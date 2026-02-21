import { NextRequest, NextResponse } from "next/server";
import supabase from "@/app/_config/supabase";
import { generateToken } from "@/app/_utils/generateToken";
import { z } from 'zod'
import bcrypt from "bcryptjs"
const signInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    role: z.string().min(1, "Role is required")
})
export async function POST(req: NextRequest) {
    try {
        const { email, password, role } = await req.json();

        const validation = signInSchema.safeParse({ email, password, role });
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.message }, { status: 400 });
        }

        const { data, error } = await supabase.from("users").select("id, name, email, role, phone, thana, password").eq("email", email).eq("role", role).single();
        console.log(data, error);

        if (!data) {
            return NextResponse.json({ error: "Invalid Credentials" }, { status: 404 });
        }

        const isPasswordValid = await bcrypt.compare(password, data.password);
        if (!isPasswordValid) {
            return NextResponse.json({ error: "Invalid Credentials" }, { status: 404 });
        }


        if (data.role !== role) {
            return NextResponse.json({ error: "Invalid Role" }, { status: 404 });
        }

        const res = NextResponse.json(data, { status: 200 });
        generateToken(data.id, data.name, data.role, data.phone, data.email, data.thana, res);

        return res;
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}