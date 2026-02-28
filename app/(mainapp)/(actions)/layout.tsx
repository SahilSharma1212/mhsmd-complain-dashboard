'use client'
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '../../_store/userStore';
import { useLanguageStore } from '@/app/_store/languageStore';
import { useStatsStore } from '@/app/_store/statsStore';
import { useEffect, useState } from 'react';


// ─── Types ──────────────────────────────────────────────────────────────────
import { StatusCounts, StatData } from '@/app/types';

// ─── Constants ──────────────────────────────────────────────────────────────
const complaintStatusColors = [
    { id: "संजेय", labeleng: "Sanjay", labelhindi: "संजेय", indicatorColor: "#0000ff" },
    { id: "असंजेय", labeleng: "Asanjay", labelhindi: "असंजेय", indicatorColor: "#ff5e00" },
    { id: "अप्रमाणित", labeleng: "Apramanit", labelhindi: "अप्रमाणित", indicatorColor: "#7a00b3" },
    { id: "प्रतिबंधात्मक", labeleng: "Pratibandhatmak", labelhindi: "प्रतिबंधात्मक", indicatorColor: "#000000" },
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

    const { stats, loading: statsLoading, fetchStats } = useStatsStore();
    const [isMounted, setIsMounted] = useState(false);

    // ── SP modal ────────────────────────────────────────────────────────────
    const [modalStatus, setModalStatus] = useState<string | null>(null);
    const [isAgeStatsFullscreen, setIsAgeStatsFullscreen] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        fetchStats();
    }, [fetchStats]);

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
        <div className='p-1 pt-0 flex flex-col w-full'>

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
        </div>

    );
}
