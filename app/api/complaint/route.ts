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