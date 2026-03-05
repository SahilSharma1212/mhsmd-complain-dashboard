"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { IoArrowBack, IoPersonOutline, IoChatbubbleOutline, IoTimeOutline, IoLocationOutline, IoCallOutline, IoChevronForward, IoAdd, IoTrash, IoCreateOutline } from "react-icons/io5"
import { useUserStore } from "@/app/_store/userStore"
import { MdOutlineSubject, MdOutlineTrackChanges } from "react-icons/md"
import toast from "react-hot-toast"
import { IoIosDocument } from "react-icons/io"
import { useLanguageStore } from "@/app/_store/languageStore"
import { useLogStore, Log } from "@/app/_store/logStore"
import { useStatsStore } from "@/app/_store/statsStore"
import { useComplaintStore } from "@/app/_store/complaintStore"
import { useRef } from "react"
import { COMPLAINT_STATUS_COLORS, COMPLAINT_STATUSES } from "@/app/types"

export default function LogsPage() {
    const params = useParams()
    const router = useRouter()
    const complaintId = Number(params.id)

    const { logsByComplaint, setLogs: setCachedLogs, clearLogs: clearCachedLogs } = useLogStore()
    const { fetchStats } = useStatsStore()
    const { clearCache: clearComplaintCache } = useComplaintStore()

    const cachedData = logsByComplaint[complaintId]
    const logs = cachedData?.logs || []
    const loadingInitially = !cachedData

    const [isLoading, setIsLoading] = useState(false)
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

    // IO Allocation State
    const [isIOModalOpen, setIsIOModalOpen] = useState(false)
    const [ioOfficerName, setIoOfficerName] = useState("")
    const [isAllocatingIO, setIsAllocatingIO] = useState(false)

    const isFetchingRef = useRef(false)

    const { user, thana, currentlyViewingComplaint, setCurrentlyViewingComplaint } = useUserStore()
    const { language } = useLanguageStore()

    const fetchLogs = async (isManualRefresh = false) => {
        if (isFetchingRef.current) return

        // TTL: 5 minutes
        const isCacheValid = cachedData && (Date.now() - cachedData.lastFetched < 5 * 60 * 1000)
        if (!isManualRefresh && isCacheValid) {
            setCurrentlyViewingComplaint(cachedData.complaint)
            return
        }

        isFetchingRef.current = true
        if (!isManualRefresh && !cachedData) setIsLoading(true)

        try {
            const response = await axios.get(
                `/api/logs`,
                {
                    params: { id: complaintId },
                    withCredentials: true,
                }
            )
            const { logs: logsData, complaint: complaintData } = response.data.data
            setCachedLogs(complaintId, logsData, complaintData)
            setCurrentlyViewingComplaint(complaintData)
            setError(null)
        } catch (err: any) {
            console.error(language === "english" ? "Failed to fetch logs" : "लॉग प्राप्त करने में विफल", err)
            if (!cachedData) {
                setError(err.response?.data?.message || (language === "english" ? "Failed to fetch logs" : "लॉग प्राप्त करने में विफल"))
            }
        } finally {
            setIsLoading(false)
            isFetchingRef.current = false
        }
    }

    useEffect(() => {
        if (!params?.id || isNaN(complaintId)) {
            if (params?.id) setError(language === "english" ? "Invalid complaint ID" : "अमान्य शिकायत आईडी")
            return
        }

        if (user) {
            fetchLogs()
        }
    }, [complaintId, user])


    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newLogReason.trim()) {
            toast.error(language === "english" ? "Please enter a reason or note" : "कृपया एक कारण या नोट दर्ज करें")
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
                toast.success(language === "english" ? "Log added successfully" : "लॉग सफलतापूर्वक जोड़ा गया")
                setNewLogReason("")
                setIsModalOpen(false)

                fetchLogs(true) // This now refreshes both logs and complaint details

                // Sync other stores
                fetchStats(true)
                clearComplaintCache()
            }
        } catch (err: any) {
            toast.error(language === "english" ? "Failed to add log" : "लॉग जोड़ने में विफल")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditComplaint = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editForm.subject.trim() || !editForm.complainant_name.trim() || !editForm.complainant_contact.trim() || !editForm.allocated_thana.trim()) {
            toast.error(language === "english" ? "Please fill all required fields" : "कृपया सभी आवश्यक फ़ील्ड भरें")
            return
        }

        setIsEditingComplaint(true)
        try {
            const response = await axios.patch("/api/complaint/edit", {
                id: complaintId,
                ...editForm
            }, { withCredentials: true })

            if (response.data.success) {
                toast.success(language === "english" ? "Complaint updated successfully" : "शिकायत सफलतापूर्वक अपडेट की गई")
                setIsEditModalOpen(false)

                fetchLogs(true) // This now refreshes both logs and complaint details including changes

                // Sync other stores
                fetchStats(true)
                clearComplaintCache()
            }
        } catch (err: any) {
            toast.error(language === "english" ? "Failed to update complaint" : "शिकायत अपडेट करने में विफल")
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
                toast.success(language === "english" ? "Log deleted successfully" : "लॉग सफलतापूर्वक हटाया गया")
                setIsDeleteModalOpen(false)
                setLogToDelete(null)
                fetchLogs(true) // Refresh logs
            }
        } catch (err: any) {
            toast.error(language === "english" ? "Failed to delete log" : "लॉग हटाने में विफल")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleAllocateIO = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!ioOfficerName.trim()) {
            toast.error(language === "english" ? "Please enter IO Officer name" : "कृपया आईओ अधिकारी का नाम दर्ज करें")
            return
        }

        setIsAllocatingIO(true)
        try {
            const response = await axios.patch("/api/logs", {
                id: complaintId,
                io_officer: ioOfficerName.trim()
            }, { withCredentials: true })

            if (response.data.success) {
                toast.success(language === "english" ? "IO Officer allocated successfully" : "आईओ अधिकारी सफलतापूर्वक आवंटित किया गया")
                setIsIOModalOpen(false)
                setIoOfficerName("")

                // Refresh local data
                await fetchLogs(true)

                // Sync other stores
                fetchStats(true)
                clearComplaintCache()
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || (language === "english" ? "Failed to allocate IO" : "आईओ आवंटित करने में विफल"))
        } finally {
            setIsAllocatingIO(false)
        }
    }

    const complaintStatusColors = COMPLAINT_STATUS_COLORS;

    if (error)
        return (
            <div className="p-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-6 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-xs text-sm font-bold group"
                >
                    <IoArrowBack className="group-hover:-translate-x-1 transition-transform" />
                    {language === "english" ? "Back" : "वापस"}
                </button>
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xs text-xs font-bold uppercase tracking-widest">
                    {error}
                </div>
            </div>
        )

    return (
        <div className="p-6 bg-white">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors mb-6 group bg-slate-50 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-xs text-sm font-bold w-fit"
            >
                <IoArrowBack className="group-hover:-translate-x-1 transition-transform" />
                {language === "english" ? "Back" : "वापस"}
            </button>

            <div className="bg-white rounded-xs border border-slate-200 shadow-sm overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-xs flex items-center justify-center border border-blue-100">
                            <MdOutlineTrackChanges className="text-blue-600 text-lg" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                {language === "english" ? "Log Timeline" : "लॉग टाइमलाइन"}
                            </h2>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                {language === "english" ? "Complaint" : "शिकायत"} #{complaintId}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
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
                            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xs text-[11px] font-bold uppercase tracking-wider border border-slate-200 shadow-xs transition-all"
                        >
                            <IoCreateOutline size={16} />
                            {language === "english" ? "Edit Case" : "संपादित"}
                        </button>
                        {user?.role === "TI" && (
                            <button
                                onClick={() => {
                                    setIoOfficerName(currentlyViewingComplaint?.io_officer || "")
                                    setIsIOModalOpen(true)
                                }}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xs text-[11px] font-bold uppercase tracking-wider shadow-xs transition-all"
                            >
                                <IoPersonOutline size={16} />
                                {currentlyViewingComplaint?.io_officer
                                    ? (language === "english" ? "Edit IO" : "IO संपादित")
                                    : (language === "english" ? "Allocate IO" : "IO आवंटित")
                                }
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setSelectedStatus(currentlyViewingComplaint?.status || "")
                                setIsModalOpen(true)
                            }}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xs text-[11px] font-bold uppercase tracking-wider shadow-xs transition-all"
                        >
                            <IoAdd size={16} />
                            {language === "english" ? "Add Log" : "लॉग जोड़ें"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Complaint Details Card */}
            <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xs border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <IoChatbubbleOutline className="text-blue-500" />
                            {language === "english" ? "Complaint Information" : "शिकायत जानकारी"}
                        </h2>
                        {currentlyViewingComplaint && (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${currentlyViewingComplaint.status === 'अप्रमाणित' ? 'bg-blue-50 text-blue-700 ring-blue-700/10' :
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
                                    <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <MdOutlineSubject /> {language === "english" ? "Subject" : "विषय"}
                                    </h3>
                                    <p className="text-slate-900 font-medium text-lg leading-relaxed">
                                        {currentlyViewingComplaint.subject}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">{language === "english" ? "Description" : "विवरण"}</h3>
                                    <p className="text-slate-700 bg-slate-50/50 p-4 rounded-xs border border-slate-100 italic">
                                        "{currentlyViewingComplaint.message || "No description provided"}"
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <IoLocationOutline className="text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-600 uppercase">{language === "english" ? "Allocated Thana" : "आवंटित थाना"}</p>
                                            <p className="text-sm text-slate-900 font-medium">{currentlyViewingComplaint.allocated_thana}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-purple-50 rounded-lg">
                                            <IoTimeOutline className="text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-600 uppercase">{language === "english" ? "Submission Date" : "जमा करने की तिथि"}</p>
                                            <p className="text-sm text-slate-900 font-medium">
                                                {new Date(currentlyViewingComplaint.date || currentlyViewingComplaint.created_at!).toLocaleDateString('en-IN', {
                                                    dateStyle: 'full'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-emerald-50 rounded-lg">
                                            <IoPersonOutline className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-600 uppercase">{language === "english" ? "IO Officer" : "आईओ अधिकारी"}</p>
                                            <p className="text-sm text-slate-900 font-bold">
                                                {currentlyViewingComplaint.io_officer || (language === "english" ? "Not Allocated" : "आवंटित नहीं")}
                                            </p>
                                        </div>
                                    </div>
                                    {currentlyViewingComplaint.accused_details && (
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-red-50 rounded-lg">
                                                <IoPersonOutline className="text-red-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-slate-600 uppercase">{language === "english" ? "Accused (आरोपी)" : "आरोपी"}</p>
                                                <p className="text-sm text-slate-900 font-medium">
                                                    {currentlyViewingComplaint.accused_details}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {currentlyViewingComplaint.file_urls && currentlyViewingComplaint.file_urls.length > 0 && (
                                    <div className="pt-4 border-t border-slate-100">
                                        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            {language === "english" ? "Attachments" : "संलग्नक"} ({currentlyViewingComplaint.file_urls.length})
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {currentlyViewingComplaint.file_urls.map((url, idx) => (
                                                <a
                                                    key={idx}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-red-700 hover:bg-red-600 border border-red-200 rounded-xs text-xs font-medium text-white transition-colors"
                                                >
                                                    <IoIosDocument className="text-white" size={14} />
                                                    {language === "english" ? "View Document" : "दस्तावेज़ देखें"} {idx + 1}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {currentlyViewingComplaint.feedback && (
                                    <div className="pt-4 border-t border-slate-100">
                                        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <IoChatbubbleOutline className="text-emerald-500" />
                                            {language === "english" ? "User Feedback" : "उपयोगकर्ता प्रतिक्रिया"}
                                        </h3>
                                        <div className="bg-emerald-50/50 p-4 rounded-xs border border-emerald-100/50">
                                            <p className="text-sm text-emerald-900 font-medium leading-relaxed italic">
                                                "{currentlyViewingComplaint.feedback}"
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-slate-600 text-sm italic">{language === "english" ? "Failed to load complaint details" : "शिकायत विवरण लोड करने में विफल"}.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xs border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200">
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <IoPersonOutline className="text-blue-500" />
                            {language === "english" ? "Complainant Details" : "शिकायतकर्ता का विवरण"}
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
                                    <div className="flex items-center justify-center gap-2 text-slate-700 bg-slate-50 py-2 px-4 rounded-xs border border-slate-100">
                                        <IoCallOutline className="text-blue-500" size={16} />
                                        <span className="text-sm font-medium">{currentlyViewingComplaint.complainant_contact || currentlyViewingComplaint.phone}</span>
                                    </div>
                                    <div className="text-xs text-slate-700 flex flex-col gap-1 mt-6">
                                        <p>{language === "english" ? "Submitted By" : "द्वारा जमा किया गया"}</p>
                                        <p className="text-slate-900 font-semibold text-sm uppercase">{currentlyViewingComplaint.submitted_by}</p>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/*Detailed Action Logs*/}
            <div className="bg-white rounded-xs shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200">
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <MdOutlineTrackChanges className="text-blue-500" size={18} />
                        {language === "english" ? "Detailed Action Logs" : "विस्तृत कार्रवाई लॉग"}
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/30 border-b border-slate-200">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">{language === "english" ? "Date & Time" : "दिनांक और समय"}</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">{language === "english" ? "Action" : "कार्रवाई"}</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">{language === "english" ? "Status Transition" : "स्थिति परिवर्तन"}</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">{language === "english" ? "Modified By" : "द्वारा संशोधित"}</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">{language === "english" ? "Reason / Remarks" : "कारण / टिप्पणी"}</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-right">{language === "english" ? "Actions" : "कार्रवाई"}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {isLoading ? (
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
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-600 italic bg-slate-50/20">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-3 bg-slate-100 rounded-full">
                                                <MdOutlineTrackChanges size={24} className="text-slate-500" />
                                            </div>
                                            {language === "english" ? "No activity logs recorded for this complaint." : "इस शिकायत के लिए कोई गतिविधि लॉग दर्ज नहीं है।"}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-slate-900 font-semibold">
                                                {new Date(log.created_at).toLocaleTimeString('en-IN', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                            <div className="text-slate-600 text-xs">
                                                {new Date(log.created_at).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight uppercase border ${log.action === 'CREATED' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                log.action === 'IO_ALLOCATED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    'bg-amber-50 text-amber-900 border-amber-100'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded text-xs">{log.prev_status}</span>
                                                <IoChevronForward className="text-slate-500" size={12} />
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
                                        <td className="px-6 py-4 max-w-[300px]">
                                            <p className="text-slate-700 leading-relaxed italic line-clamp-1 hover:line-clamp-none transition-all duration-300 cursor-help" title={log.reason}>
                                                "{log.reason || "No specific reason provided for this action."}"
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {log.action !== 'CREATED' && (user?.role === 'SP' || user?.role === "ASP" || user?.role === "SDOP") && (
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
                                {language === "english" ? "Add Manual Log / Note" : "मैन्युअल लॉग / नोट जोड़ें"}
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
                                    <label className="block text-sm font-bold text-slate-800">
                                        {language === "english" ? "Current Identifying ID" : "वर्तमान पहचान आईडी"}
                                    </label>
                                    <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono text-sm">
                                        #{complaintId}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700">
                                        {language === "english" ? "Update Case Status" : "केस स्थिति अपडेट करें"}
                                    </label>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-slate-700"
                                    >
                                        {COMPLAINT_STATUSES.map((status) => (
                                            <option key={status} value={status}>
                                                {status} {status === currentlyViewingComplaint?.status ? '(Current)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-800 mb-2">
                                    {language === "english" ? "Log entry / Observations" : "लॉग प्रविष्टि / अवलोकन"}
                                </label>
                                <textarea
                                    value={newLogReason}
                                    onChange={(e) => setNewLogReason(e.target.value)}
                                    placeholder={language === "english" ? "Enter details about the action taken or notes for this case..." : "इस मामले में की गई कार्रवाई या नोट्स के बारे में विवरण दर्ज करें..."}
                                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-500 resize-none font-medium text-sm leading-relaxed"
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xs border border-slate-100">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <IoChatbubbleOutline className="text-blue-600" />
                                </div>
                                <p className="text-[11px] text-slate-700 leading-tight font-medium">
                                    {language === "english" ? "This manual entry will create a permanent history record. Changing the status here will also update the main complaint file." : "यह मैन्युअल प्रविष्टि एक स्थायी इतिहास रिकॉर्ड बनाएगी। यहां स्थिति बदलने से मुख्य शिकायत फ़ाइल भी अपडेट हो जाएगी।"}
                                </p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors"
                                >
                                    {language === "english" ? "Cancel" : "रद्द करें"}
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
                                            {language === "english" ? "Adding..." : "जोड़ रहा है..."}
                                        </>
                                    ) : (
                                        language === "english" ? "Save Entry" : "प्रविष्टि सहेजें"
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
                                {language === "english" ? "Edit Complaint Details" : "शिकायत विवरण संपादित करें"}
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
                                    <label className="block text-sm font-bold text-slate-800 mb-1.5">{language === "english" ? "Subject" : "विषय"}</label>
                                    <input
                                        type="text"
                                        value={editForm.subject}
                                        onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-800 mb-1.5">{language === "english" ? "Complainant Name" : "शिकायतकर्ता का नाम"}</label>
                                        <input
                                            type="text"
                                            value={editForm.complainant_name}
                                            onChange={(e) => setEditForm({ ...editForm, complainant_name: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-800 mb-1.5">{language === "english" ? "Complainant Contact" : "शिकायतकर्ता संपर्क"}</label>
                                        <input
                                            type="text"
                                            value={editForm.complainant_contact}
                                            onChange={(e) => setEditForm({ ...editForm, complainant_contact: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-800 mb-1.5">{language === "english" ? "Allocated Thana" : "आवंटित थाना"}</label>
                                    <select
                                        value={editForm.allocated_thana}
                                        onChange={(e) => setEditForm({ ...editForm, allocated_thana: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900"
                                        required
                                    >
                                        <option value="">{language ? "Select Thana" : "थाना चुनें"}</option>
                                        {thana?.map((t, idx) => (
                                            <option key={idx} value={t.name}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-800 mb-1.5">{language === "english" ? "Description / Message" : "विवरण / संदेश"}</label>
                                    <textarea
                                        value={editForm.message}
                                        onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                                        className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-900 resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-5 py-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors"
                                >
                                    {language === "english" ? "Cancel" : "रद्द करें"}
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
                                            {language === "english" ? "Saving..." : "सहेज रहा है..."}
                                        </>
                                    ) : (
                                        <>
                                            <span className="max-md:hidden">{language === "english" ? "Save Changes" : "परिवर्तन सहेजें"}</span>
                                            <span className="md:hidden">{language === "english" ? "Save" : "सहेजें"}</span>
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
                            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">{language === "english" ? "Delete Log Entry?" : "लॉग प्रविष्टि हटाएं?"}</h3>
                            <p className="text-slate-700 text-sm text-center mb-6">
                                {language === "english" ? "Are you sure you want to delete this activity log? This action cannot be undone and will permanently remove it from the history." : "क्या आप सुनिश्चित हैं कि आप इस गतिविधि लॉग को हटाना चाहते हैं? यह कार्रवाई पूर्ववत नहीं की जा सकती है और इसे इतिहास से स्थायी रूप से हटा दिया जाएगा।"}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsDeleteModalOpen(false)
                                        setLogToDelete(null)
                                    }}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xs transition-colors"
                                >
                                    {language === "english" ? "Cancel" : "रद्द करें"}
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
                                            {language === "english" ? "Deleting..." : "हटा रहा है..."}
                                        </>
                                    ) : (
                                        language === "english" ? "Confirm" : "पुष्टि करें"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* IO Allocation Modal */}
            {isIOModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xs shadow-2xl w-full max-w-md border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                                <IoPersonOutline className="text-emerald-600" size={24} />
                                {language === "english" ? "Allocate IO Officer" : "आईओ अधिकारी आवंटित करें"}
                            </h2>
                            <button
                                onClick={() => setIsIOModalOpen(false)}
                                className="text-emerald-400 hover:text-emerald-600 p-1 hover:bg-emerald-200 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleAllocateIO} className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-800">
                                    {language === "english" ? "IO Officer Name" : "आईओ अधिकारी का नाम"}
                                </label>
                                <input
                                    type="text"
                                    value={ioOfficerName}
                                    onChange={(e) => setIoOfficerName(e.target.value)}
                                    placeholder={language === "english" ? "Enter officer name..." : "अधिकारी का नाम दर्ज करें..."}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-900 font-medium"
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-4 bg-emerald-50 p-4 rounded-xs border border-emerald-100">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <MdOutlineTrackChanges className="text-emerald-600" />
                                </div>
                                <p className="text-[11px] text-emerald-800 leading-tight font-medium">
                                    {language === "english" ? "Allocating an IO officer will be recorded in the timeline. This helps track who is responsible for this case." : "आईओ अधिकारी को आवंटित करना टाइमलाइन में दर्ज किया जाएगा। यह ट्रैक करने में मदद करता है कि इस मामले के लिए कौन जिम्मेदार है।"}
                                </p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsIOModalOpen(false)}
                                    className="px-5 py-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors"
                                >
                                    {language === "english" ? "Cancel" : "रद्द करें"}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAllocatingIO}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xs font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isAllocatingIO ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            {language === "english" ? "Allocating..." : "आवंटित कर रहा है..."}
                                        </>
                                    ) : (
                                        language === "english" ? "Allocate Officer" : "अधिकारी आवंटित करें"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}