'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast';
import axios from 'axios';
import { IoDocumentTextOutline, IoReloadOutline, IoArrowForwardCircleOutline } from 'react-icons/io5';
import { useUserStore } from '../../_store/userStore';
import { useLanguageStore } from '../../_store/languageStore';
import Link from 'next/link';

interface SuchnaItem {
    id: number;
    created_at: string;
    suchna: string;
    complainant_name: string;
    mobile_number: string;
    related_complaint: number | null;
}

export default function SuchanasPage() {
    const { language } = useLanguageStore();
    const { user } = useUserStore();
    const [suchnaList, setSuchnaList] = useState<SuchnaItem[]>([]);
    const [suchnaLoading, setSuchnaLoading] = useState(false);

    const fetchSuchna = async () => {
        try {
            setSuchnaLoading(true);
            const response = await axios.get("/api/suchna");
            if (response.data.success) {
                setSuchnaList(response.data.data);
            }
        } catch {
            toast.error(language === 'english' ? "Failed to load suchna records" : "सूचना रिकॉर्ड लोड करने में विफल");
        } finally {
            setSuchnaLoading(false);
        }
    };

    useEffect(() => {
        if (user?.role === "SP") {
            fetchSuchna();
        }
    }, [user]);

    if (user?.role !== "SP") {
        return (
            <div className="flex items-center justify-center h-[200px] w-full bg-red-50 border border-red-100 rounded-xs">
                <p className="text-red-600 font-black uppercase tracking-widest text-[10px]">
                    {language === "english" ? "Access Restricted to SP Only" : "केवल एसपी के लिए प्रतिबंधित पहुंच"}
                </p>
            </div>
        );
    }

    return (
        <div className='flex flex-col gap-3 p-4 h-full overflow-hidden animate-in fade-in duration-500'>
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                    <h1 className='text-lg font-black text-slate-900 tracking-tight flex items-center gap-2'>
                        <IoDocumentTextOutline className="text-indigo-600" />
                        {language === "english" ? "Suchna Records" : "सूचना रिकॉर्ड"}
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {language === "english" ? "List of all suchnas received" : "प्राप्त सभी सूचनाओं की सूची"}
                    </p>
                </div>
                <button
                    onClick={fetchSuchna}
                    disabled={suchnaLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-[10px] font-black text-slate-600 hover:bg-slate-50 rounded-xs uppercase tracking-widest transition-all"
                >
                    <IoReloadOutline size={12} className={suchnaLoading ? 'animate-spin' : ''} />
                    {language === 'english' ? 'Refresh' : 'अपडेट करें'}
                </button>
            </div>

            {/* ── Suchna Info Card ────────────────────────────────────────── */}
            <div className='bg-white border border-slate-200 rounded-xs shadow-sm overflow-hidden flex-1 flex flex-col'>
                <div className='px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0'>
                    <div className="flex flex-col">
                        <h2 className='text-[11px] font-black text-slate-800 uppercase tracking-widest'>
                            {language === "english" ? "Recent Suchna" : "हाल के सूचना"}
                        </h2>
                        <span className='text-[9px] font-bold text-slate-400 uppercase tracking-widest'>
                            {language === "english" ? `${suchnaList.length} records found` : `${suchnaList.length} रिकॉर्ड मिले`}
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    {suchnaLoading ? (
                        <div className="p-5 space-y-3 animate-pulse">
                            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xs" />)}
                        </div>
                    ) : suchnaList.length === 0 ? (
                        <div className="flex items-center justify-center py-24">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {language === 'english' ? 'No suchna records found' : 'कोई सूचना रिकॉर्ड नहीं मिला'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto min-w-full">
                            <table className="w-full border-collapse text-[11px]">
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="py-3 px-4 text-left font-black text-slate-500 uppercase tracking-wider">#</th>
                                        <th className="py-3 px-4 text-left font-black text-slate-500 uppercase tracking-wider">{language === 'english' ? 'Suchna Detail' : 'सूचना विवरण'}</th>
                                        <th className="py-3 px-4 text-left font-black text-slate-500 uppercase tracking-wider">{language === 'english' ? 'Complainant' : 'शिकायतकर्ता'}</th>
                                        <th className="py-3 px-4 text-left font-black text-slate-500 uppercase tracking-wider">{language === 'english' ? 'Mobile' : 'मोबाइल'}</th>
                                        <th className="py-3 px-4 text-left font-black text-slate-500 uppercase tracking-wider">{language === 'english' ? 'Link' : 'लिंक'}</th>
                                        <th className="py-3 px-4 text-left font-black text-slate-500 uppercase tracking-wider">{language === 'english' ? 'Created At' : 'दिनांक'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {suchnaList.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-4 font-bold text-slate-400 tabular-nums">{idx + 1}</td>
                                            <td className="py-3 px-4 font-bold text-slate-800 max-w-[400px]">
                                                <p className="whitespace-pre-wrap">{item.suchna || '—'}</p>
                                            </td>
                                            <td className="py-3 px-4 font-bold text-slate-700">{item.complainant_name || '—'}</td>
                                            <td className="py-3 px-4 font-bold text-slate-600 tabular-nums font-mono">{item.mobile_number || '—'}</td>
                                            <td className="py-3 px-4">
                                                {item.related_complaint ? (
                                                    <Link href={`/logs/${item.related_complaint}`}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 font-black text-[10px] rounded-xs hover:bg-indigo-100 transition-all uppercase tracking-wider border border-indigo-100 group">
                                                        #{item.related_complaint}
                                                        <IoArrowForwardCircleOutline className="group-hover:translate-x-0.5 transition-transform" />
                                                    </Link>
                                                ) : (
                                                    <span className="text-slate-300 font-bold">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 font-bold text-slate-500 whitespace-nowrap tabular-nums">
                                                {new Date(item.created_at).toLocaleString('en-IN', { 
                                                    day: '2-digit', 
                                                    month: 'short', 
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
