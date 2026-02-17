import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "@/app/types";
import supabase from "@/app/_config/supabase";

export async function POST(request: NextRequest) {

    const { role_addressed_to, recipient_address, subject, date, name_of_complainer, complainer_contact_number, allocated_thana } = await request.json();

    if (!role_addressed_to || !recipient_address || !subject || !date || !name_of_complainer || !complainer_contact_number || !allocated_thana) {
        return NextResponse.json({
            message: "All fields are required",
            success: false,
        });
    }

    const token = request.cookies.get("token")?.value;
    if (!token) {
        return NextResponse.json({
            message: "Unauthorised Access",
            success: false,
        });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const decodedToken = decoded as User;

    if (decodedToken.role === "TI") {
        return NextResponse.json({
            message: "Unauthorised Access",
            success: false,
        });
    }

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
            submitted_by: "SP"
        });

    if (error) {
        return NextResponse.json({
            message: "Error in adding complaint",
            success: false,
        });
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
    const body = await request.json();
    const id = Number(body.id);
    const status = body.status;

    if (!id || isNaN(id)) {
        return NextResponse.json(
            { message: "Invalid id", success: false },
            { status: 400 }
        );
    }


    if (!id || !status) {
        return NextResponse.json(
            { message: "id and status are required", success: false },
            { status: 400 }
        );
    }

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

    if (user.role !== "TI" && user.role !== "SP") {
        return NextResponse.json(
            { message: "Forbidden", success: false },
            { status: 403 }
        );
    }

    /* ---------------- Fetch complaint first ---------------- */
    console.log(`Attempting to fetch complaint with ID: ${id}`);
    const { data: complaint, error: fetchError } = await supabase
        .from("complaints")
        .select("id, allocated_thana")
        .eq("id", id)
        .maybeSingle();

    console.log("Fetch result:", { complaint, fetchError });

    if (fetchError || !complaint) {
        console.log("Error or no complaint found:", fetchError);
        return NextResponse.json(
            { message: "Complaint not found", success: false },
            { status: 404 }
        );
    }

    /* ---------------- Role-based ownership check ---------------- */
    if (user.role === "TI" && complaint.allocated_thana !== user.thana) {
        console.log("ownership conflicts")
        return NextResponse.json(
            { message: "You cannot update complaints outside your thana", success: false },
            { status: 403 }
        );
    }

    if (user.role === "SP") {
        const { data: thana, error: thanaError } = await supabase
            .from("thana")
            .select("designated_sp")
            .eq("name", complaint.allocated_thana)
            .single();

        if (thanaError || !thana || thana.designated_sp !== user.name) {
            console.log(thanaError);
            return NextResponse.json(
                { message: "You are not authorised for this complaint", success: false },
                { status: 403 }
            );
        }
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
        console.log(error);
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
