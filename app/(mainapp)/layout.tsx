"use client"

import { IoLogOutOutline } from "react-icons/io5";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MdOutlineDashboardCustomize } from "react-icons/md";
import { useLanguageStore } from "../_store/languageStore";
import { useUserStore } from "../_store/userStore";
import { useComplaintStore } from "../_store/complaintStore";
import { useLogStore } from "../_store/logStore";
import { useStatsStore } from "../_store/statsStore";
import { useUnallocatedStore } from "../_store/unallocatedStore";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter();
    const { clearUser, clearThana, setCurrentlyViewingComplaint } = useUserStore();
    const { clearCache: clearComplaintCache } = useComplaintStore();
    const { clearLogs } = useLogStore();
    const { clearStats } = useStatsStore();
    const { clearCache: clearUnallocatedCache } = useUnallocatedStore();

    const handleLogout = async () => {
        try {
            const response = await axios.get("/api/user/logout");
            if (response.status === 200) {
                // Clear all stores
                clearUser();
                clearThana();
                setCurrentlyViewingComplaint(null);
                clearComplaintCache();
                clearLogs();
                clearStats();
                clearUnallocatedCache();

                toast.success("Logout successful");
                router.push("/sign-in");
            }
        } catch (error) {
            toast.error("Logout failed");
        }
    }

    const { language, setLanguage } = useLanguageStore();

    return (
        <>
            <nav className="flex bg-white text-slate-900 py-3 w-full justify-between items-center p-4 border-b border-slate-200 sticky top-0 z-50">
                <div className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                        <MdOutlineDashboardCustomize className="text-white text-xl" />
                    </div>
                    <Link href="/" className="flex flex-col">
                        <span className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                            {language === "english" ? "Complain" : "शिकायत"}<span className="text-blue-600">{language === "english" ? "Dashboard" : "डैशबोर्ड"}</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            {language === "english" ? "System Portal" : "सिस्टम पोर्टल"}
                        </span>
                    </Link>
                </div>

                <div className="flex gap-2 items-center">

                    <button
                        onClick={() => {
                            language === "english" ? setLanguage("hindi") : setLanguage("english")
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xs transition-all border border-slate-200 hover:border-red-100"
                    >
                        {language === "english" ? "En" : "हिं"}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xs transition-all border border-slate-200 hover:border-red-100"
                    >
                        <span className="max-[400px]:hidden">{language === "english" ? "Logout" : "लॉगआउट"}</span>
                        <IoLogOutOutline size={20} />
                    </button>
                </div>
            </nav>
            <main>{children}</main>
        </>
    )
}