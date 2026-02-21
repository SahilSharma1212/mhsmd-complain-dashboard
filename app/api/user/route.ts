import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Role } from "@/app/types";
import { z } from "zod";
import bcrypt from "bcryptjs";
import supabase from "@/app/_config/supabase";
import { generateToken } from "@/app/_utils/generateToken";

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("token")?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET!) as {
            id: number;
            name: string;
            role: Role["role"];
            email: string;
            phone: string;
            thana: string;
        };

        return NextResponse.json({ id: decodedToken.id, name: decodedToken.name, role: decodedToken.role, email: decodedToken.email, phone: decodedToken.phone, thana: decodedToken.thana }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

const signUpSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    role: z.string().min(1, "Role is required"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    thana: z.string().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 1️⃣ Validate input
        const validation = signUpSchema.safeParse(body);

        if (!validation.success) {
            const errors = validation.error.flatten().fieldErrors;

            return NextResponse.json(
                {
                    success: false,
                    error: Object.values(errors).flat()[0],
                    errors,
                },
                { status: 400 }
            );
        }

        const { name, email, role, phone, thana } = validation.data;

        // 2️⃣ Check duplicate email
        const { data: emailUser } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .maybeSingle();

        if (emailUser) {
            return NextResponse.json(
                { success: false, error: "Email already registered" },
                { status: 409 }
            );
        }

        // 3️⃣ Check duplicate phone
        const { data: phoneUser } = await supabase
            .from("users")
            .select("id")
            .eq("phone", phone)
            .maybeSingle();

        if (phoneUser) {
            return NextResponse.json(
                { success: false, error: "Phone number already registered" },
                { status: 409 }
            );
        }

        // 4️⃣ Hash password
        const hashedPassword = await bcrypt.hash(phone, 10);

        // 5️⃣ Insert user
        const { data, error } = await supabase
            .from("users")
            .insert({
                name,
                email,
                password: hashedPassword,
                role,
                phone,
                thana: thana || null,
            })
            .select()
            .single();

        if (error || !data) {
            console.error(error);
            return NextResponse.json(
                { success: false, error: "Error creating user" },
                { status: 500 }
            );
        }

        // 6️⃣ Remove password before sending response
        const { password: _removed, ...safeUser } = data;

        const res = NextResponse.json(
            { success: true, user: safeUser },
            { status: 201 }
        );

        return res;

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}