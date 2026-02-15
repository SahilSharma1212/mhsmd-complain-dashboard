import { NextResponse } from "next/server";
import { Role } from "../types";
import jwt from "jsonwebtoken"

export const generateToken = (
    id: string,
    name: string,
    role: Role["role"],
    email: string,
    res: NextResponse
) => {
    if (!role || !name || !id) {
        throw new Error("Invalid user data");
    }

    const token = jwt.sign(
        { id, name, role, email },
        process.env.JWT_SECRET!,
        { expiresIn: "30d" }
    );

    res.cookies.set("token", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60,
    });
};
