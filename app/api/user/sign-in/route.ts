import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { email, role } = await req.json();
        if (!email || !role) {
            return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
        }

    } catch (error) {

    }
}