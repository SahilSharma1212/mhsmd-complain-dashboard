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
            .select("id, status, subject, message, complainant_name, complainant_contact, date, created_at, role_addressed_to, allocated_thana, file_urls, phone, submitted_by, io_officer")
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
            // Allow access if complaint is unallocated (SP manages unallocated queue)
            // or if it's allocated to one of this SP's thanas
            if (complaint.allocated_thana) {
                const { data: designatedThana, error: thanaError } = await supabase
                    .from("thana")
                    .select("name")
                    .eq("designated_sp", user.name)
                    .eq("name", complaint.allocated_thana)
                    .maybeSingle()

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
        console.log(logs)
        console.log(complaint)

        return NextResponse.json(
            {
                message: "Logs found",
                success: true,
                data: {
                    logs,
                    complaint
                },
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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { complaint_id, reason, status: newStatus } = body

        if (!complaint_id || !reason) {
            return NextResponse.json(
                { message: "Complaint ID and reason are required", success: false },
                { status: 400 }
            )
        }

        // 1. Authenticate
        const token = request.cookies.get("token")
        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            )
        }

        let user: User
        try {
            const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as JwtPayload
            user = decoded as User
        } catch {
            return NextResponse.json(
                { message: "Invalid or expired token", success: false },
                { status: 401 }
            )
        }

        // 2. Fetch complaint to verify existence and authorization
        const { data: complaint, error: complaintError } = await supabase
            .from("complaints")
            .select("*")
            .eq("id", complaint_id)
            .single()

        if (complaintError || !complaint) {
            return NextResponse.json(
                { message: "Complaint not found", success: false },
                { status: 404 }
            )
        }

        // 3. Authorization check
        if (user.role === "TI" && complaint.allocated_thana !== user.thana) {
            return NextResponse.json(
                { message: "You are not authorized for this complaint", success: false },
                { status: 403 }
            )
        }

        if (user.role === "SP") {
            const { data: designatedThana } = await supabase
                .from("thana")
                .select("*")
                .eq("designated_sp", user.name)
                .eq("name", complaint.allocated_thana)
                .single()

            if (!designatedThana) {
                return NextResponse.json(
                    { message: "You are not authorized for this complaint", success: false },
                    { status: 403 }
                )
            }
        }

        // 4. Handle Status Update if provided
        const prevStatus = complaint.status
        let updateData: any = null
        let action = "MANUAL"

        if (newStatus && newStatus !== prevStatus) {
            const { data: updatedComplaint, error: updateError } = await supabase
                .from("complaints")
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", complaint_id)
                .select("*")
                .single()

            if (updateError) {
                console.log(updateError)
                return NextResponse.json(
                    { message: "Failed to update complaint status", success: false, error: updateError.message },
                    { status: 500 }
                )
            }
            updateData = updatedComplaint
            action = "UPDATED"
        }

        // 5. Insert log
        const { data: logData, error: logError } = await supabase
            .from("complaint_logs")
            .insert({
                complaint_id,
                action,
                prev_status: prevStatus,
                current_status: newStatus || prevStatus,
                reason: reason,
                updated_by: user.name
            })
            .select()
            .single()

        if (logError) {
            return NextResponse.json(
                { message: "Failed to add log", success: false, error: logError.message },
                { status: 500 }
            )
        }

        console.log(logData)
        console.log(complaint)
        return NextResponse.json({
            message: "Log added successfully",
            success: true,
            data: logData
        })
    } catch (error) {
        return NextResponse.json(
            { message: "Internal server error", success: false },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const logId = searchParams.get("id")

        if (!logId) {
            return NextResponse.json(
                { message: "Log ID is required", success: false },
                { status: 400 }
            )
        }

        // 1. Authenticate
        const token = request.cookies.get("token")
        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            )
        }

        const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as JwtPayload
        const user = decoded as User

        // 2. Fetch log to get complaint_id
        const { data: log, error: logFetchError } = await supabase
            .from("complaint_logs")
            .select("complaint_id, action")
            .eq("id", logId)
            .single()

        if (logFetchError || !log) {
            return NextResponse.json(
                { message: "Log not found", success: false },
                { status: 404 }
            )
        }

        // 3. Prevent deleting CREATED logs (initial logs) if necessary
        if (log.action === "CREATED") {
            return NextResponse.json(
                { message: "Initial complaint logs cannot be deleted", success: false },
                { status: 403 }
            )
        }

        // 4. Fetch complaint for authorization check
        const { data: complaint, error: complaintError } = await supabase
            .from("complaints")
            .select("allocated_thana, role_addressed_to")
            .eq("id", log.complaint_id)
            .single()

        if (complaintError || !complaint) {
            return NextResponse.json(
                { message: "Associated complaint not found", success: false },
                { status: 404 }
            )
        }

        // 5. Authorization
        if (user.role === "TI") {
            if (complaint.allocated_thana !== user.thana) {
                return NextResponse.json(
                    { message: "You are not authorized to delete logs for this thana", success: false },
                    { status: 403 }
                )
            }
        } else if (user.role === "SP") {
            const { data: designatedThana } = await supabase
                .from("thana")
                .select("*")
                .eq("designated_sp", user.name)
                .eq("name", complaint.allocated_thana)
                .single()

            if (!designatedThana) {
                return NextResponse.json(
                    { message: "You are not authorized for this complaint", success: false },
                    { status: 403 }
                )
            }
        }

        // 6. Delete log
        const { error: deleteError } = await supabase
            .from("complaint_logs")
            .delete()
            .eq("id", logId)

        if (deleteError) {
            return NextResponse.json(
                { message: "Failed to delete log", success: false, error: deleteError.message },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { message: "Log deleted successfully", success: true },
            { status: 200 }
        )

    } catch (error) {
        console.error("Delete Log Error:", error)
        return NextResponse.json(
            { message: "Internal server error", success: false },
            { status: 500 }
        )
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, io_officer } = body;

        if (!id || !io_officer) {
            return NextResponse.json({ message: "ID and IO Officer name are required", success: false }, { status: 400 });
        }

        // 1. Authenticate
        const token = request.cookies.get("token");
        if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

        let user: User;
        try {
            const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as JwtPayload;
            user = decoded as User;
        } catch {
            return NextResponse.json({ message: "Invalid or expired token", success: false }, { status: 401 });
        }

        // 2. Fetch complaint for auth & current IO
        const { data: complaint, error: fetchError } = await supabase
            .from("complaints")
            .select("status, allocated_thana, io_officer")
            .eq("id", id)
            .single();

        if (fetchError || !complaint) {
            return NextResponse.json({ message: "Complaint not found", success: false }, { status: 404 });
        }

        // 3. Authorization check
        if (user.role === "TI" && complaint.allocated_thana !== user.thana) {
            return NextResponse.json({ message: "Unauthorized", success: false }, { status: 403 });
        }
        if (user.role === "SP") {
            const { data: designatedThana } = await supabase
                .from("thana")
                .select("*")
                .eq("designated_sp", user.name)
                .eq("name", complaint.allocated_thana)
                .single();
            if (!designatedThana) {
                return NextResponse.json({ message: "Unauthorized", success: false }, { status: 403 });
            }
        }

        const prevIO = complaint.io_officer || "NOT_ALLOCATED";

        // 4. Update complaint
        const { error: updateError } = await supabase
            .from("complaints")
            .update({
                io_officer: io_officer,
                updated_at: new Date().toISOString()
            })
            .eq("id", id);

        if (updateError) {
            return NextResponse.json({ message: "Failed to update IO", success: false, error: updateError.message }, { status: 500 });
        }

        // 5. Insert log
        const { error: logError } = await supabase
            .from("complaint_logs")
            .insert({
                complaint_id: id,
                action: "IO_ALLOCATED",
                prev_status: prevIO,
                current_status: io_officer,
                reason: `IO Officer allocated: ${io_officer} (Replaced: ${prevIO})`,
                updated_by: user.name
            });

        if (logError) {
            return NextResponse.json({ message: "IO updated but logging failed", success: false, error: logError.message }, { status: 500 });
        }

        return NextResponse.json({ message: "IO Officer allocated successfully", success: true });

    } catch (error) {
        console.error("IO Allocation Error:", error);
        return NextResponse.json({ message: "Internal server error", success: false }, { status: 500 });
    }
}
