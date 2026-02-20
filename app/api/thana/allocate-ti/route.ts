import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "@/app/types";
import supabase from "@/app/_config/supabase";
import { z } from "zod";

// ─── Zod schema ───
const allocateTiSchema = z.object({
    thana: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
    contact_number: z.string().min(10),
});

export async function POST(request: NextRequest) {
    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not set");
        return NextResponse.json(
            { message: "Server misconfiguration", success: false },
            { status: 500 }
        );
    }

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
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
        decodedToken = decoded as User;
    } catch (_error) {
        return NextResponse.json(
            { message: "Invalid or expired token", success: false },
            { status: 401 }
        );
    }

    // 2. Role check — only SP can allocate TI
    if (decodedToken.role !== "SP") {
        return NextResponse.json(
            { message: "Forbidden", success: false },
            { status: 403 }
        );
    }

    // 3. Validate request body with Zod
    const body = await request.json();
    const parsed = allocateTiSchema.safeParse(body);

    if (!parsed.success) {
        console.log(parsed.error.flatten().fieldErrors)
        return NextResponse.json(
            { message: "Validation failed", errors: parsed.error.flatten().fieldErrors, success: false },
            { status: 400 }
        );
    }

    const { thana, name, contact_number, email } = parsed.data;

    // 4. Check if the given thana exists
    const { data: thanaData, error: thanaError } = await supabase
        .from("thana")
        .select("designated_sp")
        .eq("name", thana)
        .single();

    if (thanaError || !thanaData) {
        return NextResponse.json(
            { message: "Thana doesn't exist", success: false },
            { status: 404 }
        );
    }

    // 5. Check if the SP is authorised for this thana
    if (thanaData.designated_sp !== decodedToken.name) {
        return NextResponse.json(
            { message: "You are not authorised to allocate admin in this thana", success: false },
            { status: 403 }
        );
    }

    // 6. Upsert user — avoids race condition and keeps contact_number fresh
    const { error: userError } = await supabase
        .from("users")
        .upsert(
            { name, phone: contact_number, email, role: "TI", thana },
            { onConflict: "email" }
        );

    if (userError) {
        console.log(userError)
        return NextResponse.json(
            { message: "Error processing user details", success: false },
            { status: 500 }
        );
    }

    // 7. Update thana table
    const { error: thanaUpdateError } = await supabase
        .from("thana")
        .update({ ti: name })
        .eq("name", thana);

    if (thanaUpdateError) {
        // User was updated but thana wasn't — log this for manual recovery
        console.error("Inconsistent state: user updated but thana.ti not set", { thana, name });
        return NextResponse.json(
            { message: "Error updating thana admin details", success: false },
            { status: 500 }
        );
    }

    return NextResponse.json(
        { message: "Admin allocated successfully", success: true },
        { status: 200 }
    );
}