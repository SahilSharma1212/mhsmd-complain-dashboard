import { NextResponse } from "next/server";
import { Role } from "../types";
import jwt from "jsonwebtoken"

export const generateToken = (
    id: string,
    name: string,
    role: Role["role"],
    phone: string,
    email: string,
    thana: string,
    res: NextResponse
) => {
    if (!role || !name || !id || !phone || !email || !thana) {
        throw new Error("Invalid user data");
    }

    const token = jwt.sign(
        { id, name, role, phone, email, thana },
        process.env.JWT_SECRET!,
        { expiresIn: "30d" }
    );

    res.cookies.set("token", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60,
    });
};
