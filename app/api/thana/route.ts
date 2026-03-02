import supabase from "@/app/_config/supabase";
import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "@/app/types";
import { z } from "zod";

// ─── Zod schema ───
const thanaPostSchema = z.object({
    name: z.string().min(1),
    pin_code: z.string().min(1),
    city: z.string().min(1),
    contact_number: z.string().min(10),
});

export async function GET(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    console.log("token", token);
    if (!token) {
        return NextResponse.json({
            message: "Unauthorised Access",
            success: false,
        });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const decodedToken = decoded as User;
    try {

        if (decodedToken.role === "SP" || decodedToken.role === "ASP" || decodedToken.role === "SDOP") {
            const roleColumn = decodedToken.role === "SP" ? "designated_sp" : decodedToken.role === "ASP" ? "designated_asp" : "designated_sdop";

            const { data, error } = await supabase
                .from("thana")
                .select("name")
                .eq(roleColumn, decodedToken.name); console.log("data", data);
            if (error) {
                return NextResponse.json({
                    message: "Error fetching thana data",
                    success: false,
                });
            }
            return NextResponse.json({
                message: "Thana data fetched successfully",
                success: true,
                data,
            });
        }

        if (decodedToken.role === "TI") {
            const { data, error } = await supabase
                .from("thana")
                .select("name")
                .eq("ti", decodedToken.name).single();

            console.log("data", data);
            if (error) {
                return NextResponse.json({
                    message: "Error fetching thana data",
                    success: false,
                });
            }

            if (!data) {
                return NextResponse.json({
                    message: "No thana found",
                    success: false,
                });
            }
            return NextResponse.json({
                message: "Thana data fetched successfully",
                success: true,
                data,
            });
        }

    } catch (error) {
        return NextResponse.json({
            message: "Server Error",
            success: false,
        });
    }
}

export async function POST(request: NextRequest) {

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
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        decodedToken = decoded as User;
    } catch {
        return NextResponse.json(
            { message: "Invalid or expired token", success: false },
            { status: 401 }
        );
    }

    // 2. Role check — only SP/ASP/SDOP can create thanas
    if (decodedToken.role !== "SP" && decodedToken.role !== "ASP" && decodedToken.role !== "SDOP") {
        return NextResponse.json(
            { message: "Forbidden", success: false },
            { status: 403 }
        );
    }

    // 3. Validate request body with Zod
    const body = await request.json();
    const parsed = thanaPostSchema.safeParse(body);

    if (!parsed.success) {
        console.log(parsed.error.flatten().fieldErrors)
        return NextResponse.json(
            { message: "Validation failed", errors: parsed.error.flatten().fieldErrors, success: false },
            { status: 400 }
        );
    }

    const { name, contact_number, pin_code, city } = parsed.data;

    const roleColumn = decodedToken.role === "SP" ? "designated_sp" : decodedToken.role === "ASP" ? "designated_asp" : "designated_sdop";

    const { data, error } = await supabase
        .from("thana").insert({
            name: name.toLowerCase(),
            contact_number,
            pin_code,
            city: city.toLowerCase(),
            ti: "NOT ALLOCATED",
            [roleColumn]: decodedToken.name.toLowerCase()
        });


    if (error) {
        console.log(error);
        return NextResponse.json({
            message: "Error creating thana",
            success: false,
        }, { status: 500 });
    }

    return NextResponse.json({
        message: "Thana created successfully",
        success: true,
        data,
    }, { status: 201 });


}