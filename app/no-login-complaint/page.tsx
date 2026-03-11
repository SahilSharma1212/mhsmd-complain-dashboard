'use client'
import { useState, useRef, useEffect } from 'react'
import { Complaint, Thana } from '../types';
import toast from 'react-hot-toast';
import axios from 'axios';
import { MdAttachFile, MdClose, MdPictureAsPdf, MdImage, MdCreate, MdOutlinePublic, MdArrowBack, MdCheckCircle } from 'react-icons/md';
import { IoArrowForwardCircleOutline, IoCreateOutline, IoCopyOutline } from 'react-icons/io5';
import Link from 'next/link';
import { useLanguageStore } from '../_store/languageStore';

export default function PublicRegistration() {
    const { language, setLanguage } = useLanguageStore();
    const [loading, setLoading] = useState(false);
    const [thanas, setThanas] = useState<Thana[]>([]);
    const [complaintDetails, setComplaintDetails] = useState<Complaint>({
        role_addressed_to: "SP",
        recipient_address: "",
        subject: "",
        date: new Date().toISOString().split('T')[0],
        status: "लंबित",
        complainant_name: "",
        complainant_contact: "",
        allocated_thana: "",
        submitted_by: "ANONYMOUS",
        message: "",
        accused_details: "",
    });
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [registeredId, setRegisteredId] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchThanas = async () => {
            try {
                const response = await axios.get("/api/no-login-complaints");
                if (response.data.success) {
                    setThanas(response.data.data);
                }
            } catch (error) {
                toast.error("Failed to fetch department list");
            }
        };
        fetchThanas();
    }, []);

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
        if (!complaintDetails.recipient_address || !complaintDetails.subject || !complaintDetails.date || !complaintDetails.complainant_name || !complaintDetails.complainant_contact || !complaintDetails.allocated_thana) {
            toast.error("Please fill all the required fields");
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            Object.entries(complaintDetails).forEach(([key, value]) => {
                if (value) formData.append(key, value);
            });

            selectedFiles.forEach((file) => {
                formData.append("files", file);
            });

            const response = await axios.post("/api/no-login-complaints", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.data.success) {
                setRegisteredId(response.data.data.id);
                setShowSuccessModal(true);
                setComplaintDetails({
                    role_addressed_to: "SP",
                    recipient_address: "",
                    subject: "",
                    date: new Date().toISOString().split('T')[0],
                    status: "लंबित",
                    complainant_name: "",
                    complainant_contact: "",
                    allocated_thana: "",
                    submitted_by: "ANONYMOUS",
                    message: "",
                    accused_details: "",
                });
                setSelectedFiles([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        } catch (error) {
            toast.error("Failed to submit complaint. Please check your connection.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen selection:bg-blue-100 p-4 md:p-8 relative">

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/sign-in"
                            className="w-10 h-10 bg-white border border-slate-200 rounded-xs flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm group"
                        >
                            <MdArrowBack size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        </Link>
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <MdOutlinePublic className="text-blue-600" />
                                {language === "english" ? "Public Citizens Portal" : "जनता शिकायत पोर्टल"}
                            </h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {language === "english" ? "Anonymous Complaint Registration System" : "अनाम शिकायत पंजीकरण प्रणाली"}
                            </p>
                        </div>

                        <button onClick={() => setLanguage(language === "hindi" ? "english" : "hindi")} className="px-4 py-2 bg-white border border-slate-200 rounded-xs hover:bg-slate-50 text-[12px] text-slate-600 transition-all cursor-pointer md:block shadow-sm font-bold">
                            {language === "hindi" ? "हिं" : "EN"}
                        </button>
                    </div>
                </div>

                {/* Info Alert */}
                <div className="bg-amber-50 border border-amber-200 rounded-xs p-4 flex gap-3 items-start">
                    <div className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-amber-700 font-black text-xs">!</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-amber-900">{language === "english" ? "Official Notice" : "आधिकारिक सूचना"}</p>
                        <p className="text-[12px] font-medium text-amber-800 leading-relaxed mt-0.5">
                            {language === "english" ? "This portal is for formal complaint submission. Submitting false info or misleading reports is a punishable offense. Your IP address may be logged for security purposes." : "यह पोर्टल औपचारिक शिकायत दर्ज करने के लिए है। गलत जानकारी या भ्रामक रिपोर्ट प्रस्तुत करना दंडनीय अपराध है। आपकी IP पते को सुरक्षा उद्देश्यों के लिए लॉग किया जा सकता है।"}
                        </p>
                    </div>
                </div>

                {/* Form Container */}
                <div className='w-full bg-white rounded-xs border border-slate-200 shadow-sm overflow-hidden'>
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-50 rounded-xs flex items-center justify-center border border-blue-100">
                                <IoCreateOutline className="text-blue-600 text-lg" />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                    {language === "english" ? "Complaint Form" : "शिकायत प्रपत्र"}
                                </h2>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">
                                    {language === "english" ? "Citizens Public Entry" : "नागरिक सार्वजनिक प्रवेश"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className='p-6'>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full'>
                            {/* Addressed to */}
                            <div className="space-y-1.5">
                                <label htmlFor="role_addressed_to" className='text-[11px] font-bold text-slate-600 uppercase tracking-wider block'>
                                    {language === "english" ? "Addressed To" : "किसको संबोधित"}
                                </label>
                                <select
                                    id="role_addressed_to"
                                    value={complaintDetails.role_addressed_to}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, role_addressed_to: e.target.value })}
                                    className='w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xs text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-hidden' >
                                    <option value="">{language === "english" ? "-- Select Recipient --" : "-- प्राप्तकर्ता चुनें --"}</option>
                                    <option value="SP">{language === 'english' ? 'SP' : 'पुलिस अधीक्षक'}</option>
                                    <option value="ASP">{language === 'english' ? 'ASP' : 'अतिरिक्त पुलिस अधीक्षक'}</option>
                                    <option value="SDOP">{language === 'english' ? 'SDOP' : 'अनुविभागीय अधिकारी'}</option>
                                    <option value="TI">{language === "english" ? "TI" : "थाना प्रभारी"}</option>
                                </select>
                            </div>

                            {/* Thana Selection */}
                            <div className="space-y-1.5">
                                <label htmlFor="thana" className='text-[11px] font-bold text-slate-600 uppercase tracking-wider block'>
                                    {language === "english" ? "Add Office" : "थाना चुनें"}
                                </label>
                                <select
                                    id="thana"
                                    value={complaintDetails.allocated_thana}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, allocated_thana: e.target.value })}
                                    className='w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xs text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-hidden' >
                                    <option value="">{language === "english" ? "-- Select Station --" : "-- थाना चुनें --"}</option>
                                    {thanas.map((th, index) => (
                                        <option key={index} value={th.name}>{th.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Complainant Name */}
                            <div className="space-y-1.5">
                                <label htmlFor="complainant_name" className='text-[11px] font-bold text-slate-600 uppercase tracking-wider block'>
                                    {language === "english" ? "Your Full Name" : "आपका पूरा नाम"}
                                </label>
                                <input
                                    id="complainant_name"
                                    value={complaintDetails.complainant_name}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, complainant_name: e.target.value })}
                                    placeholder={language === "english" ? "Enter your full name" : "अपना पूरा नाम दर्ज करें"} type="text"
                                    className='w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xs text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-hidden' />
                            </div>

                            {/* Contact Number */}
                            <div className="space-y-1.5">
                                <label htmlFor="mobile_no" className='text-[11px] font-bold text-slate-600 uppercase tracking-wider block'>
                                    {language === "english" ? "Contact Number" : "संपर्क नंबर"}
                                </label>
                                <div className="flex border border-slate-200 rounded-xs focus-within:border-blue-500 transition-all bg-slate-50">
                                    <div className="bg-slate-100 px-4 py-2.5 border-r border-slate-200 flex items-center shrink-0">
                                        <span className="text-[11px] font-bold text-slate-700 uppercase">+91</span>
                                    </div>
                                    <input
                                        id="mobile_no"
                                        value={complaintDetails.complainant_contact}
                                        onChange={(e) => setComplaintDetails({ ...complaintDetails, complainant_contact: e.target.value })}
                                        placeholder={language === "english" ? "Mobile Number" : "मोबाइल नंबर"} type="text"
                                        className='w-full px-4 py-2.5 bg-transparent text-sm font-medium text-slate-900 focus:outline-none focus:bg-white transition-all outline-none' />
                                </div>
                            </div>

                            {/* Complainant Address */}
                            <div className="space-y-1.5">
                                <label htmlFor="recipient_address" className='text-[11px] font-bold text-slate-600 uppercase tracking-wider block'>
                                    {language === "english" ? "Your Address" : "आपका पता"}
                                </label>
                                <input
                                    id="recipient_address"
                                    value={complaintDetails.recipient_address}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, recipient_address: e.target.value })}
                                    placeholder={language === "english" ? "Enter your current address" : "अपना वर्तमान पता दर्ज करें"} type="text"
                                    className='w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xs text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-hidden' />
                            </div>

                            {/* Subject */}
                            <div className="space-y-1.5">
                                <label htmlFor="subject" className='text-[11px] font-bold text-slate-600 uppercase tracking-wider block'>
                                    {language === "english" ? "Complaint Subject" : "शिकायत विषय"}
                                </label>
                                <input
                                    id="subject"
                                    value={complaintDetails.subject}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, subject: e.target.value })}
                                    placeholder={language === "english" ? "Brief nature of complaint" : "शिकायत का संक्षिप्त विवरण"} type="text"
                                    className='w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xs text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-hidden' />
                            </div>

                            {/* Accused Name */}
                            <div className="space-y-1.5">
                                <label htmlFor="accused_details" className='text-[11px] font-bold text-slate-600 uppercase tracking-wider block'>
                                    {language === "english" ? "Accused Name (If known)" : "आरोपी का नाम (यदि ज्ञात हो)"}
                                </label>
                                <input
                                    id="accused_details"
                                    value={complaintDetails.accused_details || ''}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, accused_details: e.target.value })}
                                    placeholder={language === "english" ? "Enter accused person's name" : "आरोपी का नाम दर्ज करें"} type="text"
                                    className='w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xs text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-hidden' />
                            </div>

                            {/* Detailed Description */}
                            <div className="space-y-1.5 md:col-span-2">
                                <label htmlFor="description" className='text-[11px] font-bold text-slate-600 uppercase tracking-wider block'>
                                    {language === "english" ? "Incident Description" : "घटना का विवरण"}
                                </label>
                                <textarea
                                    id="description"
                                    value={complaintDetails.message}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, message: e.target.value })}
                                    placeholder={language === "english" ? "Provide a detailed description of the incident..." : "घटना का विस्तृत विवरण प्रदान करें..."}
                                    rows={4}
                                    className='w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xs text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all outline-hidden resize-none'
                                />
                            </div>

                            {/* Files */}
                            <div className="space-y-4 md:col-span-2 lg:col-span-3 border-t border-slate-100 pt-6 mt-4">
                                <div className="flex items-center justify-between">
                                    <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5'>
                                        <MdAttachFile className="text-blue-500" />
                                        {language === "english" ? "Evidence & Documents (Images or PDF)" : "सबूत और दस्तावेज़ (छवियां या पीडीएफ)"}
                                    </label>
                                </div>

                                <div className="flex flex-wrap gap-4 w-full">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2.5 px-4 py-2 border border-slate-200 rounded-xs text-slate-600 bg-white hover:bg-slate-50 hover:border-blue-200 transition-all cursor-pointer text-xs font-bold uppercase tracking-wider shadow-xs"
                                    >
                                        <MdAttachFile className="text-blue-500 text-lg" />
                                        {language === "english" ? "Upload Files" : "फ़ाइलें अपलोड करें"}
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept=".pdf,image/*" className="hidden" />
                                </div>

                                {selectedFiles.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                                        {selectedFiles.map((file, index) => (
                                            <div key={index} className="relative flex items-center gap-3 p-3 bg-slate-50 rounded-xs border border-slate-200">
                                                <div className="text-blue-500 shrink-0">
                                                    {file.type === 'application/pdf' ? <MdPictureAsPdf size={18} /> : <MdImage size={18} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-bold text-slate-800 truncate">{file.name}</p>
                                                </div>
                                                <button onClick={() => removeFile(index)} className="p-1 text-slate-400 hover:text-red-500"><MdClose size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Submission Action */}
                            <div className='w-full md:col-span-2 lg:col-span-3 pt-6 mt-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6'>
                                <p className="text-[10px] font-bold text-slate-500 max-w-md italic">
                                    {language === "english" ? "By submitting, you agree that all information provided is true to the best of your knowledge. Your contact info will be used for follow-up by the respective department." : "जमा करके, आप सहमत हैं कि प्रदान की गई सभी जानकारी आपकी सर्वोत्तम जानकारी के अनुसार सही है। आपके संपर्क विवरण का उपयोग संबंधित विभाग द्वारा अनुवर्ती कार्रवाई के लिए किया जाएगा।"}
                                </p>
                                <button
                                    onClick={submitComplaint}
                                    disabled={loading}
                                    className={`w-full md:w-auto min-w-[200px] h-11 bg-blue-600 text-white font-bold text-xs uppercase tracking-widest rounded-xs transition-all duration-300 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 py-2 px-8
                                    ${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700 hover:shadow-blue-500/30 active:scale-[0.98] cursor-pointer"}`}
                                >
                                    {loading ? "Processing..." : language === "english" ? "Submit Complaint" : "शिकायत दर्ज करें"}
                                    <IoArrowForwardCircleOutline className="text-xl" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pt-4">
                    Police Department Information System • Secure Public Access
                </p>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-xs shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                <MdCheckCircle className="text-emerald-500 text-4xl" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
                                {language === "english" ? "Registration Successful" : "पंजीकरण सफल रहा"}
                            </h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">
                                {language === "english" ? "Your complaint has been recorded" : "आपकी शिकायत दर्ज कर ली गई है"}
                            </p>

                            <div className="w-full bg-slate-50 border border-slate-100 rounded-xs p-4 mb-8">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                                    {language === "english" ? "Complaint Reference ID" : "शिकायत संदर्भ आईडी"}
                                </span>
                                <div className="flex items-center justify-center gap-3">
                                    <code className="text-lg font-black text-blue-600 tracking-wider">
                                        {registeredId}
                                    </code>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(registeredId);
                                            toast.success(language === "english" ? "ID Copied" : "आईडी कॉपी की गई");
                                        }}
                                        className="p-1.5 hover:bg-white hover:shadow-sm rounded transition-all text-slate-400 hover:text-blue-500"
                                    >
                                        <IoCopyOutline size={16} />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xs hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98]"
                            >
                                {language === "english" ? "Close Portal" : "पोर्टल बंद करें"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
