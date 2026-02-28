'use client'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { useUserStore } from '../_store/userStore'
import { useStatsStore } from '../_store/statsStore'
import { StatusCounts, StatData } from '../types'
import { RiDashboardLine } from 'react-icons/ri'
import { IoLayersOutline, IoCreateOutline, IoSettingsOutline, IoArrowForwardCircleOutline, IoBusinessOutline, IoTimerOutline } from 'react-icons/io5'

import Link from 'next/link'
import { useLanguageStore } from '../_store/languageStore'
import { usePathname } from 'next/navigation'
import { MdHourglassFull, MdOutlineWrongLocation } from 'react-icons/md'
import { FaHourglass } from 'react-icons/fa6'
import { IoMdTimer } from 'react-icons/io'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Shared interfaces imported from ../types.ts

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



export default function Home() {
    const { user, setUser, thana, setThana } = useUserStore();
    const { language } = useLanguageStore();



    const pathname = usePathname();
    const { stats, loading: statsLoading, fetchStats } = useStatsStore();
    const [isMounted, setIsMounted] = useState(false);

    // ── SP modal ────────────────────────────────────────────────────────────
    const [modalStatus, setModalStatus] = useState<string | null>(null);
    const [isAgeStatsExpanded, setIsAgeStatsExpanded] = useState(false);
    const [isAgeStatsFullscreen, setIsAgeStatsFullscreen] = useState(false);
    const [expandedThana, setExpandedThana] = useState<string | null>(null);


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

    const fetchUserDetails = async () => {
        if (!user) {
            try {
                const response = await axios.get("/api/user");
                if (response.data) {
                    setUser(response.data);
                }
            } catch (error) {
                toast.error("Failed to fetch user details");
            }
        }
    }
    const fetchThanaDetails = async () => {
        if (!thana) {
            try {
                const response = await axios.get("/api/thana");
                if (response.data && response.data.success) {
                    const thanaData = response.data.data;
                    if (Array.isArray(thanaData)) {
                        setThana(thanaData);
                    } else {
                        setThana([thanaData]);
                    }
                }
            } catch (error) {
                toast.error("Failed to fetch user details");
            }
        }
    }

    useEffect(() => {
        fetchUserDetails();
        fetchThanaDetails();
    }, []);

    return (
        <div className='p-6 flex flex-col gap-6'>

            {/* BIG DESCRIPTION OF COMPLAINTS */}

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full px-3 gap-6 mb-2'>
                {/* TOTAL COMPLAINTS */}
                <div className='relative overflow-hidden group bg-linear-to-br from-indigo-500 to-indigo-600 p-5 rounded-xs hover:shadow-indigo-200/50 transition-all duration-300'>
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <FaHourglass size={80} className="text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <p className='text-lg font-bold text-white uppercase tracking-widest mb-1'>
                            {language === "english" ? "Total Complaints" : "कुल शिकायतें"}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-black text-white">
                                {stats?.total ?? 0}
                            </h3>
                            <span className="text-[10px] font-bold text-indigo-200 bg-white/10 px-1.5 py-0.5 rounded-full uppercase">
                                {language === "english" ? "Total" : "कुल"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* PENDING COMPLAINTS */}
                <div className='relative overflow-hidden group bg-linear-to-br from-amber-400 to-orange-500 p-5 rounded-xs hover:shadow-orange-200/50 transition-all duration-300'>
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <IoMdTimer size={80} className="text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <p className='text-lg font-bold text-white uppercase tracking-widest mb-1'>
                            {language === "english" ? "Pending Complaints" : "लंबित शिकायतें"}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-black text-white">
                                {stats?.statusCounts?.PENDING ?? 0}
                            </h3>
                            <span className="text-[10px] font-bold text-orange-100 bg-white/10 px-1.5 py-0.5 rounded-full uppercase">
                                {stats?.total ? `${Math.round(((stats.statusCounts?.PENDING ?? 0) / stats.total) * 100)}%` : '0%'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* UNALLOCATED COMPLAINTS */}
                <div className='relative overflow-hidden group bg-linear-to-br from-rose-500 to-red-600 p-5 rounded-xs hover:shadow-red-200/50 transition-all duration-300'>
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <MdOutlineWrongLocation size={80} className="text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <p className='text-lg font-bold text-white uppercase tracking-widest mb-1'>
                            {language === "english" ? "Unallocated Complaints" : "अनाबंटित शिकायतें"}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-black text-white">
                                {stats?.unallocatedCount ?? 0}
                            </h3>
                            <span className="text-[10px] font-bold text-rose-100 bg-white/10 px-1.5 py-0.5 rounded-full uppercase">
                                {stats?.total ? `${Math.round(((stats.unallocatedCount ?? 0) / stats.total) * 100)}%` : '0%'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* DISTRIBUTION CHART */}
                <div className='relative group bg-white p-4 rounded-xs border border-slate-300 flex flex-col justify-between overflow-hidden'>
                    <div className="flex justify-between items-center mb-2">
                        <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest'>
                            {language === "english" ? "Status Mix" : "स्थिति मिश्रण"}
                        </p>
                        <div className="flex gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        </div>
                    </div>

                    <div className="h-24 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Pending', value: stats?.statusCounts?.PENDING ?? 0, color: '#f59e0b' },
                                        { name: 'Unallocated', value: stats?.unallocatedCount ?? 0, color: '#f43f5e' },
                                        { name: 'Others', value: (stats?.total ?? 0) - (stats?.statusCounts?.PENDING ?? 0) - (stats?.unallocatedCount ?? 0), color: '#6366f1' }
                                    ]}
                                    innerRadius={25}
                                    outerRadius={40}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {[0, 1, 2].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#f59e0b', '#f43f5e', '#6366f1'][index]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                                    itemStyle={{ padding: '0px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex justify-around mt-1">
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black text-slate-800 uppercase">{stats?.statusCounts?.PENDING ?? 0}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Pend</span>
                        </div>
                        <div className="flex flex-col items-center border-x border-slate-100 px-4">
                            <span className="text-[9px] font-black text-slate-800 uppercase">{stats?.unallocatedCount ?? 0}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Unall</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black text-slate-800 uppercase">{(stats?.total ?? 0) - (stats?.statusCounts?.PENDING ?? 0) - (stats?.unallocatedCount ?? 0)}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Other</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className='flex flex-col w-full'>
                <div className='flex w-full justify-start gap-2 flex-col'>
                    <div className="flex items-center justify-between mb-2">
                        <h1 className='text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2'>
                            <RiDashboardLine className="text-blue-500" strokeWidth={0.5} />
                            {user?.role === "TI"
                                ? language === "english" ? "Thana Complaint Overview" : "थाना शिकायत अवलोकन"
                                : user?.role === "SP"
                                    ? language === "english" ? "District Complaint Overview" : "जिला शिकायत अवलोकन"
                                    : language === "english" ? "Complaint Overview" : "शिकायत अवलोकन"
                            }
                        </h1>
                    </div>

                    <div className='flex flex-col items-start justify-start gap-2 w-full'>
                        <div className="flex w-full flex-wrap gap-3">

                            {/* Age & Status Integrated Box */}
                            <div className={`flex flex-col flex-1 min-w-0 w-full overflow-hidden border border-slate-200 rounded-xs bg-white mb-3 transition-all duration-300 ${isAgeStatsExpanded ? 'ring-1 ring-slate-200' : ''}`}>
                                {/* Header / Collapsed Bar */}
                                <div
                                    onClick={() => setIsAgeStatsExpanded(!isAgeStatsExpanded)}
                                    className="px-4 py-2.5 bg-white flex justify-between items-center cursor-pointer group hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-6 flex-1">


                                        <p className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                                            {language === "english" ? "View Detailed Stats" : "विस्तृत आँकड़े देखें"}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button className="text-slate-400 group-hover:text-slate-600 transition-colors">
                                            {isAgeStatsExpanded ? '▲' : '▼'}
                                        </button>
                                        {user?.role === "SP" && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setIsAgeStatsFullscreen(true); }}
                                                className="text-slate-400 hover:text-indigo-600 transition-colors"
                                            >
                                                ⤢
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isAgeStatsExpanded && (
                                    <div className="p-5 bg-white space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {/* Row 1: Status Overview (Minimal) */}
                                        <div className="space-y-3">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">
                                                {language === "english" ? "COMPLAINT STATUS DISTRIBUTION" : "शिकायत स्थिति वितरण"}
                                            </p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                                {complaintStatusColors.map((s) => (
                                                    <div
                                                        key={s.id}
                                                        className="flex flex-col p-2.5 rounded-xs hover:border-slate-200 transition-all bg-slate-50/30"
                                                        style={{ backgroundColor: `${s.indicatorColor}20`, color: s.indicatorColor }}
                                                    >
                                                        <span className="text-[9px] font-bold uppercase truncate">
                                                            {language === "english" ? s.labeleng : s.labelhindi}
                                                        </span>
                                                        <div className="flex items-baseline gap-1 mt-1">
                                                            <span className="text-lg font-black">
                                                                {stats?.statusCounts?.[s.id] ?? 0}
                                                            </span>
                                                            <span className="text-[9px] font-bold">
                                                                {stats?.total ? `(${Math.round(((stats.statusCounts?.[s.id] ?? 0) / stats.total) * 100)}%)` : '(0%)'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Row 1.5: Age Overview for TI */}
                                        {user?.role === "TI" && stats?.ageStats && (
                                            <div className="space-y-3">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">
                                                    {language === "english" ? "COMPLAINT AGE DISTRIBUTION" : "शिकायत अवधि वितरण"}
                                                </p>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                                    {[
                                                        { label: language === "english" ? "< 1 Month" : "< 1 महीना", count: stats.ageStats.lessThan1Month, color: "#22c55e" },
                                                        { label: language === "english" ? "1 - 3 Months" : "1 - 3 महीने", count: stats.ageStats.oneToThreeMonths, color: "#f59e0b" },
                                                        { label: language === "english" ? "> 3 Months" : "> 3 महीने", count: stats.ageStats.moreThan3Months, color: "#ef4444" }
                                                    ].map((age, idx) => (
                                                        <div key={idx} className="flex flex-col p-3 rounded-xs border border-slate-100 bg-slate-50/20">
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{age.label}</span>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-2xl font-black text-slate-800">{age.count}</span>
                                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full transition-all duration-500"
                                                                        style={{
                                                                            width: `${stats?.total ? (age.count / stats.total) * 100 : 0}%`,
                                                                            backgroundColor: age.color
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span className="text-[10px] font-bold text-slate-400">
                                                                    {stats?.total ? `${Math.round((age.count / stats.total) * 100)}%` : '0%'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Row 2: Thana Drill-down (Minimal Full-width) */}
                                        <div className="space-y-3">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">
                                                {language === "english" ? "THANA-WISE ANALYTICS" : "थाना-वार विश्लेषण"}
                                            </p>
                                            <div className="flex flex-col border border-slate-100 rounded-sm divide-y divide-slate-50">
                                                {stats?.thanaAgeBreakdown && Object.entries(stats.thanaAgeBreakdown)
                                                    .sort((a, b) => (b[1].lessThan1Month + b[1].oneToThreeMonths + b[1].moreThan3Months) - (a[1].lessThan1Month + a[1].oneToThreeMonths + a[1].moreThan3Months))
                                                    .map(([thana, ages]) => {
                                                        const isExpanded = expandedThana === thana;
                                                        const total = ages.lessThan1Month + ages.oneToThreeMonths + ages.moreThan3Months;
                                                        return (
                                                            <div key={thana} className={`flex flex-col transition-all ${isExpanded ? 'bg-slate-50/40' : 'bg-white hover:bg-slate-50/20'}`}>
                                                                <div
                                                                    onClick={() => setExpandedThana(isExpanded ? null : thana)}
                                                                    className={`flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 cursor-pointer gap-3 sm:gap-4 ${isExpanded ? 'bg-indigo-50/20' : ''}`}
                                                                >
                                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8 flex-1 min-w-0">
                                                                        <div className="min-w-[120px] sm:w-32 lg:w-40 shrink-0">
                                                                            <span className="text-[11px] font-bold text-slate-700 truncate block">{thana}</span>
                                                                        </div>

                                                                        <div className="flex items-center gap-4 sm:gap-6 text-[10px] font-bold overflow-x-auto no-scrollbar">
                                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                                                                                <span className="text-slate-500">{ages.lessThan1Month}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                                                                                <span className="text-slate-500">{ages.oneToThreeMonths}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                                                                <span className="text-slate-500">{ages.moreThan3Months}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 border-l border-slate-200 pl-3 shrink-0">
                                                                                <span className="text-[11px] font-black text-slate-800">{total}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center self-end sm:self-center gap-4">
                                                                        <span className="text-slate-300 text-[8px]">{isExpanded ? '▲' : '▼'}</span>
                                                                    </div>
                                                                </div>

                                                                {isExpanded && stats.thanaAgeStatusBreakdown?.[thana] && (
                                                                    <div className="px-6 py-5 border-t border-slate-100 bg-white/50 animate-in slide-in-from-top-1 duration-200">
                                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                                                            {[
                                                                                { key: 'lessThan1Month', label: '< 1 Month', color: '#008000' },
                                                                                { key: 'oneToThreeMonths', label: '1 - 3 Months', color: '#FFA500' },
                                                                                { key: 'moreThan3Months', label: '> 3 Months', color: '#FF0000' }
                                                                            ].map(ageGroup => (
                                                                                <div key={ageGroup.key} className="space-y-3">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-[2px]"
                                                                                            style={{ backgroundColor: `${ageGroup.color}15`, color: ageGroup.color }}>
                                                                                            {ageGroup.label} - {ages[ageGroup.key as keyof typeof ages]}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex flex-col gap-1.5 pl-1">
                                                                                        {complaintStatusColors.map(s => {
                                                                                            const count = stats.thanaAgeStatusBreakdown?.[thana]?.[ageGroup.key]?.[s.id] ?? 0;
                                                                                            if (count === 0) return null;
                                                                                            return (
                                                                                                <div key={s.id} className="flex items-center justify-between group/status border-b pb-1 border-slate-300">
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <span className="text-[9px] font-bold text-slate-500 group-hover/status:text-slate-700 transition-colors px-2 py-1"
                                                                                                            style={{ backgroundColor: s.indicatorColor + "15", color: s.indicatorColor }}>
                                                                                                            {language === "english" ? s.labeleng : s.labelhindi}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                    <span className="text-[10px] font-black text-slate-600 px-1.5 py-0.5 bg-slate-50 rounded-xs border border-transparent group-hover/status:border-slate-100 transition-all"
                                                                                                        style={{ backgroundColor: s.indicatorColor + "15", color: s.indicatorColor }}>
                                                                                                        {count}
                                                                                                    </span>
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                        {ages[ageGroup.key as keyof typeof ages] === 0 && <span className="text-[8px] text-slate-300 italic">No activity</span>}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                }
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

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
                            className="bg-white rounded-xs w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden m-4 animate-in zoom-in-95 duration-300"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50 bg-linear-to-r from-gray-600 to-gray-600 text-white">
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


            <div className="flex items-center justify-between mb-2">
                <h1 className='text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2'>
                    <RiDashboardLine className="text-blue-500" strokeWidth={0.5} />
                    {language === "english" ? "Dashboard Overview" : "डैशबोर्ड अवलोकन"}
                </h1>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                {/* Manage Complaints */}
                <Link href="/manage-complaints" className='bg-white p-6 rounded-xs border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col justify-between h-full'>
                    <div>
                        <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <IoLayersOutline className="text-indigo-600 text-2xl" />
                        </div>
                        <h2 className='text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors'>{language === "english" ? "Manage Complaints" : "शिकायत प्रबंधन"}</h2>
                        <p className='text-slate-500 text-sm leading-relaxed mb-6'>
                            {language === "english" ? "Access the central database to view, filter, and update the status of all submitted complaints." : "सभी दर्ज शिकायतों की स्थिति देखने, फ़िल्टर करने और अपडेट करने के लिए डेटाबेस तक पहुंचें।"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
                        <span>{language === "english" ? "Access Records" : "रिकॉर्ड एक्सेस"}</span>
                        <IoArrowForwardCircleOutline className="text-xl group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

                {/* Unallocated Complaints - SP only */}
                {user?.role === "SP" && (
                    <Link href="/unallocated-complaints" className='bg-white p-6 rounded-xs border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group flex flex-col justify-between'>
                        <div>
                            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <IoBusinessOutline className="text-orange-600 text-2xl" />
                            </div>
                            <h2 className='text-lg font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors'>{language === "english" ? "Unallocated Complaints" : "अनाबंटित शिकायतें"}</h2>
                            <p className='text-slate-500 text-sm leading-relaxed mb-6'>
                                {language === "english" ? "Review and assign jurisdictions to complaints submitted without a Thana." : "बिना थाना के दर्ज की गई शिकायतों के लिएJurisdictions की समीक्षा करें और उन्हें सौंपें।"}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-orange-600 text-xs font-bold uppercase tracking-wider">
                            <span>{language === "english" ? "Manage Allocation" : "प्रबंधन आवंटन"}</span>
                            <IoArrowForwardCircleOutline className="text-xl group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                )}

                {/* Register Complaint */}
                <Link href="/register-complaint" className='bg-white p-6 rounded-xs border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group flex flex-col justify-between h-full'>
                    <div>
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <IoCreateOutline className="text-blue-600 text-2xl" />
                        </div>
                        <h2 className='text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors'>{language === "english" ? "Register Complaint" : "शिकायत दर्ज करें"}</h2>
                        <p className='text-slate-500 text-sm leading-relaxed mb-6'>
                            {language === "english" ? "Standardized entry form for filing new citizen grievances with precise categorization and official attachments." : "नागरिकों की नई शिकायतों को सटीक वर्गीकरण और आधिकारिक अनुलग्नकों के साथ दर्ज करने के लिए मानकीकृत प्रवेश प्रपत्र।"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
                        <span>{language === "english" ? "New Submission" : "नई प्रविष्टि"}</span>
                        <IoArrowForwardCircleOutline className="text-xl group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

                {/* Admin Actions */}
                {user?.role === "SP" && (
                    <Link href="/admin-actions" className='bg-white p-6 rounded-xs border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group flex flex-col justify-between h-full'>
                        <div>
                            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <IoSettingsOutline className="text-emerald-600 text-2xl" />
                            </div>
                            <h2 className='text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors'>{language === "english" ? "Admin Actions" : "प्रशासनिक कार्य"}</h2>
                            <p className='text-slate-500 text-sm leading-relaxed mb-6'>
                                {language === "english" ? "System management tools for authorized personnel to configure thanas, allocate TIs, and monitor user accounts." : "अधिकृत कर्मियों के लिए thanas को कॉन्फ़िगर करने, TIs को आवंटित करने और उपयोगकर्ता खातों की निगरानी करने के लिए सिस्टम प्रबंधन उपकरण।"}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider">
                            <span>{language === "english" ? "Control Panel" : "नियंत्रण कक्ष"}</span>
                            <IoArrowForwardCircleOutline className="text-xl group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                )}


            </div>

        </div>
    )
}
