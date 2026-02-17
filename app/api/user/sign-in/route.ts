import { NextRequest, NextResponse } from "next/server";
import supabase from "@/app/_config/supabase";
import { generateToken } from "@/app/_utils/generateToken";
export async function POST(req: NextRequest) {
    try {
        const { email, role } = await req.json();
        if (!email || !role) {
            return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
        }
        const { data, error } = await supabase.from("users").select("id, name, email, role, phone, thana").eq("email", email).eq("role", role).single();
        console.log(data, error);

        if (error) {
            return NextResponse.json({ error: "Invalid Credentials" }, { status: 404 });
        }

        const res = NextResponse.json(data, { status: 200 });
        generateToken(data.id, data.name, data.role, data.phone, data.email, data.thana, res);

        return res;
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}