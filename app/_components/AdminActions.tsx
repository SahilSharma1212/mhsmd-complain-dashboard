'use client'
import { useState } from 'react'
import toast from 'react-hot-toast';
import axios from 'axios';
import { IoBusinessOutline, IoCheckmarkDoneCircleOutline, IoShieldCheckmarkOutline } from 'react-icons/io5';
import { useUserStore } from '../_store/userStore';
import { useLanguageStore } from '../_store/languageStore';

export default function AdminActions() {
    const { language } = useLanguageStore();
    const { user } = useUserStore();
    const [loading, setLoading] = useState(false);
    const [details, setDetails] = useState({
        thanaName: "",
        thanaPinCode: "",
        thanaCity: "",
        thanaContact: "",
        userName: "",
        userEmail: "",
        userPhone: "",
        userRole: "TI" as string,
        designatedAsp: "",
        designatedSdop: "",
    });

    const handleRegister = async () => {
        if (loading) return;

        if (!details.thanaName || !details.thanaPinCode || !details.thanaCity || !details.thanaContact ||
            !details.userName || !details.userEmail || !details.userPhone) {
            toast.error(language == "english" ? "Please fill all required fields" : "कृपया सभी आवश्यक फ़ील्ड भरें");
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post("/api/register", details);
            if (response.data.success) {
                toast.success(language === 'english' ? "Thana and user registered successfully" : "थाना और उपयोगकर्ता सफलतापूर्वक पंजीकृत किए गए");
                setDetails({
                    thanaName: "", thanaPinCode: "", thanaCity: "", thanaContact: "",
                    userName: "", userEmail: "", userPhone: "", userRole: "TI",
                    designatedAsp: "", designatedSdop: "",
                });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || (language === 'english' ? "Registration failed" : "पंजीकरण विफल रहा"));
        } finally {
            setLoading(false);
        }
    };

    if (user?.role !== "SP") {
        return (
            <div className="flex items-center justify-center h-[200px] w-full bg-red-50 border border-red-100 rounded-xs">
                <p className="text-red-600 font-black uppercase tracking-widest text-[10px]">{language === "english" ? "Access Restricted to SP Only" : "केवल एसपी के लिए प्रतिबंधित पहुंच"}</p>
            </div>
        );
    }

    const inputClass = 'w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xs focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium';
    const labelClass = 'text-[10px] font-black text-slate-500 uppercase tracking-widest';

    return (
        <div className='flex flex-col gap-3 animate-in fade-in duration-500'>

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between p-2 px-4">
                <div className="flex flex-col gap-0.5">
                    <h1 className='text-lg font-black text-slate-900 tracking-tight flex items-center gap-2'>
                        <IoShieldCheckmarkOutline className="text-emerald-600" />
                        {language === "english" ? "Admin Actions" : "एडमिन एक्शन"}
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {language === "english" ? "Register New Thana & User" : "नया थाना और उपयोगकर्ता पंजीकृत करें"}
                    </p>
                </div>
            </div>

            {/* ── Form Card ──────────────────────────────────────────────── */}
            <div className='bg-white border border-slate-200 rounded-xs shadow-sm overflow-hidden border-x-0'>

                {/* Card Header */}
                <div className='px-5 py-4 border-b border-slate-100 flex items-center gap-3'>
                    <div className="w-8 h-8 bg-linear-to-br from-emerald-500 to-teal-600 rounded-xs flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <IoBusinessOutline className="text-white text-sm" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className='text-[11px] font-black text-slate-800 uppercase tracking-widest'>
                            {language === "english" ? "Register New Thana & User" : "नया थाना और उपयोगकर्ता रजिस्टर करें"}
                        </h2>
                        <span className='text-[9px] font-bold text-slate-400 uppercase tracking-widest'>
                            {language === "english" ? "Creates entries in both thana and user tables" : "थाना और उपयोगकर्ता दोनों तालिकाओं में प्रविष्टि बनाता है"}
                        </span>
                    </div>
                </div>

                {/* Card Body */}
                <div className='p-5 flex flex-col gap-7'>

                    {/* ── Thana Details Section ──────────────────────────────── */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                {language === "english" ? "Thana Details" : "थाना विवरण"}
                            </h3>
                        </div>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                            <div className='flex flex-col gap-1.5 sm:col-span-2'>
                                <label className={labelClass}>{language === "english" ? "Thana Name" : "थाना का नाम"}</label>
                                <input value={details.thanaName}
                                    onChange={(e) => setDetails({ ...details, thanaName: e.target.value })}
                                    placeholder={language === "english" ? "Enter Thana Name" : "थाना का नाम दर्ज करें"} type="text"
                                    className={inputClass} />
                            </div>
                            <div className='flex flex-col gap-1.5'>
                                <label className={labelClass}>{language === "english" ? "Contact Number" : "संपर्क नंबर"}</label>
                                <input value={details.thanaContact}
                                    onChange={(e) => setDetails({ ...details, thanaContact: e.target.value })}
                                    placeholder={language === "english" ? "Enter Contact Number" : "संपर्क नंबर दर्ज करें"} type="text"
                                    className={inputClass} />
                            </div>
                            <div className='flex flex-col gap-1.5'>
                                <label className={labelClass}>{language === "english" ? "City / Region" : "शहर / क्षेत्र"}</label>
                                <input value={details.thanaCity}
                                    onChange={(e) => setDetails({ ...details, thanaCity: e.target.value })}
                                    placeholder={language === "english" ? "Enter City" : "शहर दर्ज करें"} type="text"
                                    className={inputClass} />
                            </div>
                            <div className='flex flex-col gap-1.5 sm:col-span-2'>
                                <label className={labelClass}>{language === "english" ? "PIN Code" : "पिन कोड"}</label>
                                <input value={details.thanaPinCode}
                                    onChange={(e) => setDetails({ ...details, thanaPinCode: e.target.value })}
                                    placeholder={language === "english" ? "Enter Pin Code" : "पिन कोड दर्ज करें"} type="text"
                                    className={inputClass} />
                            </div>
                        </div>
                    </div>

                    {/* ── Designated Officers (Optional) ─────────────────────── */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                {language === "english" ? "Designated Officers (optional)" : "नामित अधिकारी (वैकल्पिक)"}
                            </h3>
                        </div>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                            <div className='flex flex-col gap-1.5'>
                                <label className={labelClass}>{language === "english" ? "Designated ASP / DSP" : "नामित ASP / DSP"}</label>
                                <input value={details.designatedAsp}
                                    onChange={(e) => setDetails({ ...details, designatedAsp: e.target.value })}
                                    placeholder={language === "english" ? "Enter ASP/DSP name" : "ASP/DSP का नाम दर्ज करें"} type="text"
                                    className={inputClass} />
                            </div>
                            <div className='flex flex-col gap-1.5'>
                                <label className={labelClass}>{language === "english" ? "Designated SDOP" : "नामित SDOP"}</label>
                                <input value={details.designatedSdop}
                                    onChange={(e) => setDetails({ ...details, designatedSdop: e.target.value })}
                                    placeholder={language === "english" ? "Enter SDOP name" : "SDOP का नाम दर्ज करें"} type="text"
                                    className={inputClass} />
                            </div>
                        </div>
                    </div>

                    {/* ── User Details Section ──────────────────────────────── */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                {language === "english" ? "User Account Details" : "उपयोगकर्ता खाता विवरण"}
                            </h3>
                        </div>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                            <div className='flex flex-col gap-1.5'>
                                <label className={labelClass}>{language === "english" ? "Name" : "नाम"}</label>
                                <input value={details.userName}
                                    onChange={(e) => setDetails({ ...details, userName: e.target.value })}
                                    placeholder={"Eg. TI Mahasamund"} type="text"
                                    className={inputClass} />
                            </div>
                            <div className='flex flex-col gap-1.5'>
                                <label className={labelClass}>{language === "english" ? "Role" : "भूमिका"}</label>
                                <select value={details.userRole}
                                    onChange={(e) => setDetails({ ...details, userRole: e.target.value })}
                                    className={inputClass}>
                                    <option value="TI">TI</option>
                                    <option value="SDOP">SDOP</option>
                                    <option value="ASP">ASP/DSP</option>
                                </select>
                            </div>
                            <div className='flex flex-col gap-1.5'>
                                <label className={labelClass}>{language === "english" ? "Official Email" : "आधिकारिक ईमेल"}</label>
                                <input value={details.userEmail}
                                    onChange={(e) => setDetails({ ...details, userEmail: e.target.value })}
                                    placeholder={language === "english" ? "Enter Email" : "ईमेल दर्ज करें"} type="email"
                                    className={inputClass} />
                            </div>
                            <div className='flex flex-col gap-1.5'>
                                <label className={labelClass}>{language === "english" ? "Mobile Number" : "मोबाइल नंबर"}</label>
                                <input value={details.userPhone}
                                    onChange={(e) => setDetails({ ...details, userPhone: e.target.value })}
                                    placeholder={language === "english" ? "Enter Phone Number" : "फोन नंबर दर्ज करें"} type="text"
                                    className={inputClass} />
                            </div>
                        </div>
                    </div>

                    {/* ── Submit ──────────────────────────────────────────────── */}
                    <button onClick={handleRegister} disabled={loading}
                        className='w-full flex items-center justify-center gap-2 py-2.5 rounded-xs text-[10px] font-black uppercase tracking-widest transition-all duration-300 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-lg hover:shadow-emerald-200/60 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed'>
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {language === "english" ? "Registering..." : "पंजीकरण प्रक्रिया..."}
                            </div>
                        ) : (
                            <>
                                <IoCheckmarkDoneCircleOutline size={16} />
                                {language === "english" ? "Register Thana & Authorize User" : "थाना रजिस्टर करें और उपयोगकर्ता को अधिकृत करें"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
