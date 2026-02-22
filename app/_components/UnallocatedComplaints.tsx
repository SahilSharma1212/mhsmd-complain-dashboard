'use client'
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast';
import axios from 'axios';
import { useUserStore } from '../_store/userStore';
import { IoLayersOutline, IoReloadOutline, IoBusinessOutline } from 'react-icons/io5';
import { MdAttachFile } from 'react-icons/md';
import { Complaint } from '../types';

export default function UnallocatedComplaints() {
    const { thana, user } = useUserStore();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [allocatingId, setAllocatingId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedThanas, setSelectedThanas] = useState<{ [key: string]: string }>({});

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
            toast.error("Please select a Thana first");
            return;
        }

        try {
            setAllocatingId(id);
            const response = await axios.patch("/api/complaint-allocation", {
                id,
                thana: targetThana
            });

            if (response.data.success) {
                toast.success("Complaint allocated successfully");
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
                <p className="text-red-600 font-bold uppercase tracking-widest text-xs">Access Restricted to SP Only</p>
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
                            Unallocated Complaints Queue
                        </h2>
                        <span className='text-[10px] font-bold text-slate-600 uppercase tracking-widest'>
                            Needs Jurisdiction Assignment • {totalCount} pending
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
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest'>Complainant</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center'>Letter Date</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center'>Letter To</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest'>Subject & Details</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center'>Docs</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center'>Allocation Action</th>
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
                                            <p className='text-sm font-bold uppercase tracking-widest'>No unallocated records found</p>
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
                                            <span className='text-[10px] font-bold text-white bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-tighter'>
                                                {complaint.role_addressed_to}
                                            </span>
                                        </td>
                                        <td className='px-4 py-4 min-w-[200px]'>
                                            <div className='flex flex-col gap-1'>
                                                <span className='text-xs font-bold text-slate-900 truncate max-w-[250px]' title={complaint.subject}>
                                                    {complaint.subject}
                                                </span>
                                                <span className='text-[10px] font-medium text-slate-600 truncate max-w-[250px]' title={complaint.message}>
                                                    {complaint.message || "— No description —"}
                                                </span>
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
                                                <span className="text-[10px] font-bold text-slate-200">NONE</span>
                                            )}
                                        </td>
                                        <td className='px-4 py-4'>
                                            <div className='flex items-center gap-2 justify-center'>
                                                <select
                                                    value={selectedThanas[complaint.id!] || ""}
                                                    onChange={(e) => setSelectedThanas(prev => ({ ...prev, [complaint.id!]: e.target.value }))}
                                                    className='p-2 bg-slate-50 border border-slate-200 rounded-xs text-[10px] font-bold text-slate-900 outline-none focus:border-orange-500 transition-all'
                                                >
                                                    <option value="">-- Select Thana --</option>
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
                                                    ) : "Allocate"}
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
        </div>
    )
}
