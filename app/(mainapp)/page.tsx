'use client'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useEffect, useState, useRef } from 'react'
import { useUserStore } from '../_store/userStore'
import { useStatsStore } from '../_store/statsStore'
import { StatusCounts, StatData, COMPLAINT_STATUS_COLORS, Complaint } from '../types'
import { RiDashboardLine } from 'react-icons/ri'
import { IoLayersOutline, IoArrowForwardCircleOutline, IoBusinessOutline, IoTimerOutline, IoReloadOutline, IoCloseOutline } from 'react-icons/io5'
import Link from 'next/link'
import { useLanguageStore } from '../_store/languageStore'
import { MdOutlineWrongLocation } from 'react-icons/md'
import { FaHourglass } from 'react-icons/fa6'
import { IoMdTimer } from 'react-icons/io'
import { useComplaintStore } from '../_store/complaintStore';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// ─── Constants ────────────────────────────────────────────────────────────────
const complaintStatusColors = Object.entries(COMPLAINT_STATUS_COLORS).map(([id, c]) => ({
    id,
    labeleng: c.labeleng,
    labelhindi: c.labelhindi,
    indicatorColor: c.indicatorColor,
}));

type PopupType =
    | 'total'
    | 'pending'
    | 'unallocated'
    | 'nirakrit'
    | 'recent'
    | 'thana_age'
    | `age_lessThan15Days`
    | `age_fifteenToThirtyDays`
    | `age_moreThan30Days`
    | `status_${string}`
    | null;

// ─── Reusable Modal ───────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(15,23,42,0.45)' }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xs shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h2>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
                    >
                        <IoCloseOutline size={18} />
                    </button>
                </div>
                {/* Body */}
                <div className="overflow-y-auto flex-1 p-5 space-y-4">
                    {children}
                </div>
            </div>
        </div>
    );
}

// ─── Reusable Tab Bar ─────────────────────────────────────────────────────────
function TabBar({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
    return (
        <div className="flex gap-1 bg-slate-100 rounded-xs p-1 mb-4 shrink-0">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`flex-1 py-1.5 rounded-md text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${active === tab.id ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

// ─── Complaint Row ────────────────────────────────────────────────────────────
function ComplaintRow({ complaint }: { complaint: Complaint }) {
    return (
        <Link href={`/logs/${complaint.id}`} className="flex items-center justify-between p-3 rounded-xs border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
            <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">{complaint.complainant_name || 'Anonymous'}</span>
                <span className="text-[10px] text-slate-400 font-medium truncate max-w-[280px]">{complaint.subject || 'No Subject'}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-500">{complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : '--'}</span>
                    <span className="text-[12px] text-indigo-400 font-bold uppercase tracking-tighter">ID: {String(complaint.id).slice(0, 8)}</span>
                </div>
                <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all opacity-0 group-hover:opacity-100">
                    <IoArrowForwardCircleOutline size={14} />
                </div>
            </div>
        </Link>
    );
}

// ─── Thana-Age Table ──────────────────────────────────────────────────────────
function ThanaAgeTable({ data, language }: { data: Record<string, { lessThan15Days: number; fifteenToThirtyDays: number; moreThan30Days: number }>; language: string }) {
    const sorted = Object.entries(data).sort((a, b) => {
        const tA = a[1].lessThan15Days + a[1].fifteenToThirtyDays + a[1].moreThan30Days;
        const tB = b[1].lessThan15Days + b[1].fifteenToThirtyDays + b[1].moreThan30Days;
        return tB - tA;
    });
    return (
        <div className="bg-white border border-slate-100 rounded-xs overflow-hidden">
            <table className="w-full border-collapse text-[11px]">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="py-2.5 px-3 text-left font-bold text-slate-500 uppercase tracking-wider">Thana</th>
                        <th className="py-2.5 px-3 text-center font-bold text-green-600 uppercase">0-15d</th>
                        <th className="py-2.5 px-3 text-center font-bold text-orange-600 uppercase">15-30d</th>
                        <th className="py-2.5 px-3 text-center font-bold text-red-600 uppercase">&gt;30d</th>
                        <th className="py-2.5 px-3 text-center font-black text-slate-800 uppercase border-l border-slate-100">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {sorted.map(([thana, ages], idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-2 px-3 font-bold text-slate-700">{thana}</td>
                            <td className="py-2 px-3 text-center"><span className="px-1.5 py-0.5 bg-green-50 text-green-700 font-black rounded">{ages.lessThan15Days}</span></td>
                            <td className="py-2 px-3 text-center"><span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 font-black rounded">{ages.fifteenToThirtyDays}</span></td>
                            <td className="py-2 px-3 text-center"><span className="px-1.5 py-0.5 bg-red-50 text-red-700 font-black rounded">{ages.moreThan30Days}</span></td>
                            <td className="py-2 px-3 text-center font-black text-slate-800 border-l border-slate-50 bg-slate-50/30">{ages.lessThan15Days + ages.fifteenToThirtyDays + ages.moreThan30Days}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ─── Status Distribution List ─────────────────────────────────────────────────
function StatusDistList({ counts, total, language }: { counts: StatusCounts; total: number; language: string }) {
    return (
        <div className="grid grid-cols-2 gap-2">
            {complaintStatusColors.map((s) => {
                const count = counts?.[s.id] ?? 0;
                if (count === 0) return null;
                return (
                    <div key={s.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xs">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.indicatorColor }} />
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter truncate">{language === 'english' ? s.labeleng : s.labelhindi}</span>
                        </div>
                        <span className="text-xs font-black text-slate-800 ml-2">{count}</span>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
    const { user, setUser, thana, setThana } = useUserStore();
    const { language } = useLanguageStore();
    const stats = useStatsStore(state => state.stats);
    const statsLoading = useStatsStore(state => state.loading);
    const statsError = useStatsStore(state => state.error);
    const fetchStats = useStatsStore(state => state.fetchStats);
    const { setCachedData } = useComplaintStore();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    // ── Popup state ───────────────────────────────────────────────────────────
    const [popup, setPopup] = useState<PopupType>(null);
    const [popupTab, setPopupTab] = useState<string>('');

    const handleRedirection = async (filter: string, value: string) => {
        setIsRedirecting(true);
        try {
            const params = new URLSearchParams();
            params.set("page", "1");
            if (filter && value) {
                params.set("filter", filter);
                params.set("value", value);
            }
            const response = await axios.get(`/api/complaint?${params.toString()}`);
            if (response.data && response.data.success) {
                const complaintData = response.data.data;
                const normalizedData = Array.isArray(complaintData) ? complaintData : [complaintData];
                setCachedData({
                    complaints: normalizedData,
                    totalCount: response.data.totalCount ?? 0,
                    currentPage: 1,
                    filterAttribute: filter,
                    filterValue: value
                });
                router.push('/manage-complaints');
            }
        } catch (error) {
            toast.error("Failed to fetch complaints for redirection");
            setIsRedirecting(false);
        }
    };

    const openPopup = (type: PopupType, defaultTab = 'age') => {
        if (user?.role === 'TI') {
            // TI only sees duration distribution modals
            if (type !== 'age_lessThan15Days' && type !== 'age_fifteenToThirtyDays' && type !== 'age_moreThan30Days') {
                return;
            }
        }
        setPopup(type);
        setPopupTab(defaultTab);
    };
    const closePopup = () => setPopup(null);

    useEffect(() => {
        setIsMounted(true);
        if (user && !stats && !statsLoading && !statsError) fetchStats();
    }, [fetchStats, stats, statsLoading, statsError, user]);

    useEffect(() => {
        const fetchUserDetails = async () => {
            if (!user) {
                try {
                    const response = await axios.get("/api/user");
                    if (response.data) setUser(response.data);
                } catch { toast.error("Failed to fetch user details"); }
            }
        };
        const fetchThanaDetails = async () => {
            if (!thana) {
                try {
                    const response = await axios.get("/api/thana");
                    if (response.data?.success) {
                        const d = response.data.data;
                        setThana(Array.isArray(d) ? d : [d]);
                    }
                } catch { toast.error("Failed to fetch thana details"); }
            }
        };
        fetchUserDetails();
        fetchThanaDetails();
    }, []);

    const isSPRole = user?.role === 'SP' || user?.role === 'ASP' || user?.role === 'SDOP';

    // ── Helpers ───────────────────────────────────────────────────────────────
    const ageGroups = [
        { id: 'lessThan15Days' as const, label: language === 'english' ? '0 – 15 Days' : '0 – 15 दिन', color: '#22c55e', bg: 'bg-green-50', border: 'border-green-300', textColor: 'text-green-700', numBg: 'bg-green-100' },
        { id: 'fifteenToThirtyDays' as const, label: language === 'english' ? '15 – 30 Days' : '15 – 30 दिन', color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-300', textColor: 'text-amber-700', numBg: 'bg-amber-100' },
        { id: 'moreThan30Days' as const, label: language === 'english' ? '30+ Days' : '30+ दिन', color: '#ef4444', bg: 'bg-red-50', border: 'border-red-300', textColor: 'text-red-700', numBg: 'bg-red-100' },
    ];

    const pendingTotal =
        (stats?.categoryAgeStats?.total?.lessThan15Days ?? 0) +
        (stats?.categoryAgeStats?.total?.fifteenToThirtyDays ?? 0) +
        (stats?.categoryAgeStats?.total?.moreThan30Days ?? 0);

    // ── Popup content resolver ─────────────────────────────────────────────────
    const renderPopupContent = () => {
        if (!popup) return null;

        // ── TOTAL ──────────────────────────────────────────────────────────────
        if (popup === 'total') {
            const tabs = [{ id: 'age', label: language === 'english' ? 'Age Distribution' : 'आयु वितरण' }, ...(isSPRole ? [{ id: 'thana', label: language === 'english' ? 'Thana-wise' : 'थाना-वार' }] : [])];
            return (
                <Modal title={language === 'english' ? 'Total Complaints' : 'कुल शिकायतें'} onClose={closePopup}>
                    <TabBar tabs={tabs} active={popupTab} onChange={setPopupTab} />
                    {popupTab === 'age' && (
                        <div className="grid grid-cols-3 gap-3">
                            {ageGroups.map(ag => (
                                <div key={ag.id} className={`${ag.bg} ${ag.border} border rounded-xs p-4 flex flex-col gap-2`}>
                                    <span className={`text-[10px] font-bold ${ag.textColor} uppercase tracking-widest`}>{ag.label}</span>
                                    <span className="text-3xl font-black text-slate-800">{stats?.categoryAgeStats?.total?.[ag.id] ?? 0}</span>
                                    <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${pendingTotal ? ((stats?.categoryAgeStats?.total?.[ag.id] ?? 0) / pendingTotal) * 100 : 0}%`, backgroundColor: ag.color }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {popupTab === 'thana' && stats?.thanaAgeBreakdown && (
                        <ThanaAgeTable data={stats.thanaAgeBreakdown} language={language} />
                    )}
                    {isSPRole && (
                        <button
                            onClick={() => { closePopup(); handleRedirection("", ""); }}
                            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xs bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            {language === 'english' ? 'View All Complaints' : 'सभी शिकायतें देखें'}
                            <IoArrowForwardCircleOutline size={16} />
                        </button>
                    )}
                </Modal>
            );
        }

        // ── PENDING ────────────────────────────────────────────────────────────
        if (popup === 'pending') {
            const tabs = isSPRole
                ? [{ id: 'thana', label: language === 'english' ? 'Thana-wise' : 'थाना-वार' }]
                : [{ id: 'age', label: language === 'english' ? 'Age Distribution' : 'आयु वितरण' }];

            const activeTab = (popupTab === 'age' || popupTab === '') && isSPRole ? 'thana' : (popupTab || 'age');

            return (
                <Modal title={language === 'english' ? 'Pending Complaints' : 'लम्बित शिकायतें'} onClose={closePopup}>
                    <TabBar tabs={tabs} active={activeTab} onChange={setPopupTab} />
                    {activeTab === 'age' && (
                        <div className="grid grid-cols-3 gap-3">
                            {ageGroups.map(ag => {
                                const pendAgeTotal = (stats?.categoryAgeStats?.pending?.lessThan15Days ?? 0) + (stats?.categoryAgeStats?.pending?.fifteenToThirtyDays ?? 0) + (stats?.categoryAgeStats?.pending?.moreThan30Days ?? 0);
                                return (
                                    <div key={ag.id} className={`${ag.bg} ${ag.border} border rounded-xs p-4 flex flex-col gap-2`}>
                                        <span className={`text-[10px] font-bold ${ag.textColor} uppercase tracking-widest`}>{ag.label}</span>
                                        <span className="text-3xl font-black text-slate-800">{stats?.categoryAgeStats?.pending?.[ag.id] ?? 0}</span>
                                        <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${pendAgeTotal ? ((stats?.categoryAgeStats?.pending?.[ag.id] ?? 0) / pendAgeTotal) * 100 : 0}%`, backgroundColor: ag.color }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {activeTab === 'thana' && stats?.thanaAgeBreakdown && (
                        <ThanaAgeTable data={stats.thanaAgeBreakdown} language={language} />
                    )}
                    <button
                        onClick={() => { closePopup(); handleRedirection("status", "लम्बित"); }}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xs bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        {language === 'english' ? 'View All Pending' : 'सभी लम्बित देखें'}
                        <IoArrowForwardCircleOutline size={16} />
                    </button>
                </Modal>
            );
        }

        // ── UNALLOCATED ────────────────────────────────────────────────────────
        if (popup === 'unallocated') {
            return (
                <Modal title={language === 'english' ? 'Unallocated Complaints' : 'अनाबंटित शिकायतें'} onClose={closePopup}>
                    <div className="space-y-2">
                        {(stats?.latestUnallocatedComplaints || []).slice(0, 5).map((c, i) => <ComplaintRow key={i} complaint={c} />)}
                        {(!stats?.latestUnallocatedComplaints || stats.latestUnallocatedComplaints.length === 0) && (
                            <p className="text-center text-sm text-slate-400 py-4 font-medium">{language === 'english' ? 'No unallocated complaints' : 'कोई अनाबंटित शिकायत नहीं'}</p>
                        )}
                    </div>
                    <Link href="/unallocated-complaints" onClick={closePopup} className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xs bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-widest transition-all">
                        {language === 'english' ? 'View All Unallocated' : 'सभी अनाबंटित देखें'}
                        <IoArrowForwardCircleOutline size={16} />
                    </Link>
                </Modal>
            );
        }

        // ── NIRAKRIT ───────────────────────────────────────────────────────────
        if (popup === 'nirakrit') {
            const tabs = isSPRole
                ? [
                    { id: 'thana', label: language === 'english' ? 'Thana-wise' : 'थाना-वार' },
                    { id: 'status', label: language === 'english' ? 'Status-wise' : 'स्थिति-वार' }
                ]
                : [{ id: 'age', label: language === 'english' ? 'Age Distribution' : 'आयु वितरण' }];

            const activeTab = (popupTab === 'age' || popupTab === '') && isSPRole ? 'thana' : (popupTab || 'age');

            return (
                <Modal title={language === 'english' ? 'Nirakrit Complaints' : 'निराकृत शिकायतें'} onClose={closePopup}>
                    <TabBar tabs={tabs} active={activeTab} onChange={setPopupTab} />
                    {activeTab === 'age' && (
                        <div className="grid grid-cols-3 gap-3">
                            {ageGroups.map(ag => (
                                <div key={ag.id} className={`${ag.bg} ${ag.border} border rounded-xs p-4 flex flex-col gap-2`}>
                                    <span className={`text-[10px] font-bold ${ag.textColor} uppercase tracking-widest`}>{ag.label}</span>
                                    <span className="text-3xl font-black text-slate-800">{stats?.categoryAgeStats?.nirakrit?.[ag.id] ?? 0}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'thana' && stats?.thanaAgeBreakdown && (
                        <ThanaAgeTable data={stats.thanaAgeBreakdown} language={language} />
                    )}
                    {activeTab === 'status' && stats?.statusCounts && (
                        <div className="grid grid-cols-2 gap-2">
                            {complaintStatusColors
                                .filter(s => s.id !== 'लम्बित')
                                .map((s) => {
                                    const count = stats?.statusCounts?.[s.id] ?? 0;
                                    if (count === 0) return null;
                                    return (
                                        <div key={s.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xs">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.indicatorColor }} />
                                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter truncate">{language === 'english' ? s.labeleng : s.labelhindi}</span>
                                            </div>
                                            <span className="text-xs font-black text-slate-800 ml-2">{count}</span>
                                        </div>
                                    );
                                })}
                        </div>
                    )}
                    <button
                        onClick={() => { closePopup(); handleRedirection("status", "निराकृत"); }}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xs bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        {language === 'english' ? 'View All Nirakrit' : 'सभी निराकृत देखें'}
                        <IoArrowForwardCircleOutline size={16} />
                    </button>
                </Modal>
            );
        }

        // ── RECENT COMPLAINTS ─────────────────────────────────────────────────
        if (popup === 'recent') {
            const allocated = (stats?.latestTotalComplaints || []).filter(c => c.allocated_thana).slice(0, 5);
            return (
                <Modal title={language === 'english' ? 'Recent Complaints' : 'नवीनतम शिकायतें'} onClose={closePopup}>
                    <div className="space-y-2">
                        {allocated.map((c, i) => <ComplaintRow key={i} complaint={c} />)}
                        {allocated.length === 0 && (
                            <p className="text-center text-sm text-slate-400 py-4">{language === 'english' ? 'No recent complaints' : 'कोई नवीनतम शिकायत नहीं'}</p>
                        )}
                    </div>
                    <Link href="/manage-complaints" onClick={closePopup} className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xs bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest transition-all">
                        {language === 'english' ? 'View All Complaints' : 'सभी शिकायतें देखें'}
                        <IoArrowForwardCircleOutline size={16} />
                    </Link>
                </Modal>
            );
        }

        // ── AGE GROUP ─────────────────────────────────────────────────────────
        if (popup?.startsWith('age_')) {
            const id = popup.replace('age_', '') as 'lessThan15Days' | 'fifteenToThirtyDays' | 'moreThan30Days';
            const ag = ageGroups.find(a => a.id === id);
            const tabs = isSPRole
                ? [{ id: 'thana', label: language === 'english' ? 'Thana-wise' : 'थाना-वार' }]
                : [{ id: 'status', label: language === 'english' ? 'Status-wise' : 'स्थिति-वार' }];

            const activeTab = (popupTab === 'age' || popupTab === '') ? (isSPRole ? 'thana' : 'status') : popupTab;

            return (
                <Modal title={`${ag?.label ?? ''} — ${language === 'english' ? 'Pending Complaints' : 'लम्बित शिकायतें'}`} onClose={closePopup}>
                    <TabBar tabs={tabs} active={activeTab} onChange={setPopupTab} />
                    {activeTab === 'thana' && stats?.thanaAgeBreakdown && (
                        <div className="bg-white border border-slate-100 rounded-xs overflow-hidden">
                            <table className="w-full border-collapse text-[11px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="py-2.5 px-3 text-left font-bold text-slate-500 uppercase tracking-wider">Thana</th>
                                        <th className="py-2.5 px-3 text-center font-black text-slate-800 uppercase">Count</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {Object.entries(stats.thanaAgeBreakdown)
                                        .filter(([_, ages]) => ages[id] > 0)
                                        .sort((a, b) => b[1][id] - a[1][id])
                                        .map(([thanaName, ages], idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-2 px-3 font-bold text-slate-700">{thanaName}</td>
                                                <td className="py-2 px-3 text-center font-black text-slate-800 tabular-nums">{ages[id]}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {activeTab === 'status' && stats?.ageStatusBreakdown && (
                        <div className="grid grid-cols-2 gap-2">
                            {complaintStatusColors.map((s) => {
                                const count = stats.ageStatusBreakdown?.[id]?.[s.id] ?? 0;
                                if (count === 0) return null;
                                return (
                                    <div key={s.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xs">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.indicatorColor }} />
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter truncate">{language === 'english' ? s.labeleng : s.labelhindi}</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-800 ml-2">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <button
                        onClick={() => { closePopup(); handleRedirection("age", id); }}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xs bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        {language === 'english' ? `View All ${ag?.label}` : `सभी ${ag?.label} देखें`}
                        <IoArrowForwardCircleOutline size={16} />
                    </button>
                </Modal>
            );
        }

        // ── STATUS ────────────────────────────────────────────────────────────
        if (popup?.startsWith('status_')) {
            const statusId = popup.replace('status_', '');
            const s = complaintStatusColors.find(item => item.id === statusId);
            const tabs = isSPRole
                ? [{ id: 'thana', label: language === 'english' ? 'Thana-wise' : 'थाना-वार' }]
                : [{ id: 'age', label: language === 'english' ? 'Age Distribution' : 'आयु वितरण' }];

            const activeTab = (popupTab === 'age' || popupTab === '') ? (isSPRole ? 'thana' : 'age') : popupTab;

            const ageDistForStatus = {
                lessThan15Days: stats?.ageStatusBreakdown?.lessThan15Days?.[statusId] ?? 0,
                fifteenToThirtyDays: stats?.ageStatusBreakdown?.fifteenToThirtyDays?.[statusId] ?? 0,
                moreThan30Days: stats?.ageStatusBreakdown?.moreThan30Days?.[statusId] ?? 0,
            };
            const ageTotal = ageDistForStatus.lessThan15Days + ageDistForStatus.fifteenToThirtyDays + ageDistForStatus.moreThan30Days;

            return (
                <Modal title={language === 'english' ? s?.labeleng ?? '' : s?.labelhindi ?? ''} onClose={closePopup}>
                    <TabBar tabs={tabs} active={activeTab} onChange={setPopupTab} />
                    {activeTab === 'age' && (
                        <div className="grid grid-cols-3 gap-3">
                            {ageGroups.map(ag => (
                                <div key={ag.id} className={`${ag.bg} ${ag.border} border rounded-xs p-4 flex flex-col gap-2`}>
                                    <span className={`text-[10px] font-bold ${ag.textColor} uppercase tracking-widest`}>{ag.label}</span>
                                    <span className="text-3xl font-black text-slate-800">{ageDistForStatus[ag.id]}</span>
                                    <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${ageTotal ? (ageDistForStatus[ag.id] / ageTotal) * 100 : 0}%`, backgroundColor: ag.color }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'thana' && stats?.thanaBreakdown && (
                        <div className="bg-white border border-slate-100 rounded-xs overflow-hidden">
                            <table className="w-full border-collapse text-[11px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="py-2.5 px-3 text-left font-bold text-slate-500 uppercase tracking-wider">Thana</th>
                                        <th className="py-2.5 px-3 text-center font-black text-slate-800 uppercase">Count</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {Object.entries(stats.thanaBreakdown)
                                        .map(([name, counts]) => {
                                            const count = counts[statusId] || 0;
                                            if (count === 0) return null;
                                            return (
                                                <tr key={name} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-2 px-3 font-bold text-slate-700">{name}</td>
                                                    <td className="py-2 px-3 text-center font-black text-slate-800 tabular-nums">{count}</td>
                                                </tr>
                                            );
                                        })
                                        .filter(row => row !== null)
                                    }
                                    {(!stats.thanaBreakdown || Object.keys(stats.thanaBreakdown).length === 0) && (
                                        <tr>
                                            <td colSpan={2} className="py-4 text-center text-slate-400 font-bold uppercase tracking-widest text-[8px]">
                                                {language === 'english' ? 'No thana-wise data' : 'कोई थाना-वार डेटा नहीं'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <button
                        onClick={() => { closePopup(); handleRedirection("status", statusId); }}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xs bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        {language === 'english' ? 'View All' : 'सभी देखें'}
                        <IoArrowForwardCircleOutline size={16} />
                    </button>
                </Modal>
            );
        }

        // ── THANA AGE ───────────────────────────────────────────────────────
        if (popup === 'thana_age' && stats?.thanaAgeBreakdown) {
            return (
                <Modal title={language === 'english' ? 'Thana-wise Duration' : 'थाना-वार अवधि'} onClose={closePopup}>
                    <ThanaAgeTable data={stats.thanaAgeBreakdown} language={language} />
                </Modal>
            );
        }

        return null;
    };

    // ── Pie chart data ─────────────────────────────────────────────────────────
    const pieData = isSPRole
        ? [
            { name: 'Pending', value: stats?.statusCounts?.लम्बित ?? 0, color: '#f59e0b' },
            { name: 'Unallocated', value: stats?.unallocatedCount ?? 0, color: '#f43f5e' },
            { name: 'Others', value: (stats?.total ?? 0) - (stats?.statusCounts?.लम्बित ?? 0) - (stats?.unallocatedCount ?? 0), color: '#6366f1' },
        ]
        : [
            { name: 'Pending', value: stats?.statusCounts?.लम्बित ?? 0, color: '#f59e0b' },
            { name: 'Nirakrit', value: stats?.nirakritCount ?? 0, color: '#10b981' },
            { name: 'Others', value: (stats?.total ?? 0) - (stats?.statusCounts?.लम्बित ?? 0) - (stats?.nirakritCount ?? 0), color: '#6366f1' },
        ];

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className='flex flex-col gap-3 p-4 h-full overflow-hidden animate-in fade-in duration-500'>

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                    <h1 className='text-lg font-black text-slate-900 tracking-tight flex items-center gap-2'>
                        <RiDashboardLine className="text-indigo-600" />
                        {language === 'english' ? 'Command Center' : 'कमांड सेंटर'}
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {user?.role === 'TI'
                            ? (language === 'english' ? `Thana: ${user.thana}` : `थाना: ${user.thana}`)
                            : (language === 'english' ? `District: ${user?.name}` : `जिला: ${user?.name}`)}
                    </p>
                </div>
                <button
                    onClick={() => fetchStats(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-[10px] font-black text-slate-600 hover:bg-slate-50 rounded-xs uppercase tracking-widest transition-all"
                >
                    <IoReloadOutline size={12} />
                    {language === 'english' ? 'Refresh' : 'अपडेट करें'}
                </button>
            </div>

            {statsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse">
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-xs" />)}
                </div>
            ) : (
                <>
                    {/* ═══════════════════════════════════════════════════════
                        ROW 1 — Stat Cards & Pie Chart
                    ═══════════════════════════════════════════════════════ */}
                    <div className="flex flex-col lg:flex-row gap-3 items-stretch">
                        {/* Stat cards grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                            {/* Total */}
                            <button
                                onClick={() => openPopup('total', 'age')}
                                className={`relative overflow-hidden text-left group bg-linear-to-br from-indigo-500 to-indigo-600 p-3 rounded-xs ${user?.role === 'TI' ? 'cursor-default' : 'hover:shadow-lg hover:shadow-indigo-200/60 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'} transition-all duration-300`}
                            >
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                                    <FaHourglass size={40} className="text-white" />
                                </div>
                                <div className="relative z-10">
                                    <p className='text-[12px] font-black text-indigo-200 uppercase tracking-widest mb-0.5'>{language === 'english' ? 'Total' : 'कुल'}</p>
                                    <h3 className="text-2xl font-black text-white">{stats?.total ?? 0}</h3>
                                </div>
                            </button>

                            {/* Pending */}
                            <button
                                onClick={() => user?.role === 'TI' ? handleRedirection("status", "लम्बित") : openPopup('pending', 'age')}
                                className='relative overflow-hidden text-left group bg-linear-to-br from-amber-400 to-orange-500 p-3 rounded-xs hover:shadow-lg hover:shadow-orange-200/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer'
                            >
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                                    <IoMdTimer size={40} className="text-white" />
                                </div>
                                <div className="relative z-10">
                                    <p className='text-[12px] font-black text-orange-100 uppercase tracking-widest mb-0.5'>{language === 'english' ? 'Pending' : 'लम्बित'}</p>
                                    <h3 className="text-2xl font-black text-white">{stats?.statusCounts?.लम्बित ?? 0}</h3>
                                    <span className="text-[8px] font-bold text-orange-100/70 uppercase">
                                        {stats?.total ? `${Math.round(((stats?.statusCounts?.लम्बित ?? 0) / stats.total) * 100)}%` : '0%'}
                                    </span>
                                </div>
                            </button>

                            {/* Unallocated (SP/ASP/SDOP only) or placeholder */}
                            {isSPRole && (
                                <button
                                    onClick={() => openPopup('unallocated', 'list')}
                                    className='relative overflow-hidden text-left group bg-linear-to-br from-rose-500 to-red-600 p-3 rounded-xs hover:shadow-lg hover:shadow-red-200/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer'
                                >
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                                        <MdOutlineWrongLocation size={40} className="text-white" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className='text-[12px] font-black text-rose-100 uppercase tracking-widest mb-0.5'>{language === 'english' ? 'Unallocated' : 'अनाबंटित'}</p>
                                        <h3 className="text-2xl font-black text-white">{stats?.unallocatedCount ?? 0}</h3>
                                        <span className="text-[8px] font-bold text-rose-100/70 uppercase">
                                            {stats?.total ? `${Math.round(((stats?.unallocatedCount ?? 0) / stats.total) * 100)}%` : '0%'}
                                        </span>
                                    </div>
                                </button>
                            )}

                            {/* Nirakrit */}
                            <button
                                onClick={() => openPopup('nirakrit', 'age')}
                                className={`relative overflow-hidden text-left group bg-linear-to-br from-emerald-500 to-teal-600 p-3 rounded-xs ${user?.role === 'TI' ? 'cursor-default' : 'hover:shadow-lg hover:shadow-emerald-200/60 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'} transition-all duration-300`}
                            >
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                                    <IoLayersOutline size={40} className="text-white" />
                                </div>
                                <div className="relative z-10">
                                    <p className='text-[12px] font-black text-emerald-100 uppercase tracking-widest mb-0.5'>{language === 'english' ? 'Nirakrit' : 'निराकृत'}</p>
                                    <h3 className="text-2xl font-black text-white">{stats?.nirakritCount ?? 0}</h3>
                                    <span className="text-[8px] font-bold text-emerald-100/70 uppercase">
                                        {stats?.total ? `${Math.round(((stats?.nirakritCount ?? 0) / stats.total) * 100)}%` : '0%'}
                                    </span>
                                </div>
                            </button>
                        </div>

                        {/* Pie Chart */}
                        <div className='bg-white border border-slate-200 rounded-xs p-3 flex flex-col gap-1 w-full lg:w-48 shrink-0 shadow-sm'>
                            <p className='text-[12px] font-black text-slate-400 uppercase tracking-widest'>{language === 'english' ? 'Status Distribution' : 'स्थिति वितरण'}</p>
                            <div className="h-24 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} innerRadius={28} outerRadius={45} paddingAngle={4} dataKey="value" stroke="none">
                                            {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-col gap-1 border-t border-slate-50 pt-1.5">
                                {pieData.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">{d.name}</span>
                                        </div>
                                        <span className="text-[12px] font-black text-slate-700">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════════════════
                        ROW 2 — Recent + 3 Age Cards
                    ═══════════════════════════════════════════════════════ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Recent Complaints button */}
                        <button
                            onClick={() => openPopup('recent', 'list')}
                            className={`flex flex-col items-center justify-center gap-2 p-4 bg-white border-2 border-indigo-200 rounded-xs ${user?.role === 'TI' ? 'cursor-default' : 'hover:bg-indigo-50 hover:border-indigo-400 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'} transition-all duration-200 shadow-sm`}
                        >
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <IoArrowForwardCircleOutline size={22} className="text-indigo-600" />
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">{language === 'english' ? 'Recent Complaints' : 'नवीनतम शिकायतें'}</p>
                                <p className="text-[12px] text-slate-400 font-medium mt-0.5">{language === 'english' ? 'Top 5 allocated' : 'शीर्ष 5 आवंटित'}</p>
                            </div>
                        </button>

                        {/* 3 Age Cards with color coding */}
                        {ageGroups.map(ag => {
                            const count = stats?.categoryAgeStats?.total?.[ag.id] ?? 0;
                            const pct = pendingTotal ? Math.round((count / pendingTotal) * 100) : 0;
                            return (
                                <button
                                    key={ag.id}
                                    onClick={() => openPopup(`age_${ag.id}` as PopupType, 'thana')}
                                    className={`cursor-pointer flex flex-col p-4 rounded-xs border-2 ${ag.border} ${ag.bg} hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-left shadow-sm`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-[12px] font-black ${ag.textColor} uppercase tracking-widest`}>{ag.label}</span>
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ag.color }} />
                                    </div>
                                    <span className="text-2xl font-black text-slate-800 leading-none">{count}</span>
                                    <div className="mt-2 w-full h-1.5 bg-white/70 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: ag.color }} />
                                    </div>
                                    <span className={`text-[12px] font-bold ${ag.textColor} mt-1`}>{pct}% {language === 'english' ? 'of pending' : 'लम्बित का'}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* ═══════════════════════════════════════════════════════
                        ROW 3 — Thana Distribution + Status Distribution
                    ═══════════════════════════════════════════════════════ */}
                    <div className={`grid grid-cols-1 ${isSPRole ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-3 flex-1 min-h-0`}>
                        {/* Thana-wise Distribution (Informative Placeholder) */}
                        {isSPRole && stats?.thanaAgeBreakdown && (
                            <button
                                onClick={() => openPopup('thana_age', 'table')}
                                className="bg-linear-to-br from-white to-slate-50 border border-slate-200 rounded-xs shadow-sm flex flex-col p-3 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-50 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-indigo-100/50 w-full">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-sm bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200">
                                            <IoBusinessOutline size={14} className="text-white" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">
                                                {language === 'english' ? 'Thana Matrix' : 'थाना मैट्रिक्स'}
                                            </p>
                                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">
                                                {language === 'english' ? 'Top 3 Pending' : 'शीर्ष 3 लंबित'}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-[8px] font-black text-indigo-600 uppercase bg-indigo-100/50 px-2 py-0.5 rounded-xs group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        {language === 'english' ? 'Full View' : 'पूर्ण विवरण'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 w-full flex-1 mt-1">
                                    {Object.entries(stats.thanaAgeBreakdown)
                                        .sort((a, b) => {
                                            const tA = (a[1].lessThan15Days || 0) + (a[1].fifteenToThirtyDays || 0) + (a[1].moreThan30Days || 0);
                                            const tB = (b[1].lessThan15Days || 0) + (b[1].fifteenToThirtyDays || 0) + (b[1].moreThan30Days || 0);
                                            return tB - tA;
                                        })
                                        .slice(0, 3)
                                        .map(([name, ages], i) => {
                                            const total = (ages.lessThan15Days || 0) + (ages.fifteenToThirtyDays || 0) + (ages.moreThan30Days || 0);
                                            return (
                                                <div key={i} className="flex flex-col items-center justify-center p-1.5 bg-slate-50/50 border border-slate-100 rounded-xs group/item hover:bg-white hover:border-indigo-200 transition-all">
                                                    <span className="text-[8px] font-black text-slate-400 mb-0.5 uppercase tracking-tighter">#{i + 1}</span>
                                                    <span className="text-[12px] font-bold text-slate-700 truncate w-full text-center px-1 mb-1">{name}</span>
                                                    <div className="flex items-center gap-1.5 w-full justify-center">
                                                        <div className="w-10 h-1 bg-slate-200 rounded-full overflow-hidden shrink-0">
                                                            <div
                                                                className="h-full bg-linear-to-r from-indigo-400 to-indigo-600 rounded-full"
                                                                style={{ width: `${Math.min(100, (total / (stats.total || 1)) * 100 * 5)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[12px] font-black text-slate-900 tabular-nums">{total}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                                <div className="mt-3 pt-1.5 border-t border-slate-50 w-full text-center">
                                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest group-hover:text-indigo-500 transition-colors">
                                        {language === 'english' ? 'Click to explore age distribution' : 'आयु-वार विस्तार के लिए क्लिक करें'}
                                    </p>
                                </div>
                            </button>
                        )}

                        {/* Status-wise Distribution */}
                        <div className="bg-white border border-slate-200 rounded-xs shadow-sm flex flex-col overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 shrink-0">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <IoTimerOutline size={12} />
                                    {language === 'english' ? 'Status-wise Distribution' : 'स्थिति-वार वितरण'}
                                </p>
                            </div>
                            <div className="overflow-auto flex-1 p-3">
                                <div className="grid grid-cols-3 gap-2">
                                    {complaintStatusColors.map((s) => {
                                        const count = stats?.statusCounts?.[s.id] ?? 0;
                                        const pct = stats?.total ? Math.round((count / stats.total) * 100) : 0;
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={() => openPopup(`status_${s.id}` as PopupType, 'age')}
                                                className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xs hover:border-indigo-200 hover:bg-indigo-50/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-left"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.indicatorColor }} />
                                                    <span className="text-[12px] font-black text-slate-600 uppercase tracking-tight truncate">{language === 'english' ? s.labeleng : s.labelhindi}</span>
                                                </div>
                                                <div className="flex flex-col items-end ml-1 shrink-0">
                                                    <span className="text-xs font-black text-slate-800">{count}</span>
                                                    <span className="text-[8px] text-slate-400 font-bold">{pct}%</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Popups */}
            {renderPopupContent()}
        </div>
    );
}
