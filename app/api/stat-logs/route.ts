import { NextRequest, NextResponse } from "next/server";
import supabase from "@/app/_config/supabase";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "@/app/types";

const STATUSES = [
    "संजेय",
    "असंजेय",
    "अप्रमाणित",
    "प्रतिबंधात्मक",
    "वापसी",
    "अन्य",
] as const;

type StatusKey = (typeof STATUSES)[number];
type StatusCounts = Record<StatusKey, number>;

// Build a zero-initialised status counts object
function zeroCounts(): StatusCounts {
    return Object.fromEntries(STATUSES.map((s) => [s, 0])) as StatusCounts;
}

// Aggregate flat rows into total statusCounts + per-thana breakdown (for SP)
function aggregateCounts(rows: { status: string; allocated_thana?: string }[]): {
    statusCounts: StatusCounts;
    thanaBreakdown: Record<string, StatusCounts>;
} {
    const statusCounts = zeroCounts();
    const thanaBreakdown: Record<string, StatusCounts> = {};

    for (const row of rows) {
        const s = row.status as StatusKey;
        if (!(s in statusCounts)) continue;

        // Global total per status
        statusCounts[s]++;

        // Per-thana breakdown (only populated when allocated_thana is present)
        if (row.allocated_thana) {
            if (!thanaBreakdown[row.allocated_thana]) {
                thanaBreakdown[row.allocated_thana] = zeroCounts();
            }
            thanaBreakdown[row.allocated_thana][s]++;
        }
    }

    return { statusCounts, thanaBreakdown };
}

export async function GET(request: NextRequest) {
    // ── 1. Auth ────────────────────────────────────────────────────────────────
    const token = request.cookies.get("token")?.value;
    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user: User;
    try {
        user = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload as User;
    } catch {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // ── 2. TI: 1 query, filter by their thana ─────────────────────────────────
    if (user.role === "TI") {
        const { data, error } = await supabase
            .from("complaints")
            .select("status")
            .eq("allocated_thana", user.thana);

        if (error) {
            console.error("stat-logs TI error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const rows = data ?? [];
        const { statusCounts } = aggregateCounts(rows);

        return NextResponse.json({ total: rows.length, statusCounts });
    }

    // ── 3. SP: 2 queries → thana list + complaints with thana column ──────────
    if (user.role === "SP") {
        // Round-trip 1: get thana names belonging to this SP
        const { data: thanaData, error: thanaError } = await supabase
            .from("thana")
            .select("name")
            .eq("designated_sp", user.name);

        if (thanaError) {
            console.error("stat-logs SP thana fetch error:", thanaError.message);
            return NextResponse.json({ error: thanaError.message }, { status: 500 });
        }

        const thanaList: string[] = (thanaData ?? []).map((t) => t.name);

        if (thanaList.length === 0) {
            return NextResponse.json({
                total: 0,
                statusCounts: zeroCounts(),
                thanaBreakdown: {},
            });
        }

        // Round-trip 2: fetch status + allocated_thana for JS aggregation
        const { data: complaintData, error: complaintError } = await supabase
            .from("complaints")
            .select("status, allocated_thana")
            .in("allocated_thana", thanaList);

        if (complaintError) {
            console.error("stat-logs SP complaint fetch error:", complaintError.message);
            return NextResponse.json({ error: complaintError.message }, { status: 500 });
        }

        const rows = complaintData ?? [];
        const { statusCounts, thanaBreakdown } = aggregateCounts(rows);

        return NextResponse.json({
            total: rows.length,
            statusCounts,
            thanaBreakdown, // { thanaName: { "संजेय": 3, "वापसी": 1, ... } }
        });
    }

    return NextResponse.json({ error: "Role not authorised" }, { status: 403 });
}