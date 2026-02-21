"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { IoArrowBack, IoPersonOutline, IoChatbubbleOutline, IoTimeOutline, IoLocationOutline, IoCallOutline, IoChevronForward } from "react-icons/io5"
import { useUserStore } from "@/app/_store/userStore"
import { Complaint } from "@/app/types"
import { MdOutlineSubject, MdOutlineTrackChanges } from "react-icons/md"

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

    const { currentlyViewingComplaint, setCurrentlyViewingComplaint } = useUserStore()

    useEffect(() => {
        if (!params?.id) return

        if (isNaN(complaintId)) {
            setError("Invalid complaint ID")
            setLoading(false)
            return
        }

        const fetchLogs = async () => {
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
                if (err.response) {
                    setError(err.response.data.message)
                } else {
                    setError("Failed to fetch logs")
                }
            } finally {
                setLoading(false)
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

        fetchLogs()
        fetchComplaintDetails()
    }, [params?.id, complaintId, currentlyViewingComplaint, setCurrentlyViewingComplaint])

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
                                        {currentlyViewingComplaint.complainant_name?.charAt(0)}
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
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic bg-slate-50/20">
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
                                                    {log.updated_by.charAt(0)}
                                                </div>
                                                <span className="text-slate-700 font-semibold">{log.updated_by}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-slate-500 max-w-xs leading-relaxed italic" title={log.reason}>
                                                "{log.reason || "No specific reason provided for this action."}"
                                            </p>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}