'use client'
import { useState } from "react";
import { IoLogOutOutline, IoLayersOutline, IoCreateOutline, IoSettingsOutline, IoBusinessOutline, IoLanguageOutline, IoMenuOutline, IoCloseOutline } from "react-icons/io5";
import { RiDashboardLine } from "react-icons/ri";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter, usePathname } from "next/navigation";
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
    const pathname = usePathname();
    const { user, clearUser, clearThana, setCurrentlyViewingComplaint } = useUserStore();
    const { clearCache: clearComplaintCache } = useComplaintStore();
    const { clearLogs } = useLogStore();
    const { clearStats } = useStatsStore();
    const { clearCache: clearUnallocatedCache } = useUnallocatedStore();
    const { language, setLanguage } = useLanguageStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = async () => {
        try {
            const response = await axios.get("/api/user/logout");
            if (response.status === 200) {
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

    const navigationItems = [
        { id: "dashboard", labeleng: "Dashboard", labelhindi: "डैशबोर्ड", href: "/", icon: RiDashboardLine, roles: ["SP", "ASP", "SDOP", "TI"], activeClasses: "bg-violet-50 text-violet-700 border-violet-200", iconActive: "text-violet-600", iconDefault: "text-violet-400" },
        { id: "manage", labeleng: "Manage Complaints", labelhindi: "शिकायत प्रबंधन", href: "/manage-complaints", icon: IoLayersOutline, roles: ["SP", "ASP", "SDOP", "TI"], activeClasses: "bg-indigo-50 text-indigo-700 border-indigo-200", iconActive: "text-indigo-600", iconDefault: "text-indigo-400" },
        { id: "unallocated", labeleng: "Unallocated Items", labelhindi: "अनाबंटित आइटम", href: "/unallocated-complaints", icon: IoBusinessOutline, roles: ["SP", "ASP", "SDOP"], activeClasses: "bg-orange-50 text-orange-700 border-orange-200", iconActive: "text-orange-600", iconDefault: "text-orange-400" },
        { id: "register", labeleng: "New Registration", labelhindi: "नया पंजीकरण", href: "/register-complaint", icon: IoCreateOutline, roles: ["SP", "ASP", "SDOP", "TI"], activeClasses: "bg-blue-50 text-blue-700 border-blue-200", iconActive: "text-blue-600", iconDefault: "text-blue-400" },
        { id: "admin", labeleng: "Admin Actions", labelhindi: "प्रशासनिक कार्य", href: "/admin-actions", icon: IoSettingsOutline, roles: ["SP", "ASP", "SDOP"], activeClasses: "bg-emerald-50 text-emerald-700 border-emerald-200", iconActive: "text-emerald-600", iconDefault: "text-emerald-400" },
    ];

    const filteredNavItems = navigationItems.filter(item => user?.role && item.roles.includes(user.role));

    return (
        <div className="flex min-h-screen">
            {/* Mobile backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:sticky top-0 left-0 h-screen z-50 bg-white border-r border-slate-200 flex flex-col
                transition-all duration-300 ease-in-out
                ${isCollapsed ? "md:w-20" : "md:w-56"}
                ${sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"}
            `}>
                {/* Logo Section */}
                <div className={`px-5 py-4 border-b border-slate-100 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
                    <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setSidebarOpen(false)}>
                        <div className="w-8 h-8 bg-blue-600 rounded-xs flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                            <MdOutlineDashboardCustomize className="text-white text-base" />
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col animate-in fade-in duration-300">
                                <span className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                                    {language === "english" ? "Complain" : "शिकायत"}<span className="text-blue-600">{language === "english" ? "Dash" : "डैश"}</span>
                                </span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    {language === "english" ? "System Portal" : "सिस्टम पोर्टल"}
                                </span>
                            </div>
                        )}
                    </Link>
                    {/* Desktop Toggle Button */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`hidden md:flex p-1.5 rounded-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors ${isCollapsed ? "absolute -right-3 top-13 bg-white border border-slate-200 shadow-xs z-60" : ""}`}
                    >
                        <IoMenuOutline size={18} className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
                    </button>
                    {/* Close button on mobile */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="md:hidden p-1.5 rounded-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <IoCloseOutline size={20} />
                    </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center rounded-xs text-[13px] font-bold transition-all ${isActive
                                    ? `${item.activeClasses} border shadow-xs`
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                                    } ${isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"}`}
                                title={isCollapsed ? (language === "english" ? item.labeleng : item.labelhindi) : ""}
                            >
                                <Icon className={`text-lg shrink-0 ${isActive ? item.iconActive : item.iconDefault}`} />
                                {!isCollapsed && (
                                    <span className="truncate animate-in fade-in slide-in-from-left-2 duration-300">
                                        {language === "english" ? item.labeleng : item.labelhindi}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section: Language & Logout */}
                <div className="px-3 py-3 border-t border-slate-100 space-y-1">
                    <button
                        onClick={() => setLanguage(language === "english" ? "hindi" : "english")}
                        className={`w-full flex items-center rounded-xs text-[13px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all ${isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"}`}
                        title={isCollapsed ? (language === "english" ? "Switch Language" : "भाषा बदलें") : ""}
                    >
                        <IoLanguageOutline className="text-lg text-slate-400 shrink-0" />
                        {!isCollapsed && <span className="animate-in fade-in duration-300">{language === "english" ? "हिन्दी" : "English"}</span>}
                    </button>

                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center rounded-xs text-[13px] font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group ${isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"}`}
                        title={isCollapsed ? (language === "english" ? "Logout" : "लॉगआउट") : ""}
                    >
                        <IoLogOutOutline className="text-lg text-slate-400 group-hover:text-red-600 shrink-0" />
                        {!isCollapsed && <span className="animate-in fade-in duration-300">{language === "english" ? "Logout" : "लॉगआउट"}</span>}
                    </button>

                    {/* User Info */}
                    {user && (
                        <div className={`mt-2 bg-slate-50 rounded-xs border border-slate-100 transition-all ${isCollapsed ? "p-2 flex justify-center" : "px-3 py-2.5"}`}>
                            {!isCollapsed ? (
                                <>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate animate-in fade-in duration-300">
                                        {user.name}
                                    </p>
                                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tight truncate animate-in fade-in duration-300">
                                        {user.role} {user.thana ? `• ${user.thana}` : ""}
                                    </p>
                                </>
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600 uppercase">
                                    {user.name.charAt(0)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto min-w-0">
                {/* Mobile top bar with hamburger */}
                <div className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-xs text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <IoMenuOutline size={22} />
                    </button>
                    <span className="text-sm font-bold text-slate-900 tracking-tight">
                        {language === "english" ? "Complain" : "शिकायत"}<span className="text-blue-600">{language === "english" ? "Dashboard" : "डैशबोर्ड"}</span>
                    </span>
                </div>
                {children}
            </main>
        </div>
    );
}
