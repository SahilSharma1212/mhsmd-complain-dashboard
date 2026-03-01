'use client'

import Link from 'next/link'
import { MdOutlineWrongLocation } from 'react-icons/md'
import { IoArrowForwardCircleOutline } from 'react-icons/io5'
import { MdOutlineDashboardCustomize } from 'react-icons/md'
import { useLanguageStore } from './_store/languageStore'

export default function NotFound() {
    const { language } = useLanguageStore();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md bg-white rounded-xs border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
                {/* Decorative Header */}
                <div className="bg-slate-900 p-6 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10 transform scale-150">
                        <MdOutlineWrongLocation size={120} className="text-white" />
                    </div>
                    <div className="z-10 flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <MdOutlineDashboardCustomize className="text-white text-2xl" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-white tracking-tight leading-tight">
                                {language === "english" ? "Complain" : "शिकायत"}<span className="text-blue-500">{language === "english" ? "Dashboard" : "डैशबोर्ड"}</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                {language === "english" ? "System Portal" : "सिस्टम पोर्टल"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-10 text-center flex flex-col items-center gap-6">
                    <div className="relative">
                        <h1 className="text-8xl font-black text-slate-100 select-none">404</h1>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <MdOutlineWrongLocation size={64} className="text-blue-600 animate-bounce" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                            {language === "english" ? "Page Not Found" : "पृष्ठ नहीं मिला"}
                        </h2>
                        <p className="text-slate-500 text-sm max-w-[280px]">
                            {language === "english"
                                ? "The resource you are looking for might have been removed, had its name changed, or is temporarily unavailable."
                                : "आप जिस संसाधन की तलाश कर रहे हैं उसे हटाया जा सकता है, उसका नाम बदला जा सकता है या वह अस्थायी रूप से अनुपलब्ध है।"}
                        </p>
                    </div>

                    <div className="w-full h-px bg-slate-100 my-2" />

                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xs transition-all duration-300 shadow-lg shadow-blue-500/20 group uppercase text-xs tracking-widest"
                    >
                        <span>{language === "english" ? "Go Back to Home" : "होम पेज पर वापस जाएं"}</span>
                        <IoArrowForwardCircleOutline size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {language === "english" ? "Error ID: #404-NF-LOG" : "त्रुटि आईडी: #404-NF-LOG"}
                    </p>
                </div>
            </div>

            {/* Subtle background text */}
            <div className="mt-8 opacity-20 pointer-events-none select-none hidden sm:block">
                <span className="text-sm font-black text-slate-300 uppercase tracking-[1em]">
                    {language === "english" ? "OFFICIAL ACCESS PORTAL" : "आधिकारिक एक्सेस पोर्टल"}
                </span>
            </div>
        </div>
    )
}
