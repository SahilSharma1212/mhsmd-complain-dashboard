'use client'
import { IoMdSearch } from 'react-icons/io'
import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast';
import axios from 'axios';
import { useUserStore } from '../_store/userStore';
import { FcRefresh } from 'react-icons/fc';
import { MdNavigateNext, MdNavigateBefore, MdDeleteOutline, MdAttachFile } from 'react-icons/md';
import { CgNotes } from 'react-icons/cg';
import Link from 'next/link';
import { IoTrash } from 'react-icons/io5';

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
        <div className='w-full px-3 bg-white rounded-lg p-2 flex flex-col gap-2 shadow-sm'>
            <h1 className='text-xl font-bold text-slate-900 tracking-tight py-3 flex items-center justify-start gap-3'>
                Complaints Table
                <span className='text-sm font-normal text-gray-400'>({totalCount} total)</span>
                <button onClick={handleRefresh} className='cursor-pointer border p-1 rounded-md hover:bg-blue-500/10 border-blue-500'><FcRefresh size={20} /></button>
            </h1>

            {/* SEARCH FORM */}
            <form onSubmit={handleSearch} className='py-3 flex flex-wrap items-end justify-start gap-3'>
                <div className='flex flex-col gap-1'>
                    <label className='text-xs font-medium text-gray-500'>Filter By</label>
                    <select
                        value={filterAttribute}
                        onChange={(e) => setFilterAttribute(e.target.value)}
                        className='p-2 border border-gray-300 focus:border-gray-500 focus:outline-none text-sm min-w-[180px]'
                    >
                        <option value="">-- Select Filter --</option>
                        <option value="status">Status</option>
                        <option value="complainant_name">Name of Complainer</option>
                        <option value="role_addressed_to">Addressed To</option>
                    </select>
                </div>

                <div className='flex flex-col gap-1'>
                    <label className='text-xs font-medium text-gray-500'>Value</label>
                    <div className='flex'>
                        {filterAttribute === "status" ? (
                            <select
                                value={filterValue}
                                onChange={(e) => setFilterValue(e.target.value)}
                                className='p-2 rounded-r-none border border-gray-300 focus:border-gray-500 focus:outline-none text-sm min-w-[180px]'
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
                                className='p-2 rounded-r-none border border-gray-300 focus:border-gray-500 focus:outline-none text-sm min-w-[180px]'
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
                                className='p-2 rounded-r-none border border-gray-300 focus:border-gray-500 focus:outline-none text-sm min-w-[180px]'
                                placeholder={filterAttribute ? 'Type to search...' : 'Select a filter first'}
                                disabled={!filterAttribute}
                            />
                        )}
                        <button
                            type="submit"
                            disabled={searchLoading}
                            className='bg-blue-500 text-white p-2 rounded-l-none border border-blue-500 hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50'
                        >
                            {searchLoading ? (
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : (
                                <IoMdSearch size={20} />
                            )}
                        </button>
                    </div>
                </div>
            </form>

            <div className='w-full overflow-x-auto border border-slate-200 rounded-sm shadow-sm'>
                <table className='w-full text-left border-collapse text-sm' style={{ minWidth: '900px' }}>
                    <thead>
                        <tr className='bg-slate-50 border-b border-slate-200'>
                            <th className='px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap'>ID</th>
                            <th className='px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap'>Complainer</th>
                            <th className='px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap'>Date</th>
                            <th className='px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap'>To</th>
                            <th className='px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap'>Thana</th>
                            <th className='px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide'>Subject</th>
                            <th className='px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide'>Description</th>
                            <th className='px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide'>Source</th>
                            <th className='px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap text-center'>Docs</th>
                            <th className='px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap text-center'>Status</th>
                            <th className='px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap text-center'>Del</th>
                            <th className='px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap text-center'>Logs</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-100'>
                        {searchLoading ? (
                            Array.from({ length: 8 }).map((_, idx) => (
                                <tr key={idx} className="animate-pulse">
                                    {Array.from({ length: 11 }).map((_, i) => (
                                        <td key={i} className="px-3 py-3"><div className="h-3 bg-slate-100 rounded w-full"></div></td>
                                    ))}
                                </tr>
                            ))
                        ) : complaints?.length === 0 ? (
                            <tr>
                                <td colSpan={11} className='text-center py-10 text-gray-400 text-sm'>No complaints found</td>
                            </tr>
                        ) : (
                            complaints?.map((complaint) => (
                                <tr key={complaint.id} className='hover:bg-gray-50 transition-colors'>
                                    {/* ID */}
                                    <td className='px-3 py-2 text-xs text-gray-500 font-mono whitespace-nowrap'>
                                        <span title={complaint.id}>{String(complaint.id).slice(0, 8)}…</span>
                                    </td>
                                    {/* Complainer — name + number stacked */}
                                    <td className='px-3 py-2 whitespace-nowrap'>
                                        <div className='text-sm font-medium text-gray-800 max-w-[120px] truncate' title={complaint.complainant_name}>
                                            {complaint.complainant_name}
                                        </div>
                                        <div className='text-xs text-gray-400'>{complaint.complainant_contact}</div>
                                    </td>
                                    {/* Date */}
                                    <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">
                                        {new Date(complaint.date || complaint.created_at!)
                                            .toISOString()
                                            .split("T")[0]}
                                    </td>
                                    {/* Addressed To */}
                                    <td className='px-3 py-2 text-xs font-semibold text-gray-700 whitespace-nowrap'>{complaint.role_addressed_to}</td>
                                    {/* Thana */}
                                    <td className='px-3 py-2 text-xs text-gray-700 whitespace-nowrap max-w-[100px] truncate' title={complaint.allocated_thana}>
                                        {complaint.allocated_thana}
                                    </td>
                                    {/* Subject */}
                                    <td className='px-3 py-2'>
                                        <div className='text-xs text-gray-700 max-w-[140px] truncate' title={complaint.subject}>
                                            {complaint.subject}
                                        </div>
                                    </td>
                                    {/* Description */}
                                    <td className='px-3 py-2'>
                                        <div className='text-xs text-gray-400 max-w-[160px] truncate' title={complaint.message}>
                                            {complaint.message || <span className='italic'>—</span>}
                                        </div>
                                    </td>
                                    <td className='px-3 py-2 text-xs text-gray-700 whitespace-nowrap max-w-[100px] truncate' title={complaint.source}>
                                        {complaint.source}
                                    </td>
                                    {/* Docs */}
                                    <td className='px-3 py-2 text-center'>
                                        {complaint.file_urls && complaint.file_urls.length > 0 ? (
                                            <div className='flex gap-1 justify-center flex-wrap'>
                                                {complaint.file_urls.map((url, index) => (
                                                    <a key={index} href={url} target="_blank" rel="noopener noreferrer"
                                                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-colors"
                                                        title={`Document ${index + 1}`}
                                                        onClick={(e) => e.stopPropagation()}>
                                                        <MdAttachFile size={16} />
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-gray-300 text-xs">NONE</span>
                                        )}
                                    </td>
                                    {/* Status */}
                                    <td className='px-3 py-2 text-center'>
                                        <div ref={activeComplaintId === complaint.id ? popupRef : undefined} className="inline-block relative">
                                            <div
                                                onClick={(e) => {
                                                    if (activeComplaintId === complaint.id) {
                                                        setActiveComplaintId(null); setPopupPosition(null);
                                                    } else {
                                                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                        setPopupPosition({ top: rect.top, left: rect.left + rect.width / 2 });
                                                        setActiveComplaintId(complaint.id || null);
                                                    }
                                                }}
                                                className="inline-flex items-center px-2 py-1 rounded-xs text-xs font-medium cursor-pointer whitespace-nowrap"
                                                style={{
                                                    color: complaintStatusColors[complaint.status]?.text,
                                                    backgroundColor: complaintStatusColors[complaint.status]?.bg,
                                                }}>
                                                {updatingStatusId === complaint.id ? (
                                                    <span className="flex items-center gap-1">
                                                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                        </svg>
                                                        …
                                                    </span>
                                                ) : complaint.status}
                                            </div>
                                            {activeComplaintId === complaint.id && popupPosition && (
                                                <div className='fixed p-2 flex flex-col gap-1 bg-white/80 backdrop-blur-xl shadow-xl rounded-xs border border-gray-100 z-50 w-32'
                                                    style={{ top: popupPosition.top - 8, left: popupPosition.left, transform: 'translate(-50%, -100%)' }}>
                                                    {Object.keys(complaintStatusColors).map((status) => (
                                                        <button key={status} disabled={updatingStatusId !== null}
                                                            onClick={(e) => { e.stopPropagation(); handleStatusChange(complaint.id!, status); }}
                                                            className='w-full px-3 py-1.5 text-xs rounded-xs transition-colors text-center'
                                                            style={{ color: complaintStatusColors[status].text, backgroundColor: complaintStatusColors[status].bg }}>
                                                            {status}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    {/* Delete */}
                                    <td className='px-3 py-2 text-center'>
                                        <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(complaint.id!); }}
                                            className='p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors' title="Delete">
                                            <IoTrash size={18} />
                                        </button>
                                    </td>
                                    {/* Logs */}
                                    <td className='px-3 py-2 text-center'>
                                        <Link href={`/logs/${complaint.id}`}
                                            onClick={() => setCurrentlyViewingComplaint(complaint)}
                                            className='p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors inline-block' title="Logs">
                                            <CgNotes size={18} />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ─── Pagination Controls ─── */}
            {totalPages > 1 && (
                <div className='flex items-center justify-center gap-2 py-4'>
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || searchLoading}
                        className='flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
                    >
                        <MdNavigateBefore size={18} /> Prev
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => {
                            // Show first, last, and pages around current
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
                                <span key={`ellipsis-${idx}`} className='px-2 text-gray-400'>…</span>
                            ) : (
                                <button
                                    key={item}
                                    onClick={() => handlePageChange(item)}
                                    disabled={searchLoading}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md border transition-colors cursor-pointer ${currentPage === item
                                        ? 'bg-blue-500 text-white border-blue-500'
                                        : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {item}
                                </button>
                            )
                        )}

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || searchLoading}
                        className='flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'
                    >
                        Next <MdNavigateNext size={18} />
                    </button>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xs shadow-2xl p-6 max-w-sm w-full border border-gray-100 scale-in-center">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Delete Complaint?</h2>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this complaint? This action cannot be undone.</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xs transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteComplaint(showDeleteConfirm)}
                                disabled={deletingId !== null}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xs transition-colors flex items-center gap-2"
                            >
                                {deletingId ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
