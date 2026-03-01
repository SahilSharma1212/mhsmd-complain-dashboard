import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "@/app/types";
import supabase from "@/app/_config/supabase";
import { z } from "zod";

// --- Zod schemas ---
const allocationPatchSchema = z.object({
    id: z.coerce.string().min(1),
    thana: z.string().min(1),
});

// --- Helper: verify JWT ---
function verifyToken(token: string): User | null {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        return decoded as User;
    } catch {
        return null;
    }
}

// --- Helper: safe log insert ---
async function insertLog(payload: {
    complaint_id: string | number;
    action: string;
    updated_by: string;
    prev_status: string;
    current_status: string;
    reason: string;
}) {
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

export async function GET(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorised Access", success: false }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || decodedToken.role !== "SP") {
        return NextResponse.json({ message: "Unauthorised Access", success: false }, { status: 403 });
    }

    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const pageSize = 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Fetch complaints where allocated_thana is null or empty
    const { data, error, count } = await supabase
        .from("complaints")
        .select("id, complainant_name, complainant_contact, date, created_at, role_addressed_to, subject, message, file_urls, complainant_details", { count: "exact" })
        .or('allocated_thana.is.null,allocated_thana.eq.')
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error) {
        console.error("Unallocated complaints fetch error:", error.message);
        return NextResponse.json({ message: "Failed to fetch complaints", success: false }, { status: 500 });
    }

    return NextResponse.json({
        message: "Unallocated complaints fetched successfully",
        success: true,
        data,
        totalCount: count
    }, { status: 200 });
}

export async function PATCH(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorised Access", success: false }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== "SP") {
        return NextResponse.json({ message: "Unauthorised Access", success: false }, { status: 403 });
    }

    let body: any;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ message: "Invalid JSON body", success: false }, { status: 400 });
    }

    const parsed = allocationPatchSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors,
            success: false
        }, { status: 400 });
    }

    const { id, thana } = parsed.data;

    // 1. Verify Thana exists
    const { data: thanaRecord, error: thanaError } = await supabase
        .from("thana")
        .select("name")
        .eq("name", thana)
        .maybeSingle();

    if (thanaError || !thanaRecord) {
        return NextResponse.json({
            message: `Invalid thana: "${thana}" does not exist.`,
            success: false
        }, { status: 400 });
    }

    // 2. Fetch current complaint state for logging
    const { data: complaint, error: fetchError } = await supabase
        .from("complaints")
        .select("status")
        .eq("id", id)
        .maybeSingle();

    if (fetchError || !complaint) {
        return NextResponse.json({ message: "Complaint not found", success: false }, { status: 404 });
    }

    // 3. Update complaint
    const { data: updatedComplaint, error: updateError } = await supabase
        .from("complaints")
        .update({
            allocated_thana: thana,
            updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select("*")
        .single();

    if (updateError) {
        console.error("Allocation update error:", updateError.message);
        return NextResponse.json({ message: "Failed to allocate thana", success: false }, { status: 500 });
    }

    // 4. Insert log
    await insertLog({
        complaint_id: id,
        action: "THANA_ALLOCATED",
        updated_by: user.name,
        prev_status: complaint.status,
        current_status: complaint.status,
        reason: `${thana} थाना अलॉट किया गया`
    });

    return NextResponse.json({
        message: "Thana allocated successfully",
        success: true,
        data: updatedComplaint
    }, { status: 200 });
}
