import { NextRequest, NextResponse } from "next/server";
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
    accused_details: z.string().optional(),
});

// ─── GET: Fetch Thanas for Public Dropdown ───
export async function GET() {
    try {
        const { data, error } = await supabase
            .from("thana")
            .select("name")
            .order("name", { ascending: true });

        if (error) {
            return NextResponse.json(
                { message: "Failed to fetch thanas", success: false },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json(
            { message: "Server error", success: false },
            { status: 500 }
        );
    }
}

// ─── POST: Anonymous Complaint Submission ───
export async function POST(request: NextRequest) {
    // 1. Parse FormData
    let formData: FormData;
    try {
        formData = await request.formData();
    } catch (error) {
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
        accused_details: formData.get("accused_details") as string | undefined,
    };

    // 2. Validate with Zod
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
        accused_details,
    } = parsed.data;

    const files = formData.getAll("files") as File[];

    // 3. Verify Thana exists
    const { data: thanaRecord, error: thanaError } = await supabase
        .from("thana")
        .select("name")
        .eq("name", allocated_thana)
        .maybeSingle();

    if (thanaError || !thanaRecord) {
        return NextResponse.json(
            { message: "Invalid or missing station (thana) selection.", success: false },
            { status: 400 }
        );
    }

    // 4. Handle File Uploads
    const file_urls: string[] = [];
    if (files && files.length > 0) {
        for (const file of files) {
            if (!file || file.size === 0) continue;

            const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
            if (!allowedTypes.includes(file.type)) continue;
            if (file.size > 10 * 1024 * 1024) continue;

            const fileExt = file.name.split(".").pop();
            const fileName = `public-${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;

            try {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const { error: uploadError } = await supabaseAdmin.storage
                    .from("complain_docs")
                    .upload(fileName, buffer, { contentType: file.type, upsert: false });

                if (!uploadError) {
                    const { data: { publicUrl } } = supabaseAdmin.storage.from("complain_docs").getPublicUrl(fileName);
                    file_urls.push(publicUrl);
                }
            } catch (err) {
                console.error("Public upload error:", err);
            }
        }
    }

    // 5. Insert complaint (marked as ANONYMOUS)
    const { data, error } = await supabase
        .from("complaints")
        .insert({
            role_addressed_to,
            recipient_address,
            subject,
            date,
            status: "लंबित", // Public complaints go straight to Pending usually, or keep "अप्रमाणित"? 
            // The user request said "available only if user is not signed in", but didn't specify initial status.
            // Let's use "लंबित" as it's a new external submission waiting for review.
            complainant_name,
            complainant_contact,
            allocated_thana,
            submitted_by: "ANONYMOUS",
            message,
            accused_details: accused_details || null,
            source: "WEBSITE",
            file_urls: file_urls.length > 0 ? file_urls : null,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json(
            { message: "Failed to submit. Please try again.", success: false },
            { status: 500 }
        );
    }

    // 6. Log activity
    await supabase.from("complaint_logs").insert({
        complaint_id: data.id,
        action: "CREATED",
        updated_by: "ANONYMOUS USER",
        prev_status: "NONE",
        current_status: "लंबित",
        reason: "PUBLIC SUBMISSION",
    });

    return NextResponse.json({
        message: "Successfully submitted",
        success: true,
        data,
    });
}
