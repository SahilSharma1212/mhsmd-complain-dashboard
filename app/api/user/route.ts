import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { Role } from "@/app/types";

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
        };

        return NextResponse.json({ id: decodedToken.id, name: decodedToken.name, role: decodedToken.role, email: decodedToken.email }, { status: 200 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
