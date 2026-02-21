'use client'
import { IoMdSearch } from 'react-icons/io'
import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast';
import axios from 'axios';
import { useUserStore } from '../_store/userStore';
import { FcRefresh } from 'react-icons/fc';
import { MdNavigateNext, MdNavigateBefore, MdDeleteOutline, MdAttachFile } from 'react-icons/md';
import { IoLayersOutline, IoFilterOutline, IoReloadOutline, IoTrashOutline } from 'react-icons/io5';
import { CgNotes } from 'react-icons/cg';
import Link from 'next/link';

export default function ManageComplaints() {
    const { user, complaints, setComplaints, setCurrentlyViewingComplaint } = useUserStore();

    // ─── Search & Pagination state ───
    const [filterAttribute, setFilterAttribute] = useState("");
    const [filterValue, setFilterValue] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchLoading, setSearchLoading] = useState(false);
    const pageSize = 20;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const fetchComplaints = useCallback(async (page = 1, filter = "", value = "") => {
        setSearchLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            if (filter && value) {
                params.set("filter", filter);
                params.set("value", value);
            }
            const response = await axios.get(`/api/complaint?${params.toString()}`);
            if (response.data && response.data.success) {
                const complaintData = response.data.data;
                if (Array.isArray(complaintData)) {
                    setComplaints(complaintData);
                } else {
                    setComplaints([complaintData]);
                }
                setTotalCount(response.data.totalCount ?? 0);
                setCurrentPage(page);
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const statusCode = error.response?.status;
                if (statusCode === 401) {
                    toast.error("Session expired. Please log in again.");
                } else {
                    toast.error("Failed to fetch complaints. Please try again.");
                }
            } else {
                toast.error("Network error. Check your connection.");
            }
            console.error(error);
        } finally {
            setSearchLoading(false);
        }
    }, [setComplaints]);

    // Initial load
    useEffect(() => {
        fetchComplaints(1);
    }, [fetchComplaints]);

    // Reset filterValue when changing filterAttribute
    useEffect(() => {
        setFilterValue("");
    }, [filterAttribute]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (filterAttribute && !filterValue) {
            toast.error("Please enter a value for the selected filter");
            return;
        }
        fetchComplaints(1, filterAttribute, filterValue);
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        fetchComplaints(page, filterAttribute, filterValue);
    };

    const handleRefresh = () => {
        setFilterAttribute("");
        setFilterValue("");
        setCurrentPage(1);
        fetchComplaints(1);
    };

    const complaintStatusColors: Record<string, { bg: string, text: string }> = {
        "PENDING": { bg: "#0000ff20", text: "#0000ff" },
        "FIR": { bg: "#ff5e0020", text: "#ff5e00" },
        "NON FIR": { bg: "#7a00b320", text: "#7a00b3" },
        "FILE": { bg: "#99999920", text: "#000" },
        "NO CONTACT": { bg: "#ff000020", text: "#ff0000" },
        "SOLVED": { bg: "#00ff0020", text: "#007d21" },
    }

    const [activeComplaintId, setActiveComplaintId] = useState<string | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Close popup on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                setActiveComplaintId(null);
                setPopupPosition(null);
            }
        };
        if (activeComplaintId) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeComplaintId]);

    const handleStatusChange = async (id: string, status: string) => {
        if (updatingStatusId) return;
        setUpdatingStatusId(id);
        try {
            const response = await axios.patch("/api/complaint", { id, status });
            if (response.data.success) {
                toast.success("Status updated");
                if (complaints) {
                    const updatedComplaints = complaints.map((c) =>
                        c.id === id ? { ...c, status: status } : c
                    );
                    setComplaints(updatedComplaints);
                }
                setActiveComplaintId(null);
                setPopupPosition(null);
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const statusCode = error.response?.status;
                const message = error.response?.data?.message;

                if (statusCode === 401) {
                    toast.error("Session expired. Please log in again.");
                } else if (statusCode === 403) {
                    toast.error(
                        message === "You are not authorised for this complaint"
                            ? "You don't have access to this complaint."
                            : "Action not allowed."
                    );
                } else if (statusCode === 404) {
                    toast.error("Complaint not found.");
                } else if (statusCode === 400) {
                    toast.error("Invalid request. Check the status value.");
                } else {
                    toast.error("Something went wrong. Try again.");
                }
            } else {
                toast.error("Network error. Check your connection.");
            }
            console.error(error);
        } finally {
            setUpdatingStatusId(null);
        }
    }

    const handleDeleteComplaint = async (id: string) => {
        setDeletingId(id);
        try {
            const response = await axios.delete(`/api/complaint?id=${id}`);
            if (response.data.success) {
                toast.success("Complaint deleted successfully");
                if (complaints) {
                    setComplaints(complaints.filter((c) => c.id !== id));
                }
                setShowDeleteConfirm(null);
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Failed to delete complaint");
            } else {
                toast.error("Failed to delete complaint");
            }
            console.error(error);
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className='w-full bg-white rounded-xs border border-slate-200 shadow-sm overflow-hidden flex flex-col'>
            {/* Header Section */}
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-white">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-xs flex items-center justify-center border border-blue-100">
                        <IoLayersOutline className="text-blue-600 text-lg" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            Official Complaints Registry
                        </h2>
                        <span className='text-[10px] font-bold text-slate-400 uppercase tracking-widest'>
                            Central Database • {totalCount} total entries
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        className='p-2 rounded-xs bg-slate-50 border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-white transition-all cursor-pointer shadow-xs group'
                        title="Refresh Registry"
                    >
                        <IoReloadOutline size={18} className="group-active:rotate-180 transition-transform duration-500" />
                    </button>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold tracking-tight uppercase">
                        Admin View
                    </span>
                </div>
            </div>

            <div className='p-6 flex flex-col gap-6'>
                {/* SEARCH FORM */}
                <form onSubmit={handleSearch} className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end justify-start gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xs'>
                    <div className='flex flex-col gap-1.5 w-full sm:w-auto'>
                        <label className='text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5'>
                            <IoFilterOutline className="text-blue-500" />
                            Filter By
                        </label>
                        <select
                            value={filterAttribute}
                            onChange={(e) => setFilterAttribute(e.target.value)}
                            className='w-full sm:w-[200px] px-3 py-2 bg-white border border-slate-200 rounded-xs text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all'
                        >
                            <option value="">-- Select Attribute --</option>
                            <option value="status">Status</option>
                            <option value="complainant_name">Name of Complainer</option>
                            <option value="role_addressed_to">Addressed To</option>
                        </select>
                    </div>

                    <div className='flex flex-col gap-1.5 flex-1 min-w-0 sm:min-w-[300px]'>
                        <label className='text-[11px] font-bold text-slate-400 uppercase tracking-wider'>Search Value</label>
                        <div className='flex group'>
                            {filterAttribute === "status" ? (
                                <select
                                    value={filterValue}
                                    onChange={(e) => setFilterValue(e.target.value)}
                                    className='flex-1 px-4 py-2 bg-white border border-slate-200 rounded-l-xs text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all min-w-0'
                                >
                                    <option value="">-- Select Status --</option>
                                    <option value="PENDING">PENDING</option>
                                    <option value="FIR">FIR</option>
                                    <option value="NON FIR">NON FIR</option>
                                    <option value="NO CONTACT">NO CONTACT</option>
                                    <option value="FILE">FILE</option>
                                    <option value="SOLVED">SOLVED</option>
                                </select>
                            ) : filterAttribute === "role_addressed_to" ? (
                                <select
                                    value={filterValue}
                                    onChange={(e) => setFilterValue(e.target.value)}
                                    className='flex-1 px-4 py-2 bg-white border border-slate-200 rounded-l-xs text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all min-w-0'
                                >
                                    <option value="">-- Select Role --</option>
                                    <option value="SP">SP</option>
                                    <option value="TI">TI</option>
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={filterValue}
                                    onChange={(e) => setFilterValue(e.target.value)}
                                    className='flex-1 px-4 py-2 bg-white border border-slate-200 rounded-l-xs text-xs font-semibold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all min-w-0'
                                    placeholder={filterAttribute ? 'Type to search records...' : 'Select an attribute first'}
                                    disabled={!filterAttribute}
                                />
                            )}
                            <button
                                type="submit"
                                disabled={searchLoading}
                                className='bg-blue-600 text-white px-5 rounded-r-xs border border-blue-600 hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0'
                            >
                                {searchLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <IoMdSearch size={20} />
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                {/* TABLE CONTAINER */}
                <div className='w-full overflow-x-auto border border-slate-200 rounded-xs bg-white shadow-xs'>
                    <table className='w-full text-left border-collapse text-sm' style={{ minWidth: '1000px' }}>
                        <thead>
                            <tr className='bg-slate-50 border-b border-slate-200'>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest'>ID</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest'>Complainant</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center'>Date</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center'>Target</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest'>Jurisdiction</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest'>Subject & Details</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center'>Source</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center'>Files</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center'>Status</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center'>Actions</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100'>
                            {searchLoading ? (
                                Array.from({ length: 8 }).map((_, idx) => (
                                    <tr key={idx} className="animate-pulse">
                                        {Array.from({ length: 10 }).map((_, i) => (
                                            <td key={i} className="px-4 py-4"><div className="h-2 bg-slate-50 rounded-full w-full"></div></td>
                                        ))}
                                    </tr>
                                ))
                            ) : complaints?.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className='text-center py-16'>
                                        <div className='flex flex-col items-center gap-2 opacity-20'>
                                            <IoLayersOutline size={48} />
                                            <p className='text-sm font-bold uppercase tracking-widest'>No records found in database</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                complaints?.map((complaint) => (
                                    <tr key={complaint.id} className='hover:bg-slate-50/50 transition-colors group'>
                                        {/* ID */}
                                        <td className='px-4 py-4'>
                                            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100" title={complaint.id}>
                                                #{String(complaint.id).slice(0, 8)}
                                            </span>
                                        </td>
                                        {/* Complainer */}
                                        <td className='px-4 py-4'>
                                            <div className='flex flex-col'>
                                                <span className='text-xs font-bold text-slate-700 truncate max-w-[120px]' title={complaint.complainant_name}>
                                                    {complaint.complainant_name}
                                                </span>
                                                <span className='text-[10px] font-semibold text-slate-400'>{complaint.complainant_contact}</span>
                                            </div>
                                        </td>
                                        {/* Date */}
                                        <td className="px-4 py-4 text-center">
                                            <span className='text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full'>
                                                {new Date(complaint.date || complaint.created_at!)
                                                    .toISOString()
                                                    .split("T")[0]}
                                            </span>
                                        </td>
                                        {/* Addressed To */}
                                        <td className='px-4 py-4 text-center'>
                                            <span className='text-[10px] font-bold text-white bg-slate-800 px-2 py-0.5 rounded-full uppercase tracking-tighter'>
                                                {complaint.role_addressed_to}
                                            </span>
                                        </td>
                                        {/* Thana */}
                                        <td className='px-4 py-4'>
                                            <span className='text-xs font-bold text-slate-500 truncate max-w-[100px] block' title={complaint.allocated_thana}>
                                                {complaint.allocated_thana}
                                            </span>
                                        </td>
                                        {/* Subject & Description */}
                                        <td className='px-4 py-4 min-w-[200px]'>
                                            <div className='flex flex-col gap-1'>
                                                <span className='text-xs font-bold text-slate-700 max-w-[200px] truncate hover:max-w-none hover:whitespace-normal transition-all duration-300 cursor-help' title={complaint.subject}>
                                                    {complaint.subject}
                                                </span>
                                                <span className='text-[10px] font-medium text-slate-400 max-w-[200px] truncate hover:max-w-none hover:whitespace-normal transition-all duration-300 cursor-help' title={complaint.message}>
                                                    {complaint.message || "— No detailed description provided —"}
                                                </span>
                                            </div>
                                        </td>
                                        {/* Source */}
                                        <td className='px-4 py-4 text-center'>
                                            <span className='text-[10px] font-bold text-slate-400 uppercase tracking-widest'>
                                                {complaint.source || "System"}
                                            </span>
                                        </td>
                                        {/* Docs */}
                                        <td className='px-4 py-4 text-center'>
                                            {complaint.file_urls && complaint.file_urls.length > 0 ? (
                                                <div className='flex gap-1 justify-center'>
                                                    {complaint.file_urls.map((url, index) => (
                                                        <a key={index} href={url} target="_blank" rel="noopener noreferrer"
                                                            className="w-6 h-6 flex items-center justify-center text-blue-500 hover:text-white hover:bg-blue-600 rounded-xs transition-all border border-blue-100"
                                                            title={`View Doc ${index + 1}`}>
                                                            <MdAttachFile size={14} />
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-200">NONE</span>
                                            )}
                                        </td>
                                        {/* Status */}
                                        <td className='px-4 py-4 text-center'>
                                            <div ref={activeComplaintId === complaint.id ? popupRef : undefined} className="inline-block relative">
                                                <button
                                                    onClick={(e) => {
                                                        if (activeComplaintId === complaint.id) {
                                                            setActiveComplaintId(null); setPopupPosition(null);
                                                        } else {
                                                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                            setPopupPosition({ top: rect.top, left: rect.left + rect.width / 2 });
                                                            setActiveComplaintId(complaint.id || null);
                                                        }
                                                    }}
                                                    className="inline-flex items-center px-3 py-1 rounded-xs text-[10px] font-bold cursor-pointer whitespace-nowrap uppercase tracking-wider shadow-xs hover:contrast-125 transition-all"
                                                    style={{
                                                        color: complaintStatusColors[complaint.status]?.text,
                                                        backgroundColor: complaintStatusColors[complaint.status]?.bg,
                                                        border: `1px solid ${complaintStatusColors[complaint.status]?.text}20`
                                                    }}>
                                                    {updatingStatusId === complaint.id ? (
                                                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
                                                    ) : null}
                                                    {complaint.status}
                                                </button>
                                                {activeComplaintId === complaint.id && popupPosition && (
                                                    <div className='fixed p-1.5 flex flex-col gap-1 bg-white/95 backdrop-blur-md shadow-2xl rounded-xs border border-slate-200 z-50 w-36 scale-in-center'
                                                        style={{ top: popupPosition.top - 8, left: popupPosition.left, transform: 'translate(-50%, -100%)' }}>
                                                        <p className='text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center py-1 border-b border-slate-100 mb-1'>Update Status</p>
                                                        {Object.keys(complaintStatusColors).map((status) => (
                                                            <button key={status} disabled={updatingStatusId !== null}
                                                                onClick={(e) => { e.stopPropagation(); handleStatusChange(complaint.id!, status); }}
                                                                className='w-full px-3 py-1.5 text-[10px] font-bold rounded-xs transition-all text-center uppercase tracking-tighter hover:scale-[1.02] active:scale-[0.98]'
                                                                style={{ color: complaintStatusColors[status].text, backgroundColor: complaintStatusColors[status].bg }}>
                                                                {status}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        {/* Actions */}
                                        <td className='px-4 py-4'>
                                            <div className='flex items-center justify-center gap-1 transition-opacity'>
                                                <Link href={`/logs/${complaint.id}`}
                                                    onClick={() => setCurrentlyViewingComplaint(complaint)}
                                                    className='w-8 h-8 flex items-center justify-center text-blue-500 hover:text-white hover:bg-blue-600 rounded-xs transition-all border border-blue-100 bg-blue-50 shadow-xs'
                                                    title="View Detailed Logs">
                                                    <CgNotes size={16} />
                                                </Link>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(complaint.id!); }}
                                                    className='w-8 h-8 flex items-center justify-center text-red-500 hover:text-white hover:bg-red-600 rounded-xs transition-all border border-red-100 bg-red-50 shadow-xs'
                                                    title="Permanently Delete">
                                                    <IoTrashOutline size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ─── Pagination Controls ─── */}
                {totalPages > 1 && (
                    <div className='flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-6 px-2 gap-4'>
                        <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest'>
                            Showing <span className='text-slate-700'>page {currentPage}</span> of {totalPages}
                        </p>
                        <div className='flex flex-wrap justify-center items-center gap-2'>
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1 || searchLoading}
                                className='flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xs border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs'
                            >
                                <MdNavigateBefore size={16} /> Prev
                            </button>

                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => {
                                        if (p === 1 || p === totalPages) return true;
                                        if (Math.abs(p - currentPage) <= 1) return true;
                                        return false;
                                    })
                                    .reduce<(number | string)[]>((acc, p, idx, arr) => {
                                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((item, idx) =>
                                        typeof item === 'string' ? (
                                            <span key={`ellipsis-${idx}`} className='w-8 h-8 flex items-center justify-center text-slate-300'>…</span>
                                        ) : (
                                            <button
                                                key={item}
                                                onClick={() => handlePageChange(item)}
                                                disabled={searchLoading}
                                                className={`w-8 h-8 flex items-center justify-center text-[10px] font-bold rounded-xs border transition-all cursor-pointer shadow-xs ${currentPage === item
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {item}
                                            </button>
                                        )
                                    )}
                            </div>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages || searchLoading}
                                className='flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xs border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs'
                            >
                                Next <MdNavigateNext size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* DELETE CONFIRMATION MODAL */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xs border border-slate-200 shadow-2xl p-6 max-w-sm w-full scale-in-center overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-50 rounded-xs flex items-center justify-center border border-red-100">
                                <IoTrashOutline className="text-red-600 text-xl" />
                            </div>
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Authorize Deletion?</h2>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 leading-relaxed mb-6">
                            This action will permanently remove the complaint record from the system database. This process is irreversible and all associated data will be purged.
                        </p>
                        <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50 rounded-xs transition-colors"
                            >
                                Abort
                            </button>
                            <button
                                onClick={() => handleDeleteComplaint(showDeleteConfirm)}
                                disabled={deletingId !== null}
                                className="px-5 py-2 text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 uppercase tracking-widest rounded-xs transition-all shadow-lg shadow-red-500/20 disabled:opacity-70 flex items-center gap-2"
                            >
                                {deletingId ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Confirm Purge'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
