import supabase from "@/app/_config/supabase";
import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "@/app/types";

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

        if (decodedToken.role === "SP") {
            const { data, error } = await supabase
                .from("thana")
                .select("name")
                .eq("designated_sp", decodedToken.name); console.log("data", data);
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
    const { name, contact_number, pin_code, city } = await request.json();

    if (!name || !contact_number || !pin_code || !city) {
        return NextResponse.json({
            message: "All fields are required",
            success: false,
        });
    }

    const token = request.cookies.get("token")?.value;
    if (!token) {
        return NextResponse.json({
            message: "Unauthorised Access",
            success: false,
        });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const decodedToken = decoded as User;

    if (decodedToken.role === "TI") {
        return NextResponse.json({
            message: "Unauthorised Access",
            success: false,
        });
    }
    const { data, error } = await supabase
        .from("thana").insert({
            name,
            contact_number,
            pin_code,
            city,
            ti: "NOT ALLOCATED",
            designated_sp: decodedToken.name
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