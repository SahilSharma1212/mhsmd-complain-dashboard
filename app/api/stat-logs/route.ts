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
    "PENDING",
    "SOLVED",
] as const;

type StatusKey = (typeof STATUSES)[number];
type StatusCounts = Record<StatusKey, number>;

// Build a zero-initialised status counts object
function zeroCounts(): StatusCounts {
    return Object.fromEntries(STATUSES.map((s) => [s, 0])) as StatusCounts;
}

// Aggregate flat rows into total statusCounts + per-thana breakdown (for SP) + ageStats
function aggregateCounts(rows: { status: string; created_at: string; allocated_thana?: string }[]): {
    statusCounts: StatusCounts;
    thanaBreakdown: Record<string, StatusCounts>;
    ageStats: {
        lessThan1Month: number;
        oneToThreeMonths: number;
        moreThan3Months: number;
    };
    thanaAgeBreakdown: Record<string, {
        lessThan1Month: number;
        oneToThreeMonths: number;
        moreThan3Months: number;
    }>;
    thanaAgeStatusBreakdown: Record<string, Record<string, StatusCounts>>;
} {
    const statusCounts = zeroCounts();
    const thanaBreakdown: Record<string, StatusCounts> = {};
    const thanaAgeBreakdown: Record<string, {
        lessThan1Month: number;
        oneToThreeMonths: number;
        moreThan3Months: number;
    }> = {};
    const thanaAgeStatusBreakdown: Record<string, Record<string, StatusCounts>> = {};
    const ageStats = {
        lessThan1Month: 0,
        oneToThreeMonths: 0,
        moreThan3Months: 0,
    };

    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    // Pre-calculate timestamps for faster comparison
    const oneMonthTs = oneMonthAgo.getTime();
    const threeMonthsTs = threeMonthsAgo.getTime();

    for (const row of rows) {
        // 1. Age Stats (Process for ALL complaints)
        const createdAtTs = new Date(row.created_at).getTime();
        let currentAge: 'lessThan1Month' | 'oneToThreeMonths' | 'moreThan3Months' = 'moreThan3Months';

        if (createdAtTs > oneMonthTs) {
            ageStats.lessThan1Month++;
            currentAge = 'lessThan1Month';
        } else if (createdAtTs > threeMonthsTs) {
            ageStats.oneToThreeMonths++;
            currentAge = 'oneToThreeMonths';
        } else {
            ageStats.moreThan3Months++;
            currentAge = 'moreThan3Months';
        }

        // 2. Status Breakdown (Process only for known statuses)
        const s = row.status as StatusKey;
        const isValidStatus = STATUSES.includes(s);

        if (isValidStatus) {
            statusCounts[s]++;
        }

        // 3. Per-thana breakdown
        if (row.allocated_thana) {
            const t = row.allocated_thana;

            // Age breakdown per thana (Process for ALL)
            if (!thanaAgeBreakdown[t]) {
                thanaAgeBreakdown[t] = {
                    lessThan1Month: 0,
                    oneToThreeMonths: 0,
                    moreThan3Months: 0,
                };
            }
            thanaAgeBreakdown[t][currentAge]++;

            // Status breakdown per thana (Only if valid)
            if (isValidStatus) {
                if (!thanaBreakdown[t]) {
                    thanaBreakdown[t] = zeroCounts();
                }
                thanaBreakdown[t][s]++;

                if (!thanaAgeStatusBreakdown[t]) {
                    thanaAgeStatusBreakdown[t] = {
                        lessThan1Month: zeroCounts(),
                        oneToThreeMonths: zeroCounts(),
                        moreThan3Months: zeroCounts(),
                    };
                }
                thanaAgeStatusBreakdown[t][currentAge][s]++;
            }
        }
    }

    return { statusCounts, thanaBreakdown, ageStats, thanaAgeBreakdown, thanaAgeStatusBreakdown };
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
            .select("status, created_at")
            .eq("allocated_thana", user.thana);

        if (error) {
            console.error("stat-logs TI error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const rows = data ?? [];
        const { statusCounts, ageStats, thanaAgeStatusBreakdown } = aggregateCounts(rows as any);

        const response = NextResponse.json({ total: rows.length, statusCounts, ageStats, thanaAgeStatusBreakdown });
        response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
        return response;
    }

    // ── 3. SP: 2 queries → thana list + complaints with thana column ──────────
    if (user.role === "SP") {
        // Round-trip 1: get thana names belonging to this SP
        const { data: thanaData, error: thanaError } = await supabase
            .from("thana")
            .select("name")
            .eq("designated_sp", user.name);

        if (thanaError) {
            console.error("stat-logs SP thana fetch error:", {
                message: thanaError.message,
                error: thanaError,
                url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING'
            });
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

        // Round-trip 2: Optimized parallel fetches to avoid long/brittle .or() strings
        // 1. Fetch complaints allocated to the SP's thanas
        // 2. Fetch unallocated complaints
        const [allocatedRes, unallocatedRes] = await Promise.all([
            supabase
                .from("complaints")
                .select("status, allocated_thana, created_at")
                .in("allocated_thana", thanaList),
            supabase
                .from("complaints")
                .select("status, allocated_thana, created_at")
                .is("allocated_thana", null)
        ]);

        if (allocatedRes.error) {
            console.error("stat-logs SP allocated fetch error:", allocatedRes.error.message);
            return NextResponse.json({ error: allocatedRes.error.message }, { status: 500 });
        }
        if (unallocatedRes.error) {
            console.error("stat-logs SP unallocated fetch error:", unallocatedRes.error.message);
            return NextResponse.json({ error: unallocatedRes.error.message }, { status: 500 });
        }

        const rows = [...(allocatedRes.data ?? []), ...(unallocatedRes.data ?? [])];
        const unallocatedCount = unallocatedRes.data?.length ?? 0;

        const { statusCounts, thanaBreakdown, ageStats, thanaAgeBreakdown, thanaAgeStatusBreakdown } = aggregateCounts(rows as any);

        const response = NextResponse.json({
            total: rows.length,
            unallocatedCount,
            statusCounts,
            thanaBreakdown,
            ageStats,
            thanaAgeBreakdown,
            thanaAgeStatusBreakdown,
        });

        // Add Cache-Control header for better reuse & less origin load
        response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
        return response;
    }

    return NextResponse.json({ error: "Role not authorised" }, { status: 403 });
}