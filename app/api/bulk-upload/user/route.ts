import { NextRequest, NextResponse } from "next/server";
import supabase from "@/app/_config/supabase";
import { z } from "zod";
import bcrypt from "bcryptjs";

const userSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    role: z.string().min(1, "Role is required"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    thana: z.string().optional(),
});

const bulkUserSchema = z.object({
    users: z.array(userSchema).min(1, "At least one user is required"),
});

export async function POST(req: NextRequest) {
    try {
        let body = await req.json();

        // If body is an array, wrap it in a "users" object
        if (Array.isArray(body)) {
            body = { users: body };
        }

        const parsed = bulkUserSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { message: "Validation failed", errors: parsed.error.flatten().fieldErrors, success: false },
                { status: 400 }
            );
        }

        const { users } = parsed.data;

        // Hash passwords (phone number is the default password, same as user/route.ts)
        const usersToInsert = await Promise.all(
            users.map(async (user) => {
                const hashedPassword = await bcrypt.hash(user.phone, 10);
                return {
                    name: user.name.toLowerCase(),
                    email: user.email,
                    password: hashedPassword,
                    role: user.role,
                    phone: user.phone,
                    thana: user.thana?.toLowerCase() || null,
                };
            })
        );

        const { data, error } = await supabase
            .from("users")
            .insert(usersToInsert)
            .select("id, name, email, role, phone, thana");

        if (error) {
            console.error("Bulk user insert error:", error.message);
            return NextResponse.json(
                { message: "Failed to create users", error: error.message, success: false },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: `${data.length} user(s) created successfully`, success: true, count: data.length, data },
            { status: 201 }
        );
    } catch (error) {
        console.error("Bulk user upload error:", error);
        return NextResponse.json(
            { message: "Internal Server Error", success: false },
            { status: 500 }
        );
    }
}
