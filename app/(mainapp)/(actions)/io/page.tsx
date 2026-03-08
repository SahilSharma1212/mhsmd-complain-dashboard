'use client'
import React, { useEffect, useState } from "react";
import { FiUsers, FiUser, FiHome, FiAlertCircle, FiChevronRight, FiChevronDown, FiBarChart2, FiRefreshCw } from "react-icons/fi";
import { useUserStore } from "@/app/_store/userStore";
import { useIoStatsStore } from "@/app/_store/ioStatsStore";
import { IOStat, ThanaIOStat, TIResponse } from "@/app/types";

const IOPage = () => {
    const { user } = useUserStore();
    const { stats, loading, error, fetchIOStats } = useIoStatsStore();
    const [expandedThana, setExpandedThana] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchIOStats();
        }
    }, [user, fetchIOStats]);

    if (!user) return null;

    const isTI = user.role === "TI";

    // Cast stats to appropriate type based on role
    const tiStats = isTI ? (stats as TIResponse) : null;
    const spStats = !isTI ? (stats as ThanaIOStat[]) : null;

    return (
        <div className="min-h-screen bg-white p-6">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900 tracking-tight">
                        <FiBarChart2 className="text-blue-600" />
                        विवेचना अधिकारी सांख्यिकी (IO Stats)
                    </h1>
                    <p className="mt-2 text-gray-500 font-medium">
                        {isTI ? `${user.thana} थाना के विवेचना अधिकारियों का विवरण` : "क्षेत्राधिकार के थानों का विवेचना अधिकारी विवरण"}
                    </p>
                </div>
                <button
                    onClick={() => fetchIOStats(true)}
                    disabled={loading}
                    className="flex items-center gap-2 self-start md:self-center px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xs text-xs font-bold uppercase tracking-widest text-slate-700 transition-all disabled:opacity-50"
                >
                    <FiRefreshCw className={`${loading ? 'animate-spin' : ''}`} />
                    {loading ? "लोड हो रहा है..." : "रिफ्रेश करें"}
                </button>
            </header>

            {loading && !stats ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <StatCardSkeleton key={i} />)}
                    </div>
                    <div className="rounded-xs border border-gray-100 bg-white p-6 shadow-sm">
                        <div className="h-6 w-48 bg-gray-100 rounded-xs mb-6 animate-pulse" />
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-12 bg-gray-50 rounded-xs animate-pulse" />
                            ))}
                        </div>
                    </div>
                </div>
            ) : isTI ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* TI Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard
                            title="कुल विवेचना अधिकारी"
                            value={tiStats?.ioStats?.length || 0}
                            icon={<FiUsers />}
                            color="blue"
                        />
                        <StatCard
                            title="आवंटित मामले"
                            value={tiStats?.ioStats?.reduce((acc: number, curr: any) => acc + curr.count, 0) || 0}
                            icon={<FiBarChart2 />}
                            color="emerald"
                        />
                        <StatCard
                            title="बिना आवंटित (No IO)"
                            value={tiStats?.noIoCount || 0}
                            icon={<FiAlertCircle />}
                            color="orange"
                        />
                    </div>

                    {/* TI Detailed IO List */}
                    <div className="rounded-xs border border-gray-100 bg-white p-6 shadow-sm">
                        <h2 className="mb-6 text-xl font-bold text-gray-800 flex items-center gap-2">
                            <FiUser className="text-blue-500" />
                            सभी विवेचना अधिकारी
                        </h2>
                        <div className="overflow-hidden rounded-xs border border-gray-100">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">नाम</th>
                                        <th className="px-6 py-4">शिकायतों की संख्या</th>
                                        <th className="px-6 py-4 text-right">प्रगति</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {tiStats?.ioStats?.map((io: IOStat) => (
                                        <tr key={io.name} className="group hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-gray-900 capitalize">{io.name}</td>
                                            <td className="px-6 py-4 text-gray-600">{io.count}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-3">
                                                    <div className="h-2 w-32 rounded-full bg-gray-100 overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{ width: `${Math.min((io.count / (tiStats.ioStats.reduce((a: number, c: any) => a + c.count, 0) || 1)) * 100, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-400">
                                                        {Math.round((io.count / (tiStats.ioStats.reduce((a: number, c: any) => a + c.count, 0) || 1)) * 100)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {tiStats?.ioStats?.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-10 text-center text-gray-500 italic">कोई डेटा उपलब्ध नहीं है</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* SP/ASP/SDOP View */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {spStats?.map((thana: ThanaIOStat) => (
                            <div
                                key={thana.thanaName}
                                className={`rounded-xs border transition-all duration-300 ${expandedThana === thana.thanaName ? 'border-blue-200 ring-2 ring-blue-50' : 'border-gray-100'} bg-white shadow-sm overflow-hidden`}
                            >
                                <button
                                    onClick={() => setExpandedThana(expandedThana === thana.thanaName ? null : thana.thanaName)}
                                    className="flex w-full items-center justify-between p-6 text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xs bg-blue-50 text-blue-600">
                                            <FiHome size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 capitalize">{thana.thanaName}</h3>
                                            <p className="text-sm text-gray-500 font-medium">
                                                {thana.ioStats.length} IOs • {thana.ioStats.reduce((a, c) => a + c.count, 0)} मामले
                                            </p>
                                        </div>
                                    </div>
                                    {expandedThana === thana.thanaName ? <FiChevronDown /> : <FiChevronRight />}
                                </button>

                                {expandedThana === thana.thanaName && (
                                    <div className="border-t border-gray-50 bg-gray-50/30 p-6 animate-in slide-in-from-top-2 duration-300">
                                        <div className="mb-4 flex items-center justify-between text-sm">
                                            <span className="font-semibold text-gray-600 uppercase tracking-tighter">विवेचना अधिकारी</span>
                                            <span className="font-semibold text-gray-600 uppercase tracking-tighter">मामले</span>
                                        </div>
                                        <div className="space-y-3">
                                            {thana.ioStats.map((io) => (
                                                <div key={io.name} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm border border-gray-100">
                                                    <span className="font-medium text-gray-700 capitalize">{io.name}</span>
                                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
                                                        {io.count}
                                                    </span>
                                                </div>
                                            ))}
                                            <div className="flex items-center justify-between rounded-lg bg-orange-50/50 p-3 border border-orange-100 mt-4">
                                                <span className="font-bold text-orange-700">बिना आवंटित मामले</span>
                                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                                                    {thana.noIoCount}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: 'blue' | 'emerald' | 'orange' }) => {
    const colors = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        orange: "bg-orange-50 text-orange-600 border-orange-100"
    };

    return (
        <div className={`flex items-center gap-5 rounded-xs border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md`}>
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xs border ${colors[color]}`}>
                {React.cloneElement(icon as any, { size: 28 })}
            </div>
            <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-tight">{title}</p>
                <p className="text-3xl font-black text-gray-900">{value}</p>
            </div>
        </div>
    );
};

const StatCardSkeleton = () => (
    <div className="flex items-center gap-5 rounded-xs border border-gray-100 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-14 w-14 bg-gray-50 rounded-xs border border-gray-100 shrink-0" />
        <div className="space-y-2 flex-1">
            <div className="h-3 w-2/3 bg-gray-100 rounded-full" />
            <div className="h-8 w-1/2 bg-gray-50 rounded-xs" />
        </div>
    </div>
);

export default IOPage;
