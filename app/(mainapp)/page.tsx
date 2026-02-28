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
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<'total' | 'pending' | 'unallocated' | 'nirakrit'>('total');
    const [selectedAgeGroup, setSelectedAgeGroup] = useState<'lessThan15Days' | 'fifteenToThirtyDays' | 'moreThan30Days' | null>(null);
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
                    <div
                        onClick={() => {
                            setSelectedCategory('total');
                            setSelectedAgeGroup(null);
                            setShowStatsModal(true);
                        }}
                        className="cursor-pointer relative z-10 flex flex-col h-full justify-between"
                    >
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
                <div
                    onClick={() => {
                        setSelectedCategory('pending');
                        setSelectedAgeGroup(null);
                        setShowStatsModal(true);
                    }}
                    className='cursor-pointer relative overflow-hidden group bg-linear-to-br from-amber-400 to-orange-500 p-5 rounded-xs hover:shadow-orange-200/50 transition-all duration-300'
                >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <IoMdTimer size={80} className="text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <p className='text-lg font-bold text-white uppercase tracking-widest mb-1'>
                            {language === "english" ? "Pending" : "लंबित"}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-black text-white">
                                {stats?.statusCounts?.लंबित ?? stats?.statusCounts?.PENDING ?? 0}
                            </h3>
                            <span className="text-[10px] font-bold text-orange-100 bg-white/10 px-1.5 py-0.5 rounded-full uppercase">
                                {stats?.total ? `${Math.round(((stats.statusCounts?.लंबित ?? stats.statusCounts?.PENDING ?? 0) / stats.total) * 100)}%` : '0%'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* UNALLOCATED COMPLAINTS */}
                <div
                    onClick={() => {
                        setSelectedCategory('unallocated');
                        setSelectedAgeGroup(null);
                        setShowStatsModal(true);
                    }}
                    className='cursor-pointer relative overflow-hidden group bg-linear-to-br from-rose-500 to-red-600 p-5 rounded-xs hover:shadow-red-200/50 transition-all duration-300'
                >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <MdOutlineWrongLocation size={80} className="text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <p className='text-lg font-bold text-white uppercase tracking-widest mb-1'>
                            {language === "english" ? "Unallocated" : "अनाबंटित"}
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

                {/* NIRAKRIT COMPLAINTS */}
                <div
                    onClick={() => {
                        setSelectedCategory('nirakrit');
                        setSelectedAgeGroup(null);
                        setShowStatsModal(true);
                    }}
                    className='cursor-pointer relative overflow-hidden group bg-linear-to-br from-emerald-500 to-teal-600 p-5 rounded-xs hover:shadow-emerald-200/50 transition-all duration-300'
                >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <IoLayersOutline size={80} className="text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <p className='text-lg font-bold text-white uppercase tracking-widest mb-1'>
                            {language === "english" ? "NIRAKRIT" : "निराकृत"}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-black text-white">
                                {stats?.nirakritCount ?? 0}
                            </h3>
                            <span className="text-[10px] font-bold text-emerald-100 bg-white/10 px-1.5 py-0.5 rounded-full uppercase">
                                {stats?.total ? `${Math.round(((stats?.nirakritCount ?? 0) / stats.total) * 100)}%` : '0%'}
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
                                        { name: 'Pending', value: stats?.statusCounts?.लंबित ?? stats?.statusCounts?.PENDING ?? 0, color: '#f59e0b' },
                                        { name: 'Unallocated', value: stats?.unallocatedCount ?? 0, color: '#f43f5e' },
                                        { name: 'Others', value: (stats?.total ?? 0) - (stats?.statusCounts?.लंबित ?? stats?.statusCounts?.PENDING ?? 0) - (stats?.unallocatedCount ?? 0), color: '#6366f1' }
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
                            <span className="text-[9px] font-black text-slate-800 uppercase">{stats?.statusCounts?.लंबित ?? stats?.statusCounts?.PENDING ?? 0}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Pend</span>
                        </div>
                        <div className="flex flex-col items-center border-x border-slate-100 px-4">
                            <span className="text-[9px] font-black text-slate-800 uppercase">{stats?.unallocatedCount ?? 0}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Unall</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black text-slate-800 uppercase">{(stats?.total ?? 0) - (stats?.statusCounts?.लंबित ?? stats?.statusCounts?.PENDING ?? 0) - (stats?.unallocatedCount ?? 0)}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Other</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Modal */}
            {showStatsModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md transition-all duration-300 p-4"
                    onClick={() => setShowStatsModal(false)}
                >
                    <div
                        className="bg-white rounded-xs w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-slate-50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    {language === "english" ? "Detailed Statistics" : "विस्तृत आंकड़े"}
                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] rounded-full uppercase tracking-tighter">
                                        {selectedCategory}
                                    </span>
                                </h3>
                                <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest font-bold">
                                    {user?.role === "TI" ? (language === "english" ? `Thana: ${user.thana}` : `थाना: ${user.thana}`) : (language === "english" ? `District Overview: ${user?.name}` : `जिला विवरण: ${user?.name}`)}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowStatsModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-slate-400 text-xl font-light"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto p-6 space-y-8">
                            {/* Row 1: Age Distribution */}
                            <div className="space-y-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">
                                    {language === "english" ? `COMPLAINT AGE DISTRIBUTION (${selectedCategory.toUpperCase()})` : `शिकायत अवधि वितरण (${selectedCategory.toUpperCase()})`}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    {[
                                        { id: 'lessThan15Days', label: language === "english" ? "0 - 15 Days" : "0 - 15 दिन", count: stats?.categoryAgeStats?.[selectedCategory]?.lessThan15Days ?? 0, color: "#22c55e", bg: "bg-green-50/50", border: "border-green-100" },
                                        { id: 'fifteenToThirtyDays', label: language === "english" ? "15 - 30 Days" : "15 - 30 दिन", count: stats?.categoryAgeStats?.[selectedCategory]?.fifteenToThirtyDays ?? 0, color: "#f59e0b", bg: "bg-orange-50/50", border: "border-orange-100" },
                                        { id: 'moreThan30Days', label: language === "english" ? "More Than A Month" : "एक महीने से अधिक", count: stats?.categoryAgeStats?.[selectedCategory]?.moreThan30Days ?? 0, color: "#ef4444", bg: "bg-red-50/50", border: "border-red-100" }
                                    ].map((age, idx) => {
                                        const isSelected = selectedAgeGroup === age.id;
                                        const totalInCategory = (stats?.categoryAgeStats?.[selectedCategory]?.lessThan15Days ?? 0) +
                                            (stats?.categoryAgeStats?.[selectedCategory]?.fifteenToThirtyDays ?? 0) +
                                            (stats?.categoryAgeStats?.[selectedCategory]?.moreThan30Days ?? 0);

                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => setSelectedAgeGroup(isSelected ? null : age.id as any)}
                                                className={`cursor-pointer transition-all duration-300 flex flex-col p-4 rounded-xs border ${isSelected ? age.border + ' ring-2 ring-offset-2 ring-opacity-50 ring-slate-200 shadow-md transform scale-[1.02]' : 'border-slate-100'} ${age.bg}`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{age.label}</span>
                                                    {isSelected && <span className="text-[8px] bg-slate-800 text-white px-1 rounded-sm font-bold">ACTIVE</span>}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-3xl font-black text-slate-800">{age.count}</span>
                                                    <div className="flex-1 h-2 bg-white rounded-full overflow-hidden border border-slate-100/50">
                                                        <div
                                                            className="h-full transition-all duration-700"
                                                            style={{
                                                                width: `${totalInCategory ? (age.count / totalInCategory) * 100 : 0}%`,
                                                                backgroundColor: age.color
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-[11px] font-black text-slate-400 min-w-[35px]">
                                                        {totalInCategory ? `${Math.round((age.count / totalInCategory) * 100)}%` : '0%'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Age Group Specific Status Distribution */}
                            {selectedAgeGroup && stats?.ageStatusBreakdown?.[selectedAgeGroup] && (
                                <div className="space-y-4 pt-4 animate-in slide-in-from-top-4 duration-300">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2 flex justify-between items-center">
                                        <span>{language === "english" ? "STATUS BREAKDOWN FOR SELECTED AGE" : "चयनित अवधि के लिए स्थिति विवरण"}</span>
                                        <button
                                            onClick={() => setSelectedAgeGroup(null)}
                                            className="text-[9px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-full text-slate-500 transition-colors"
                                        >
                                            CLOSE
                                        </button>
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                        {Object.entries(stats.ageStatusBreakdown[selectedAgeGroup])
                                            .filter(([_, count]) => count > 0)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([status, count], idx) => {
                                                const statusMeta = complaintStatusColors.find(s => s.id === status);
                                                return (
                                                    <div key={idx} className="bg-white border border-slate-100 p-3 rounded-xs flex flex-col gap-1 shadow-xs">
                                                        <div className="flex items-center gap-1.5">
                                                            <div
                                                                className="w-2 h-2 rounded-full"
                                                                style={{ backgroundColor: statusMeta?.indicatorColor ?? '#cbd5e1' }}
                                                            />
                                                            <span className="text-[9px] font-bold text-slate-500 uppercase truncate">
                                                                {language === "english" ? statusMeta?.labeleng ?? status : statusMeta?.labelhindi ?? status}
                                                            </span>
                                                        </div>
                                                        <span className="text-xl font-black text-slate-800">{count}</span>
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>
                                </div>
                            )}

                            {/* Row 2: Thana-wise Age Distribution (SP Only) */}
                            {user?.role === "SP" && stats?.thanaAgeBreakdown && (
                                <div className="space-y-4 pt-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">
                                        {language === "english" ? "THANA-WISE AGE ANALYTICS" : "थाना-वार अवधि विश्लेषण"}
                                    </p>
                                    <div className="border border-slate-100 rounded-xs overflow-hidden">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                                    <th className="py-3 px-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thana Name</th>
                                                    <th className="py-3 px-4 text-center text-[10px] font-bold text-green-600 uppercase tracking-wider">0-15 Days</th>
                                                    <th className="py-3 px-4 text-center text-[10px] font-bold text-orange-600 uppercase tracking-wider">15-30 Days</th>
                                                    <th className="py-3 px-4 text-center text-[10px] font-bold text-red-600 uppercase tracking-wider">{"> 30 Days"}</th>
                                                    <th className="py-3 px-4 text-center text-[10px] font-bold text-slate-800 uppercase tracking-wider border-l border-slate-100">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {Object.entries(stats.thanaAgeBreakdown)
                                                    .sort((a, b) => {
                                                        const totalA = a[1].lessThan15Days + a[1].fifteenToThirtyDays + a[1].moreThan30Days;
                                                        const totalB = b[1].lessThan15Days + b[1].fifteenToThirtyDays + b[1].moreThan30Days;
                                                        return totalB - totalA;
                                                    })
                                                    .map(([thana, ages], idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="py-2.5 px-4 text-xs font-bold text-slate-700">{thana}</td>
                                                            <td className="py-2.5 px-4 text-center text-xs font-black text-green-600/70">{ages.lessThan15Days}</td>
                                                            <td className="py-2.5 px-4 text-center text-xs font-black text-orange-600/70">{ages.fifteenToThirtyDays}</td>
                                                            <td className="py-2.5 px-4 text-center text-xs font-black text-red-600/70">{ages.moreThan30Days}</td>
                                                            <td className="py-2.5 px-4 text-center text-xs font-black text-slate-800 border-l border-slate-50 bg-slate-50/30">
                                                                {ages.lessThan15Days + ages.fifteenToThirtyDays + ages.moreThan30Days}
                                                            </td>
                                                        </tr>
                                                    ))
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}


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
