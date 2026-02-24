'use client'
import { useState, useRef } from 'react'
import { Complaint, Thana } from '../types';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useUserStore } from '../_store/userStore';
import { MdAttachFile, MdClose, MdPictureAsPdf, MdImage, MdCreate } from 'react-icons/md';
import { IoArrowForwardCircleOutline } from 'react-icons/io5';
import { useLanguageStore } from '../_store/languageStore';

export default function RegisterComplaint() {
    const { language } = useLanguageStore();
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
            toast.error(language === "english" ? "Please fill all the required fields" : "कृपया सभी आवश्यक फ़ील्ड भरें");
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
                toast.success(language === "english" ? "Complaint submitted successfully" : "शिकायत सफलतापूर्वक दर्ज की गई");
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
                toast.error(language === "english" ? error.response?.data?.message || "Failed to submit complaint" : error.response?.data?.message || "शिकायत दर्ज करने में विफल");
            } else {
                toast.error(language === "english" ? "Failed to submit complaint" : "शिकायत दर्ज करने में विफल");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='w-full bg-white rounded-xs border border-slate-200 shadow-sm overflow-hidden'>
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <MdCreate className="text-blue-500" />
                    {language === "english" ? "Register a New Official Complaint" : "नई आधिकारिक शिकायत दर्ज करें"}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold tracking-tight uppercase">
                    {language === "english" ? "New Entry" : "नई प्रविष्टि"}
                </span>
            </div>

            <div className='p-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full'>
                    {/* Addressed to */}
                    <div className="space-y-1.5">
                        <label htmlFor="role_addressed_to" className='text-[11px] font-bold text-slate-600 uppercase tracking-wider block'>
                            {language === "english" ? "Addressed to" : "किसको संबोधित"}
                        </label>
                        <select
                            id="role_addressed_to"
                            value={complaintDetails.role_addressed_to}
                            onChange={(e) => setComplaintDetails({ ...complaintDetails, role_addressed_to: e.target.value })}
                            className='w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xs text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-hidden' >
                            <option value="">{language === "english" ? "-- Select Recipient --" : "-- प्राप्तकर्ता चुनें --"}</option>
                            <option value="SP">SP</option>
                            <option value="TI">TI</option>
                        </select>
                    </div>

                    {/* Recipient Address */}
                    <div className="space-y-1.5">
                        <label htmlFor="recipient_address" className='text-[11px] font-bold text-slate-600 uppercase tracking-wider block'>
                            {language === "english" ? "Recipient Address" : "प्राप्तकर्ता का पता"}
                        </label>
                        <input
                            id="recipient_address"
                            value={complaintDetails.recipient_address}
                            onChange={(e) => setComplaintDetails({ ...complaintDetails, recipient_address: e.target.value })}
                            placeholder={language === 'english' ? "Enter recipient's designation/office" : "प्राप्तकर्ता का पद/कार्यालय दर्ज करें"} type="text"
                            className='w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xs text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-hidden' />
                    </div>

                    {/* Subject */}
                    <div className="space-y-1.5">
                        <label htmlFor="subject" className='text-[11px] font-bold text-slate-600 uppercase tracking-wider block'>
                            {language === "english" ? "Complaint Subject" : "शिकायत का विषय"}
                        </label>
                        <input
                            id="subject"
                            value={complaintDetails.subject}
                            onChange={(e) => setComplaintDetails({ ...complaintDetails, subject: e.target.value })}
                            placeholder={language === 'english' ? "Briefly state the subject" : "संक्षेप में विषय बताएं"} type="text"
                            className='w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xs text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-hidden' />
                    </div>

                    {/* Date */}
                    <div className="space-y-1.5">
                        <label htmlFor="date" className='text-[11px] font-bold text-slate-600 uppercase tracking-wider block'>
                            {language === "english" ? "Reporting Date" : "रिपोर्टिंग तिथि"}
                        </label>
                        <input
                            id="date"
                            type='date'
                            value={complaintDetails.date}
                            onChange={(e) => setComplaintDetails({ ...complaintDetails, date: e.target.value })}
                            className='w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xs text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-hidden' />
                    </div>

                    {/* Name of Complainer */}
                    <div className="space-y-1.5">
                        <label htmlFor="complainant_name" className='text-[11px] font-bold text-slate-600 uppercase tracking-wider block'>
                            {language === "english" ? "Name of Complainer" : "शिकायतकर्ता का नाम"}
                        </label>
                        <input
                            id="complainant_name"
                            value={complaintDetails.complainant_name}
                            onChange={(e) => setComplaintDetails({ ...complaintDetails, complainant_name: e.target.value })}
                            placeholder={language === 'english' ? "Enter full legal name" : "पूरा कानूनी नाम दर्ज करें"} type="text"
                            className='w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xs text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-hidden' />
                    </div>

                    {/* Mobile No. */}
                    <div className="space-y-1.5">
                        <label htmlFor="mobile_no" className='text-[11px] font-bold text-slate-600 uppercase tracking-wider block'>
                            {language === "english" ? "Complainer Contact Number" : "शिकायतकर्ता का संपर्क नंबर"}
                        </label>
                        <div className="flex group overflow-hidden border border-slate-200 rounded-xs focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all bg-slate-50">
                            <div className="bg-slate-100 px-4 py-2.5 border-r border-slate-200 flex items-center justify-center shrink-0">
                                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">+91</span>
                            </div>
                            <input
                                id="mobile_no"
                                value={complaintDetails.complainant_contact}
                                onChange={(e) => setComplaintDetails({ ...complaintDetails, complainant_contact: e.target.value })}
                                placeholder="00000-00000" type="text"
                                className='w-full px-4 py-2.5 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus:bg-white transition-all outline-none' />
                        </div>
                    </div>

                    {/* Thana */}
                    <div className="space-y-1.5">
                        <label htmlFor="thana" className='text-[11px] font-bold text-slate-600 uppercase tracking-wider block'>
                            {language === "english" ? "Allocate to Station (Thana)" : "स्टेशन (थाना) को आवंटित करें"}
                        </label>
                        <select
                            id="thana"
                            value={complaintDetails.allocated_thana}
                            onChange={(e) => setComplaintDetails({ ...complaintDetails, allocated_thana: e.target.value })}
                            className='w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xs text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-hidden' >
                            <option value="">{language === "english" ? "-- Select Thana --" : "-- थाना चुनें --"}</option>
                            {thana?.map((th: Thana, index: number) => (
                                <option key={index} value={th.name}>{th.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                        <label htmlFor="description" className='text-[11px] font-bold text-slate-600 uppercase tracking-wider block'>
                            {language === "english" ? "Detailed Description / Message" : "विस्तृत विवरण / संदेश"}
                        </label>
                        <textarea
                            id="description"
                            value={complaintDetails.message}
                            onChange={(e) => setComplaintDetails({ ...complaintDetails, message: e.target.value })}
                            placeholder={language === 'english' ? "Provide a comprehensive description of the incident..." : "घटना का विस्तृत विवरण / संदेश"}
                            rows={4}
                            className='w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xs text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-hidden resize-none'
                        />
                    </div>

                    <div className="space-y-4 md:col-span-2 lg:col-span-3 border-t border-slate-100 pt-6 mt-4">
                        <div className="flex items-center justify-between">
                            <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5'>
                                <MdAttachFile className="text-blue-500" />
                                {language === "english" ? "Support Documents & Evidence" : "सहायक दस्तावेज और साक्ष्य"}
                            </label>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic animate-pulse">
                                {language === "english" ? "Images & PDF Only" : "केवल चित्र और पीडीएफ"}
                            </span>
                        </div>

                        <div className="flex flex-wrap gap-4 w-full">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2.5 px-4 py-2 border border-slate-200 rounded-xs text-slate-600 bg-white hover:bg-slate-50 hover:border-blue-200 transition-all cursor-pointer text-xs font-bold uppercase tracking-wider shadow-xs"
                            >
                                <MdAttachFile className="text-blue-500 text-lg" />
                                {language === "english" ? "Add Documents" : "दस्तावेज़ जोड़ें"}
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="relative group flex items-center gap-3 p-3 bg-slate-50 rounded-xs border border-slate-200 hover:border-blue-200 transition-colors">
                                        <div className="text-blue-500 shrink-0">
                                            {file.type === 'application/pdf' ? <MdPictureAsPdf size={20} /> : <MdImage size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold text-slate-800 truncate">{file.name}</p>
                                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                        <button
                                            onClick={() => removeFile(index)}
                                            className="ml-1 p-1 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <MdClose size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className='w-full md:col-span-2 lg:col-span-3 pt-6 mt-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6'>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight italic">
                                {language === "english" ? "Verification Required" : "सत्यापन आवश्यक"}
                            </span>
                            <p className="text-[10px] font-bold text-slate-600 mt-1">
                                {language === "english" ? "Ensure all official details are accurate before submission." : "जमा करने से पहले सभी आधिकारिक विवरण सही होने चाहिए।"}
                            </p>
                        </div>
                        <button
                            onClick={submitComplaint}
                            disabled={loading}
                            className={`w-full md:w-auto min-w-[200px] h-11 bg-blue-600 text-white font-bold text-xs uppercase tracking-widest rounded-xs transition-all duration-300 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 py-2 px-8
                            ${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700 hover:shadow-blue-500/30 active:scale-[0.98] cursor-pointer"}`}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {language === "english" ? "Submitting Entry..." : "प्रविष्टि जमा हो रही है..."}
                                </span>
                            ) : (
                                <>
                                    <span>{language === "english" ? "Finalize Submission" : "अंतिम सबमिशन"}</span>
                                    <IoArrowForwardCircleOutline className="text-xl" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
