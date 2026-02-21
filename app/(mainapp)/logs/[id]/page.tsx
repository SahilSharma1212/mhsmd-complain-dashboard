"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { IoArrowBack, IoPersonOutline, IoChatbubbleOutline, IoTimeOutline, IoLocationOutline, IoCallOutline, IoChevronForward, IoAdd, IoTrash, IoCreateOutline } from "react-icons/io5"
import { useUserStore } from "@/app/_store/userStore"
import { Complaint } from "@/app/types"
import { MdOutlineSubject, MdOutlineTrackChanges } from "react-icons/md"
import toast from "react-hot-toast"

type Log = {
    id: number
    created_at: string
    complaint_id: number
    updated_by: string
    prev_status: string
    current_status: string
    reason: string
    action: string
}

export default function LogsPage() {
    const params = useParams()
    const router = useRouter()
    const complaintId = Number(params.id)

    const [logs, setLogs] = useState<Log[]>([])
    const [loading, setLoading] = useState(true)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Add Log State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newLogReason, setNewLogReason] = useState("")
    const [selectedStatus, setSelectedStatus] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Delete Log State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [logToDelete, setLogToDelete] = useState<number | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Edit Complaint State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editForm, setEditForm] = useState({
        subject: "",
        message: "",
        complainant_name: "",
        complainant_contact: "",
        allocated_thana: ""
    })
    const [isEditingComplaint, setIsEditingComplaint] = useState(false)

    const { user, thana, currentlyViewingComplaint, setCurrentlyViewingComplaint } = useUserStore()

    const fetchLogs = async (isManualRefresh = false) => {
        if (!isManualRefresh) setLoading(true)
        try {
            const response = await axios.get(
                `/api/logs`,
                {
                    params: { id: complaintId },
                    withCredentials: true,
                }
            )
            setLogs(response.data.data)
        } catch (err: any) {
            console.error("Failed to fetch logs", err)
            if (!isManualRefresh) {
                if (err.response) {
                    setError(err.response.data.message)
                } else {
                    setError("Failed to fetch logs")
                }
            }
        } finally {
            if (!isManualRefresh) setLoading(false)
        }
    }

    const fetchComplaintDetails = async () => {
        if (currentlyViewingComplaint && String(currentlyViewingComplaint.id) === String(complaintId)) {
            return
        }

        setDetailsLoading(true)
        try {
            const response = await axios.get(`/api/complaint`, {
                params: { filter: "id", value: complaintId },
                withCredentials: true,
            })

            if (response.data.success && response.data.data.length > 0) {
                setCurrentlyViewingComplaint(response.data.data[0])
            }
        } catch (err) {
            console.error("Failed to fetch complaint details", err)
        } finally {
            setDetailsLoading(false)
        }
    }

    useEffect(() => {
        if (!params?.id) return

        if (isNaN(complaintId)) {
            setError("Invalid complaint ID")
            setLoading(false)
            return
        }

        fetchLogs()
        fetchComplaintDetails()
    }, [params?.id, complaintId])


    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newLogReason.trim()) {
            toast.error("Please enter a reason or note")
            return
        }

        setIsSubmitting(true)
        try {
            const response = await axios.post("/api/logs", {
                complaint_id: complaintId,
                reason: newLogReason.trim(),
                status: selectedStatus
            }, { withCredentials: true })

            if (response.data.success) {
                toast.success("Log added successfully")
                setNewLogReason("")
                setIsModalOpen(false)

                // Refresh complaint details if status changed
                if (selectedStatus !== currentlyViewingComplaint?.status) {
                    fetchComplaintDetails()
                }

                fetchLogs() // Refresh logs
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to add log")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditComplaint = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editForm.subject.trim() || !editForm.complainant_name.trim() || !editForm.complainant_contact.trim() || !editForm.allocated_thana.trim()) {
            toast.error("Please fill all required fields")
            return
        }

        setIsEditingComplaint(true)
        try {
            const response = await axios.patch("/api/complaint/edit", {
                id: complaintId,
                ...editForm
            }, { withCredentials: true })

            if (response.data.success) {
                toast.success("Complaint updated successfully")
                setIsEditModalOpen(false)

                // Force a full re-fetch of complaint details to update the UI
                setCurrentlyViewingComplaint(null) // Reset to trigger conditional in fetchComplaintDetails

                const fetchRes = await axios.get(`/api/complaint`, {
                    params: { filter: "id", value: complaintId },
                    withCredentials: true,
                })

                if (fetchRes.data.success && fetchRes.data.data.length > 0) {
                    setCurrentlyViewingComplaint(fetchRes.data.data[0])
                }

                fetchLogs() // Refresh logs to show "EDITED" entry
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update complaint")
        } finally {
            setIsEditingComplaint(false)
        }
    }

    const handleDeleteLog = async () => {
        if (!logToDelete) return

        setIsDeleting(true)
        try {
            const response = await axios.delete(`/api/logs`, {
                params: { id: logToDelete },
                withCredentials: true
            })

            if (response.data.success) {
                toast.success("Log deleted successfully")
                setIsDeleteModalOpen(false)
                setLogToDelete(null)
                fetchLogs() // Refresh logs
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to delete log")
        } finally {
            setIsDeleting(false)
        }
    }

    const complaintStatusColors: Record<string, { bg: string, text: string }> = {
        "PENDING": { bg: "bg-blue-50 text-blue-700", text: "text-blue-700" },
        "FIR": { bg: "bg-amber-50 text-amber-700", text: "text-amber-700" },
        "NON FIR": { bg: "bg-purple-50 text-purple-700", text: "text-purple-700" },
        "FILE": { bg: "bg-slate-50 text-slate-700", text: "text-slate-700" },
        "NO CONTACT": { bg: "bg-red-50 text-red-700", text: "text-red-700" },
        "SOLVED": { bg: "bg-emerald-50 text-emerald-700", text: "text-emerald-700" },
    }

    if (error)
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-6"
                >
                    <IoArrowBack className="mr-2" />
                    Back to Complaints
                </button>
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xs font-medium shadow-sm">
                    {error}
                </div>
            </div>
        )

    return (
        <div className="p-3 bg-white">
            <button
                onClick={() => router.back()}
                className="flex items-center text-slate-600 hover:text-slate-900 transition-colors mb-6 group bg-slate-100 hover:bg-slate-200 px-4 py-2 text-sm font-medium w-fit shadow-xs"
            >
                <IoArrowBack className="mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Complaints
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <MdOutlineTrackChanges className="text-blue-500" />
                        Complaint Investigation Timeline
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Comprehensive history and progress logs for case ID: <span className="font-semibold text-slate-700">#{complaintId}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            if (currentlyViewingComplaint) {
                                setEditForm({
                                    subject: currentlyViewingComplaint.subject || "",
                                    message: currentlyViewingComplaint.message || "",
                                    complainant_name: currentlyViewingComplaint.complainant_name || "",
                                    complainant_contact: currentlyViewingComplaint.complainant_contact || "",
                                    allocated_thana: currentlyViewingComplaint.allocated_thana || ""
                                })
                                setIsEditModalOpen(true)
                            }
                        }}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xs font-bold border border-slate-200 shadow-sm transition-all hover:-translate-y-0.5"
                    >
                        <IoCreateOutline size={20} />
                        Edit Case
                    </button>
                    <button
                        onClick={() => {
                            setSelectedStatus(currentlyViewingComplaint?.status || "")
                            setIsModalOpen(true)
                        }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xs font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                    >
                        <IoAdd size={20} />
                        Add New Log
                    </button>
                </div>
            </div>

            {/* Complaint Details Card */}
            <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xs border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <IoChatbubbleOutline className="text-blue-500" />
                            Complaint Information
                        </h2>
                        {currentlyViewingComplaint && (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${currentlyViewingComplaint.status === 'PENDING' ? 'bg-blue-50 text-blue-700 ring-blue-700/10' :
                                currentlyViewingComplaint.status === 'SOLVED' ? 'bg-emerald-50 text-emerald-700 ring-emerald-700/10' :
                                    'bg-amber-50 text-amber-700 ring-amber-700/10'
                                }`}>
                                {currentlyViewingComplaint.status}
                            </span>
                        )}
                    </div>
                    <div className="p-6">
                        {detailsLoading ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                                <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                                <div className="h-20 bg-slate-100 rounded w-full"></div>
                            </div>
                        ) : currentlyViewingComplaint ? (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <MdOutlineSubject /> Subject
                                    </h3>
                                    <p className="text-slate-900 font-medium text-lg leading-relaxed">
                                        {currentlyViewingComplaint.subject}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                                    <p className="text-slate-600 bg-slate-50/50 p-4 rounded-xs border border-slate-100 italic">
                                        "{currentlyViewingComplaint.message || "No description provided"}"
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <IoLocationOutline className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 uppercase">Allocated Thana</p>
                                            <p className="text-sm text-slate-700 font-medium">{currentlyViewingComplaint.allocated_thana}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-purple-50 rounded-lg">
                                            <IoTimeOutline className="text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 uppercase">Submission Date</p>
                                            <p className="text-sm text-slate-700 font-medium">
                                                {new Date(currentlyViewingComplaint.date || currentlyViewingComplaint.created_at!).toLocaleDateString('en-IN', {
                                                    dateStyle: 'full'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {currentlyViewingComplaint.file_urls && currentlyViewingComplaint.file_urls.length > 0 && (
                                    <div className="pt-4 border-t border-slate-100">
                                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            Attachments ({currentlyViewingComplaint.file_urls.length})
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {currentlyViewingComplaint.file_urls.map((url, idx) => (
                                                <a
                                                    key={idx}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 transition-colors"
                                                >
                                                    <IoChatbubbleOutline className="text-blue-500" size={14} />
                                                    View Document {idx + 1}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-slate-400 text-sm italic">Failed to load complaint details.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xs border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <IoPersonOutline className="text-blue-500" />
                            Complainant Details
                        </h2>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-center">
                        {detailsLoading ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-12 bg-slate-100 rounded-full w-12 mx-auto"></div>
                                <div className="h-4 bg-slate-100 rounded w-1/2 mx-auto"></div>
                                <div className="h-4 bg-slate-100 rounded w-3/4 mx-auto"></div>
                            </div>
                        ) : currentlyViewingComplaint ? (
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm ring-1 ring-blue-100">
                                    <span className="text-blue-600 text-xl font-bold">
                                        {currentlyViewingComplaint.complainant_name ? currentlyViewingComplaint.complainant_name.charAt(0) : 'C'}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">{currentlyViewingComplaint.complainant_name}</h3>
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-center gap-2 text-slate-600 bg-slate-50 py-2 px-4 rounded-xs border border-slate-100">
                                        <IoCallOutline className="text-blue-500" size={16} />
                                        <span className="text-sm font-medium">{currentlyViewingComplaint.complainant_contact}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 flex flex-col gap-1 mt-6">
                                        <p>Submitted By</p>
                                        <p className="text-slate-700 font-semibold text-sm uppercase">{currentlyViewingComplaint.submitted_by}</p>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xs shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200">
                    <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <MdOutlineTrackChanges className="text-blue-500" size={18} />
                        Detailed Action Logs
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/30 border-b border-slate-200">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date & Time</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Transition</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modified By</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reason / Remarks</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {loading ? (
                                // Skeleton rows
                                Array.from({ length: 5 }).map((_, idx) => (
                                    <tr key={idx} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-sm w-32"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-sm w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-sm w-40"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-sm w-28"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-sm w-48"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-sm w-12 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic bg-slate-50/20">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-3 bg-slate-100 rounded-full">
                                                <MdOutlineTrackChanges size={24} className="text-slate-300" />
                                            </div>
                                            No activity logs recorded for this complaint.
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-slate-700 font-semibold">
                                                {new Date(log.created_at).toLocaleTimeString('en-IN', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                            <div className="text-slate-400 text-xs">
                                                {new Date(log.created_at).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight uppercase border ${log.action === 'CREATED' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded text-xs">{log.prev_status}</span>
                                                <IoChevronForward className="text-slate-300" size={12} />
                                                <span className={`font-bold px-2 py-0.5 rounded text-xs ${log.current_status === 'SOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-800 text-white'
                                                    }`}>
                                                    {log.current_status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                    {log.updated_by ? log.updated_by.charAt(0) : 'U'}
                                                </div>
                                                <span className="text-slate-700 font-semibold">{log.updated_by || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-slate-500 max-w-xs leading-relaxed italic" title={log.reason}>
                                                "{log.reason || "No specific reason provided for this action."}"
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {log.action !== 'CREATED' && (
                                                <button
                                                    onClick={() => {
                                                        setLogToDelete(log.id)
                                                        setIsDeleteModalOpen(true)
                                                    }}
                                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Delete Log"
                                                >
                                                    <IoTrash size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Log Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xs shadow-2xl w-full max-w-lg border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <IoAdd className="text-blue-600" size={24} />
                                Add Manual Log / Note
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddLog} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">
                                        Current Identifying ID
                                    </label>
                                    <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-mono text-sm">
                                        #{complaintId}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">
                                        Update Case Status
                                    </label>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-700"
                                    >
                                        {Object.keys(complaintStatusColors).map((status) => (
                                            <option key={status} value={status}>
                                                {status} {status === currentlyViewingComplaint?.status ? '(Current)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Log entry / Observations
                                </label>
                                <textarea
                                    value={newLogReason}
                                    onChange={(e) => setNewLogReason(e.target.value)}
                                    placeholder="Enter details about the action taken or notes for this case..."
                                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-700 resize-none font-medium text-sm leading-relaxed"
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xs border border-slate-100">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <IoChatbubbleOutline className="text-blue-600" />
                                </div>
                                <p className="text-[11px] text-slate-500 leading-tight font-medium">
                                    This manual entry will create a permanent history record. Changing the status here will also update the main complaint file.
                                </p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xs font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Adding...
                                        </>
                                    ) : (
                                        'Save Entry'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Complaint Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xs shadow-2xl w-full max-w-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <IoCreateOutline className="text-blue-600" size={24} />
                                Edit Complaint Details
                            </h2>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleEditComplaint} className="p-6 space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Subject</label>
                                    <input
                                        type="text"
                                        value={editForm.subject}
                                        onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Complainant Name</label>
                                        <input
                                            type="text"
                                            value={editForm.complainant_name}
                                            onChange={(e) => setEditForm({ ...editForm, complainant_name: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Complainant Contact</label>
                                        <input
                                            type="text"
                                            value={editForm.complainant_contact}
                                            onChange={(e) => setEditForm({ ...editForm, complainant_contact: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Allocated Thana</label>
                                    <select
                                        value={editForm.allocated_thana}
                                        onChange={(e) => setEditForm({ ...editForm, allocated_thana: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                                        required
                                    >
                                        <option value="">Select Thana</option>
                                        {thana?.map((t, idx) => (
                                            <option key={idx} value={t.name}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Description / Message</label>
                                    <textarea
                                        value={editForm.message}
                                        onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                                        className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isEditingComplaint}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xs font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isEditingComplaint ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <span className="max-md:hidden">Save Changes</span>
                                            <span className="md:hidden">Save</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xs shadow-2xl w-full max-w-sm border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                                <IoTrash className="text-red-600" size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">Delete Log Entry?</h3>
                            <p className="text-slate-500 text-sm text-center mb-6">
                                Are you sure you want to delete this activity log? This action cannot be undone and will permanently remove it from the history.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsDeleteModalOpen(false)
                                        setLogToDelete(null)
                                    }}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xs transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteLog}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Deleting...
                                        </>
                                    ) : (
                                        'Confirm'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}