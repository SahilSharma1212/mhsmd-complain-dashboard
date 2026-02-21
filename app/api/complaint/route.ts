import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "@/app/types";
import supabase from "@/app/_config/supabase";
import { z } from "zod";
import supabaseAdmin from "@/app/_config/supabaseAdmin";

// ─── Zod schemas ───
const complaintPostSchema = z.object({
    role_addressed_to: z.enum(["SP", "TI"]),
    recipient_address: z.string().min(1),
    subject: z.string().min(1),
    date: z.string().min(1),
    complainant_name: z.string().min(1),
    complainant_contact: z.string().min(10),
    allocated_thana: z.string().min(1),
    message: z.string().optional(),
});

const complaintPatchSchema = z.object({
    id: z.coerce.string().min(1),
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

    // 2. Parse FormData
    let formData: FormData;
    try {
        formData = await request.formData();
    } catch (error) {
        console.log("error: ", error)
        return NextResponse.json(
            { message: "Invalid form data", success: false },
            { status: 400 }
        );
    }

    const role_addressed_to = formData.get("role_addressed_to") as string;
    const recipient_address = formData.get("recipient_address") as string;
    const subject = formData.get("subject") as string;
    const date = formData.get("date") as string;
    const complainant_name = formData.get("complainant_name") as string;
    const complainant_contact = formData.get("complainant_contact") as string;
    const allocated_thana = formData.get("allocated_thana") as string;
    const message = formData.get("message") as string;
    const files = formData.getAll("files") as File[];

    // Validate essential fields
    if (!role_addressed_to || !recipient_address || !subject || !date || !complainant_name || !complainant_contact || !allocated_thana) {
        return NextResponse.json(
            { message: "All fields are required", success: false },
            { status: 400 }
        );
    }

    // 3. Verify that allocated_thana actually exists
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

    // 4. Handle File Uploads
    const file_urls: string[] = [];

    if (files && files.length > 0) {
        for (const file of files) {
            if (!file || file.size === 0) continue;

            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json(
                    { message: `Invalid file type: ${file.name}. Only images and PDFs are allowed.`, success: false },
                    { status: 400 }
                );
            }

            if (file.size > 10 * 1024 * 1024) {
                return NextResponse.json(
                    { message: `File too large: ${file.name}. Max size is 10MB.`, success: false },
                    { status: 400 }
                );
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const { error: uploadError } = await supabaseAdmin.storage
                .from("complain_docs")
                .upload(fileName, buffer, {
                    contentType: file.type,
                    upsert: false,
                });

            if (uploadError) {
                console.error("Upload error:", uploadError);
                return NextResponse.json(
                    { message: `File upload failed: ${uploadError.message}`, success: false },
                    { status: 500 }
                );
            }

            const { data: { publicUrl } } = supabaseAdmin.storage
                .from("complain_docs")
                .getPublicUrl(fileName);

            file_urls.push(publicUrl);
        }
    }

    // 5. Insert complaint — uses "status" column in complaints table
    const { data, error } = await supabase
        .from("complaints")
        .insert({
            role_addressed_to,
            recipient_address,
            subject,
            date,
            status: "PENDING",
            complainant_name,
            complainant_contact,
            allocated_thana,
            submitted_by: decodedToken.name,
            message,
            source: "WEBSITE",
            file_urls: file_urls.length > 0 ? file_urls : null,
        })
        .select()
        .single();

    if (error) {
        console.log(error)
        return NextResponse.json(
            { message: "Error in adding complaint", error: error.message, success: false },
            { status: 500 }
        );
    }

    // 6. Insert log — uses "prev_status" / "current_status" columns in complaint_logs table
    const { data: logData, error: logError } = await supabase
        .from("complaint_logs")
        .insert({
            complaint_id: data?.id,
            action: "CREATED",
            updated_by: decodedToken.name,
            prev_status: "NONE",            // ✅ complaint_logs table column
            current_status: "PENDING",      // ✅ complaint_logs table column
            reason: "INITIALISATION"
        })
        .select()
        .single();

    if (logError) {
        return NextResponse.json(
            { message: "Error in creating log", error: logError.message, success: false },
            { status: 500 }
        );
    }

    return NextResponse.json({
        message: "Complaint Submitted successfully",
        success: true,
        logsUpdated: true,
        logData,
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

    const filter = request.nextUrl.searchParams.get("filter");
    const value = request.nextUrl.searchParams.get("value");
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const pageSize = 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query;

    if (decodedToken.role === "TI") {
        query = supabase
            .from("complaints")
            .select("*", { count: "exact" })
            .eq("allocated_thana", decodedToken.thana)
            .order("created_at", { ascending: false });
    } else if (decodedToken.role === "SP") {
        query = supabase
            .from("complaints")
            .select(`*, thana!inner ( name, designated_sp )`, { count: "exact" })
            .eq("thana.designated_sp", decodedToken.name)
            .order("created_at", { ascending: false });
    } else {
        return NextResponse.json(
            { message: "Role not authorised", success: false },
            { status: 403 }
        );
    }

    // Apply filters if provided
    if (filter && value) {
        if (filter === "complainant_name") {
            query = query.ilike("complainant_name", `%${value}%`);
        } else if (filter === "status") {
            query = query.eq("status", value);          // ✅ complaints table column
        } else if (filter === "role_addressed_to") {
            query = query.eq("role_addressed_to", value);
        } else if (filter === "id") {
            query = query.eq("id", value);
        }
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
        return NextResponse.json(
            { message: error.message, success: false },
            { status: 500 }
        );
    }

    return NextResponse.json(
        { message: "Complaints fetched successfully", success: true, data, totalCount: count },
        { status: 200 }
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

    // 2. Validate request body with Zod
    const body = await request.json();
    const parsed = complaintPatchSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { message: "Validation failed", errors: parsed.error.flatten().fieldErrors, success: false },
            { status: 400 }
        );
    }

    const { id, status } = parsed.data;

    // 3. Fetch complaint — select "status" from complaints table
    const { data: complaint, error: fetchError } = await supabase
        .from("complaints")
        .select("id, allocated_thana, status")   // ✅ complaints table column
        .eq("id", id)
        .maybeSingle();

    if (fetchError || !complaint) {
        console.log(fetchError)
        return NextResponse.json(
            { message: "Complaint not found", success: false },
            { status: 404 }
        );
    }

    // 4. Update complaint — set "status" column
    const { data, error } = await supabase
        .from("complaints")
        .update({
            status: status,                 // ✅ complaints table column
            updated_by: user.name,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();

    if (error) {
        return NextResponse.json(
            { message: error.message, success: false },
            { status: 500 }
        );
    }

    // 5. Insert log — uses "prev_status" / "current_status" columns in complaint_logs table
    const { data: logData, error: logError } = await supabase
        .from("complaint_logs")
        .insert({
            complaint_id: data?.id,
            action: "UPDATED",
            updated_by: user.name,
            prev_status: complaint.status,  // ✅ read from fetched complaint.status
            current_status: status,         // ✅ complaint_logs table column
            reason: "UPDATED"
        })
        .select()
        .single();

    if (logError) {
        return NextResponse.json(
            { message: logError.message, success: false },
            { status: 500 }
        );
    }

    return NextResponse.json(
        { message: "Complaint updated successfully", success: true, data, logsUpdated: true, logData },
        { status: 200 }
    );
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json(
            { message: "Complaint ID is required", success: false },
            { status: 400 }
        );
    }

    // Fetch complaint — include "status" so we can log the prev_status
    const { data: complaint, error: fetchError } = await supabase
        .from("complaints")
        .select("id, allocated_thana, role_addressed_to, status")  // ✅ added "status"
        .eq("id", id)
        .maybeSingle();

    if (fetchError || !complaint) {
        return NextResponse.json(
            { message: "Complaint not found", success: false },
            { status: 404 }
        );
    }

    // Authorization check
    let isAuthorised = false;
    if (user.role === "TI") {
        if (complaint.allocated_thana === user.thana) {
            isAuthorised = true;
        }
    } else if (user.role === "SP") {
        const { data: thanaRecord } = await supabase
            .from("thana")
            .select("designated_sp")
            .eq("name", complaint.allocated_thana)
            .single();

        if (thanaRecord?.designated_sp === user.name) {
            isAuthorised = true;
        }
    }

    if (!isAuthorised) {
        return NextResponse.json(
            { message: "You are not authorised to delete this complaint", success: false },
            { status: 403 }
        );
    }

    // Delete complaint
    const { error: deleteError } = await supabase
        .from("complaints")
        .delete()
        .eq("id", id);

    if (deleteError) {
        return NextResponse.json(
            { message: deleteError.message, success: false },
            { status: 500 }
        );
    }

    // Insert log — uses "prev_status" / "current_status" columns in complaint_logs table
    const { data: logData, error: logError } = await supabase
        .from("complaint_logs")
        .insert({
            complaint_id: complaint.id,
            action: "DELETED",
            updated_by: user.name,
            prev_status: complaint.status,  // ✅ read from fetched complaint.status
            current_status: "DELETED",      // ✅ complaint_logs table column
            reason: "DELETED"
        })
        .select()
        .single();

    if (logError) {
        return NextResponse.json(
            { message: logError.message, success: false },
            { status: 500 }
        );
    }

    return NextResponse.json(
        { message: "Complaint deleted successfully", success: true, logData },
        { status: 200 }
    );
}