'use client'
import { useState } from 'react'
import toast from 'react-hot-toast';
import axios from 'axios';
import { IoPersonAddOutline, IoBusinessOutline, IoCheckmarkDoneCircleOutline, IoShieldCheckmarkOutline } from 'react-icons/io5';
import { useUserStore } from '../_store/userStore';
import { useLanguageStore } from '../_store/languageStore';

export default function AdminActions() {
    const { language } = useLanguageStore();
    const { thana, user } = useUserStore();
    const [addThanaLoading, setAddThanaLoading] = useState(false);
    const [addUserLoading, setAddUserLoading] = useState(false);
    const [addThanaDetails, setAddThanaDetails] = useState({
        name: "", pin_code: "", city: "", contact_number: "",
    });
    const [addUserDetails, setAddUserDetails] = useState({
        name: "",
        email: "",
        role: "TI" as "TI",
        phone: "",
        thana: user?.role === "TI" ? (user?.thana ?? "") : "",
    });

    const addThana = async () => {
        setAddThanaLoading(true);
        if (!addThanaDetails.name || !addThanaDetails.pin_code || !addThanaDetails.city || !addThanaDetails.contact_number) {
            toast.error(language == "english" ? "Please fill all the fields" : "कृपया सभी फ़ील्ड भरें");
            setAddThanaLoading(false);
            return;
        }
        try {
            const response = await axios.post("/api/thana", addThanaDetails);
            if (response.data.success) {
                toast.success(language === 'english' ? "Thana added successfully" : "थाना सफलतापूर्वक जोड़ा गया");
                setAddThanaDetails({ name: "", pin_code: "", city: "", contact_number: "" });
            }
        } catch {
            toast.error(language === 'english' ? "Failed to add thana" : "थाना जोड़ने में विफल");
        } finally {
            setAddThanaLoading(false);
        }
    };

    const createNewUser = async () => {
        if (addUserLoading) return;
        if (!addUserDetails.name || !addUserDetails.email || !addUserDetails.phone) {
            toast.error(language == "english" ? "Please fill all required fields" : "कृपया सभी आवश्यक फ़ील्ड भरें");
            return;
        }
        if (!addUserDetails.thana) {
            toast.error(language == "english" ? "Please select a thana" : "कृपया एक थाना चुनें");
            return;
        }
        try {
            setAddUserLoading(true);
            const response = await axios.post("/api/user", { ...addUserDetails, role: "TI" });
            if (response.data.success) {
                toast.success(language == "english" ? "User created successfully" : "उपयोगकर्ता सफलतापूर्वक बनाया गया");
                setAddUserDetails({
                    name: "", email: "", role: "TI", phone: "",
                    thana: user?.role === "TI" ? (user?.thana ?? "") : "",
                });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to create user");
        } finally {
            setAddUserLoading(false);
        }
    };

    if (user?.role !== "SP" && user?.role !== "ASP" && user?.role !== "SDOP" && user?.role !== "TI") {
        return (
            <div className="flex items-center justify-center h-[200px] w-full bg-red-50 border border-red-100 rounded-xs">
                <p className="text-red-600 font-bold uppercase tracking-widest text-xs">{language === "english" ? "Access Restricted to Official Personnel Only" : "केवल आधिकारिक कर्मियों के लिए प्रतिबंधित पहुंच"}</p>
            </div>
        );
    }

    return (
        <div className='w-full bg-white border border-slate-200 rounded-xs shadow-sm overflow-hidden flex flex-col'>
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-xs flex items-center justify-center border border-emerald-100">
                        <IoShieldCheckmarkOutline className="text-emerald-600 text-lg" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className='text-sm font-bold text-slate-900 uppercase tracking-wider'>
                            {language === "english" ? "Admin Actions" : "एडमिन एक्शन"}
                        </h2>
                        <span className='text-[10px] font-bold text-slate-500 uppercase tracking-widest'>
                            {language === "english" ? "Control Panel" : "कंट्रोल पैनल"}
                        </span>
                    </div>
                </div>
            </div>

            <div className='p-6'>
                <div className='grid grid-cols-2 max-lg:grid-cols-1 gap-6 w-full items-start'>

                    {/* ADD THANA — SP, ASP, SDOP Only */}
                    {(user?.role === "SP" || user?.role === "ASP" || user?.role === "SDOP") && (
                        <div className='bg-white border border-slate-200 rounded-xs shadow-sm overflow-hidden flex flex-col'>
                            <div className='p-4 bg-white border-b border-slate-100 flex items-center gap-3'>
                                <div className="w-8 h-8 bg-emerald-600 rounded-xs flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <IoBusinessOutline className="text-white text-sm" />
                                </div>
                                <h2 className='text-[11px] font-bold text-slate-900 uppercase tracking-widest'>
                                    {language === "english" ? "Register New Physical Thana" : "नया फिजिकल थाना रजिस्टर करें"}
                                </h2>
                            </div>

                            <div className='flex flex-col gap-5 p-6'>
                                <div className='flex flex-col gap-1.5'>
                                    <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider'>{language === "english" ? "Thana Identification Name" : "थाना का नाम"}</label>
                                    <input value={addThanaDetails.name}
                                        onChange={(e) => setAddThanaDetails({ ...addThanaDetails, name: e.target.value })}
                                        placeholder={language === "english" ? "Enter Thana Name" : "थाना का नाम दर्ज करें"} type="text"
                                        className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xs focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all text-xs font-semibold text-slate-900 placeholder:text-slate-500' />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className='flex flex-col gap-1.5'>
                                        <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider'>{language === "english" ? "Contact Number" : "संपर्क नंबर"}</label>
                                        <input value={addThanaDetails.contact_number}
                                            onChange={(e) => setAddThanaDetails({ ...addThanaDetails, contact_number: e.target.value })}
                                            placeholder={language === "english" ? "Enter Contact Number" : "संपर्क नंबर दर्ज करें"} type="text"
                                            className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xs focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all text-xs font-semibold text-slate-900 placeholder:text-slate-500' />
                                    </div>
                                    <div className='flex flex-col gap-1.5'>
                                        <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider'>{language === "english" ? "City / Region" : "शहर / क्षेत्र"}</label>
                                        <input value={addThanaDetails.city}
                                            onChange={(e) => setAddThanaDetails({ ...addThanaDetails, city: e.target.value })}
                                            placeholder={language === "english" ? "Enter City" : "शहर दर्ज करें"} type="text"
                                            className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xs focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all text-xs font-semibold text-slate-900 placeholder:text-slate-500' />
                                    </div>
                                </div>

                                <div className='flex flex-col gap-1.5'>
                                    <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider'>{language === "english" ? "Postal Index Number (PIN)" : "पोस्टल इंडेक्स नंबर (पिन)"}</label>
                                    <input value={addThanaDetails.pin_code}
                                        onChange={(e) => setAddThanaDetails({ ...addThanaDetails, pin_code: e.target.value })}
                                        placeholder={language === "english" ? "Enter Pin Code" : "पिन कोड दर्ज करें"} type="text"
                                        className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xs focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all text-xs font-semibold text-slate-900 placeholder:text-slate-500' />
                                </div>

                                <button onClick={addThana} disabled={addThanaLoading}
                                    className='w-full h-11 bg-emerald-600 text-white hover:bg-emerald-700 transition-all rounded-xs text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-600/10 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 mt-2'>
                                    {addThanaLoading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : <IoBusinessOutline size={16} />}
                                    {addThanaLoading ? language === "english" ? "Registering Jurisdiction..." : "पंजीकरण हो रहा है..." : language === "english" ? "Register Thana Profile" : "थाना प्रोफाइल रजिस्टर करें"}
                                </button>
                            </div>
                        </div>
                    )}
                    {/* CREATE TI USER */}
                    <div className='bg-white border border-slate-200 rounded-xs shadow-sm overflow-hidden flex flex-col'>
                        <div className='p-4 bg-white border-b border-slate-100 flex items-center gap-3'>
                            <div className="w-8 h-8 bg-indigo-600 rounded-xs flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <IoPersonAddOutline className="text-white text-sm" />
                            </div>
                            <h2 className='text-[11px] font-bold text-slate-900 uppercase tracking-widest'>
                                {language === "english" ? "Provision New Thana In-charge" : "नए थाना इंचार्ज का प्रावधान"}
                            </h2>
                        </div>

                        <div className='flex flex-col gap-5 p-6'>
                            <div className='flex flex-col gap-1.5'>
                                <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider'>{language === "english" ? "Head Name" : "हेड का नाम"}</label>
                                <input value={addUserDetails.name}
                                    onChange={(e) => setAddUserDetails({ ...addUserDetails, name: e.target.value })}
                                    placeholder={language === "english" ? "Enter Full Name" : "पूरा नाम दर्ज करें"} type="text"
                                    className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xs focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all text-xs font-semibold text-slate-900 placeholder:text-slate-500' />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className='flex flex-col gap-1.5'>
                                    <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider'>{language === "english" ? "Official Email" : "आधिकारिक ईमेल"}</label>
                                    <input value={addUserDetails.email}
                                        onChange={(e) => setAddUserDetails({ ...addUserDetails, email: e.target.value })}
                                        placeholder={language === "english" ? "Enter Email" : "ईमेल दर्ज करें"} type="email"
                                        className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xs focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all text-xs font-semibold text-slate-900 placeholder:text-slate-500' />
                                </div>
                                <div className='flex flex-col gap-1.5'>
                                    <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider'>{language === "english" ? "Contact Number" : "संपर्क नंबर"}</label>
                                    <input value={addUserDetails.phone}
                                        onChange={(e) => setAddUserDetails({ ...addUserDetails, phone: e.target.value })}
                                        placeholder={language === "english" ? "Enter Phone" : "फोन नंबर दर्ज करें"} type="text"
                                        className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xs focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all text-xs font-semibold text-slate-900 placeholder:text-slate-500' />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className='flex flex-col gap-1.5'>
                                    <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider'>{language === "english" ? "Assigned Role" : "असाइन की गई भूमिका"}</label>
                                    <div className='w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xs text-[10px] text-slate-700 font-bold uppercase tracking-widest flex items-center gap-2'>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse"></div>
                                        TI (Thana In-charge)
                                    </div>
                                </div>

                                <div className='flex flex-col gap-1.5'>
                                    <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider'>{language === "english" ? "Allocated Jurisdiction" : "आवंटित अधिकार क्षेत्र"}</label>
                                    {user?.role === "SP" || user?.role === "ASP" || user?.role === "SDOP" ? (
                                        <select value={addUserDetails.thana}
                                            onChange={(e) => setAddUserDetails({ ...addUserDetails, thana: e.target.value })}
                                            className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xs focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all text-xs font-semibold text-slate-900'>
                                            <option value="">{language === "english" ? "-- Select Thana --" : "-- थाना चुनें --"}</option>
                                            {thana?.map((th, index) => (
                                                <option key={index} value={th?.name}>{th?.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className='w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xs text-[10px] text-slate-700 font-bold uppercase tracking-widest'>
                                            {user?.thana ?? language === "english" ? "Not Allocated" : "आवंटित नहीं"}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button onClick={createNewUser} disabled={addUserLoading}
                                className='w-full h-11 bg-indigo-600 text-white hover:bg-indigo-700 transition-all rounded-xs text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/10 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 mt-2'>
                                {addUserLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : <IoPersonAddOutline size={16} />}
                                {addUserLoading ? language === "english" ? "Processing Authorization..." : "प्रमाणीकरण प्रक्रिया" : language === "english" ? "Authorize TI Account" : "टी आई खाते को अधिकृत करें"}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
