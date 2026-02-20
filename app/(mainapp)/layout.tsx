'use client'
import DetailsSection from "../_components/DetailsSection";
import { MdOutlineLogout } from "react-icons/md";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

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
            <nav className='flex bg-blue-500 text-white py-3 w-full justify-between items-center p-4'>
                <p className='text-2xl font-bold text-white tracking-tight'><span className='max-sm:hidden text-2xl font-bold text-white tracking-tight'>Complain</span> <span className='text-2xl font-bold text-white tracking-tight'>Dashboard</span></p>

                <div className='flex gap-2 items-center text-base'>

                    <button
                        onClick={handleLogout}
                        className='flex p-1 text-base items-center justify-center gap-2 border border-white rounded-sm outline-none px-2 cursor-pointer hover:bg-white/10'
                    >
                        <span className='max-[400px]:hidden'>Logout</span> <MdOutlineLogout />
                    </button>
                </div>
            </nav>
            <DetailsSection />
            <main>{children}</main>
        </>
    )
}