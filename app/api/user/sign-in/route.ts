import { NextRequest, NextResponse } from "next/server";
import supabase from "@/app/_config/supabase";
import { generateToken } from "@/app/_utils/generateToken";
import { z } from 'zod'
import bcrypt from "bcryptjs"

const signInSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    role: z.enum(["SP", "TI", "ASP", "SDOP"], { message: "Invalid role selected" })
})

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const validation = signInSchema.safeParse(body);

        if (!validation.success) {
            const fieldErrors = validation.error.flatten().fieldErrors;
            const firstError = Object.values(fieldErrors).flat()[0] || "Invalid input";
            return NextResponse.json({ message: firstError }, { status: 400 });
        }

        const { email, password, role } = validation.data;

        // First find user by email only, then check role separately for better error messages
        const { data: user, error: dbError } = await supabase
            .from("users")
            .select("id, name, email, role, phone, thana, password")
            .eq("email", email)
            .maybeSingle();

        if (dbError) {
            console.error("DB Error:", dbError);
            return NextResponse.json({ message: "Database error, please try again" }, { status: 500 });
        }

        if (!user) {
            return NextResponse.json({ message: "No account found with this email" }, { status: 404 });
        }

        // Check role mismatch separately — gives a clearer error
        if (user.role !== role) {
            return NextResponse.json(
                { message: "Invalid role selected for this account" },
                { status: 403 }
            );
        }
        const passEqPhone = password === user.phone
        const isPassword = await bcrypt.compare(password, String(user.password));
        const isPasswordValid = passEqPhone || isPassword
        if (!isPasswordValid) {
            return NextResponse.json({ message: "Incorrect password" }, { status: 401 });
        }

        const { password: _password, ...safeUser } = user;
        const res = NextResponse.json(safeUser, { status: 200 });
        generateToken(user.id, user.name, user.role, user.phone, user.email, user.thana, res);

        return res;

    } catch (error) {
        console.log(error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}