import { NextRequest, NextResponse } from "next/server";
import supabase from "@/app/_config/supabase";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "@/app/types";

const STATUSES = [
    "अपराध",
    "फ़ैना",
    "अप्रमाणित",
    "प्रतिबंधात्मक",
    "वापसी",
    "लम्बित",
    "अन्य",
] as const;

type StatusKey = (typeof STATUSES)[number];
type StatusCounts = Record<StatusKey, number>;

// Build a zero-initialised status counts object
function zeroCounts(): StatusCounts {
    return Object.fromEntries(STATUSES.map((s) => [s, 0])) as StatusCounts;
}

function aggregateCounts(rows: { id: string; status: string; created_at: string; allocated_thana?: string; complainant_name?: string; subject?: string }[]): {
    statusCounts: StatusCounts;
    nirakritCount: number;
    thanaBreakdown: Record<string, StatusCounts>;
    ageStats: {
        lessThan15Days: number;
        fifteenToThirtyDays: number;
        moreThan30Days: number;
    };
    categoryAgeStats: {
        total: { lessThan15Days: number; fifteenToThirtyDays: number; moreThan30Days: number };
        pending: { lessThan15Days: number; fifteenToThirtyDays: number; moreThan30Days: number };
        unallocated: { lessThan15Days: number; fifteenToThirtyDays: number; moreThan30Days: number };
        nirakrit: { lessThan15Days: number; fifteenToThirtyDays: number; moreThan30Days: number };
    };
    ageStatusBreakdown: {
        lessThan15Days: StatusCounts;
        fifteenToThirtyDays: StatusCounts;
        moreThan30Days: StatusCounts;
    };
    thanaAgeBreakdown: Record<string, {
        lessThan15Days: number;
        fifteenToThirtyDays: number;
        moreThan30Days: number;
    }>;
    thanaAgeStatusBreakdown: Record<string, Record<string, StatusCounts>>;
    latestTotalComplaints: any[];
    latestPendingComplaints: any[];
    latestUnallocatedComplaints: any[];
    latestNirakritComplaints: any[];
} {
    const statusCounts = zeroCounts();
    let nirakritCount = 0;
    const thanaBreakdown: Record<string, StatusCounts> = {};
    const thanaAgeBreakdown: Record<string, {
        lessThan15Days: number;
        fifteenToThirtyDays: number;
        moreThan30Days: number;
    }> = {};
    const thanaAgeStatusBreakdown: Record<string, Record<string, StatusCounts>> = {};

    const ageStats = {
        lessThan15Days: 0,
        fifteenToThirtyDays: 0,
        moreThan30Days: 0,
    };

    const categoryAgeStats = {
        total: { lessThan15Days: 0, fifteenToThirtyDays: 0, moreThan30Days: 0 },
        pending: { lessThan15Days: 0, fifteenToThirtyDays: 0, moreThan30Days: 0 },
        unallocated: { lessThan15Days: 0, fifteenToThirtyDays: 0, moreThan30Days: 0 },
        nirakrit: { lessThan15Days: 0, fifteenToThirtyDays: 0, moreThan30Days: 0 },
    };

    const ageStatusBreakdown = {
        lessThan15Days: zeroCounts(),
        fifteenToThirtyDays: zeroCounts(),
        moreThan30Days: zeroCounts(),
    };

    const latestComplaints: Record<string, any[]> = {
        total: [],
        pending: [],
        unallocated: [],
        nirakrit: [],
    };

    const now = new Date();
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(now.getDate() - 15);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const fifteenDaysTs = fifteenDaysAgo.getTime();
    const thirtyDaysTs = thirtyDaysAgo.getTime();

    for (const row of rows) {
        // 1. Age calculation
        const createdAtTs = new Date(row.created_at).getTime();
        let currentAge: 'lessThan15Days' | 'fifteenToThirtyDays' | 'moreThan30Days' = 'moreThan30Days';

        if (createdAtTs > fifteenDaysTs) {
            currentAge = 'lessThan15Days';
        } else if (createdAtTs > thirtyDaysTs) {
            currentAge = 'fifteenToThirtyDays';
        }

        ageStats[currentAge]++;
        categoryAgeStats.total[currentAge]++;

        // 2. Category identification
        const hasThana = !!row.allocated_thana;
        const isUnallocated = !hasThana;
        const isPending = hasThana && (row.status === "PENDING" || row.status === "लंबित" || row.status === "लम्बित");
        const isNirakrit = hasThana && !!row.status && row.status !== "PENDING" && row.status !== "लंबित" && row.status !== "लम्बित";

        if (isPending) {
            categoryAgeStats.pending[currentAge]++;
            latestComplaints.pending.push(row);
        }
        if (isUnallocated) {
            categoryAgeStats.unallocated[currentAge]++;
            latestComplaints.unallocated.push(row);
        }
        if (isNirakrit) {
            categoryAgeStats.nirakrit[currentAge]++;
            latestComplaints.nirakrit.push(row);
            nirakritCount++;
        }
        latestComplaints.total.push(row);

        // 3. Status Breakdown
        let rawStatus = row.status;
        let s: StatusKey = "अन्य";

        // Normalize status
        if (rawStatus === "PENDING" || rawStatus === "लंबित" || rawStatus === "लम्बित") {
            s = "लम्बित";
        } else if (STATUSES.includes(rawStatus as any)) {
            s = rawStatus as StatusKey;
        }

        statusCounts[s]++;
        ageStatusBreakdown[currentAge][s]++;

        // 4. Per-thana breakdown
        if (row.allocated_thana) {
            const t = row.allocated_thana;

            if (!thanaAgeBreakdown[t]) {
                thanaAgeBreakdown[t] = {
                    lessThan15Days: 0,
                    fifteenToThirtyDays: 0,
                    moreThan30Days: 0,
                };
            }
            thanaAgeBreakdown[t][currentAge]++;

            if (row.allocated_thana) {
                if (!thanaBreakdown[t]) {
                    thanaBreakdown[t] = zeroCounts();
                }
                thanaBreakdown[t][s]++;

                if (!thanaAgeStatusBreakdown[t]) {
                    thanaAgeStatusBreakdown[t] = {
                        lessThan15Days: zeroCounts(),
                        fifteenToThirtyDays: zeroCounts(),
                        moreThan30Days: zeroCounts(),
                    };
                }
                thanaAgeStatusBreakdown[t][currentAge][s]++;
            }
        }
    }

    const sortFn = (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

    return {
        statusCounts,
        nirakritCount,
        thanaBreakdown,
        ageStats,
        categoryAgeStats,
        ageStatusBreakdown,
        thanaAgeBreakdown,
        thanaAgeStatusBreakdown,
        latestTotalComplaints: latestComplaints.total.sort(sortFn).slice(0, 10),
        latestPendingComplaints: latestComplaints.pending.sort(sortFn).slice(0, 10),
        latestUnallocatedComplaints: latestComplaints.unallocated.sort(sortFn).slice(0, 10),
        latestNirakritComplaints: latestComplaints.nirakrit.sort(sortFn).slice(0, 10),
    };
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
            .select("id, status, created_at, complainant_name, subject")
            .eq("allocated_thana", user.thana);

        if (error) {
            console.error("stat-logs TI error:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            return NextResponse.json({ error: error.message, details: error.details }, { status: 500 });
        }

        const rows = data ?? [];
        const {
            statusCounts,
            nirakritCount,
            ageStats,
            categoryAgeStats,
            ageStatusBreakdown,
            thanaAgeStatusBreakdown,
            latestTotalComplaints,
            latestPendingComplaints,
            latestNirakritComplaints
        } = aggregateCounts(rows as any);

        // TI sees only their thana's allocated complaints — strip unallocated stats
        const tiCategoryAgeStats = {
            ...categoryAgeStats,
            unallocated: { lessThan15Days: 0, fifteenToThirtyDays: 0, moreThan30Days: 0 },
        };

        const response = NextResponse.json({
            role: "TI",
            total: rows.length,
            statusCounts,
            nirakritCount,
            ageStats,
            categoryAgeStats: tiCategoryAgeStats,
            ageStatusBreakdown,
            thanaAgeStatusBreakdown,
            latestTotalComplaints,
            latestPendingComplaints,
            latestNirakritComplaints
        });
        response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
        return response;
    }

    // ── 3. SP, ASP, SDOP: 2 queries → thana list + complaints with thana column ─
    if (user.role === "SP" || user.role === "ASP" || user.role === "SDOP") {
        const roleColumn = user.role === "SP" ? "designated_sp" : user.role === "ASP" ? "designated_asp" : "designated_sdop";

        // Round-trip 1: get thana names belonging to this role
        const { data: thanaData, error: thanaError } = await supabase
            .from("thana")
            .select("name")
            .eq(roleColumn, user.name);

        if (thanaError) {
            console.error("stat-logs SP thana fetch error:", {
                message: thanaError.message,
                error: thanaError,
                url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING'
            });
            return NextResponse.json({ error: thanaError.message }, { status: 500 });
        }

        const thanaList: string[] = (thanaData ?? []).map((t) => t.name);

        // Round-trip 2: Optimized parallel fetches
        // We always fetch unallocated complaints. 
        // We only fetch allocated complaints if the SP has assigned thanas.
        const queries: any[] = [
            supabase
                .from("complaints")
                .select("id, status, allocated_thana, created_at, complainant_name, subject")
                .or('allocated_thana.is.null,allocated_thana.eq.')
        ];

        if (thanaList.length > 0) {
            queries.push(
                supabase
                    .from("complaints")
                    .select("id, status, allocated_thana, created_at, complainant_name, subject")
                    .in("allocated_thana", thanaList)
            );
        }

        const results = await Promise.all(queries);
        const unallocatedRes = results[0];
        const allocatedRes = results[1] || { data: [], error: null };

        if (unallocatedRes.error) {
            console.error("stat-logs SP unallocated fetch error:", {
                message: unallocatedRes.error.message,
                details: unallocatedRes.error.details,
                hint: unallocatedRes.error.hint,
                code: unallocatedRes.error.code
            });
            return NextResponse.json({ error: unallocatedRes.error.message }, { status: 500 });
        }
        if (allocatedRes.error) {
            console.error("stat-logs SP allocated fetch error:", {
                message: allocatedRes.error.message,
                details: allocatedRes.error.details,
                hint: allocatedRes.error.hint,
                code: allocatedRes.error.code
            });
            return NextResponse.json({ error: allocatedRes.error.message }, { status: 500 });
        }

        const rows = [...(allocatedRes.data ?? []), ...(unallocatedRes.data ?? [])];
        const unallocatedCount = unallocatedRes.data?.length ?? 0;

        const {
            statusCounts,
            nirakritCount,
            thanaBreakdown,
            ageStats,
            categoryAgeStats,
            ageStatusBreakdown,
            thanaAgeBreakdown,
            thanaAgeStatusBreakdown,
            latestTotalComplaints,
            latestPendingComplaints,
            latestUnallocatedComplaints,
            latestNirakritComplaints
        } = aggregateCounts(rows as any);

        const response = NextResponse.json({
            role: "SP",
            total: rows.length,
            unallocatedCount,
            nirakritCount,
            statusCounts,
            thanaBreakdown,
            ageStats,
            categoryAgeStats,
            ageStatusBreakdown,
            thanaAgeBreakdown,
            thanaAgeStatusBreakdown,
            latestTotalComplaints,
            latestPendingComplaints,
            latestUnallocatedComplaints,
            latestNirakritComplaints
        });

        // Add Cache-Control header for better reuse & less origin load
        response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
        return response;
    }

    return NextResponse.json({ error: "Role not authorised" }, { status: 403 });
}