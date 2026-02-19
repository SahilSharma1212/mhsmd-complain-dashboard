'use client'
import { IoMdSearch } from 'react-icons/io'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Complaint, Thana } from '../types';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useUserStore } from '../_store/userStore';
import { FcRefresh } from 'react-icons/fc';
import { MdNavigateNext, MdNavigateBefore, MdDeleteOutline, MdNote, MdAttachFile, MdClose, MdPictureAsPdf, MdImage } from 'react-icons/md';
import { CgNotes } from 'react-icons/cg';
export default function SPComplaintSection() {

    const [activeTab, setActiveTab] = useState("manage");
    const [loading, setLoading] = useState(false);
    const [addThanaLoading, setAddThanaLoading] = useState(false);
    const [allocateThanaLoading, setAllocateThanaLoading] = useState(false);
    const [complaintDetails, setComplaintDetails] = useState<Complaint>({
        role_addressed_to: "",
        recipient_address: "",
        subject: "",
        date: "",
        current_status: "",
        name_of_complainer: "",
        complainer_contact_number: "",
        allocated_thana: "",
        submitted_by: "",
        description: "",
    });
    const [addThanaDetails, setAddThanaDetails] = useState({
        name: "",
        pin_code: "",
        city: "",
        contact_number: "",
    })

    const [thanaAdminInfo, setThanaAdminInfo] = useState({
        thana: "",
        name: "",
        email: "",
        contact_number: "",
    })
    const { thana, user, complaints, setComplaints } = useUserStore();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─── Search & Pagination state ───
    const [filterAttribute, setFilterAttribute] = useState("");
    const [filterValue, setFilterValue] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchLoading, setSearchLoading] = useState(false);
    const pageSize = 20;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const allocateThanaTI = async () => {
        setAllocateThanaLoading(true);
        if (!thanaAdminInfo.name || !thanaAdminInfo.email || !thanaAdminInfo.contact_number || !thanaAdminInfo.thana) {
            toast.error("Please fill all the fields");
            setAllocateThanaLoading(false);
            return;
        }
        try {
            const response = await axios.post("/api/thana/allocate-ti", thanaAdminInfo);
            if (response.data.success) {
                toast.success("Thana allocated successfully");
                setThanaAdminInfo({
                    name: "",
                    email: "",
                    contact_number: "",
                    thana: "",
                });
            }
        } catch (error) {
            toast.error("Failed to allocate thana");
        } finally {
            setAllocateThanaLoading(false);
        }
    }

    const addThana = async () => {
        setAddThanaLoading(true);
        if (!addThanaDetails.name || !addThanaDetails.pin_code || !addThanaDetails.city || !addThanaDetails.contact_number) {
            toast.error("Please fill all the fields");
            return;
        }
        try {
            const response = await axios.post("/api/thana", addThanaDetails);
            if (response.data.success) {
                toast.success("Thana added successfully");
                setAddThanaDetails({
                    name: "",
                    pin_code: "",
                    city: "",
                    contact_number: "",
                });
            }
        } catch (error) {
            toast.error("Failed to add thana");
        } finally {
            setAddThanaLoading(false);
        }
    }

    const submitComplaint = async () => {
        setLoading(true);

        if (!complaintDetails.role_addressed_to || !complaintDetails.recipient_address || !complaintDetails.subject || !complaintDetails.date || !complaintDetails.name_of_complainer || !complaintDetails.complainer_contact_number || !complaintDetails.allocated_thana) {
            toast.error("Please fill all the required fields");
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            // ✅ Fix — only lowercase specific fields, not enums
            Object.entries(complaintDetails).forEach(([key, value]) => {
                const enumFields = ['role_addressed_to', 'current_status'];
                const processed = enumFields.includes(key)
                    ? value.trim().toUpperCase()   // keep enums uppercase
                    : value.trim().toLowerCase();
                formData.append(key, processed);
            });

            selectedFiles.forEach((file) => {
                formData.append("files", file);
            });

            const response = await axios.post("/api/complaint", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.success) {
                toast.success("Complaint submitted successfully");
                setComplaintDetails({
                    role_addressed_to: "",
                    recipient_address: "",
                    subject: "",
                    date: "",
                    current_status: "",
                    name_of_complainer: "",
                    complainer_contact_number: "",
                    allocated_thana: "",
                    submitted_by: "",
                    description: "",
                });
                setSelectedFiles([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || "Failed to submit complaint");
            } else {
                toast.error("Failed to submit complaint");
            }
        } finally {
            setLoading(false);
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const validFiles = newFiles.filter(file => {
                const isValid = file.type.startsWith('image/') || file.type === 'application/pdf';
                if (!isValid) toast.error(`${file.name} is not a valid format (Image or PDF only)`);
                return isValid;
            });
            setSelectedFiles(prev => [...prev, ...validFiles]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

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
                        c.id === id ? { ...c, current_status: status } : c
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

    const tabs = [
        { id: "manage", label: "Manage Complaints", color: "#7a00b3" },
        { id: "register", label: "Register Complaint", color: "#0000ff" },
        { id: "admin", label: "Admin Actions", color: "#06a600" },
    ];
    return (
        <div className='bg-white p-2 rounded-lg w-full flex flex-col gap-2 items-start'>

            {/* TABS SECTION FOR SP */}
            {user?.role === "SP" && (
                <div className="relative flex border-b border-gray-300 w-full">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3 text-sm font-medium transition-colors duration-200`}
                            style={{
                                color: activeTab === tab.id ? tab.color : "#000000",
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}

                    {/* Active Indicator */}
                    <div
                        className={`absolute bottom-0 h-[2px] bg-blue-600 transition-all duration-300`}
                        style={{
                            width: "33.33%",
                            left:
                                activeTab === "manage"
                                    ? "0%"
                                    : activeTab === "register"
                                        ? "33.33%"
                                        : "66.66%",
                            backgroundColor:
                                activeTab === "manage"
                                    ? "#dd00ff"
                                    : activeTab === "register"
                                        ? "#0000ff"
                                        : "#00ff00",
                        }}
                    />
                    <div
                        className={`absolute bottom-0 h-full w-full transition-all duration-300`}
                        style={{
                            width: "33.33%",
                            left:
                                activeTab === "manage"
                                    ? "0%"
                                    : activeTab === "register"
                                        ? "33.33%"
                                        : "66.66%",
                            backgroundColor:
                                activeTab === "manage"
                                    ? "#dd00ff05"
                                    : activeTab === "register"
                                        ? "#0000ff05"
                                        : "#00ff0005",
                        }}
                    />
                </div>
            )
            }

            {/* COMPLAINTS TABLE */}
            {
                (activeTab === "manage") && (
                    <div className='w-full px-3'>

                        {/* SEARCH FORM */}
                        <form onSubmit={handleSearch} className='py-3 flex flex-wrap items-end justify-start gap-3'>
                            <div className='flex flex-col gap-1'>
                                <label className='text-xs font-medium text-gray-500'>Filter By</label>
                                <select
                                    value={filterAttribute}
                                    onChange={(e) => setFilterAttribute(e.target.value)}
                                    className='p-2 rounded-md border border-gray-300 focus:border-gray-500 focus:outline-none text-sm min-w-[180px]'
                                >
                                    <option value="">-- Select Filter --</option>
                                    <option value="current_status">Status</option>
                                    <option value="name_of_complainer">Name of Complainer</option>
                                    <option value="role_addressed_to">Addressed To</option>
                                </select>
                            </div>

                            <div className='flex flex-col gap-1'>
                                <label className='text-xs font-medium text-gray-500'>Value</label>
                                <div className='flex'>
                                    {filterAttribute === "current_status" ? (
                                        <select
                                            value={filterValue}
                                            onChange={(e) => setFilterValue(e.target.value)}
                                            className='p-2 rounded-md rounded-r-none border border-gray-300 focus:border-gray-500 focus:outline-none text-sm min-w-[180px]'
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
                                            className='p-2 rounded-md rounded-r-none border border-gray-300 focus:border-gray-500 focus:outline-none text-sm min-w-[180px]'
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
                                            className='p-2 rounded-md rounded-r-none border border-gray-300 focus:border-gray-500 focus:outline-none text-sm min-w-[180px]'
                                            placeholder={filterAttribute ? 'Type to search...' : 'Select a filter first'}
                                            disabled={!filterAttribute}
                                        />
                                    )}
                                    <button
                                        type="submit"
                                        disabled={searchLoading}
                                        className='bg-blue-500 text-white p-2 rounded-md rounded-l-none border border-blue-500 hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50'
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

                        <h1 className='text-xl font-semibold text-gray-600 py-3 flex items-center justify-start gap-3'>
                            Complaints Table
                            <span className='text-sm font-normal text-gray-400'>({totalCount} total)</span>
                            <button onClick={handleRefresh} className='cursor-pointer border p-1 rounded-md hover:bg-blue-500/10 border-blue-500'><FcRefresh size={20} /></button>
                        </h1>
                        <div className='overflow-x-auto w-full'>
                            <table className='w-full min-w-[700px] text-left border-collapse'>
                                <thead>
                                    <tr className='bg-gray-50 border-b border-gray-200'>
                                        <th className='p-3 text-sm font-semibold text-gray-600'>Complaint ID</th>
                                        <th className='p-3 text-sm font-semibold text-gray-600'>Name of the Complainer</th>
                                        <th className='p-3 text-sm font-semibold text-gray-600'>Complaint Date</th>
                                        <th className='p-3 text-sm font-semibold text-gray-600'>Addressed To</th>
                                        <th className='p-3 text-sm font-semibold text-gray-600'>Thana</th>
                                        <th className='p-3 text-sm font-semibold text-gray-600'>Subject</th>
                                        <th className='p-3 text-sm font-semibold text-gray-600'>Description</th>
                                        <th className='p-3 text-sm font-semibold text-gray-600'>Documents</th>
                                        <th className='p-3 text-sm font-semibold text-gray-600 text-center'>Complaint Status</th>
                                        <th className='p-3 text-sm font-semibold text-gray-600 text-center'>Actions</th>
                                        <th className='p-3 text-sm font-semibold text-gray-600 text-center'>Logs</th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-gray-100'>
                                    {complaints?.map((complaint) => (
                                        <tr key={complaint.id} className='hover:bg-gray-50 cursor-pointer transition-colors'>
                                            <td className='p-3 text-sm text-gray-700 font-medium'>{complaint.id}</td>
                                            <td className='p-3 text-sm text-gray-700 font-medium'>{complaint.name_of_complainer}</td>
                                            <td className='p-3 text-sm text-gray-700'>{complaint.date}</td>
                                            <td className='p-3 text-sm text-gray-700'>{complaint.role_addressed_to}</td>
                                            <td className='p-3 text-sm text-gray-700'>{complaint.allocated_thana}</td>
                                            <td className='p-3 text-sm text-gray-700'>{complaint.subject}</td>
                                            <td className='p-3 text-sm text-gray-500'>{complaint.description}</td>
                                            <td className='p-3 text-sm text-gray-700'>
                                                <div className="flex gap-2 flex-wrap max-w-[150px]">
                                                    {complaint.docs_url && complaint.docs_url.length > 0 ? (
                                                        complaint.docs_url.map((url, index) => (
                                                            <a
                                                                key={index}
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded-full transition-colors flex items-center justify-center border border-transparent hover:border-blue-100"
                                                                title={`View Document ${index + 1}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <MdAttachFile size={18} />
                                                            </a>
                                                        ))
                                                    ) : (
                                                        <span className="text-gray-400 text-xs italic">None</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className='p-3 text-sm text-center'>
                                                <div ref={activeComplaintId === complaint.id ? popupRef : undefined} className="inline-block">
                                                    <div
                                                        onClick={(e) => {
                                                            if (activeComplaintId === complaint.id) {
                                                                setActiveComplaintId(null);
                                                                setPopupPosition(null);
                                                            } else {
                                                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                                setPopupPosition({ top: rect.top, left: rect.left + rect.width / 2 });
                                                                setActiveComplaintId(complaint.id || null);
                                                            }
                                                        }}
                                                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer"
                                                        style={{
                                                            color: complaintStatusColors[complaint.current_status]?.text,
                                                            backgroundColor: complaintStatusColors[complaint.current_status]?.bg,
                                                        }}
                                                    >
                                                        {updatingStatusId === complaint.id ? (
                                                            <span className="flex items-center gap-1">
                                                                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                                </svg>
                                                                Updating…
                                                            </span>
                                                        ) : complaint.current_status}
                                                    </div>

                                                    {activeComplaintId === complaint.id && popupPosition && (
                                                        <div
                                                            className='fixed p-2 flex flex-col items-center justify-center gap-1 bg-white/30 backdrop-blur-2xl shadow-lg rounded-md border border-gray-100 z-50 w-30'
                                                            style={{ top: popupPosition.top - 8, left: popupPosition.left, transform: 'translate(-50%, -100%)' }}
                                                        >
                                                            {Object.keys(complaintStatusColors).map((status) => (
                                                                <button
                                                                    key={status}
                                                                    disabled={updatingStatusId !== null}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleStatusChange(complaint.id!, status);
                                                                    }}
                                                                    className='w-full px-3 py-2 text-xs hover:bg-gray-50 rounded-md transition-colors text-center'
                                                                    style={{ color: complaintStatusColors[status].text, backgroundColor: complaintStatusColors[status].bg, borderRadius: '20px' }}
                                                                >
                                                                    {status}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className='p-3 text-sm text-center'>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowDeleteConfirm(complaint.id!);
                                                    }}
                                                    className='p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors'
                                                    title="Delete Complaint"
                                                >
                                                    <MdDeleteOutline size={20} />
                                                </button>
                                            </td>
                                            <td className='p-3 text-sm text-center'>
                                                <button
                                                    className='p-2 text-blue-500 hover:bg-red-50 rounded-full transition-colors'
                                                    title="Delete Complaint"
                                                >
                                                    <CgNotes size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
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
                    </div>
                )
            }

            {/* REGISTER COMPLAINTS TABLE */}
            {
                activeTab === "register" && user?.role === "SP" && (
                    <div className='w-full px-3'>
                        <div className='grid grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-4 w-full mt-5'>
                            <div className="flex flex-col items-start gap-2 justify-center">
                                <label htmlFor="name">Addressed to:</label>
                                <select
                                    value={complaintDetails.role_addressed_to}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, role_addressed_to: e.target.value })}
                                    id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' >
                                    <option value="">-- Select Recipient --</option>
                                    <option value="SP">SP</option>
                                    <option value="TI">TI</option>
                                </select>
                            </div>
                            <div className="flex flex-col items-start gap-2 justify-center">
                                <label htmlFor="name">Recipient Address</label>
                                <input
                                    value={complaintDetails.recipient_address}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, recipient_address: e.target.value })}
                                    placeholder="Enter recipient's address" type="text"
                                    id="name"
                                    className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' />
                            </div>
                            <div className="flex flex-col items-start gap-2 justify-center">
                                <label htmlFor="name">Subject</label>
                                <input
                                    value={complaintDetails.subject}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, subject: e.target.value })}
                                    placeholder="Enter complaint subject" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' />
                            </div>
                            <div className="flex flex-col items-start gap-2 justify-center">
                                <label htmlFor="name">Date</label>
                                <input
                                    type='date'
                                    value={complaintDetails.date}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, date: e.target.value })} id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' />
                            </div>
                            <div className="flex flex-col items-start gap-2 justify-center">
                                <label htmlFor="name">Name of Complainer</label>
                                <input
                                    value={complaintDetails.name_of_complainer}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, name_of_complainer: e.target.value })}
                                    placeholder="Enter full name" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' />
                            </div>
                            <div className="flex flex-col items-start gap-2 justify-center">
                                <label htmlFor="name">Mobile No. of Complainer</label>
                                <input
                                    value={complaintDetails.complainer_contact_number}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, complainer_contact_number: e.target.value })}
                                    placeholder="Enter 10-digit mobile number" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' />
                            </div>

                            <div className="flex flex-col items-start gap-2 justify-center">
                                <label htmlFor="name">Allocate to Thana</label>
                                <select
                                    value={complaintDetails.allocated_thana}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, allocated_thana: e.target.value })}
                                    id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' >

                                    <option value="">-- Select Thana --</option>
                                    {
                                        thana?.map((th: Thana, index: number) => (
                                            <option key={index} value={th.name}>{th.name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div className="flex flex-col items-start gap-2 justify-center col-span-3 max-lg:col-span-2 max-sm:col-span-1">
                                <label htmlFor="description">Description (Optional)</label>
                                <textarea
                                    value={complaintDetails.description}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, description: e.target.value })}
                                    placeholder="Enter detailed description of the complaint"
                                    id="description"
                                    rows={4}
                                    className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 focus:outline-none'
                                />
                            </div>
                            <div className="flex flex-col items-start gap-2 justify-center col-span-3 max-lg:col-span-2 max-sm:col-span-1 pt-4 mt-2">
                                <label className="font-semibold text-gray-700">Attachments (Optional)</label>
                                <div className="flex flex-wrap gap-4 w-full">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 transition-all cursor-pointer font-medium"
                                    >
                                        <MdAttachFile size={20} />
                                        Add Documents
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        multiple
                                        accept=".pdf,image/*"
                                        className="hidden"
                                    />
                                </div>

                                {selectedFiles.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 w-full mt-3">
                                        {selectedFiles.map((file, index) => (
                                            <div key={index} className="relative group flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="text-blue-500">
                                                    {file.type === 'application/pdf' ? <MdPictureAsPdf size={24} /> : <MdImage size={24} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-gray-700 truncate">{file.name}</p>
                                                    <p className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                                <button
                                                    onClick={() => removeFile(index)}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <MdClose size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <p className="text-[10px] text-gray-400 mt-1">* Only images and PDF files are allowed.</p>
                            </div>

                            <div className='w-full'>

                                <button
                                    onClick={submitComplaint}
                                    disabled={loading}
                                    className='w-full h-10 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none bg-blue-500 text-white hover:bg-blue-600 transition-colors cursor-pointer group flex items-center justify-center gap-2'
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit Complaint"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ADMIN ACTIONS */}
            {user?.role === "SP" &&
                activeTab === "admin" && user?.role === "SP" && (
                    <div className='w-full px-3'>

                        <div className='grid grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-4 w-full mt-5'>

                            {/* ADD THANA */}
                            <div className='flex flex-col items-start justify-start gap-3 border-gray-300 border bg-white shadow-lg p-3 rounded-lg'>
                                <h1 className='text-lg font-semibold text-gray-600 text-center'>Add a Thana</h1>
                                <div className='flex flex-col items-start gap-2 justify-center w-full mt-3'>
                                    <label htmlFor="name" className='text-gray-600'>Thana Name</label>
                                    <input
                                        value={addThanaDetails.name}
                                        onChange={(e) => setAddThanaDetails({ ...addThanaDetails, name: e.target.value })}
                                        placeholder="Enter Thana Name" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' />
                                </div>

                                <div className='flex flex-col items-start gap-2 justify-center w-full'>
                                    <label htmlFor="name" className='text-gray-600'>Thana Contact No.</label>
                                    <input
                                        value={addThanaDetails.contact_number}
                                        onChange={(e) => setAddThanaDetails({ ...addThanaDetails, contact_number: e.target.value })}
                                        placeholder="Enter Contact Number" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none' />
                                </div>

                                <div className='flex flex-col items-start gap-2 justify-center w-full'>
                                    <label htmlFor="name" className='text-gray-600'>City</label>
                                    <input
                                        value={addThanaDetails.city}
                                        onChange={(e) => setAddThanaDetails({ ...addThanaDetails, city: e.target.value })}
                                        placeholder="Enter City" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none' />
                                </div>

                                <div className='flex flex-col items-start gap-2 justify-center w-full'>
                                    <label htmlFor="name" className='text-gray-600'>Pin Code</label>
                                    <input
                                        value={addThanaDetails.pin_code}
                                        onChange={(e) => setAddThanaDetails({ ...addThanaDetails, pin_code: e.target.value })}
                                        placeholder="Enter Pin Code" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none' />
                                </div>
                                <button
                                    onClick={addThana}
                                    disabled={addThanaLoading}
                                    className='w-full h-10 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none bg-green-500 text-white hover:bg-green-600 transition-colors cursor-pointer'>{addThanaLoading ? "Adding..." : "Add Thana"}</button>
                            </div>

                            <div className='flex flex-col items-start justify-start gap-3 border-gray-300 border bg-white shadow-lg p-3 rounded-lg'>
                                <h1 className='text-lg font-semibold text-gray-600 text-center w-full'>Allocate TI</h1>
                                <div className='flex flex-col items-start gap-2 justify-center w-full mt-3'>
                                    <label htmlFor="name" className='text-gray-600'>Select Thana</label>
                                    <select
                                        id="name"
                                        value={thanaAdminInfo.thana}
                                        onChange={(e) => setThanaAdminInfo({ ...thanaAdminInfo, thana: e.target.value })}
                                        className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none'
                                    >
                                        <option value="">Select Thana</option>
                                        {thana?.map((th, index) => (
                                            <option key={index} value={th?.name}>
                                                {th?.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className='flex flex-col items-start gap-2 justify-center w-full'>
                                    <label htmlFor="name" className='text-gray-600'>Name</label>
                                    <input
                                        value={thanaAdminInfo.name}
                                        onChange={(e) => setThanaAdminInfo({ ...thanaAdminInfo, name: e.target.value })}
                                        placeholder="Enter TI Name" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none' />
                                </div>
                                <div className='flex flex-col items-start gap-2 justify-center w-full'>
                                    <label htmlFor="name" className='text-gray-600'>Contact No.</label>
                                    <input
                                        value={thanaAdminInfo.contact_number}
                                        onChange={(e) => setThanaAdminInfo({ ...thanaAdminInfo, contact_number: e.target.value })}
                                        placeholder="Enter Contact Number" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none' />
                                </div>
                                <div className='flex flex-col items-start gap-2 justify-center w-full'>
                                    <label htmlFor="name" className='text-gray-600'>Email</label>
                                    <input
                                        value={thanaAdminInfo.email}
                                        onChange={(e) => setThanaAdminInfo({ ...thanaAdminInfo, email: e.target.value })}
                                        placeholder="Enter Email Address" type="email" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none' />
                                </div>
                                <button onClick={allocateThanaTI} disabled={allocateThanaLoading} className='w-full h-10 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none bg-blue-500 text-white hover:bg-blue-600 transition-colors cursor-pointer'>{allocateThanaLoading ? "Allocating..." : "Submit"}</button>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* DELETE CONFIRMATION MODAL */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-100 scale-in-center">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Delete Complaint?</h2>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this complaint? This action cannot be undone.</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteComplaint(showDeleteConfirm)}
                                disabled={deletingId !== null}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
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
    )
}