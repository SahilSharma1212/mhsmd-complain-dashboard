import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "@/app/types";
import supabase from "@/app/_config/supabase";
import { z } from "zod";

// ─── Zod schemas ───
const complaintPostSchema = z.object({
    role_addressed_to: z.enum(["SP", "TI"]),
    recipient_address: z.string().min(1),
    subject: z.string().min(1),
    date: z.string().min(1),
    name_of_complainer: z.string().min(1),
    complainer_contact_number: z.string().min(10),
    allocated_thana: z.string().min(1),
});

const complaintPatchSchema = z.object({
    id: z.string().min(1),
    status: z.enum(["PENDING", "FIR", "NON FIR", "FILE", "NO CONTACT", "SOLVED"]),
});

export async function POST(request: NextRequest) {

    // 1. Authenticate via JWT cookie
    const token = request.cookies.get("token")?.value;
    if (!token) {
        return NextResponse.json(
            { message: "Unauthorised Access", success: false },
            { status: 401 }
        );
    }

    let decodedToken: User;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        decodedToken = decoded as User;
    } catch {
        return NextResponse.json(
            { message: "Invalid or expired token", success: false },
            { status: 401 }
        );
    }

    if (decodedToken.role === "TI") {
        return NextResponse.json(
            { message: "Unauthorised Access", success: false },
            { status: 403 }
        );
    }

    // 2. Validate request body with Zod
    const body = await request.json();
    const parsed = complaintPostSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { message: "Validation failed", errors: parsed.error.flatten().fieldErrors, success: false },
            { status: 400 }
        );
    }

    const { role_addressed_to, recipient_address, subject, date, name_of_complainer, complainer_contact_number, allocated_thana } = parsed.data;

    // 3. Verify that allocated_thana actually exists in the database
    const { data: thanaRecord, error: thanaError } = await supabase
        .from("thana")
        .select("name")
        .eq("name", allocated_thana)
        .single();

    if (thanaError || !thanaRecord) {
        return NextResponse.json(
            { message: "Invalid thana", success: false },
            { status: 400 }
        );
    }

    // 4. Insert complaint — submitted_by and current_status are set SERVER-SIDE only
    const { data, error } = await supabase
        .from("complaints")
        .insert({
            role_addressed_to,
            recipient_address,
            subject,
            date,
            current_status: "PENDING",
            name_of_complainer,
            complainer_contact_number,
            allocated_thana,
            submitted_by: decodedToken.name,
        });

    if (error) {
        return NextResponse.json(
            { message: "Error in adding complaint", success: false },
            { status: 500 }
        );
    }

    return NextResponse.json({
        message: "Complaint Submitted successfully",
        success: true,
        data,
    });
}

export async function GET(request: NextRequest) {
    const token = request.cookies.get("token")?.value;

    if (!token) {
        return NextResponse.json(
            { message: "Unauthorised Access", success: false },
            { status: 401 }
        );
    }

    let decodedToken: User;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        decodedToken = decoded as User;
    } catch {
        return NextResponse.json(
            { message: "Invalid or expired token", success: false },
            { status: 401 }
        );
    }

    /* ---------------- TI ---------------- */
    if (decodedToken.role === "TI") {
        const { data, error } = await supabase
            .from("complaints")
            .select("*")
            .eq("allocated_thana", decodedToken.thana);

        if (error) {
            return NextResponse.json(
                { message: error.message, success: false },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: "Complaints fetched successfully", success: true, data },
            { status: 200 }
        );
    }

    /* ---------------- SP ---------------- */
    if (decodedToken.role === "SP") {
        const { data, error } = await supabase
            .from("complaints")
            .select(`
                *,
                thana!inner (
                    name,
                    designated_sp
                )
            `)
            .eq("thana.designated_sp", decodedToken.name);

        if (error) {
            return NextResponse.json(
                { message: error.message, success: false },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: "Complaints fetched successfully", success: true, data },
            { status: 200 }
        );
    }

    /* -------------- Fallback -------------- */
    return NextResponse.json(
        { message: "Role not authorised", success: false },
        { status: 403 }
    );
}

export async function PATCH(request: NextRequest) {

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

    // 2. Role check — only SP can change status
    if (user.role !== "SP") {
        return NextResponse.json(
            { message: "Forbidden", success: false },
            { status: 403 }
        );
    }

    // 3. Validate request body with Zod
    const body = await request.json();
    const parsed = complaintPatchSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { message: "Validation failed", errors: parsed.error.flatten().fieldErrors, success: false },
            { status: 400 }
        );
    }

    const { id, status } = parsed.data;

    /* ---------------- Fetch complaint first ---------------- */
    const { data: complaint, error: fetchError } = await supabase
        .from("complaints")
        .select("id, allocated_thana")
        .eq("id", id)
        .maybeSingle();

    if (fetchError || !complaint) {
        return NextResponse.json(
            { message: "Complaint not found", success: false },
            { status: 404 }
        );
    }

    /* ---------------- SP ownership check ---------------- */
    const { data: thana, error: thanaError } = await supabase
        .from("thana")
        .select("designated_sp")
        .eq("name", complaint.allocated_thana)
        .single();

    if (thanaError || !thana || thana.designated_sp !== user.name) {
        return NextResponse.json(
            { message: "You are not authorised for this complaint", success: false },
            { status: 403 }
        );
    }

    /* ---------------- Update ---------------- */
    const { data, error } = await supabase
        .from("complaints")
        .update({
            current_status: status,
            updated_by: user.name,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id);

    if (error) {
        return NextResponse.json(
            { message: error.message, success: false },
            { status: 500 }
        );
    }

    return NextResponse.json(
        { message: "Complaint updated successfully", success: true, data },
        { status: 200 }
    );
}