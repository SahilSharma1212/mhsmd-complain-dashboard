import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "@/app/types";
import supabase from "@/app/_config/supabase";

// --- Helper: verify JWT ---
function verifyToken(token: string): User | null {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        return decoded as User;
    } catch {
        return null;
    }
}

export async function GET(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorised Access", success: false }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken) {
        return NextResponse.json({ message: "Invalid or expired token", success: false }, { status: 401 });
    }

    try {
        if (decodedToken.role === "TI") {
            // Fetch complaints for the TI's thana
            const { data: complaints, error } = await supabase
                .from("complaints")
                .select("io_officer")
                .eq("allocated_thana", decodedToken.thana);

            if (error) throw error;

            const ioStats: Record<string, number> = {};
            let noIoCount = 0;

            complaints.forEach((c) => {
                if (c.io_officer && c.io_officer.trim() !== "") {
                    ioStats[c.io_officer] = (ioStats[c.io_officer] || 0) + 1;
                } else {
                    noIoCount++;
                }
            });

            return NextResponse.json({
                success: true,
                data: {
                    thana: decodedToken.thana,
                    ioStats: Object.entries(ioStats).map(([name, count]) => ({ name, count })),
                    noIoCount
                }
            });
        }

        if (["SP", "ASP", "SDOP"].includes(decodedToken.role)) {
            const roleColumn = decodedToken.role === "SP" ? "designated_sp" : decodedToken.role === "ASP" ? "designated_asp" : "designated_sdop";

            // Fetch thanas assigned to this officer
            const { data: thanas, error: thanaError } = await supabase
                .from("thana")
                .select("name")
                .eq(roleColumn, decodedToken.name);

            if (thanaError) throw thanaError;

            const thanaNames = thanas.map(t => t.name);

            if (thanaNames.length === 0) {
                return NextResponse.json({ success: true, data: [] });
            }

            // Fetch complaints for these thanas
            const { data: complaints, error: complaintError } = await supabase
                .from("complaints")
                .select("allocated_thana, io_officer")
                .in("allocated_thana", thanaNames);

            if (complaintError) throw complaintError;

            const thanaWiseStats: Record<string, { ioStats: Record<string, number>, noIoCount: number }> = {};

            thanaNames.forEach(tn => {
                thanaWiseStats[tn] = { ioStats: {}, noIoCount: 0 };
            });

            complaints.forEach(c => {
                const thana = c.allocated_thana;
                if (!thanaWiseStats[thana]) return;

                if (c.io_officer && c.io_officer.trim() !== "") {
                    thanaWiseStats[thana].ioStats[c.io_officer] = (thanaWiseStats[thana].ioStats[c.io_officer] || 0) + 1;
                } else {
                    thanaWiseStats[thana].noIoCount++;
                }
            });

            const result = Object.entries(thanaWiseStats).map(([thanaName, stats]) => ({
                thanaName,
                ioStats: Object.entries(stats.ioStats).map(([name, count]) => ({ name, count })),
                noIoCount: stats.noIoCount
            }));

            return NextResponse.json({ success: true, data: result });
        }

        return NextResponse.json({ message: "Role not authorised", success: false }, { status: 403 });

    } catch (error: any) {
        console.error("IO Stats fetch error:", error.message);
        return NextResponse.json({ message: "Failed to fetch IO statistics", success: false }, { status: 500 });
    }
}
