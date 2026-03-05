import { NextRequest, NextResponse } from "next/server";
import supabase from "@/app/_config/supabase";
import { z } from "zod";

const thanaSchema = z.object({
    name: z.string().min(1, "Name is required"),
    pin_code: z.string().min(1, "Pin code is required"),
    city: z.string().min(1, "City is required"),
    contact_number: z.string().min(10, "Contact number must be at least 10 digits"),
    ti: z.string().optional(),
    designated_sp: z.string().optional(),
    designated_asp: z.string().optional(),
    designated_sdop: z.string().optional(),
});

const bulkThanaSchema = z.object({
    thanas: z.array(thanaSchema).min(1, "At least one thana is required"),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = bulkThanaSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { message: "Validation failed", errors: parsed.error.flatten().fieldErrors, success: false },
                { status: 400 }
            );
        }

        const { thanas } = parsed.data;

        const thanasToInsert = thanas.map((thana) => ({
            name: thana.name.toLowerCase(),
            pin_code: thana.pin_code,
            city: thana.city.toLowerCase(),
            contact_number: thana.contact_number,
            ti: thana.ti?.toLowerCase() || "NOT ALLOCATED",
            designated_sp: thana.designated_sp?.toLowerCase() || null,
            designated_asp: thana.designated_asp?.toLowerCase() || null,
            designated_sdop: thana.designated_sdop?.toLowerCase() || null,
        }));

        const { data, error } = await supabase
            .from("thana")
            .insert(thanasToInsert)
            .select();

        if (error) {
            console.error("Bulk thana insert error:", error.message);
            return NextResponse.json(
                { message: "Failed to create thanas", error: error.message, success: false },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: `${data.length} thana(s) created successfully`, success: true, count: data.length, data },
            { status: 201 }
        );
    } catch (error) {
        console.error("Bulk thana upload error:", error);
        return NextResponse.json(
            { message: "Internal Server Error", success: false },
            { status: 500 }
        );
    }
}
