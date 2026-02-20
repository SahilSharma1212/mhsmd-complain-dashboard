"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { IoArrowBack } from "react-icons/io5"

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
    const [error, setError] = useState<string | null>(null)

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

        fetchLogs()
    }, [params?.id, complaintId])

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
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl font-medium shadow-sm">
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

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Complaint Logs
                    </h1>
                    <p className="text-slate-500 mt-1">
                        History and progress logs for Complaint ID: <span className="font-semibold text-slate-700">#{complaintId}</span>
                    </p>
                </div>
            </div>

            <div className="bg-white shadow border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status Change</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Updated By</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
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
                                        No activity logs recorded for this complaint.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                                            {new Date(log.created_at).toLocaleString('en-IN', {
                                                dateStyle: 'medium',
                                                timeStyle: 'short'
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${log.action === 'CREATED' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-400 font-medium">{log.prev_status}</span>
                                                <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                                <span className="font-bold text-slate-800">{log.current_status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 font-medium">
                                            {log.updated_by}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={log.reason}>
                                            {log.reason || "—"}
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