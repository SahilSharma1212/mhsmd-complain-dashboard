import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "@/app/types";
import supabase from "@/app/_config/supabase";
import { z } from "zod";

const editComplaintSchema = z.object({
    id: z.coerce.string().min(1),
    subject: z.string().min(1),
    message: z.string().optional(),
    complainant_name: z.string().min(1),
    complainant_contact: z.string().min(10),
    allocated_thana: z.string().min(1),
    accused_details: z.string().optional(),
    role_addressed_to: z.string().optional(),
    recipient_address: z.string().optional(),
    date: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
    try {
        // 1. Authenticate via JWT cookie
        const token = request.cookies.get("token")?.value;
        if (!token) {
            return NextResponse.json(
                { message: "Unauthorised Access", success: false },
                { status: 401 }
            );
        }

        let user: User;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
            user = decoded as User;
        } catch {
            return NextResponse.json(
                { message: "Invalid or expired token", success: false },
                { status: 401 }
            );
        }

        // 2. Validate request body
        const body = await request.json();
        const parsed = editComplaintSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { message: "Validation failed", errors: parsed.error.flatten().fieldErrors, success: false },
                { status: 400 }
            );
        }

        const { id, subject, message, complainant_name, complainant_contact, allocated_thana, accused_details, role_addressed_to, recipient_address, date } = parsed.data;

        // 3. Fetch current complaint for auth and log context
        const { data: complaint, error: fetchError } = await supabase
            .from("complaints")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (fetchError || !complaint) {
            return NextResponse.json(
                { message: "Complaint not found", success: false },
                { status: 404 }
            );
        }

        // 4. Authorization check
        let isAuthorised = false;
        if (user.role === "TI") {
            if (complaint.allocated_thana === user.thana) {
                isAuthorised = true;
            }
        } else if (user.role === "SP" || user.role === "ASP" || user.role === "SDOP") {
            const roleColumn = user.role === "SP" ? "designated_sp" : user.role === "ASP" ? "designated_asp" : "designated_sdop";

            const { data: thanaRecord } = await supabase
                .from("thana")
                .select(roleColumn)
                .eq("name", complaint.allocated_thana)
                .single();

            if ((thanaRecord as any)?.[roleColumn] === user.name) {
                isAuthorised = true;
            }
        }

        if (!isAuthorised) {
            return NextResponse.json(
                { message: "You are not authorised to edit this complaint", success: false },
                { status: 403 }
            );
        }

        // 5. Update complaint
        const { data: updatedComplaint, error: updateError } = await supabase
            .from("complaints")
            .update({
                subject,
                message,
                complainant_name,
                complainant_contact,
                allocated_thana,
                accused_details,
                role_addressed_to,
                recipient_address,
                date,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select("*")
            .single();

        if (updateError) {
            return NextResponse.json(
                { message: updateError.message, success: false },
                { status: 500 }
            );
        }

        // 6. Insert log entry
        const { error: logError } = await supabase
            .from("complaint_logs")
            .insert({
                complaint_id: id,
                action: "EDITED",
                updated_by: user.name,
                prev_status: complaint.status,
                current_status: complaint.status,
                reason: "Complaint details updated via Edit interface"
            });

        if (logError) {
            console.error("Log error:", logError);
            // We don't fail the whole request if log fails, but we log it
        }

        return NextResponse.json({
            message: "Complaint updated successfully",
            success: true,
            data: updatedComplaint
        });

    } catch (error) {
        console.error("Edit Complaint Error:", error);
        return NextResponse.json(
            { message: "Internal server error", success: false },
            { status: 500 }
        );
    }
}
