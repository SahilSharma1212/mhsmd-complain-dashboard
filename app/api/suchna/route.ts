import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import supabase from "@/app/_config/supabase";
import { User } from "@/app/types";

export async function GET(request: NextRequest) {
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

    // 2. Only SP can access suchna_info
    if (decodedToken.role !== "SP") {
      return NextResponse.json(
        { message: "Forbidden - SP role required", success: false },
        { status: 403 }
      );
    }

    // 3. Fetch all suchna_info records ordered by most recent first
    const { data, error } = await supabase
      .from("suchna_info")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching suchna_info:", error);
      return NextResponse.json(
        { success: false, error: "Error fetching suchna records" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
    });
  } catch (error) {
    console.error("Suchna route error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
