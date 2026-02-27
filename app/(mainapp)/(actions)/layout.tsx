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
    ageStats?: {
        lessThan1Month: number;
        oneToThreeMonths: number;
        moreThan3Months: number;
    };
    thanaAgeBreakdown?: Record<string, {
        lessThan1Month: number;
        oneToThreeMonths: number;
        moreThan3Months: number;
    }>;
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
    const [isMounted, setIsMounted] = useState(false);

    // ── SP modal ────────────────────────────────────────────────────────────
    const [modalStatus, setModalStatus] = useState<string | null>(null);
    const [isAgeStatsExpanded, setIsAgeStatsExpanded] = useState(false);
    const [isAgeStatsFullscreen, setIsAgeStatsFullscreen] = useState(false);

    useEffect(() => {
        setIsMounted(true);
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
                        {/* Age Stats Card - Minimal by default */}
                        <div className={`flex w-full flex-col overflow-hidden border border-gray-100 rounded-xs bg-linear-to-br from-white to-gray-50/30 shadow-sm hover:shadow-md transition-all duration-300 ${isAgeStatsExpanded ? 'grow' : 'grow'}`}>
                            <div className={`px-4 py-2 bg-white/50 flex justify-between items-center group ${!isAgeStatsExpanded ? 'h-10' : 'border-b border-gray-50'}`}>
                                <div className="flex items-center gap-4 flex-1">
                                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                        {language === "english" ? "Complaint Age" : "शिकायत अवधि"}
                                    </p>

                                    {/* Minimal Inline Bar & Stats */}
                                    {!isAgeStatsExpanded && (
                                        <div className="flex items-center gap-4 flex-1 max-w-2xl">
                                            {/* Small Bar */}
                                            <div className="flex flex-1 h-2 rounded-full overflow-hidden bg-slate-100/50 border border-slate-200/50 p-px">
                                                {(() => {
                                                    const v1 = stats?.ageStats?.lessThan1Month ?? 0;
                                                    const v2 = stats?.ageStats?.oneToThreeMonths ?? 0;
                                                    const v3 = stats?.ageStats?.moreThan3Months ?? 0;
                                                    const total = v1 + v2 + v3 || 1;
                                                    const p1 = (v1 / total) * 100;
                                                    const p2 = (v2 / total) * 100;
                                                    const p3 = (v3 / total) * 100;
                                                    return (
                                                        <>
                                                            {v1 > 0 && <div style={{ width: `${p1}%` }} className="h-full bg-linear-to-r from-green-400 to-green-500" />}
                                                            {v2 > 0 && <div style={{ width: `${p2}%` }} className="h-full bg-linear-to-r from-orange-400 to-orange-500" />}
                                                            {v3 > 0 && <div style={{ width: `${p3}%` }} className="h-full bg-linear-to-r from-red-400 to-red-500" />}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                            {/* Mini Counts */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-bold text-green-700">{stats?.ageStats?.lessThan1Month ?? 0}</span>
                                                <span className="text-[9px] font-bold text-orange-700">{stats?.ageStats?.oneToThreeMonths ?? 0}</span>
                                                <span className="text-[9px] font-bold text-red-700">{stats?.ageStats?.moreThan3Months ?? 0}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsAgeStatsExpanded(!isAgeStatsExpanded)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                                        title={isAgeStatsExpanded ? (language === "english" ? "Collapse" : "समेटें") : (language === "english" ? "Expand" : "विस्तार करें")}
                                    >
                                        {isAgeStatsExpanded ? '▲' : '▼'}
                                    </button>
                                    {user?.role === "SP" && (
                                        <button
                                            onClick={() => setIsAgeStatsFullscreen(true)}
                                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                                            title={language === "english" ? "Fullscreen" : "पूर्ण स्क्रीन"}
                                        >
                                            ⤢
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Full View Content */}
                            {isAgeStatsExpanded && (
                                <div className="flex flex-col p-4 animate-in fade-in slide-in-from-top-2 duration-500 min-h-[150px]">
                                    <div className="space-y-4">
                                        {/* Big Proportional Bar */}
                                        <div className="flex w-full h-3 rounded-full overflow-hidden bg-slate-100/50 border border-slate-200/50 p-px shadow-sm">
                                            {(() => {
                                                const v1 = stats?.ageStats?.lessThan1Month ?? 0;
                                                const v2 = stats?.ageStats?.oneToThreeMonths ?? 0;
                                                const v3 = stats?.ageStats?.moreThan3Months ?? 0;
                                                const total = v1 + v2 + v3 || 1;
                                                const p1 = (v1 / total) * 100;
                                                const p2 = (v2 / total) * 100;
                                                const p3 = (v3 / total) * 100;
                                                return (
                                                    <>
                                                        {v1 > 0 && <div style={{ width: `${p1}%` }} className="h-full bg-linear-to-r from-green-400 to-green-500 transition-all duration-1000 shadow-[inset_0_1px_rgba(255,255,255,0.2)]" />}
                                                        {v2 > 0 && <div style={{ width: `${p2}%` }} className="h-full bg-linear-to-r from-orange-400 to-orange-500 transition-all duration-1000 shadow-[inset_0_1px_rgba(255,255,255,0.2)]" />}
                                                        {v3 > 0 && <div style={{ width: `${p3}%` }} className="h-full bg-linear-to-r from-red-400 to-red-500 transition-all duration-1000 shadow-[inset_0_1px_rgba(255,255,255,0.2)]" />}
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        {/* Top 5 Thanas */}
                                        {user?.role === "SP" && stats?.thanaAgeBreakdown && (
                                            <div className="grid grid-cols-3 gap-6">
                                                {[
                                                    { key: 'lessThan1Month', label: language === "english" ? "< 1 Month" : "< 1 महीना", color: 'text-green-600', bg: 'bg-green-50' },
                                                    { key: 'oneToThreeMonths', label: language === "english" ? "1-3 Months" : "1-3 महीने", color: 'text-orange-600', bg: 'bg-orange-50' },
                                                    { key: 'moreThan3Months', label: language === "english" ? "> 3 Months" : "> 3 महीने", color: 'text-red-600', bg: 'bg-red-50' }
                                                ].map((cat) => (
                                                    <div key={cat.key} className="flex flex-col">
                                                        <div className={`px-2 py-1.5 ${cat.bg} rounded-t-lg mb-2 flex justify-between items-center border-b border-white`}>
                                                            <span className={`text-[10px] font-bold ${cat.color}`}>{cat.label}</span>
                                                            <span className={`text-[10px] font-black ${cat.color}`}>
                                                                {cat.key === 'oneToThreeMonths'
                                                                    ? (stats?.ageStats?.oneToThreeMonths ?? 0)
                                                                    : (stats?.ageStats?.[cat.key as keyof typeof stats.ageStats] ?? 0)}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1.5 px-1 pb-2">
                                                            {Object.entries(stats?.thanaAgeBreakdown || {})
                                                                .map(([thana, ages]) => ({
                                                                    thana,
                                                                    count: cat.key === 'oneToThreeMonths'
                                                                        ? ages.oneToThreeMonths
                                                                        : ages[cat.key as keyof typeof ages]
                                                                }))
                                                                .filter(item => item.count > 0)
                                                                .sort((a, b) => b.count - a.count)
                                                                .slice(0, 5)
                                                                .map((item, idx) => (
                                                                    <div key={idx} className="flex justify-between items-center text-[9px] group/item hover:bg-slate-50 transition-colors rounded px-1 py-0.5">
                                                                        <span className="text-gray-600 truncate max-w-[70%]" title={item.thana}>{item.thana}</span>
                                                                        <span className="font-bold text-gray-400 group-hover/item:text-indigo-600">{item.count}</span>
                                                                    </div>
                                                                ))
                                                            }
                                                            {Object.entries(stats.thanaAgeBreakdown || {}).filter(([_, ages]) => (cat.key === 'oneToThreeMonths' ? ages.oneToThreeMonths : ages[cat.key as keyof typeof ages]) > 0).length === 0 && (
                                                                <div className="text-[8px] text-gray-300 italic text-center py-4">
                                                                    {language === "english" ? "No complaints" : "कोई शिकायत नहीं"}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
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
            {/* Age Stats Fullscreen Modal */}
            {isAgeStatsFullscreen && user?.role === "SP" && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md transition-all duration-300"
                    onClick={() => setIsAgeStatsFullscreen(false)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden m-4 animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-indigo-50 bg-linear-to-r from-indigo-600 to-violet-600 text-white">
                            <div>
                                <h3 className="text-lg font-bold">
                                    {language === "english" ? "Comprehensive Age Statistics" : "विस्तृत शिकायत अवधि आंकड़े"}
                                </h3>
                                <p className="text-indigo-100 text-xs mt-1">
                                    {language === "english" ? `All Thanas under ${user.name}` : `${user.name} के अंतर्गत सभी थाने`}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsAgeStatsFullscreen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white text-xl font-light"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto p-6">
                            <table className="w-full border-collapse">
                                <thead className="sticky top-0 bg-white z-10">
                                    <tr className="border-b-2 border-slate-100">
                                        <th className="py-3 px-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            {language === "english" ? "Thana Name" : "थाने का नाम"}
                                        </th>
                                        <th className="py-3 px-4 text-center text-xs font-bold text-green-600 uppercase tracking-wider bg-green-50/50 rounded-tl-lg">
                                            {language === "english" ? "< 1 Month" : "< 1 महीना"}
                                        </th>
                                        <th className="py-3 px-4 text-center text-xs font-bold text-orange-600 uppercase tracking-wider bg-orange-50/50">
                                            {language === "english" ? "1-3 Months" : "1-3 महीने"}
                                        </th>
                                        <th className="py-3 px-4 text-center text-xs font-bold text-red-600 uppercase tracking-wider bg-red-50/50 rounded-tr-lg">
                                            {language === "english" ? "> 3 Months" : "> 3 महीने"}
                                        </th>
                                        <th className="py-3 px-4 text-center text-xs font-bold text-indigo-600 uppercase tracking-wider border-l border-slate-100">
                                            {language === "english" ? "Total" : "कुल"}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {stats?.thanaAgeBreakdown && Object.entries(stats.thanaAgeBreakdown)
                                        .sort((a, b) => {
                                            const totalA = a[1].lessThan1Month + a[1].oneToThreeMonths + a[1].moreThan3Months;
                                            const totalB = b[1].lessThan1Month + b[1].oneToThreeMonths + b[1].moreThan3Months;
                                            return totalB - totalA;
                                        })
                                        .map(([thana, ages], idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="py-3 px-4 text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                                    {thana}
                                                </td>
                                                <td className="py-3 px-4 text-center text-sm font-bold text-green-600 bg-green-50/20">
                                                    {ages.lessThan1Month}
                                                </td>
                                                <td className="py-3 px-4 text-center text-sm font-bold text-orange-600 bg-orange-50/20">
                                                    {ages.oneToThreeMonths}
                                                </td>
                                                <td className="py-3 px-4 text-center text-sm font-bold text-red-600 bg-red-50/20">
                                                    {ages.moreThan3Months}
                                                </td>
                                                <td className="py-3 px-4 text-center text-sm font-black text-indigo-700 border-l border-slate-50">
                                                    {ages.lessThan1Month + ages.oneToThreeMonths + ages.moreThan3Months}
                                                </td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                                <tfoot className="sticky bottom-0 bg-slate-50 font-bold border-t-2 border-indigo-100">
                                    <tr>
                                        <td className="py-4 px-4 text-sm text-slate-600 uppercase tracking-tight">
                                            {language === "english" ? "Grand Totals" : "कुल योग"}
                                        </td>
                                        <td className="py-4 px-4 text-center text-lg text-green-700">
                                            {stats?.ageStats?.lessThan1Month ?? 0}
                                        </td>
                                        <td className="py-4 px-4 text-center text-lg text-orange-700">
                                            {stats?.ageStats?.oneToThreeMonths ?? 0}
                                        </td>
                                        <td className="py-4 px-4 text-center text-lg text-red-700">
                                            {stats?.ageStats?.moreThan3Months ?? 0}
                                        </td>
                                        <td className="py-4 px-4 text-center text-xl text-indigo-800 border-l border-indigo-100">
                                            {(stats?.ageStats?.lessThan1Month ?? 0) + (stats?.ageStats?.oneToThreeMonths ?? 0) + (stats?.ageStats?.moreThan3Months ?? 0)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                            {(!stats?.thanaAgeBreakdown || Object.keys(stats.thanaAgeBreakdown).length === 0) && (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                                    <span className="text-4xl mb-4">📊</span>
                                    <p className="text-sm font-medium">
                                        {language === "english" ? "No breakdown data available" : "कोई विवरण डेटा उपलब्ध नहीं है"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
