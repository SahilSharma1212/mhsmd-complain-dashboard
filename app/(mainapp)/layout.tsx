"use client"

import DetailsSection from "../_components/DetailsSection";
import { IoLogOutOutline } from "react-icons/io5";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MdOutlineDashboardCustomize } from "react-icons/md";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const response = await axios.get("/api/user/logout");
            if (response.status === 200) {
                toast.success("Logout successful");
                router.push("/sign-in");
            }
        } catch (error) {
            toast.error("Logout failed");
        }
    }

    return (
        <>
            <nav className="flex bg-white text-slate-900 py-3 w-full justify-between items-center p-4 border-b border-slate-200 sticky top-0 z-50">
                <div className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                        <MdOutlineDashboardCustomize className="text-white text-xl" />
                    </div>
                    <Link href="/" className="flex flex-col">
                        <span className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                            Complain<span className="text-blue-600">Dashboard</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                            System Portal
                        </span>
                    </Link>
                </div>

                <div className="flex gap-2 items-center">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xs transition-all border border-slate-200 hover:border-red-100"
                    >
                        <span className="max-[400px]:hidden">Logout</span>
                        <IoLogOutOutline size={20} />
                    </button>
                </div>
            </nav>
            <DetailsSection />
            <main>{children}</main>
        </>
    )
}