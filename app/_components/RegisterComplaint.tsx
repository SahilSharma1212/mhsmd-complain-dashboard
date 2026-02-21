'use client'
import { useState, useRef } from 'react'
import { Complaint, Thana } from '../types';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useUserStore } from '../_store/userStore';
import { MdAttachFile, MdClose, MdPictureAsPdf, MdImage } from 'react-icons/md';

export default function RegisterComplaint() {
    const { thana } = useUserStore();
    const [loading, setLoading] = useState(false);
    const [complaintDetails, setComplaintDetails] = useState<Complaint>({
        role_addressed_to: "",
        recipient_address: "",
        subject: "",
        date: "",
        status: "",
        complainant_name: "",
        complainant_contact: "",
        allocated_thana: "",
        submitted_by: "",
        message: "",
    });
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const submitComplaint = async () => {
        setLoading(true);

        if (!complaintDetails.role_addressed_to || !complaintDetails.recipient_address || !complaintDetails.subject || !complaintDetails.date || !complaintDetails.complainant_name || !complaintDetails.complainant_contact || !complaintDetails.allocated_thana) {
            toast.error("Please fill all the required fields");
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();
            Object.entries(complaintDetails).forEach(([key, value]) => {
                const enumFields = ['role_addressed_to', 'status'];
                const processed = enumFields.includes(key)
                    ? value.trim().toUpperCase()
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
                    status: "",
                    complainant_name: "",
                    complainant_contact: "",
                    allocated_thana: "",
                    submitted_by: "",
                    message: "",
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

    return (
        <div className='w-full px-3 bg-white rounded-lg p-5 shadow-sm'>
            <h1 className='text-xl font-bold text-slate-900 tracking-tight mb-5'>Register a New Complaint</h1>
            <div className='grid grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-4 w-full'>
                <div className="flex flex-col items-start gap-2 justify-center">
                    <label htmlFor="role_addressed_to">Addressed to:</label>
                    <select
                        id="role_addressed_to"
                        value={complaintDetails.role_addressed_to}
                        onChange={(e) => setComplaintDetails({ ...complaintDetails, role_addressed_to: e.target.value })}
                        className='w-full p-2 border border-gray-300 focus:border-gray-500 focus:outline-none rounded-md' >
                        <option value="">-- Select Recipient --</option>
                        <option value="SP">SP</option>
                        <option value="TI">TI</option>
                    </select>
                </div>
                <div className="flex flex-col items-start gap-2 justify-center">
                    <label htmlFor="recipient_address">Recipient Address</label>
                    <input
                        id="recipient_address"
                        value={complaintDetails.recipient_address}
                        onChange={(e) => setComplaintDetails({ ...complaintDetails, recipient_address: e.target.value })}
                        placeholder="Enter recipient's address" type="text"
                        className='w-full p-2 border border-gray-300 focus:border-gray-500 focus:outline-none rounded-md' />
                </div>
                <div className="flex flex-col items-start gap-2 justify-center">
                    <label htmlFor="subject">Subject</label>
                    <input
                        id="subject"
                        value={complaintDetails.subject}
                        onChange={(e) => setComplaintDetails({ ...complaintDetails, subject: e.target.value })}
                        placeholder="Enter complaint subject" type="text" className='w-full p-2 border border-gray-300 focus:border-gray-500 focus:outline-none rounded-md' />
                </div>
                <div className="flex flex-col items-start gap-2 justify-center">
                    <label htmlFor="date">Date</label>
                    <input
                        id="date"
                        type='date'
                        value={complaintDetails.date}
                        onChange={(e) => setComplaintDetails({ ...complaintDetails, date: e.target.value })} className='w-full p-2 border border-gray-300 focus:border-gray-500 focus:outline-none rounded-md' />
                </div>
                <div className="flex flex-col items-start gap-2 justify-center">
                    <label htmlFor="complainant_name">Name of Complainer</label>
                    <input
                        id="complainant_name"
                        value={complaintDetails.complainant_name}
                        onChange={(e) => setComplaintDetails({ ...complaintDetails, complainant_name: e.target.value })}
                        placeholder="Enter full name" type="text" className='w-full p-2 border border-gray-300 focus:border-gray-500 focus:outline-none rounded-md' />
                </div>
                <div className="flex flex-col items-start gap-2 justify-center">
                    <label htmlFor="mobile_no">Mobile No. of Complainer</label>
                    <input
                        id="mobile_no"
                        value={complaintDetails.complainant_contact}
                        onChange={(e) => setComplaintDetails({ ...complaintDetails, complainant_contact: e.target.value })}
                        placeholder="Enter 10-digit mobile number" type="text" className='w-full p-2 border border-gray-300 focus:border-gray-500 focus:outline-none rounded-md' />
                </div>

                <div className="flex flex-col items-start gap-2 justify-start">
                    <label htmlFor="thana">Allocate to Thana</label>
                    <select
                        id="thana"
                        value={complaintDetails.allocated_thana}
                        onChange={(e) => setComplaintDetails({ ...complaintDetails, allocated_thana: e.target.value })}
                        className='w-full p-2 border border-gray-300 focus:border-gray-500 focus:outline-none rounded-md' >
                        <option value="">-- Select Thana --</option>
                        {thana?.map((th: Thana, index: number) => (
                            <option key={index} value={th.name}>{th.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col items-start gap-2 justify-center col-span-2 max-lg:col-span-2 max-sm:col-span-1">
                    <label htmlFor="description">Description (Optional)</label>
                    <textarea
                        id="description"
                        value={complaintDetails.message}
                        onChange={(e) => setComplaintDetails({ ...complaintDetails, message: e.target.value })}
                        placeholder="Enter detailed description of the complaint"
                        rows={4}
                        className='w-full p-2 border border-gray-300 focus:border-gray-500 focus:outline-none rounded-md'
                    />
                </div>
                <div className="flex flex-col items-start gap-2 justify-center col-span-3 max-lg:col-span-2 max-sm:col-span-1 border-t border-gray-300 pt-4 mt-2">
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

                <div className='w-full col-span-3 max-lg:col-span-2 max-sm:col-span-1 mt-4'>
                    <button
                        onClick={submitComplaint}
                        disabled={loading}
                        className='w-full h-12 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors cursor-pointer group flex items-center justify-center gap-2 font-semibold shadow-md'
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
    );
}
