'use client'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useEffect } from 'react'
import { useUserStore } from '../_store/userStore'
import { RiDashboardLine } from 'react-icons/ri'
import { IoLayersOutline, IoCreateOutline, IoSettingsOutline, IoArrowForwardCircleOutline, IoBusinessOutline } from 'react-icons/io5'

import Link from 'next/link'
import { useLanguageStore } from '../_store/languageStore'


export default function Home() {
    const { user, setUser, thana, setThana } = useUserStore();
    const { language, setLanguage } = useLanguageStore();
    const fetchUserDetails = async () => {
        if (!user) {
            try {
                const response = await axios.get("/api/user");
                if (response.data) {
                    setUser(response.data);
                }
            } catch (error) {
                toast.error("Failed to fetch user details");
            }
        }
    }
    const fetchThanaDetails = async () => {
        if (!thana) {
            try {
                const response = await axios.get("/api/thana");
                if (response.data && response.data.success) {
                    const thanaData = response.data.data;
                    if (Array.isArray(thanaData)) {
                        setThana(thanaData);
                    } else {
                        setThana([thanaData]);
                    }
                }
            } catch (error) {
                toast.error("Failed to fetch user details");
            }
        }
    }

    useEffect(() => {
        fetchUserDetails();
        fetchThanaDetails();
    }, []);

    return (
        <div className='p-6 flex flex-col gap-6'>
            <div className="flex items-center justify-between mb-2">
                <h1 className='text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2'>
                    <RiDashboardLine className="text-blue-500" strokeWidth={0.5} />
                    {language === "english" ? "Dashboard Overview" : "डैशबोर्ड अवलोकन"}
                </h1>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                {/* Manage Complaints */}
                <Link href="/manage-complaints" className='bg-white p-6 rounded-xs border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col justify-between h-full'>
                    <div>
                        <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <IoLayersOutline className="text-indigo-600 text-2xl" />
                        </div>
                        <h2 className='text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors'>{language === "english" ? "Manage Complaints" : "शिकायत प्रबंधन"}</h2>
                        <p className='text-slate-500 text-sm leading-relaxed mb-6'>
                            {language === "english" ? "Access the central database to view, filter, and update the status of all submitted complaints across jurisdictions." : "सभी दर्ज शिकायतों की स्थिति देखने, फ़िल्टर करने और अपडेट करने के लिए केंद्रीय डेटाबेस तक पहुंचें।"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
                        <span>{language === "english" ? "Access Records" : "रिकॉर्ड एक्सेस"}</span>
                        <IoArrowForwardCircleOutline className="text-xl group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

                {/* Unallocated Complaints - SP only */}
                {user?.role === "SP" && (
                    <Link href="/unallocated-complaints" className='bg-white p-6 rounded-xs border border-slate-200 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group flex flex-col justify-between'>
                        <div>
                            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <IoBusinessOutline className="text-orange-600 text-2xl" />
                            </div>
                            <h2 className='text-lg font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors'>{language === "english" ? "Unallocated Complaints" : "अनाबंटित शिकायतें"}</h2>
                            <p className='text-slate-500 text-sm leading-relaxed mb-6'>
                                {language === "english" ? "Review and assign jurisdictions to complaints submitted without a Thana." : "बिना थाना के दर्ज की गई शिकायतों के लिएJurisdictions की समीक्षा करें और उन्हें सौंपें।"}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-orange-600 text-xs font-bold uppercase tracking-wider">
                            <span>{language === "english" ? "Manage Allocation" : "प्रबंधन आवंटन"}</span>
                            <IoArrowForwardCircleOutline className="text-xl group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                )}

                {/* Register Complaint */}
                <Link href="/register-complaint" className='bg-white p-6 rounded-xs border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group flex flex-col justify-between h-full'>
                    <div>
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <IoCreateOutline className="text-blue-600 text-2xl" />
                        </div>
                        <h2 className='text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors'>{language === "english" ? "Register Complaint" : "शिकायत दर्ज करें"}</h2>
                        <p className='text-slate-500 text-sm leading-relaxed mb-6'>
                            {language === "english" ? "Standardized entry form for filing new citizen grievances with precise categorization and official attachments." : "नागरिकों की नई शिकायतों को सटीक वर्गीकरण और आधिकारिक अनुलग्नकों के साथ दर्ज करने के लिए मानकीकृत प्रवेश प्रपत्र।"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
                        <span>{language === "english" ? "New Submission" : "नई प्रविष्टि"}</span>
                        <IoArrowForwardCircleOutline className="text-xl group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

                {/* Admin Actions */}
                {user?.role === "SP" && (
                    <Link href="/admin-actions" className='bg-white p-6 rounded-xs border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group flex flex-col justify-between h-full'>
                        <div>
                            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <IoSettingsOutline className="text-emerald-600 text-2xl" />
                            </div>
                            <h2 className='text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors'>{language === "english" ? "Admin Actions" : "प्रशासनिक कार्य"}</h2>
                            <p className='text-slate-500 text-sm leading-relaxed mb-6'>
                                {language === "english" ? "System management tools for authorized personnel to configure thanas, allocate TIs, and monitor user accounts." : "अधिकृत कर्मियों के लिए thanas को कॉन्फ़िगर करने, TIs को आवंटित करने और उपयोगकर्ता खातों की निगरानी करने के लिए सिस्टम प्रबंधन उपकरण।"}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider">
                            <span>{language === "english" ? "Control Panel" : "नियंत्रण कक्ष"}</span>
                            <IoArrowForwardCircleOutline className="text-xl group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                )}


            </div>

        </div>
    )
}
