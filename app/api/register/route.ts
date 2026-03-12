import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { z } from "zod";
import bcrypt from "bcryptjs";
import supabase from "@/app/_config/supabase";
import { User } from "@/app/types";

const registrationSchema = z.object({
  thanaName: z.string().min(1, "Thana name is required"),
  thanaPinCode: z.string().min(1, "Pin code is required"),
  thanaCity: z.string().min(1, "City is required"),
  thanaContact: z.string().min(10, "Thana contact number must be at least 10 digits"),
  userName: z.string().min(1, "User name is required"),
  userEmail: z.string().email("Invalid email format"),
  userPhone: z.string().min(10, "User phone number must be at least 10 digits"),
  userRole: z.enum(["TI", "SDOP", "ASP"]).default("TI"),
  designatedAsp: z.string().optional().default(""),
  designatedSdop: z.string().optional().default(""),
});

export async function POST(request: NextRequest) {
  try {
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

    // 2. Role check — only SP can perform this consolidated action
    if (decodedToken.role !== "SP") {
      return NextResponse.json(
        { message: "Forbidden - SP role required", success: false },
        { status: 403 }
      );
    }

    // 3. Validate request body
    const body = await request.json();
    const validation = registrationSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          success: false,
          error: Object.values(errors).flat()[0],
          errors,
        },
        { status: 400 }
      );
    }

    const {
      thanaName,
      thanaPinCode,
      thanaCity,
      thanaContact,
      userName,
      userEmail,
      userPhone,
      userRole,
      designatedAsp,
      designatedSdop,
    } = validation.data;

    // 4. Check if Thana already exists
    const { data: existingThana } = await supabase
      .from("thana")
      .select("id")
      .eq("name", thanaName.toLowerCase())
      .maybeSingle();

    if (existingThana) {
      return NextResponse.json(
        { success: false, error: "Thana already registered" },
        { status: 409 }
      );
    }

    // 5. Check if User already exists (email or phone)
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .or(`email.eq.${userEmail},phone.eq.${userPhone}`)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email or Phone number already registered" },
        { status: 409 }
      );
    }

    // 6. Build thana insert payload — link user to appropriate column based on role
    const thanaInsert: Record<string, string> = {
      name: thanaName.toLowerCase(),
      pin_code: thanaPinCode,
      city: thanaCity.toLowerCase(),
      contact_number: thanaContact,
      designated_sp: decodedToken.name.toLowerCase(),
    };

    if (userRole === "TI") {
      thanaInsert.ti = userName.toLowerCase();
    } else if (userRole === "SDOP") {
      thanaInsert.designated_sdop = userName.toLowerCase();
    } else if (userRole === "ASP") {
      thanaInsert.designated_asp = userName.toLowerCase();
    }

    // Set optional designated officers if provided
    if (designatedAsp && designatedAsp.trim()) {
      thanaInsert.designated_asp = designatedAsp.toLowerCase();
    }
    if (designatedSdop && designatedSdop.trim()) {
      thanaInsert.designated_sdop = designatedSdop.toLowerCase();
    }

    const { error: thanaError } = await supabase.from("thana").insert(thanaInsert);

    if (thanaError) {
      console.error("Thana creation error:", thanaError);
      return NextResponse.json(
        { success: false, error: "Error creating Thana record" },
        { status: 500 }
      );
    }

    // 7. Hash password and insert User
    const hashedPassword = await bcrypt.hash(userPhone, 10);
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        name: userName.toLowerCase(),
        email: userEmail,
        password: hashedPassword,
        role: userRole,
        phone: userPhone,
        thana: thanaName.toLowerCase(),
        added_by: decodedToken.name,
      })
      .select()
      .single();

    if (userError || !newUser) {
      console.error("User creation error:", userError);
      // Note: Ideally, we'd roll back the Thana creation here if this fails.
      // Supabase doesn't support easy transactions across multiple calls without RPC.
      return NextResponse.json(
        { success: false, error: "Error creating TI user account" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Thana and TI registered successfully",
        thana: thanaName,
        user: newUser.email,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration route error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
