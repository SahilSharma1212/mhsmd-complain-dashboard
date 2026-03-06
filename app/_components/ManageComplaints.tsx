'use client'
import { IoMdSearch } from 'react-icons/io'
import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast';
import axios from 'axios';
import { useUserStore } from '../_store/userStore';
import { MdNavigateNext, MdNavigateBefore, MdAttachFile } from 'react-icons/md';
import { IoLayersOutline, IoFilterOutline, IoReloadOutline, IoTrashOutline, IoExpand, IoCloseOutline } from 'react-icons/io5';
import { CgNotes } from 'react-icons/cg';
import { Complaint, COMPLAINT_STATUS_COLORS, COMPLAINT_STATUSES } from '../types';
import Link from 'next/link';
import { useLanguageStore } from '../_store/languageStore';
import { useComplaintStore } from '../_store/complaintStore';
import { isKrutidev, convertKrutidevToUnicode } from '../_utils/krutidevConverter';
import { RxReset } from 'react-icons/rx';

export default function ManageComplaints() {
    const { user, thana, setCurrentlyViewingComplaint } = useUserStore();
    const {
        complaints,
        totalCount,
        currentPage,
        filterAttribute: cachedFilterAttribute,
        filterValue: cachedFilterValue,
        lastFetched,
        setCachedData,
        clearCache
    } = useComplaintStore();
    const { language } = useLanguageStore();

    // ─── Search & Pagination state ───
    const [filterAttribute, setFilterAttribute] = useState(cachedFilterAttribute);
    const [filterValue, setFilterValue] = useState(cachedFilterValue);
    const [searchLoading, setSearchLoading] = useState(false);
    const [krutiConvertedValue, setKrutiConvertedValue] = useState<string | null>(null);
    const isFetchingRef = useRef(false);
    const pageSize = 20;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const fetchComplaints = useCallback(async (page = 1, filter = "", value = "", force = false) => {
        if (isFetchingRef.current && !force) return;

        isFetchingRef.current = true;
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
                const normalizedData = Array.isArray(complaintData) ? complaintData : [complaintData];
                setCachedData({
                    complaints: normalizedData,
                    totalCount: response.data.totalCount ?? 0,
                    currentPage: page,
                    filterAttribute: filter,
                    filterValue: value
                });
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
            isFetchingRef.current = false;
        }
    }, [setCachedData]);

    // Initial load with caching logic
    useEffect(() => {
        const CACHE_DURATION = 5 * 60 * 1000;
        const isCacheValid = lastFetched && (Date.now() - lastFetched < CACHE_DURATION);
        if (user && (!complaints || !isCacheValid)) {
            fetchComplaints(currentPage, filterAttribute, filterValue);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Reset filterValue when changing filterAttribute
    useEffect(() => {
        setFilterValue("");
        setKrutiConvertedValue(null);
    }, [filterAttribute]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setKrutiConvertedValue(null);

        if (filterAttribute && !filterValue) {
            toast.error("Please enter a value for the selected filter");
            return;
        }

        let searchQuery = filterValue;

        // Only attempt Krutidev detection on free-text fields
        const isTextField = filterAttribute === "complainant_name" || filterAttribute === "accused";

        if (isTextField && isKrutidev(searchQuery)) {
            const converted = convertKrutidevToUnicode(searchQuery);
            setKrutiConvertedValue(converted);
            toast.success(
                language === "english"
                    ? `Krutidev detected → searching: "${converted}"`
                    : `कृतिदेव पहचाना → खोज: "${converted}"`,
                { duration: 3500, icon: "🔤" }
            );
            searchQuery = converted;
            setFilterValue(converted);
        }

        fetchComplaints(1, filterAttribute, searchQuery);
    };

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        fetchComplaints(page, filterAttribute, filterValue);
    };

    const handleRefresh = () => {
        setFilterAttribute("");
        setFilterValue("");
        setKrutiConvertedValue(null);
        clearCache();
        fetchComplaints(1, "", "", true);
    };

    const complaintStatusColors = COMPLAINT_STATUS_COLORS;

    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
    const [complaintToUpdateStatus, setComplaintToUpdateStatus] = useState<Complaint | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const handleStatusChange = async (id: string, status: string) => {
        if (updatingStatusId) return;
        setUpdatingStatusId(id);
        try {
            const response = await axios.patch("/api/complaint", { id, status });
            if (response.data.success) {
                toast.success(language === "english" ? "Status updated" : "स्थिति अपडेट हुई");
                if (complaints) {
                    const updatedComplaints = complaints.map((c) =>
                        c.id === id ? { ...c, status: status } : c
                    );
                    setCachedData({ complaints: updatedComplaints, totalCount, currentPage, filterAttribute, filterValue });
                }
                setShowStatusUpdateModal(false);
                setComplaintToUpdateStatus(null);
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const statusCode = error.response?.status;
                const message = error.response?.data?.message;
                if (statusCode === 401) {
                    toast.error(language === "english" ? "Session expired. Please log in again." : "सत्र समाप्त हो गया है। कृपया पुनः लॉग इन करें।");
                } else if (statusCode === 403) {
                    toast.error(
                        message === "You are not authorised for this complaint"
                            ? language === "english" ? "You don't have access to this complaint." : "आपके पास इस शिकायत तक पहुंच नहीं है।"
                            : language === "english" ? "Action not allowed." : "कार्रवाई की अनुमति नहीं है।"
                    );
                } else if (statusCode === 404) {
                    toast.error(language === "english" ? "Complaint not found." : "शिकायत नहीं मिली।");
                } else if (statusCode === 400) {
                    toast.error(language === "english" ? "Invalid request. Check the status value." : "अमान्य अनुरोध। स्थिति मान की जाँच करें।");
                } else {
                    toast.error(language === "english" ? "Something went wrong. Try again." : "कुछ गलत हो गया। कृपया पुनः प्रयास करें।");
                }
            } else {
                toast.error(language === "english" ? "Network error. Check your connection." : "नेटवर्क त्रुटि। अपना कनेक्शन जांचें।");
            }
            console.error(error);
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const handleDeleteComplaint = async (id: string) => {
        if (user?.role !== 'SP' && user?.role !== 'ASP' && user?.role !== 'SDOP') {
            toast.error(language === "english" ? "Only SP users can delete complaints" : "केवल SP उपयोगकर्ता ही शिकायतें हटा सकते हैं");
            return;
        }
        setDeletingId(id);
        try {
            const response = await axios.delete(`/api/complaint?id=${id}`);
            if (response.data.success) {
                toast.success(language === "english" ? "Complaint deleted successfully" : "शिकायत सफलतापूर्वक हटा दी गई");
                if (complaints) {
                    const updatedComplaints = complaints.filter((c) => c.id !== id);
                    setCachedData({ complaints: updatedComplaints, totalCount: totalCount - 1, currentPage, filterAttribute, filterValue });
                }
                setShowDeleteConfirm(null);
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || language === "english" ? "Failed to delete complaint" : "शिकायत हटाने में विफल");
            } else {
                toast.error(language === "english" ? "Failed to delete complaint" : "शिकायत हटाने में विफल");
            }
            console.error(error);
        } finally {
            setDeletingId(null);
        }
    };

    // Determine if current filter supports Krutidev input
    const isKrutidevEligibleField = filterAttribute === "complainant_name" || filterAttribute === "accused";

    return (
        <div className='w-full bg-white rounded-xs border border-slate-200 shadow-sm overflow-hidden flex flex-col'>
            {/* Header Section */}
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-white">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-xs flex items-center justify-center border border-blue-100">
                        <IoLayersOutline className="text-blue-600 text-lg" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            {language === "english" ? "Complaint Registry" : "शिकायत रजिस्टर"}
                        </h2>
                        <span className='text-[10px] font-bold text-slate-500 uppercase tracking-widest'>
                            {language === "english" ? "TOTAL" : "कुल"} • {totalCount}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        className='p-2 rounded-xs bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-white transition-all cursor-pointer shadow-xs group'
                        title="Refresh Registry"
                    >
                        <IoReloadOutline size={18} className="group-active:rotate-180 transition-transform duration-500" />
                    </button>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold tracking-tight uppercase">
                        {language === "english" ? "Admin View" : "प्रशासक दृश्य"}
                    </span>
                </div>
            </div>

            <div className='p-6 flex flex-col gap-6'>
                {/* SEARCH FORM */}
                <form onSubmit={handleSearch} className='flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end justify-start gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xs'>
                    <div className='flex flex-col gap-1.5 w-full sm:w-auto'>
                        <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5'>
                            <IoFilterOutline className="text-blue-500" />
                            {language === "english" ? "Filter By" : "फिल्टर"}
                        </label>
                        <select
                            value={filterAttribute}
                            onChange={(e) => setFilterAttribute(e.target.value)}
                            className='w-full sm:w-[200px] px-3 py-2 bg-white border border-slate-200 rounded-xs text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all'
                        >
                            <option value="">{language === "english" ? "-- Select Attribute --" : "-- विशेषता चुनें --"}</option>
                            <option value="status">{language === "english" ? "Status" : "स्टेटस"}</option>
                            <option value="id">{language === "english" ? "ID / Serial No." : "ID / सीरियल नंबर"}</option>
                            <option value="complainant_name">{language === "english" ? "Name of Complainer" : "शिकायतकर्ता का नाम"}</option>
                            <option value="accused">{language === "english" ? "Accused (आरोपी)" : "आरोपी"}</option>
                            {(user?.role === 'SP' || user?.role === 'ASP' || user?.role === 'SDOP') && (
                                <option value="allocated_thana">{language === "english" ? "Search by Thana" : "थाना द्वारा खोजें"}</option>
                            )}
                            {user?.role !== 'TI' && user?.role !== 'SP' && user?.role !== 'ASP' && user?.role !== 'SDOP' && (
                                <option value="role_addressed_to">{language === "english" ? "Addressed To" : "किसको संबोधित"}</option>
                            )}
                        </select>
                    </div>

                    <div className='flex flex-col gap-1.5 flex-1 min-w-0 sm:min-w-[300px]'>
                        <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5'>
                            {language === "english" ? "Search Value" : "खोज"}
                            {/* Krutidev support badge — shown only on eligible fields */}
                            {isKrutidevEligibleField && (
                                <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[9px] font-bold text-blue-600 uppercase tracking-wider">
                                    <span>🔤</span> Krutidev supported
                                </span>
                            )}
                        </label>
                        <div className='flex flex-col gap-1.5'>
                            <div className='flex group'>
                                {filterAttribute === "status" ? (
                                    <select
                                        value={filterValue}
                                        onChange={(e) => setFilterValue(e.target.value)}
                                        className='flex-1 px-4 py-2 bg-white border border-slate-200 rounded-l-xs text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all min-w-0'
                                    >
                                        <option value="">{language === "english" ? "-- Select Status --" : "-- स्टेटस चुनें --"}</option>
                                        {COMPLAINT_STATUSES.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                ) : filterAttribute === "allocated_thana" ? (
                                    <select
                                        value={filterValue}
                                        onChange={(e) => setFilterValue(e.target.value)}
                                        className='flex-1 px-4 py-2 bg-white border border-slate-200 rounded-l-xs text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all min-w-0'
                                    >
                                        <option value="">{language === "english" ? "ALL" : "सभी"}</option>
                                        {thana?.map((th, idx) => (
                                            <option key={idx} value={th.name}>{th.name}</option>
                                        ))}
                                    </select>
                                ) : filterAttribute === "role_addressed_to" ? (
                                    <select
                                        value={filterValue}
                                        onChange={(e) => setFilterValue(e.target.value)}
                                        className='flex-1 px-4 py-2 bg-white border border-slate-200 rounded-l-xs text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all min-w-0'
                                    >
                                        <option value="">{language === "english" ? "-- Select Role --" : "-- भूमिका चुनें --"}</option>
                                        <option value="SP">SP</option>
                                        <option value="TI">TI</option>
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={filterValue}
                                        onChange={(e) => {
                                            setFilterValue(e.target.value);
                                            setKrutiConvertedValue(null); // clear badge on new input
                                        }}
                                        className='flex-1 px-4 py-2 bg-white border border-slate-200 rounded-l-xs text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all min-w-0'
                                        placeholder={
                                            !filterAttribute
                                                ? 'Select an attribute first'
                                                : isKrutidevEligibleField
                                                    ? language === 'english'
                                                        ? 'Type in Hindi or Krutidev font…'
                                                        : 'हिंदी या कृतिदेव में टाइप करें…'
                                                    : 'Type to search records...'
                                        }
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
                                {/* Reset Button */}
                                <button
                                    type="button"
                                    onClick={handleRefresh}
                                    title={language === "english" ? "Reset Filters" : "फिल्टर रीसेट करें"}
                                    className='px-3 py-2 ml-2 bg-red-600 text-white hover:bg-red-700 border border-red-600 rounded-xs text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center shadow-xs'
                                >
                                    <RxReset size={14} strokeWidth={1} />
                                </button>
                            </div>
                        </div>
                    </div>
                </form>

                {/* TABLE CONTAINER */}
                <div className='w-full overflow-x-auto border border-slate-200 rounded-xs bg-white shadow-xs'>
                    <table className='w-full text-left border-collapse text-sm' style={{ minWidth: '1000px' }}>
                        <thead>
                            <tr className='bg-slate-50 border-b border-slate-200'>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest'>ID</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest'>{language === "english" ? "Complainant" : "शिकायतकर्ता"}</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center'>{language === "english" ? "Letter Date" : "पत्र तिथि"}</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center'>{language === "english" ? "Letter To" : "पत्र किसको"}</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest'>{language === "english" ? "Jurisdiction" : "अधिकार क्षेत्र"}</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest'>{language === "english" ? "Subject & Details" : "विषय और विवरण"}</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest'>{language === "english" ? "Accused" : "आरोपी"}</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center'>{language === "english" ? "Source" : "स्रोत"}</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center'>{language === "english" ? "Files" : "फाइलें"}</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center'>{language === "english" ? "Status" : "स्टेटस"}</th>
                                <th className='px-4 py-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center'>{language === "english" ? "Actions" : "एक्शन"}</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-slate-100'>
                            {searchLoading ? (
                                Array.from({ length: 8 }).map((_, idx) => (
                                    <tr key={idx} className="animate-pulse">
                                        {Array.from({ length: 11 }).map((_, i) => (
                                            <td key={i} className="px-4 py-4"><div className="h-2 bg-slate-50 rounded-full w-full"></div></td>
                                        ))}
                                    </tr>
                                ))
                            ) : complaints?.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className='text-center py-16'>
                                        <div className='flex flex-col items-center gap-2 opacity-20'>
                                            <IoLayersOutline size={48} />
                                            <p className='text-sm font-bold uppercase tracking-widest'>{language === "english" ? "No records found in database" : "डेटाबेस में कोई रिकॉर्ड नहीं मिला"}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                complaints?.map((complaint) => (
                                    <tr key={complaint.id} className='hover:bg-slate-50/50 transition-colors group'>
                                        {/* ID */}
                                        <td className='px-4 py-4'>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`w-2 h-2 rounded-full shrink-0 ${complaint.feedback?.trim() ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]'}`}
                                                    title={complaint.feedback?.trim() ? (language === "english" ? "Feedback Received" : "प्रतिक्रिया प्राप्त हुई") : (language === "english" ? "Pending Feedback" : "प्रतिक्रिया लंबित")}
                                                />
                                                <span className="text-[10px] font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100" title={complaint.id}>
                                                    #{String(complaint.id).slice(0, 8)}
                                                </span>
                                            </div>
                                        </td>
                                        {/* Complainer */}
                                        <td className='px-4 py-4'>
                                            <div className='flex flex-col'>
                                                <span className='text-xs font-bold text-slate-900 truncate max-w-[120px]' title={complaint.complainant_name}>
                                                    {complaint.complainant_name}
                                                </span>
                                                <span className='text-[10px] font-semibold text-slate-600'>{complaint.complainant_contact}</span>
                                            </div>
                                        </td>
                                        {/* Date */}
                                        <td className="px-4 py-4 text-center">
                                            <span className='text-[11px] font-bold text-slate-800 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full'>
                                                {new Date(complaint.date || complaint.created_at!).toISOString().split("T")[0]}
                                            </span>
                                        </td>
                                        {/* Addressed To */}
                                        <td className='px-4 py-4 text-center'>
                                            <p className='text-white bg-slate-800 rounded-lg w-fit mx-auto px-2 py-0.5 uppercase tracking-tighter'>
                                                {complaint.role_addressed_to}
                                            </p>
                                        </td>
                                        {/* Thana */}
                                        <td className='px-4 py-4'>
                                            <span className='text-xs font-bold text-slate-700 truncate max-w-[100px] block' title={complaint.allocated_thana}>
                                                {complaint.allocated_thana}
                                            </span>
                                        </td>
                                        {/* Subject & Description */}
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
                                                    className='p-1.5 bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-white rounded-xs transition-all cursor-pointer shadow-xs group shrink-0'
                                                    title="View Full Details"
                                                >
                                                    <IoExpand size={14} />
                                                </button>
                                            </div>
                                        </td>
                                        {/* Accused */}
                                        <td className='px-4 py-4'>
                                            <span className='text-xs font-medium text-slate-700 truncate max-w-[120px] block' title={complaint.accused_details || ''}>
                                                {complaint.accused_details || <span className='text-slate-300 text-[10px] font-bold'>—</span>}
                                            </span>
                                        </td>
                                        {/* Source */}
                                        <td className='px-4 py-4 text-center'>
                                            <span className='text-[10px] font-bold text-slate-600 uppercase tracking-widest'>
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
                                                <span className="text-[10px] font-bold text-slate-200">{language === "english" ? "NONE" : "कोई नहीं"}</span>
                                            )}
                                        </td>
                                        {/* Status */}
                                        <td className='px-4 py-4 text-center'>
                                            <div className="inline-block relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setComplaintToUpdateStatus(complaint);
                                                        setShowStatusUpdateModal(true);
                                                    }}
                                                    className="inline-flex items-center px-3 py-1 rounded-xs text-[10px] font-bold cursor-pointer whitespace-nowrap uppercase tracking-wider shadow-xs hover:contrast-125 transition-all outline-none"
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
                                                {(user?.role === 'SP' || user?.role === 'ASP' || user?.role === 'SDOP') && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(complaint.id!); }}
                                                        className='w-8 h-8 flex items-center justify-center text-red-500 hover:text-white hover:bg-red-600 rounded-xs transition-all border border-red-100 bg-red-50 shadow-xs'
                                                        title="Permanently Delete">
                                                        <IoTrashOutline size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ─── Pagination Controls ─── */}
                {
                    totalPages > 1 && (
                        <div className='flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-6 px-2 gap-4'>
                            <p className='text-[10px] font-bold text-slate-600 uppercase tracking-widest'>
                                {language === "english" ? "Showing" : "दिखा रहा है"} <span className='text-slate-900'>page {currentPage}</span> {language === "english" ? "of" : "का"} {totalPages}
                            </p>
                            <div className='flex flex-wrap justify-center items-center gap-2'>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1 || searchLoading}
                                    className='flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xs border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs'
                                >
                                    <MdNavigateBefore size={16} /> {language === "english" ? "Prev" : "पिछला"}
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
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
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
                                    {language === "english" ? "Next" : "अगला"} <MdNavigateNext size={16} />
                                </button>
                            </div>
                        </div>
                    )
                }
            </div>

            {/* DELETE CONFIRMATION MODAL */}
            {
                showDeleteConfirm && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xs border border-slate-200 shadow-2xl p-6 max-w-sm w-full scale-in-center overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-red-50 rounded-xs flex items-center justify-center border border-red-100">
                                    <IoTrashOutline className="text-red-600 text-xl" />
                                </div>
                                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{language === "english" ? "Authorize Deletion?" : "हटाने के लिए अधिकृत करें?"}</h2>
                            </div>
                            <p className="text-[11px] font-medium text-slate-600 leading-relaxed mb-6">
                                {language === "english" ? "This action will permanently remove the complaint record from the system database. This process is irreversible and all associated data will be purged." : "यह कार्रवाई शिकायत रिकॉर्ड को सिस्टम डेटाबेस से स्थायी रूप से हटा देगी। यह प्रक्रिया अपरिवर्तनीय है और सभी संबंधित डेटा को हटा दिया जाएगा।"}
                            </p>
                            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="px-4 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:bg-slate-50 rounded-xs transition-colors"
                                >
                                    {language === "english" ? "Abort" : "रद्द करें"}
                                </button>
                                <button
                                    onClick={() => handleDeleteComplaint(showDeleteConfirm)}
                                    disabled={deletingId !== null}
                                    className="px-5 py-2 text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 uppercase tracking-widest rounded-xs transition-all shadow-lg shadow-red-500/20 disabled:opacity-70 flex items-center gap-2"
                                >
                                    {deletingId ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {language === "english" ? "Processing..." : "प्रसंस्करण..."}
                                        </>
                                    ) : (
                                        language === "english" ? "Confirm Purge" : "हटाने की पुष्टि करें"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* FULL DETAILS MODAL */}
            {
                showDetailsModal && selectedComplaint && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xs border border-slate-200 shadow-2xl w-full max-w-2xl scale-in-center overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xs flex items-center justify-center border border-blue-100">
                                        <IoLayersOutline className="text-blue-600 text-xl" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{language === "english" ? "Complaint Detailed View" : "शिकायत का विस्तृत दृश्य"}</h2>
                                        <span className="text-[10px] font-mono text-slate-600">#{selectedComplaint.id}</span>
                                    </div>
                                </div>
                                <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-slate-50 rounded-xs text-slate-600 hover:text-slate-600 transition-colors">
                                    <IoCloseOutline size={24} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{language === "english" ? "Complainant Name" : "शिकायतकर्ता का नाम"}</p>
                                        <p className="text-sm font-bold text-slate-900 bg-slate-50 p-2 rounded-xs border border-slate-100 italic">{selectedComplaint.complainant_name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{language === "english" ? "Contact Number" : "संपर्क नंबर"}</p>
                                        <p className="text-sm font-bold text-slate-900 bg-slate-50 p-2 rounded-xs border border-slate-100">{selectedComplaint.complainant_contact}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{language === "english" ? "Reporting Date" : "रिपोर्टिंग तिथि"}</p>
                                        <p className="text-sm font-bold text-slate-900 bg-slate-50 p-2 rounded-xs border border-slate-100">
                                            {new Date(selectedComplaint.date || selectedComplaint.created_at!).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{language === "english" ? "Addressed To" : "किसको संबोधित"}</p>
                                        <span className="inline-block px-3 py-1 bg-slate-800 text-white text-sm font-bold uppercase tracking-widest">{selectedComplaint.role_addressed_to}</span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{language === "english" ? "Subject Reference" : "विषय संदर्भ"}</p>
                                    <div className="bg-blue-50/10 border border-blue-100 p-4 rounded-xs">
                                        <p className="text-sm font-bold text-slate-800 leading-relaxed">{selectedComplaint.subject}</p>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{language === "english" ? "Complaint Message" : "शिकायत संदेश"}</p>
                                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xs min-h-[80px]">
                                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedComplaint.message || "— No detailed message provided —"}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{language === "english" ? "Current Jurisdiction" : "वर्तमान अधिकार क्षेत्र"}</p>
                                        <p className="text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded-xs border border-slate-100">{selectedComplaint.allocated_thana || "Unallocated"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{language === "english" ? "Current Status" : "वर्तमान स्थिति"}</p>
                                        <span className="inline-flex items-center px-3 py-1 rounded-xs text-[10px] font-bold uppercase tracking-wider shadow-xs"
                                            style={{
                                                color: complaintStatusColors[selectedComplaint.status]?.text,
                                                backgroundColor: complaintStatusColors[selectedComplaint.status]?.bg,
                                                border: `1px solid ${complaintStatusColors[selectedComplaint.status]?.text}20`
                                            }}>
                                            {selectedComplaint.status}
                                        </span>
                                    </div>
                                </div>
                                {selectedComplaint.file_urls && selectedComplaint.file_urls.length > 0 && (
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{language === "english" ? "Attached Documentation" : "संलग्न दस्तावेज़ीकरण"}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedComplaint.file_urls.map((url, idx) => (
                                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xs text-[10px] font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-xs">
                                                    <MdAttachFile size={16} className="text-blue-500" />
                                                    {language === "english" ? "VIEW DOCUMENT" : "दस्तावेज़ देखें"} {idx + 1}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="pt-6 border-t border-slate-100 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${selectedComplaint.feedback?.trim() ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.3)]' : 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.3)]'}`} />
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{language === "english" ? "User Feedback" : "उपयोगकर्ता प्रतिक्रिया"}</p>
                                    </div>
                                    <div className={`p-4 rounded-xs border transition-all duration-300 ${selectedComplaint.feedback?.trim() ? 'bg-emerald-50/40 border-emerald-100 shadow-sm' : 'bg-slate-50/50 border-slate-100'}`}>
                                        <p className={`text-sm leading-relaxed ${selectedComplaint.feedback?.trim() ? 'text-emerald-900 font-medium' : 'text-slate-500 italic'}`}>
                                            {selectedComplaint?.feedback?.trim() || (language === "english" ? "No feedback has been submitted for this complaint yet." : "इस शिकायत के लिए अभी तक कोई प्रतिक्रिया नहीं दी गई है।")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 sticky bottom-0">
                                <button onClick={() => setShowDetailsModal(false)} className="px-6 py-2 bg-white border border-slate-200 rounded-xs text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xs">
                                    {language === "english" ? "Dismiss" : "बंद करें"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* STATUS UPDATE MODAL */}
            {
                showStatusUpdateModal && complaintToUpdateStatus && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-110 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xs border border-slate-200 shadow-2xl w-full max-w-sm scale-in-center overflow-hidden flex flex-col">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${complaintStatusColors[complaintToUpdateStatus.status]?.bg}` }}>
                                        <IoReloadOutline className="text-xl" style={{ color: `${complaintStatusColors[complaintToUpdateStatus.status]?.text}` }} />
                                    </div>
                                    <div>
                                        <h2 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">{language === "english" ? "Update Status" : "स्थिति अपडेट करें"}</h2>
                                        <p className="text-[9px] font-mono text-slate-500">#{String(complaintToUpdateStatus.id).slice(0, 12)}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowStatusUpdateModal(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                    <IoCloseOutline size={20} />
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xs">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{language === "english" ? "Current Status" : "वर्तमान स्थिति"}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: complaintStatusColors[complaintToUpdateStatus.status]?.indicatorColor }} />
                                        <span className="text-xs font-bold text-slate-900 uppercase">{complaintToUpdateStatus.status}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">{language === "english" ? "Select New Status" : "नई स्थिति चुनें"}</p>
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {Object.keys(complaintStatusColors).map((status) => (
                                            <button
                                                key={status}
                                                disabled={updatingStatusId !== null}
                                                onClick={() => complaintToUpdateStatus && handleStatusChange(complaintToUpdateStatus.id!, status)}
                                                className={`group relative flex items-center justify-between px-4 py-2.5 rounded-xs border transition-all duration-200 ${complaintToUpdateStatus?.status === status ? 'bg-slate-50 border-slate-300 ring-2 ring-blue-500/10' : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-xs'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full ring-4 ring-white shadow-sm" style={{ backgroundColor: complaintStatusColors[status].indicatorColor }} />
                                                    <span className={`text-[11px] font-bold tracking-tight ${complaintToUpdateStatus.status === status ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>{status}</span>
                                                </div>
                                                {complaintToUpdateStatus.status === status && (
                                                    <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full uppercase tracking-widest">{language === "english" ? "Active" : "सक्रिय"}</span>
                                                )}
                                                {updatingStatusId === complaintToUpdateStatus.id && (
                                                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-xs">
                                                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                                <button onClick={() => setShowStatusUpdateModal(false)} className="px-4 py-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:text-slate-900 transition-colors">
                                    {language === "english" ? "Close" : "बंद करें"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}