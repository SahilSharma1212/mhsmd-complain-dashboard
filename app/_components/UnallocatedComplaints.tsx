'use client'
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast';
import axios from 'axios';
import { useUserStore } from '../_store/userStore';
import { IoLayersOutline, IoReloadOutline, IoBusinessOutline, IoExpand, IoCloseOutline } from 'react-icons/io5';
import { MdAttachFile } from 'react-icons/md';
import { Complaint } from '../types';
import { useLanguageStore } from '../_store/languageStore';

export default function UnallocatedComplaints() {
    const { thana, user } = useUserStore();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [allocatingId, setAllocatingId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedThanas, setSelectedThanas] = useState<{ [key: string]: string }>({});
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const { language } = useLanguageStore();
    const fetchUnallocated = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/complaint-allocation?page=${page}`);
            if (response.data.success) {
                setComplaints(response.data.data);
                setTotalCount(response.data.totalCount);
            }
        } catch (error) {
            toast.error("Failed to fetch unallocated complaints");
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        if (user?.role === "SP") {
            fetchUnallocated();
        }
    }, [fetchUnallocated, user]);

    const handleAllocate = async (id: string) => {
        const targetThana = selectedThanas[id];
        if (!targetThana) {
            toast.error(language === "english" ? "Please select a Thana first" : "कृपया पहले एक थाना चुनें");
            return;
        }

        try {
            setAllocatingId(id);
            const response = await axios.patch("/api/complaint-allocation", {
                id,
                thana: targetThana
            });

            if (response.data.success) {
                toast.success(language === "english" ? "Complaint allocated successfully" : "शिकायत सफलतापूर्वक आवंटित की गई");
                // Remove from local list
                setComplaints(prev => prev.filter(c => c.id !== id));
                setTotalCount(prev => prev - 1);
            }
        } catch (error) {
            toast.error("Allocation failed");
        } finally {
            setAllocatingId(null);
        }
    };

    if (user?.role !== "SP") {
        return (
            <div className="flex items-center justify-center h-[200px] w-full bg-red-50 border border-red-100 rounded-xs">
                <p className="text-red-600 font-bold uppercase tracking-widest text-xs">{language === 'english' ? "Access Restricted to SP Only" : "केवल एसपी के लिए प्रतिबंधित"}</p>
            </div>
        );
    }

    return (
        <div className='w-full bg-white border border-slate-200 rounded-xs shadow-sm overflow-hidden flex flex-col'>
            {/* HEADER AREA */}
            <div className='p-6 bg-white border-b border-slate-100 flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                    <div className="w-10 h-10 bg-orange-50 rounded-xs flex items-center justify-center border border-orange-100">
                        <IoBusinessOutline className="text-orange-600 text-xl" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                            {language === 'english' ? "Unallocated Complaints Queue" : "अनआवंटित शिकायतें"}
                        </h2>
                        <span className='text-[10px] font-bold text-slate-600 uppercase tracking-widest'>
                            {language === 'english' ? "TOTAL • " : "कुल • "}{totalCount} {language === 'english' ? "अप्रमाणित" : "लंबित"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchUnallocated}
                        className='p-2 rounded-xs bg-slate-50 border border-slate-200 text-slate-400 hover:text-orange-600 hover:border-orange-200 hover:bg-white transition-all cursor-pointer shadow-xs group'
                        title="Refresh Queue"
                    >
                        <IoReloadOutline size={18} className="group-active:rotate-180 transition-transform duration-500" />
                    </button>
                </div>
            </div>

            <div className='p-6 flex flex-col gap-6'>
                {/* TABLE CONTAINER */}
                <div className='w-full overflow-x-auto border border-slate-200 rounded-xs bg-white shadow-xs'>
                    <table className='w-full text-left border-collapse text-sm' style={{ minWidth: '1000px' }}>
                        <thead>
                            <tr className='bg-slate-50 border-b border-slate-200'>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest'>ID</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest'>{language === 'english' ? "Complainant" : "शिकायतकर्ता"}</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center'>{language === 'english' ? "Letter Date" : "पत्र तिथि"}</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center'>{language === 'english' ? "Letter To" : "पत्र किसे"}</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest'>{language === 'english' ? "Subject & Details" : "विषय और विवरण"}</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center'>{language === 'english' ? "Docs" : "दस्तावेज़"}</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center'>{language === 'english' ? "Allocation Action" : "आवंटन कार्रवाई"}</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100'>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, idx) => (
                                    <tr key={idx} className="animate-pulse">
                                        {Array.from({ length: 7 }).map((_, i) => (
                                            <td key={i} className="px-4 py-4"><div className="h-2 bg-slate-50 rounded-full w-full"></div></td>
                                        ))}
                                    </tr>
                                ))
                            ) : complaints.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className='text-center py-16'>
                                        <div className='flex flex-col items-center gap-2 opacity-20'>
                                            <IoLayersOutline size={48} />
                                            <p className='text-sm font-bold uppercase tracking-widest'>{language === 'english' ? "No unallocated records found" : "कोई अनआवंटित रिकॉर्ड नहीं मिला"}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                complaints.map((complaint) => (
                                    <tr key={complaint.id} className='hover:bg-slate-50/50 transition-colors group'>
                                        <td className='px-4 py-4'>
                                            <span className="text-[10px] font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                #{String(complaint.id).slice(0, 8)}
                                            </span>
                                        </td>
                                        <td className='px-4 py-4'>
                                            <div className='flex flex-col'>
                                                <span className='text-xs font-bold text-slate-900 truncate max-w-[120px]'>
                                                    {complaint.complainant_name}
                                                </span>
                                                <span className='text-[10px] font-semibold text-slate-600'>{complaint.complainant_contact}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className='text-[11px] font-bold text-slate-800 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full'>
                                                {new Date(complaint.date || complaint.created_at!)
                                                    .toISOString()
                                                    .split("T")[0]}
                                            </span>
                                        </td>
                                        <td className='px-4 py-4 text-center'>
                                            <p className='mx-auto w-fit text-white bg-slate-800 px-2 py-0.5 rounded-lg uppercase tracking-tighter'>
                                                {complaint.role_addressed_to}
                                            </p>
                                        </td>
                                        <td className='px-4 py-4 min-w-[200px]'>
                                            <div className='flex items-center justify-between gap-4'>
                                                <div className='flex flex-col gap-1 flex-1 min-w-0'>
                                                    <span className='text-xs font-bold text-slate-900 truncate max-w-[250px]' title={complaint.subject}>
                                                        {complaint.subject}
                                                    </span>
                                                    <span className='text-[10px] font-medium text-slate-600 truncate max-w-[250px]' title={complaint.message}>
                                                        {complaint.message || "— No description —"}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => { setSelectedComplaint(complaint); setShowDetailsModal(true); }}
                                                    className='p-1.5 bg-slate-50 border border-slate-200 text-slate-400 hover:text-orange-600 hover:border-orange-200 hover:bg-white rounded-xs transition-all cursor-pointer shadow-xs group shrink-0'
                                                    title="View Full Details"
                                                >
                                                    <IoExpand size={14} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className='px-4 py-4 text-center'>
                                            {complaint.file_urls && complaint.file_urls.length > 0 ? (
                                                <div className='flex gap-1 justify-center'>
                                                    {complaint.file_urls.map((url, index) => (
                                                        <a key={index} href={url} target="_blank" rel="noopener noreferrer"
                                                            className="w-6 h-6 flex items-center justify-center text-blue-500 hover:text-white hover:bg-blue-600 rounded-xs transition-all border border-blue-100">
                                                            <MdAttachFile size={14} />
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-200">{language === 'english' ? "NONE" : "कोई नहीं"}</span>
                                            )}
                                        </td>
                                        <td className='px-4 py-4'>
                                            <div className='flex items-center gap-2 justify-center'>
                                                <select
                                                    value={selectedThanas[complaint.id!] || ""}
                                                    onChange={(e) => setSelectedThanas(prev => ({ ...prev, [complaint.id!]: e.target.value }))}
                                                    className='p-2 bg-slate-50 border border-slate-200 rounded-xs text-[10px] font-bold text-slate-900 outline-none focus:border-orange-500 transition-all'
                                                >
                                                    <option value="">{language === "english" ? "-- Select Thana --" : "-- थाना चुनें --"}</option>
                                                    {thana?.map((t, idx) => (
                                                        <option key={idx} value={t.name}>{t.name}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => handleAllocate(complaint.id!)}
                                                    disabled={allocatingId === complaint.id}
                                                    className='px-3 py-2 bg-orange-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xs hover:bg-orange-700 disabled:opacity-50 transition-all flex items-center gap-2'
                                                >
                                                    {allocatingId === complaint.id ? (
                                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : language === 'english' ? "Allocate" : "आवंटित करें"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION */}
                {totalCount > 20 && (
                    <div className='flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xs'>
                        <span className='text-[10px] font-bold text-slate-600 uppercase tracking-widest'>
                            Showing {complaints.length} of {totalCount} entries
                        </span>
                        <div className='flex gap-1'>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className='px-3 py-1.5 bg-white border border-slate-200 rounded-xs text-[10px] font-bold text-slate-400 hover:text-orange-600 hover:border-orange-200 disabled:opacity-30 transition-all'
                            >
                                PREV
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={page * 20 >= totalCount}
                                className='px-3 py-1.5 bg-white border border-slate-200 rounded-xs text-[10px] font-bold text-slate-400 hover:text-orange-600 hover:border-orange-200 disabled:opacity-30 transition-all'
                            >
                                NEXT
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* FULL DETAILS MODAL */}
            {showDetailsModal && selectedComplaint && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xs border border-slate-200 shadow-2xl w-full max-w-2xl scale-in-center overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-50 rounded-xs flex items-center justify-center border border-orange-100">
                                    <IoBusinessOutline className="text-orange-600 text-xl" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{language === 'english' ? "Complaint Detailed View" : "शिकायत का विस्तृत विवरण"}</h2>
                                    <span className="text-[10px] font-mono text-slate-500">#{selectedComplaint.id}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="p-2 hover:bg-slate-50 rounded-xs text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <IoCloseOutline size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'english' ? "Complainant Name" : "शिकायतकर्ता का नाम"}</p>
                                    <p className="text-sm font-bold text-slate-900 bg-slate-50 p-2 rounded-xs border border-slate-100 italic">
                                        {selectedComplaint.complainant_name}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'english' ? "Contact Number" : "संपर्क नंबर"}</p>
                                    <p className="text-sm font-bold text-slate-900 bg-slate-50 p-2 rounded-xs border border-slate-100">
                                        {selectedComplaint.complainant_contact}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'english' ? "Letter Date" : "पत्र दिनांक"}</p>
                                    <p className="text-sm font-bold text-slate-900 bg-slate-50 p-2 rounded-xs border border-slate-100">
                                        {new Date(selectedComplaint.date || selectedComplaint.created_at!).toLocaleDateString('en-IN', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'english' ? "Addressed To" : "को संबोधित"}</p>
                                    <span className="inline-block px-3 py-1 bg-slate-800 text-white text-sm font-bold uppercase tracking-widest">
                                        {selectedComplaint.role_addressed_to}
                                    </span>
                                </div>
                            </div>

                            {/* Subject Section */}
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'english' ? "Subject Reference" : "विषय संदर्भ"}</p>
                                <div className="bg-orange-50/30 border border-orange-100 p-4 rounded-xs">
                                    <p className="text-sm font-bold text-slate-800 leading-relaxed">
                                        {selectedComplaint.subject}
                                    </p>
                                </div>
                            </div>

                            {/* Message Section */}
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'english' ? "Complaint Message" : "शिकायत संदेश"}</p>
                                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xs min-h-[120px]">
                                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {selectedComplaint.message || "— No detailed message provided —"}
                                    </p>
                                </div>
                            </div>

                            {/* Complainant Details */}
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'english' ? "Complainant Details" : "शिकायतकर्ता का विवरण"}</p>
                                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xs min-h-[120px]">
                                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {selectedComplaint.complainant_details || "— No detailed message provided —"}
                                    </p>
                                </div>
                            </div>

                            {/* Files Section */}
                            {selectedComplaint.file_urls && selectedComplaint.file_urls.length > 0 && (
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'english' ? "Attached Documentation" : "संलग्न दस्तावेज़"}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedComplaint.file_urls.map((url, idx) => (
                                            <a
                                                key={idx}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xs text-[10px] font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-xs"
                                            >
                                                <MdAttachFile size={16} className="text-blue-500" />
                                                {language === 'english' ? "VIEW DOCUMENT" : "दस्तावेज़ देखें"} {idx + 1}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 sticky bottom-0">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="px-6 py-2 bg-white border border-slate-200 rounded-xs text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xs"
                            >
                                {language === 'english' ? "Dismiss" : "खारिज"}
                            </button>
                            <div className="px-6 py-2 bg-orange-600 rounded-xs text-[10px] font-bold text-white uppercase tracking-widest opacity-50 cursor-not-allowed">
                                {language === 'english' ? "Decision Required Below" : "नीचे निर्णय आवश्यक है"}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
