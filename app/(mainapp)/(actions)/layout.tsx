'use client'
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '../../_store/userStore';
import { useLanguageStore } from '@/app/_store/languageStore';
import { useEffect, useState } from 'react';
import { VscLoading } from 'react-icons/vsc';

// ─── Types ──────────────────────────────────────────────────────────────────
interface StatusCounts {
    [status: string]: number;
}

interface StatData {
    total: number;
    statusCounts: StatusCounts;
    thanaBreakdown?: Record<string, StatusCounts>; // SP only: { thanaName: { status: count } }
}

// ─── Constants ──────────────────────────────────────────────────────────────
const complaintStatusColors = [
    { id: "संजेय", labeleng: "Sanjay", labelhindi: "संजेय", indicatorColor: "#0000ff" },
    { id: "असंजेय", labeleng: "Asanjay", labelhindi: "असंजेय", indicatorColor: "#ff5e00" },
    { id: "अप्रमाणित", labeleng: "Apramanit", labelhindi: "अप्रमाणित", indicatorColor: "#7a00b3" },
    { id: "प्रतिबंधात्मक", labeleng: "Pratibandhatmak", labelhindi: "प्रतिबंधात्मक", indicatorColor: "#000" },
    { id: "वापसी", labeleng: "Vapsi", labelhindi: "वापसी", indicatorColor: "#ff0000" },
    { id: "अन्य", labeleng: "Anya", labelhindi: "अन्य", indicatorColor: "#007d21" },
];

const tabs = [
    { id: "manage", labeleng: "Manage Complaints", labelhindi: "शिकायत प्रबंधन", href: "/manage-complaints", color: "#7a00b3", indicatorColor: "#dd00ff" },
    { id: "unallocated", labeleng: "Unallocated Complaints", labelhindi: "अनाबंटित शिकायतें", href: "/unallocated-complaints", color: "#e67e22", indicatorColor: "#f39c12" },
    { id: "register", labeleng: "Register Complaint", labelhindi: "शिकायत दर्ज करें", href: "/register-complaint", color: "#0000ff", indicatorColor: "#0000ff" },
    { id: "admin", labeleng: "Admin Actions", labelhindi: "प्रशासनिक कार्य", href: "/admin-actions", color: "#06a600", indicatorColor: "#00ff00" },
];

export default function ActionsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useUserStore();
    const { language } = useLanguageStore();

    // ── Stats ────────────────────────────────────────────────────────────────
    const [stats, setStats] = useState<StatData | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    // ── SP modal ────────────────────────────────────────────────────────────
    const [modalStatus, setModalStatus] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/stat-logs");
                if (!res.ok) return;
                setStats(await res.json());
            } catch (e) {
                console.error("Stats fetch failed:", e);
            } finally {
                setStatsLoading(false);
            }
        }
        fetchStats();
    }, []);

    // ── Tab helpers ──────────────────────────────────────────────────────────
    const visibleTabs = user?.role === "SP"
        ? tabs
        : tabs.filter(t => t.id !== "admin" && t.id !== "unallocated");

    const getActiveTab = () => {
        if (pathname.includes("/manage-complaints")) return "manage";
        if (pathname.includes("/unallocated-complaints")) return "unallocated";
        if (pathname.includes("/register-complaint")) return "register";
        if (pathname.includes("/admin-actions")) return "admin";
        return "manage";
    };

    const activeTabId = getActiveTab();
    const activeTab = tabs.find(t => t.id === activeTabId);
    const activeStatusMeta = complaintStatusColors.find(s => s.id === modalStatus);

    // Thana rows for the active modal status
    const thanaRows = modalStatus && stats?.thanaBreakdown
        ? Object.entries(stats.thanaBreakdown).map(([thana, counts]) => ({
            thana,
            count: counts[modalStatus] ?? 0,
        }))
        : [];

    return (
        <div className='bg-white rounded-lg w-full flex flex-col items-start'>
            <div className='p-4 flex flex-col w-full'>
                <div className='flex items-center justify-start gap-2 flex-col'>
                    <p>
                        {user?.role === "TI"
                            ? language === "english" ? "Thana Complaint Overview" : "थाना शिकायत अवलोकन"
                            : user?.role === "SP"
                                ? language === "english" ? "District Complaint Overview" : "जिला शिकायत अवलोकन"
                                : language === "english" ? "Complaint Overview" : "शिकायत अवलोकन"
                        }
                    </p>

                    <div className='flex flex-col items-start justify-start gap-2 w-full'>
                        <div className="flex w-full flex-wrap gap-3">

                            {/* Total Card */}
                            <div className="flex flex-1 min-w-[140px] flex-col items-center justify-center gap-1 border rounded-sm p-3">
                                <p className="text-xs font-semibold text-black">
                                    {language === "english" ? "Total" : "कुल"}
                                </p>
                                <p className="font-medium text-black text-sm">
                                    {statsLoading ? <VscLoading className='animate-spin' /> : (stats?.total ?? 0)}
                                </p>
                            </div>

                            {/* Status Cards */}
                            {complaintStatusColors.map((s) => (
                                <div
                                    key={s.id}
                                    className={`relative flex flex-1 min-w-[140px] flex-col items-center justify-center gap-1 border rounded-sm p-3`}
                                    style={{
                                        borderColor: s.indicatorColor
                                    }}
                                >
                                    <p
                                        className="text-xs font-semibold"
                                        style={{ color: s.indicatorColor }}
                                    >
                                        {language === "english" ? s.labeleng : s.labelhindi}
                                    </p>

                                    <p className="font-medium text-gray-800 text-sm">
                                        {statsLoading
                                            ? <VscLoading className='animate-spin' style={{ color: s.indicatorColor }} />
                                            : (stats?.statusCounts?.[s.id] ?? 0)}
                                    </p>

                                    {/* SP-only expand button */}
                                    {user?.role === "SP" && (
                                        <button
                                            onClick={() => setModalStatus(s.id)}
                                            title={
                                                language === "english"
                                                    ? "Thana breakdown"
                                                    : "थाना विवरण"
                                            }
                                            className="absolute top-1 right-1 text-gray-400 hover:text-gray-700 transition-colors text-xs"
                                        >
                                            ⤢
                                        </button>
                                    )}
                                </div>
                            ))}

                        </div>
                    </div>
                </div>
            </div>

            {/* Tab bar */}
            <div className="relative flex border-b py-2 border-gray-100 w-full">
                {visibleTabs.map((tab) => (
                    <Link
                        key={tab.id}
                        href={tab.href}
                        className="flex-1 py-3 px-1.5 text-sm font-semibold transition-colors duration-200 text-center"
                        style={{ color: activeTabId === tab.id ? tab.color : "#64748b" }}
                    >
                        {language === "english" ? tab.labeleng : tab.labelhindi}
                    </Link>
                ))}
                <div
                    className="absolute bottom-0 h-[2px] transition-all duration-300"
                    style={{
                        width: `${100 / visibleTabs.length}%`,
                        left: `${visibleTabs.findIndex(t => t.id === activeTabId) * (100 / visibleTabs.length)}%`,
                        backgroundColor: activeTab?.indicatorColor || "#000",
                    }}
                />
                <div
                    className="absolute bottom-0 h-full transition-all duration-300 z-0"
                    style={{
                        width: `${100 / visibleTabs.length}%`,
                        left: `${visibleTabs.findIndex(t => t.id === activeTabId) * (100 / visibleTabs.length)}%`,
                        backgroundColor: `${activeTab?.indicatorColor}05` || "transparent",
                    }}
                />
            </div>

            <div className="w-full">{children}</div>

            {/* SP Thana Breakdown Modal */}
            {modalStatus && user?.role === "SP" && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={() => setModalStatus(null)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-5 py-4 border-b border-gray-100"
                            style={{ borderLeftColor: activeStatusMeta?.indicatorColor, borderLeftWidth: 4 }}
                        >
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">
                                    {language === "english" ? "Thana Breakdown" : "थाना विवरण"}
                                </p>
                                <p className="font-bold" style={{ color: activeStatusMeta?.indicatorColor }}>
                                    {language === "english" ? activeStatusMeta?.labeleng : activeStatusMeta?.labelhindi}
                                </p>
                            </div>
                            <button
                                onClick={() => setModalStatus(null)}
                                className="text-gray-400 hover:text-gray-700 text-xl font-light"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Thana rows */}
                        <div className="px-5 py-3 divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
                            {thanaRows.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-6">
                                    {language === "english" ? "No thanas assigned." : "कोई थाना नहीं मिला।"}
                                </p>
                            ) : (
                                thanaRows.map(({ thana, count }) => (
                                    <div key={thana} className="flex items-center justify-between py-3">
                                        <p className="text-sm font-medium text-gray-700 capitalize">{thana}</p>
                                        <span
                                            className="text-sm font-bold px-3 py-0.5 rounded-full"
                                            style={{
                                                color: activeStatusMeta?.indicatorColor,
                                                backgroundColor: `${activeStatusMeta?.indicatorColor}15`,
                                            }}
                                        >
                                            {count}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
