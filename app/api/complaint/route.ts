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
    status: z.enum(["संजेय", "असंजेय", "अप्रमाणित", "प्रतिबंधात्मक", "वापसी", "अन्य"]),
});

// ─── Helper: verify JWT ───
function verifyToken(token: string): User | null {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        return decoded as User;
    } catch {
        return null;
    }
}

// ─── Helper: safe log insert (never throws, logs error to console) ───
async function insertLog(payload: {
    complaint_id: string | number;
    action: string;
    updated_by: string;
    prev_status: string;
    current_status: string;
    reason: string;
}): Promise<{ logData: unknown; logError: string | null }> {
    const { data: logData, error: logError } = await supabase
        .from("complaint_logs")
        .insert(payload)
        .select()
        .single();

    if (logError) {
        console.error("Log insert failed:", logError.message, "| Payload:", payload);
        return { logData: null, logError: logError.message };
    }

    return { logData, logError: null };
}

export async function POST(request: NextRequest) {
    // 1. Authenticate via JWT cookie
    const token = request.cookies.get("token")?.value;
    if (!token) {
        return NextResponse.json(
            { message: "Unauthorised Access", success: false },
            { status: 401 }
        );
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
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
        console.error("FormData parse error:", error);
        return NextResponse.json(
            { message: "Invalid form data", success: false },
            { status: 400 }
        );
    }

    const rawFields = {
        role_addressed_to: formData.get("role_addressed_to") as string,
        recipient_address: formData.get("recipient_address") as string,
        subject: formData.get("subject") as string,
        date: formData.get("date") as string,
        complainant_name: formData.get("complainant_name") as string,
        complainant_contact: formData.get("complainant_contact") as string,
        allocated_thana: formData.get("allocated_thana") as string,
        message: formData.get("message") as string | undefined,
    };

    // 3. Validate with Zod (was defined but never used before — now it is)
    const parsed = complaintPostSchema.safeParse(rawFields);
    if (!parsed.success) {
        return NextResponse.json(
            {
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
                success: false,
            },
            { status: 400 }
        );
    }

    const {
        role_addressed_to,
        recipient_address,
        subject,
        date,
        complainant_name,
        complainant_contact,
        allocated_thana,
        message,
    } = parsed.data;

    const files = formData.getAll("files") as File[];

    // 4. Verify that allocated_thana actually exists (no FK = manual check)
    const { data: thanaRecord, error: thanaError } = await supabase
        .from("thana")
        .select("name")
        .eq("name", allocated_thana)
        .maybeSingle(); // use maybeSingle to avoid error on no rows

    if (thanaError) {
        console.error("Thana lookup error:", thanaError.message);
        return NextResponse.json(
            { message: "Error verifying thana. Please try again.", success: false },
            { status: 500 }
        );
    }

    if (!thanaRecord) {
        return NextResponse.json(
            { message: `Invalid thana: "${allocated_thana}" does not exist.`, success: false },
            { status: 400 }
        );
    }

    // 5. Handle File Uploads
    const file_urls: string[] = [];

    if (files && files.length > 0) {
        for (const file of files) {
            if (!file || file.size === 0) continue;

            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/webp",
                "application/pdf",
            ];

            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json(
                    {
                        message: `Invalid file type: "${file.name}". Only images and PDFs are allowed.`,
                        success: false,
                    },
                    { status: 400 }
                );
            }

            if (file.size > 10 * 1024 * 1024) {
                return NextResponse.json(
                    {
                        message: `File too large: "${file.name}". Maximum allowed size is 10MB.`,
                        success: false,
                    },
                    { status: 400 }
                );
            }

            const fileExt = file.name.split(".").pop();
            const fileName = `${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 11)}.${fileExt}`;

            let buffer: Buffer;
            try {
                const arrayBuffer = await file.arrayBuffer();
                buffer = Buffer.from(arrayBuffer);
            } catch (err) {
                console.error("File read error:", err);
                return NextResponse.json(
                    { message: `Failed to read file: "${file.name}". Please try again.`, success: false },
                    { status: 500 }
                );
            }

            const { error: uploadError } = await supabaseAdmin.storage
                .from("complain_docs")
                .upload(fileName, buffer, {
                    contentType: file.type,
                    upsert: false,
                });

            if (uploadError) {
                console.error("Storage upload error:", uploadError.message);
                return NextResponse.json(
                    {
                        message: `Failed to upload file "${file.name}": ${uploadError.message}`,
                        success: false,
                    },
                    { status: 500 }
                );
            }

            const {
                data: { publicUrl },
            } = supabaseAdmin.storage.from("complain_docs").getPublicUrl(fileName);

            file_urls.push(publicUrl);
        }
    }

    // 6. Insert complaint
    const { data, error } = await supabase
        .from("complaints")
        .insert({
            role_addressed_to,
            recipient_address,
            subject,
            date,
            status: "अप्रमाणित",
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
        console.error("Complaint insert error:", error.message);
        return NextResponse.json(
            { message: "Failed to submit complaint. Please try again.", error: error.message, success: false },
            { status: 500 }
        );
    }

    // 7. Insert log — non-fatal: complaint is already saved, log failure is recoverable
    const { logData, logError } = await insertLog({
        complaint_id: data.id,
        action: "CREATED",
        updated_by: decodedToken.name,
        prev_status: "NONE",
        current_status: "अप्रमाणित",
        reason: "INITIALISATION",
    });

    return NextResponse.json({
        message: "Complaint submitted successfully",
        success: true,
        logsUpdated: !logError,
        ...(logError && { logWarning: "Complaint saved but activity log could not be recorded." }),
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

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
        return NextResponse.json(
            { message: "Invalid or expired token", success: false },
            { status: 401 }
        );
    }

    const filter = request.nextUrl.searchParams.get("filter");
    const value = request.nextUrl.searchParams.get("value");
    const thana = request.nextUrl.searchParams.get("thana"); // optional: SP modal drill-down
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
        // ─── CHANGED: use a subquery approach instead of !inner join ───
        // !inner silently drops complaints when the thana row is missing.
        // Instead, fetch the SP's thana names first, then filter complaints.
        const { data: thanasForSP, error: thanaFetchError } = await supabase
            .from("thana")
            .select("name")
            .eq("designated_sp", decodedToken.name);

        if (thanaFetchError) {
            console.error("Thana fetch error for SP:", thanaFetchError.message);
            return NextResponse.json(
                { message: "Failed to fetch thana data. Please try again.", success: false },
                { status: 500 }
            );
        }

        const thanaNames = (thanasForSP ?? []).map((t) => t.name);

        if (thanaNames.length === 0) {
            // SP has no thanas assigned — return empty result immediately
            return NextResponse.json(
                { message: "No thanas assigned to this SP.", success: true, data: [], totalCount: 0 },
                { status: 200 }
            );
        }

        query = supabase
            .from("complaints")
            .select("*", { count: "exact" })
            .in("allocated_thana", thanaNames)
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
            query = query.eq("status", value);
        } else if (filter === "role_addressed_to") {
            query = query.eq("role_addressed_to", value);
        } else if (filter === "id") {
            query = query.eq("id", value);
        }
    }

    // SP modal drill-down: further narrow by a specific thana
    if (thana) {
        query = query.eq("allocated_thana", thana);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
        console.error("Complaints fetch error:", error.message);
        return NextResponse.json(
            { message: "Failed to fetch complaints. Please try again.", success: false },
            { status: 500 }
        );
    }
    console.log(data);
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

    const user = verifyToken(token);
    if (!user) {
        return NextResponse.json(
            { message: "Invalid or expired token", success: false },
            { status: 401 }
        );
    }

    // 2. Validate request body with Zod
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { message: "Invalid JSON body", success: false },
            { status: 400 }
        );
    }

    const parsed = complaintPatchSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { message: "Validation failed", errors: parsed.error.flatten().fieldErrors, success: false },
            { status: 400 }
        );
    }

    const { id, status } = parsed.data;

    // 3. Fetch complaint
    const { data: complaint, error: fetchError } = await supabase
        .from("complaints")
        .select("id, allocated_thana, status")
        .eq("id", id)
        .maybeSingle();

    if (fetchError) {
        console.error("Complaint fetch error:", fetchError.message);
        return NextResponse.json(
            { message: "Error fetching complaint. Please try again.", success: false },
            { status: 500 }
        );
    }

    if (!complaint) {
        return NextResponse.json(
            { message: `Complaint with ID "${id}" not found.`, success: false },
            { status: 404 }
        );
    }

    // 4. Short-circuit if status hasn't changed
    if (complaint.status === status) {
        return NextResponse.json(
            { message: `Complaint is already in "${status}" status. No update needed.`, success: false },
            { status: 400 }
        );
    }

    // 5. Update complaint
    const { data, error } = await supabase
        .from("complaints")
        .update({
            status,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();

    if (error) {
        console.error("Complaint update error:", error.message);
        return NextResponse.json(
            { message: "Failed to update complaint. Please try again.", success: false },
            { status: 500 }
        );
    }

    // 6. Insert log — non-fatal
    const { logData, logError } = await insertLog({
        complaint_id: data.id,
        action: "UPDATED",
        updated_by: user.name,
        prev_status: complaint.status,
        current_status: status,
        reason: "UPDATED",
    });

    return NextResponse.json(
        {
            message: "Complaint updated successfully",
            success: true,
            data,
            logsUpdated: !logError,
            ...(logError && { logWarning: "Status updated but activity log could not be recorded." }),
            logData,
        },
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

    const user = verifyToken(token);
    if (!user) {
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

    // Fetch complaint
    const { data: complaint, error: fetchError } = await supabase
        .from("complaints")
        .select("id, allocated_thana, role_addressed_to, status")
        .eq("id", id)
        .maybeSingle();

    if (fetchError) {
        console.error("Complaint fetch error:", fetchError.message);
        return NextResponse.json(
            { message: "Error fetching complaint. Please try again.", success: false },
            { status: 500 }
        );
    }

    if (!complaint) {
        return NextResponse.json(
            { message: `Complaint with ID "${id}" not found.`, success: false },
            { status: 404 }
        );
    }

    // Authorization check
    let isAuthorised = false;

    if (user.role === "TI") {
        isAuthorised = complaint.allocated_thana === user.thana;
    } else if (user.role === "SP") {
        const { data: thanaRecord, error: thanaError } = await supabase
            .from("thana")
            .select("designated_sp")
            .eq("name", complaint.allocated_thana)
            .maybeSingle();

        if (thanaError) {
            console.error("Thana auth lookup error:", thanaError.message);
            return NextResponse.json(
                { message: "Error verifying authorisation. Please try again.", success: false },
                { status: 500 }
            );
        }

        isAuthorised = thanaRecord?.designated_sp === user.name;
    }

    if (!isAuthorised) {
        return NextResponse.json(
            { message: "You are not authorised to delete this complaint.", success: false },
            { status: 403 }
        );
    }

    // Delete complaint
    const { error: deleteError } = await supabase
        .from("complaints")
        .delete()
        .eq("id", id);

    if (deleteError) {
        console.error("Complaint delete error:", deleteError.message);
        return NextResponse.json(
            { message: "Failed to delete complaint. Please try again.", success: false },
            { status: 500 }
        );
    }

    // Insert log — non-fatal: complaint is gone, log is best-effort
    const { logData, logError } = await insertLog({
        complaint_id: complaint.id,
        action: "DELETED",
        updated_by: user.name,
        prev_status: complaint.status,
        current_status: "DELETED",
        reason: "DELETED",
    });

    return NextResponse.json(
        {
            message: "Complaint deleted successfully",
            success: true,
            logsUpdated: !logError,
            ...(logError && { logWarning: "Complaint deleted but activity log could not be recorded." }),
            logData,
        },
        { status: 200 }
    );
}