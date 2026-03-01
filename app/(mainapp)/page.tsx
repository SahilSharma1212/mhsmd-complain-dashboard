'use client'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { useUserStore } from '../_store/userStore'
import { useStatsStore } from '../_store/statsStore'
import { StatusCounts, StatData, COMPLAINT_STATUS_COLORS } from '../types'
import { RiDashboardLine } from 'react-icons/ri'
import { IoLayersOutline, IoCreateOutline, IoSettingsOutline, IoArrowForwardCircleOutline, IoBusinessOutline, IoTimerOutline } from 'react-icons/io5'

import Link from 'next/link'
import { useLanguageStore } from '../_store/languageStore'
import { usePathname } from 'next/navigation'
import { MdHourglassFull, MdOutlineWrongLocation } from 'react-icons/md'
import { FaHourglass } from 'react-icons/fa6'
import { IoMdTimer } from 'react-icons/io'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// ─── Constants ──────────────────────────────────────────────────────────────
const complaintStatusColors = Object.entries(COMPLAINT_STATUS_COLORS).map(([id, c]) => ({
    id,
    labeleng: c.labeleng,
    labelhindi: c.labelhindi,
    indicatorColor: c.indicatorColor,
}));

const mainTabs = [
    { id: "manage", labeleng: "Manage Complaints", labelhindi: "शिकायत प्रबंधन", href: "/manage-complaints", color: "#7a00b3", indicatorColor: "#dd00ff" },
    { id: "unallocated", labeleng: "Unallocated Complaints", labelhindi: "अनाबंटित शिकायतें", href: "/unallocated-complaints", color: "#e67e22", indicatorColor: "#f39c12" },
    { id: "register", labeleng: "Register Complaint", labelhindi: "शिकायत दर्ज करें", href: "/register-complaint", color: "#0000ff", indicatorColor: "#0000ff" },
    { id: "admin", labeleng: "Admin Actions", labelhindi: "प्रशासनिक कार्य", href: "/admin-actions", color: "#06a600", indicatorColor: "#00ff00" },
];

type StatsTabId = 'summary' | 'age' | 'status';

export default function Home() {
    const { user, setUser, thana, setThana } = useUserStore();
    const { language } = useLanguageStore();
    const pathname = usePathname();
    const stats = useStatsStore(state => state.stats);
    const statsLoading = useStatsStore(state => state.loading);
    const statsError = useStatsStore(state => state.error);
    const fetchStats = useStatsStore(state => state.fetchStats);
    const [isMounted, setIsMounted] = useState(false);

    // ── Stats Tabs ──────────────────────────────────────────────────────────
    const [activeStatsTab, setActiveStatsTab] = useState<StatsTabId>('summary');
    const [selectedAgeGroup, setSelectedAgeGroup] = useState<'lessThan15Days' | 'fifteenToThirtyDays' | 'moreThan30Days' | null>(null);

    useEffect(() => {
        setIsMounted(true);
        if (!stats && !statsLoading && !statsError) {
            fetchStats();
        }
    }, [fetchStats, stats, statsLoading, statsError]);

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
                toast.error("Failed to fetch thana details");
            }
        }
    }

    useEffect(() => {
        fetchUserDetails();
        fetchThanaDetails();
    }, []);

    // ── Render Helpers ──────────────────────────────────────────────────────

    const renderSummaryTab = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${user?.role === 'SP' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
                {/* TOTAL COMPLAINTS */}
                <div className='relative overflow-hidden group bg-linear-to-br from-indigo-500 to-indigo-600 p-5 rounded-xs hover:shadow-indigo-200/50 transition-all duration-300'>
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                        <FaHourglass size={80} className="text-white" />
                    </div>
                    <div className="flex flex-col h-full justify-between relative z-10">
                        <p className='text-lg font-bold text-white uppercase tracking-widest mb-1'>
                            {language === "english" ? "Total" : "कुल"}
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
                            {language === "english" ? "Pending" : "लम्बित"}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-black text-white">
                                {stats?.statusCounts?.लम्बित ?? 0}
                            </h3>
                            <span className="text-[10px] font-bold text-orange-100 bg-white/10 px-1.5 py-0.5 rounded-full uppercase">
                                {stats?.total ? `${Math.round(((stats?.statusCounts?.लम्बित ?? 0) / stats.total) * 100)}%` : '0%'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* UNALLOCATED COMPLAINTS - SP only */}
                {user?.role === "SP" && (
                    <div className='relative overflow-hidden group bg-linear-to-br from-rose-500 to-red-600 p-5 rounded-xs hover:shadow-red-200/50 transition-all duration-300'>
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
                )}

                {/* NIRAKRIT COMPLAINTS */}
                <div className='relative overflow-hidden group bg-linear-to-br from-emerald-500 to-teal-600 p-5 rounded-xs hover:shadow-emerald-200/50 transition-all duration-300'>
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* PIE CHART */}
                <div className='bg-white p-6 rounded-xs border border-slate-200 shadow-sm flex flex-col gap-4 overflow-hidden'>
                    <div className="flex justify-between items-center">
                        <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest'>
                            {language === "english" ? "Status Distribution" : "स्थिति वितरण"}
                        </p>
                    </div>
                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={
                                        user?.role === "SP"
                                            ? [
                                                { name: 'Pending', value: stats?.statusCounts?.लम्बित ?? 0, color: '#f59e0b' },
                                                { name: 'Unallocated', value: stats?.unallocatedCount ?? 0, color: '#f43f5e' },
                                                { name: 'Others', value: (stats?.total ?? 0) - (stats?.statusCounts?.लम्बित ?? 0) - (stats?.unallocatedCount ?? 0), color: '#6366f1' }
                                            ]
                                            : [
                                                { name: 'Pending', value: stats?.statusCounts?.लम्बित ?? 0, color: '#f59e0b' },
                                                { name: 'Nirakrit', value: stats?.nirakritCount ?? 0, color: '#10b981' },
                                                { name: 'Others', value: (stats?.total ?? 0) - (stats?.statusCounts?.लम्बित ?? 0) - (stats?.nirakritCount ?? 0), color: '#6366f1' }
                                            ]
                                    }
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {user?.role === "SP"
                                        ? [0, 1, 2].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#f59e0b', '#f43f5e', '#6366f1'][index]} />
                                        ))
                                        : [0, 1, 2].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#f59e0b', '#10b981', '#6366f1'][index]} />
                                        ))
                                    }
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-around border-t border-slate-50 pt-4">
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-black text-slate-800 uppercase">{stats?.statusCounts?.लम्बित ?? 0}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</span>
                        </div>
                        {user?.role === "SP" ? (
                            <div className="flex flex-col items-center border-x border-slate-100 px-8">
                                <span className="text-sm font-black text-slate-800 uppercase">{stats?.unallocatedCount ?? 0}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unallocated</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center border-x border-slate-100 px-8">
                                <span className="text-sm font-black text-slate-800 uppercase">{stats?.nirakritCount ?? 0}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nirakrit</span>
                            </div>
                        )}
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-black text-slate-800 uppercase">
                                {user?.role === "SP"
                                    ? (stats?.total ?? 0) - (stats?.statusCounts?.लम्बित ?? 0) - (stats?.unallocatedCount ?? 0)
                                    : (stats?.total ?? 0) - (stats?.statusCounts?.लम्बित ?? 0) - (stats?.nirakritCount ?? 0)
                                }
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Other</span>
                        </div>
                    </div>
                </div>

                {/* LATEST COMPLAINTS */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xs flex flex-col overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                            {language === "english" ? "Latest Submissions" : "नवीनतम प्रविष्टियां"}
                        </h3>
                        <Link href="/manage-complaints" className="text-[10px] font-black text-indigo-600 hover:underline uppercase">
                            {language === "english" ? "View Archive" : "संग्रह देखें"}
                        </Link>
                    </div>
                    <div className="flex-1 overflow-auto divide-y divide-slate-50">
                        {(stats?.latestTotalComplaints || []).slice(0, 5).map((complaint, idx) => (
                            <Link href={`/logs/${complaint.id}`} key={idx} className="p-4 hover:bg-slate-50/50 transition-colors group flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                        {complaint.complainant_name || "Anonymous"}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px] sm:max-w-md">
                                        {complaint.subject || "No Subject"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-slate-500">
                                            {complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : '--'}
                                        </span>
                                        <span className="text-[8px] text-indigo-400 font-bold uppercase tracking-tighter">
                                            ID: {String(complaint.id).slice(0, 8)}
                                        </span>
                                    </div>
                                    <p className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                        <IoArrowForwardCircleOutline size={16} />
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAgeTab = () => (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            {/* Age Distribution Header */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                    { id: 'lessThan15Days', label: language === "english" ? "0 - 15 Days" : "0 - 15 दिन", count: stats?.categoryAgeStats?.total?.lessThan15Days ?? 0, color: "#22c55e", bg: "bg-green-50/50", border: "border-green-500" },
                    { id: 'fifteenToThirtyDays', label: language === "english" ? "15 - 30 Days" : "15 - 30 दिन", count: stats?.categoryAgeStats?.total?.fifteenToThirtyDays ?? 0, color: "#f59e0b", bg: "bg-orange-50/50", border: "border-orange-500" },
                    { id: 'moreThan30Days', label: language === "english" ? "More Than A Month" : "एक महीने से अधिक", count: stats?.categoryAgeStats?.total?.moreThan30Days ?? 0, color: "#ef4444", bg: "bg-red-50/50", border: "border-red-500" }
                ].map((age, idx) => {
                    const isSelected = selectedAgeGroup === age.id;
                    const total = (stats?.categoryAgeStats?.total?.lessThan15Days ?? 0) +
                        (stats?.categoryAgeStats?.total?.fifteenToThirtyDays ?? 0) +
                        (stats?.categoryAgeStats?.total?.moreThan30Days ?? 0);

                    return (
                        <div
                            key={idx}
                            onClick={() => setSelectedAgeGroup(isSelected ? null : age.id as any)}
                            className={`cursor-pointer transition-all duration-300 flex flex-col p-6 rounded-xs border ${isSelected ? age.border + `border-[${age.color}] shadow-lg transform scale-[1.02]` : 'border-slate-100'} ${age.bg}`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{age.label}</span>
                                <div className={`w-3 h-3 rounded-full ${isSelected ? 'animate-ping' : ''}`} style={{ backgroundColor: age.color }} />
                            </div>
                            <div className="flex items-end gap-3 mb-4">
                                <span className="text-5xl font-black text-slate-800 leading-none">{age.count}</span>
                                <span className="text-[11px] font-black text-slate-400 mb-1">
                                    {total ? `${Math.round((age.count / total) * 100)}%` : '0%'}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-slate-100/50 shadow-inner">
                                <div
                                    className="h-full transition-all duration-1000 ease-out"
                                    style={{
                                        width: `${total ? (age.count / total) * 100 : 0}%`,
                                        backgroundColor: age.color
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Thana-wise Age Distribution (SP Only) */}
            {user?.role === "SP" && stats?.thanaAgeBreakdown && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                            {language === "english" ? "Thana-Wise Performance Matrix" : "थाना-वार प्रदर्शन मैट्रिक्स"}
                        </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xs overflow-hidden shadow-sm">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="py-4 px-6 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Thana Name</th>
                                    <th className="py-4 px-4 text-center text-[10px] font-bold text-green-600 uppercase tracking-wider">0-15 Days</th>
                                    <th className="py-4 px-4 text-center text-[10px] font-bold text-orange-600 uppercase tracking-wider">15-30 Days</th>
                                    <th className="py-4 px-4 text-center text-[10px] font-bold text-red-600 uppercase tracking-wider">{"> 30 Days"}</th>
                                    <th className="py-4 px-6 text-center text-[11px] font-black text-slate-800 uppercase tracking-wider border-l border-slate-100">Total</th>
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
                                            <td className="py-3 px-6 text-[12px] font-bold text-slate-700">{thana}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="inline-block px-2 py-0.5 bg-green-50 text-green-700 text-[11px] font-black rounded-xs">{ages.lessThan15Days}</span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="inline-block px-2 py-0.5 bg-orange-50 text-orange-700 text-[11px] font-black rounded-xs">{ages.fifteenToThirtyDays}</span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className="inline-block px-2 py-0.5 bg-red-50 text-red-700 text-[11px] font-black rounded-xs">{ages.moreThan30Days}</span>
                                            </td>
                                            <td className="py-3 px-6 text-center text-[12px] font-black text-slate-800 border-l border-slate-50 bg-slate-50/30">
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
    );

    const renderStatusTab = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Status Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {complaintStatusColors.map((status, idx) => {
                    const count = stats?.statusCounts?.[status.id] ?? 0;
                    return (
                        <div key={idx} className="bg-white border border-slate-200 p-5 rounded-xs flex flex-col gap-3 shadow-sm hover:border-indigo-100 transition-all group">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.indicatorColor }} />
                                <span className="font-bold text-slate-600 text-[12px] uppercase tracking-tighter truncate">
                                    {language === "english" ? status.labeleng : status.labelhindi}
                                </span>
                            </div>
                            <div className="flex items-baseline justify-between">
                                <span className="text-3xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{count}</span>
                                <span className="text-[10px] text-slate-300 font-bold">
                                    {stats?.total ? `${Math.round((count / stats.total) * 100)}%` : '0%'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Age Group Breakdown */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                        {language === "english" ? "Investigation Breakdown by Duration" : "जांच विवरण अवधि के अनुसार"}
                    </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {([{ time: 'lessThan15Days', bg: 'bg-green-50', color: 'text-green-700' }, { time: 'fifteenToThirtyDays', bg: 'bg-orange-50', color: 'text-orange-700' }, { time: 'moreThan30Days', bg: 'bg-red-50', color: 'text-red-700' }] as const).map((ageId) => (
                        <div key={ageId.time} className={`space-y-4 ${ageId.bg} p-4 border border-slate-100 rounded-xs`}>
                            <h4 className={`text-[11px] font-black ${ageId.color} uppercase tracking-widest flex items-center gap-2`}>
                                <IoTimerOutline />
                                {ageId.time === 'lessThan15Days' ? (language === "english" ? "0-15 days" : "0-15 दिन") :
                                    ageId.time === 'fifteenToThirtyDays' ? (language === "english" ? "15-30 days" : "15-30 दिन") :
                                        (language === "english" ? "30+ days" : "30+ दिन")}
                            </h4>
                            <div className="space-y-2">
                                {Object.entries(stats?.ageStatusBreakdown?.[ageId.time] || {})
                                    .filter(([_, count]) => count > 0)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([status, count], idx) => {
                                        const statusMeta = complaintStatusColors.find(s => s.id === status);
                                        return (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-white border border-white hover:border-slate-200 rounded-xs transition-all">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusMeta?.indicatorColor || '#cbd5e1' }} />
                                                    <span className="text-[10px] font-bold text-slate-600 uppercase">
                                                        {language === "english" ? statusMeta?.labeleng || status : statusMeta?.labelhindi || status}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-black text-slate-800">{count}</span>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className='p-6 pb-0 flex flex-col gap-6 animate-in fade-in w-fullduration-700'>
            {/* Header with quick navigation */}
            <div className="flex items-center justify-between px-3">
                <div className="flex flex-col gap-1">
                    <h1 className='text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2'>
                        <RiDashboardLine className="text-blue-600" />
                        {language === "english" ? "Command Center" : "कमांड सेंटर"}
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {user?.role === "TI" ? (language === "english" ? `Thana: ${user.thana}` : `थाना: ${user.thana}`) : (language === "english" ? `District Overview: ${user?.name}` : `जिला विवरण: ${user?.name}`)}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => fetchStats(true)} className="px-3 py-1.5 bg-white border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all rounded-xs uppercase">
                        {language === "english" ? "Refresh Data" : "डेटा अपडेट करें"}
                    </button>
                </div>
            </div>

            {/* STATS TABS NAVIGATION */}
            <div className="w-full px-3 pb-0">
                <div className="border-b p-1.5 rounded-xs flex relative w-full border-slate-300">
                    {[
                        { id: 'summary', eng: 'Avedan Sarans', hin: 'आवेदन सारांश' },
                        { id: 'age', eng: 'Lambit Awadhi', hin: 'लंबित अवधि' },
                        { id: 'status', eng: 'Jaanch Nirikshan', hin: 'जांच निरीक्षण' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveStatsTab(tab.id as StatsTabId)}
                            className={`flex-1 py-2.5 px-4 text-normal font-black uppercase tracking-widest relative z-10 transition-all duration-300 border-none outline-none ${activeStatsTab === tab.id ? 'text-indigo-800' : 'text-slate-500 hover:text-indigo-800'
                                }`}
                        >
                            {language === 'english' ? tab.eng : tab.hin}
                        </button>
                    ))}
                    <div
                        className="absolute top-0 bottom-0 transition-all duration-300 ease-in-out bg-indigo-600/10 rounded-px shadow-indigo-200"
                        style={{
                            left: `${(100 / 3) * ['summary', 'age', 'status'].indexOf(activeStatsTab) + 0.5}%`,
                            width: `${(100 / 3) - 1}%`
                        }}
                    />
                </div>
            </div>

            {/* TAB CONTENT */}
            <div className="w-full px-3 min-h-[400px]">
                {statsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-40 bg-slate-100 rounded-xs" />
                        ))}
                    </div>
                ) : (
                    <>
                        {activeStatsTab === 'summary' && renderSummaryTab()}
                        {activeStatsTab === 'age' && renderAgeTab()}
                        {activeStatsTab === 'status' && renderStatusTab()}
                    </>
                )}
            </div>

            {/* SEPARATOR */}
            <div className="w-full h-px bg-slate-100 my-4" />

            {/* MAIN ACTIONS GRID */}
            <div>
                <div className="px-3 mb-6">
                    <h2 className='text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2'>
                        <IoLayersOutline className="text-indigo-500" />
                        {language === "english" ? "Management Modules" : "प्रबंधन मॉड्यूल"}
                    </h2>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-3 pb-4'>
                    {/* Manage Complaints */}
                    <Link href="/manage-complaints" className='bg-white p-6 rounded-xs border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col justify-between h-full min-h-[180px]'>
                        <div>
                            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <IoLayersOutline className="text-indigo-600 text-xl" />
                            </div>
                            <h2 className='text-sm font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors'>{language === "english" ? "Manage Complaints" : "शिकायत प्रबंधन"}</h2>
                            <p className='text-slate-500 text-[11px] leading-relaxed mb-4'>
                                {language === "english" ? "Access central database to view and update complaint status." : "शिकायतों की स्थिति देखने और अपडेट करने के लिए डेटाबेस तक पहुंचें।"}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-wider">
                            <span>{language === "english" ? "Enter Module" : "मॉड्यूल में प्रवेश"}</span>
                            <IoArrowForwardCircleOutline className="text-lg group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>

                    {/* Unallocated Complaints - SP only */}
                    {user?.role === "SP" && (
                        <Link href="/unallocated-complaints" className='bg-white p-6 rounded-xs border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group flex flex-col justify-between min-h-[180px]'>
                            <div>
                                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <IoBusinessOutline className="text-orange-600 text-xl" />
                                </div>
                                <h2 className='text-sm font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors'>{language === "english" ? "Unallocated Items" : "अनाबंटित आइटम"}</h2>
                                <p className='text-slate-500 text-[11px] leading-relaxed mb-4'>
                                    {language === "english" ? "Review and assign jurisdictions to unassigned complaints." : "अनाबंटित शिकायतों के लिएJurisdictions की समीक्षा करें और सौंपें।"}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-orange-600 text-[10px] font-black uppercase tracking-wider">
                                <span>{language === "english" ? "Manage Allocation" : "प्रबंधन आवंटन"}</span>
                                <IoArrowForwardCircleOutline className="text-lg group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    )}

                    {/* Register Complaint */}
                    <Link href="/register-complaint" className='bg-white p-6 rounded-xs border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group flex flex-col justify-between h-full min-h-[180px]'>
                        <div>
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <IoCreateOutline className="text-blue-600 text-xl" />
                            </div>
                            <h2 className='text-sm font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors'>{language === "english" ? "New Registration" : "नया पंजीकरण"}</h2>
                            <p className='text-slate-500 text-[11px] leading-relaxed mb-4'>
                                {language === "english" ? "File new grievances with precise categorization and attachments." : "सटीक वर्गीकरण और अनुलग्नकों के साथ नई शिकायतें दर्ज करें।"}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-wider">
                            <span>{language === "english" ? "File Narrative" : "प्रविष्टि प्रारंभ करें"}</span>
                            <IoArrowForwardCircleOutline className="text-lg group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>

                    {/* Admin Actions */}
                    {user?.role === "SP" && (
                        <Link href="/admin-actions" className='bg-white p-6 rounded-xs border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group flex flex-col justify-between h-full min-h-[180px]'>
                            <div>
                                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <IoSettingsOutline className="text-emerald-600 text-xl" />
                                </div>
                                <h2 className='text-sm font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors'>{language === "english" ? "Admin Actions" : "प्रशासनिक कार्य"}</h2>
                                <p className='text-slate-500 text-[11px] leading-relaxed mb-4'>
                                    {language === "english" ? "Management tools to configure thanas and monitor user accounts." : "thanas को कॉन्फ़िगर करने और उपयोगकर्ता खातों की निगरानी के उपकरण।"}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                                <span>{language === "english" ? "Security Console" : "सुरक्षा कंसोल"}</span>
                                <IoArrowForwardCircleOutline className="text-lg group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}
