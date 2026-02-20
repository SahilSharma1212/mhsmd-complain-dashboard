import { NextRequest, NextResponse } from "next/server"
import jwt, { JwtPayload } from "jsonwebtoken"
import { User } from "../../types"
import supabase from "@/app/_config/supabase"

export async function GET(request: NextRequest) {
    try {
        // 1️⃣ Get ID and convert to number
        const complaintIdParam = request.nextUrl.searchParams.get("id")

        if (!complaintIdParam) {
            return NextResponse.json(
                { message: "Complaint id is required", success: false },
                { status: 400 }
            )
        }

        const complaintId = parseInt(complaintIdParam, 10)

        if (isNaN(complaintId)) {
            return NextResponse.json(
                { message: "Invalid complaint id", success: false },
                { status: 400 }
            )
        }

        // 2️⃣ Check token
        const token = request.cookies.get("token")

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            )
        }

        let user: User

        try {
            const decoded = jwt.verify(
                token.value,
                process.env.JWT_SECRET!
            ) as JwtPayload

            user = decoded as User
        } catch {
            return NextResponse.json(
                { message: "Invalid or expired token", success: false },
                { status: 401 }
            )
        }

        // 3️⃣ Check complaint exists
        const { data: complaint, error: complaintError } = await supabase
            .from("complaints")
            .select("*")
            .eq("id", complaintId)
            .single()

        if (complaintError || !complaint) {
            return NextResponse.json(
                { message: "Complaint not found", success: false },
                { status: 404 }
            )
        }

        // =====================
        // ROLE: TI
        // =====================
        if (user.role === "TI") {
            if (complaint.allocated_thana !== user.thana) {
                return NextResponse.json(
                    {
                        message: "You are not authorized to access this complaint",
                        success: false,
                    },
                    { status: 401 }
                )
            }
        }

        // =====================
        // ROLE: SP
        // =====================
        if (user.role === "SP") {
            const { data: designatedThana, error: thanaError } =
                await supabase
                    .from("thana")
                    .select("*")
                    .eq("designated_sp", user.name)
                    .eq("name", user.thana)
                    .single()

            if (thanaError || !designatedThana) {
                return NextResponse.json(
                    {
                        message: "You are not authorized to access this complaint",
                        success: false,
                    },
                    { status: 401 }
                )
            }
        }

        // 4️⃣ Fetch logs
        const { data: logs, error: logsError } = await supabase
            .from("complaint_logs")
            .select("*")
            .eq("complaint_id", complaintId)
            .order("created_at", { ascending: false })

        if (logsError) {
            return NextResponse.json(
                { message: "Failed to fetch logs", success: false },
                { status: 500 }
            )
        }

        return NextResponse.json(
            {
                message: "Logs found",
                success: true,
                data: logs,
            },
            { status: 200 }
        )
    } catch (error) {
        return NextResponse.json(
            { message: "Internal server error", success: false },
            { status: 500 }
        )
    }
}