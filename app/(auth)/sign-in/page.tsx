'use client'
import { useState } from 'react'
import { Role, User } from '../../types'
import axios from "axios"
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/app/_store/userStore'
import toast from "react-hot-toast"
import { FaArrowRightLong } from 'react-icons/fa6'
import { MdOutlineDashboardCustomize } from "react-icons/md"
import Link from 'next/link'
export default function SignInPage() {
    const [loading, setLoading] = useState(false)
    const { setUser } = useUserStore()
    const [role, setRole] = useState<Role["role"]>("SP")
    const router = useRouter()
    const [credentials, setCredentials] = useState({
        email: "",
        password: ""
    })
    const handleGoogleSignIn = async () => {
        if (loading) return

        try {
            setLoading(true)

            if (credentials.email === "" || credentials.password === "") {
                toast.error("Please fill all the fields")
                return
            }

            const response = await axios.post("/api/user/sign-in", {
                email: credentials.email,
                password: credentials.password,
                role
            })

            const resData: User = response.data
            setUser(resData)

            toast.success("Signed in successfully")

            router.push("/")
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Sign in failed"
            )
        } finally {
            setLoading(false)
        }
    }


    return (
        <div className='min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-blue-100'>
            <div className='w-full max-w-[800px] grid grid-cols-1 md:grid-cols-2 gap-0 bg-white rounded-xs border border-slate-200 shadow-xl overflow-hidden'>


                {/* Sign-in Form (Right on Desktop) */}
                <div className='p-8 md:p-10 space-y-8'>
                    {/* Branding Section */}
                    <div className='flex flex-col gap-1'>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Authorized Access Only</span>
                        <h1 className='text-3xl font-black text-slate-900 tracking-tight'>
                            Portal Login
                        </h1>
                        <p className='text-xs text-slate-500 font-medium'>Enter your credentials to manage the dashboard</p>
                    </div>

                    {/* Role Selector */}
                    <div className='w-full space-y-3'>
                        <div className="relative flex border-b border-slate-100 w-full">
                            <button onClick={() => setRole("SP")} className={`flex-1 py-3 text-[10px] font-black tracking-widest transition-all duration-200 text-center relative z-10 ${role === "SP" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`}>SP</button>
                            <button onClick={() => setRole("ASP")} className={`flex-1 py-3 text-[10px] font-black tracking-widest transition-all duration-200 text-center relative z-10 ${role === "ASP" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`}>ASP</button>
                            <button onClick={() => setRole("SDOP")} className={`flex-1 py-3 text-[10px] font-black tracking-widest transition-all duration-200 text-center relative z-10 ${role === "SDOP" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`}>SDOP</button>
                            <button onClick={() => setRole("TI")} className={`flex-1 py-3 text-[10px] font-black tracking-widest transition-all duration-200 text-center relative z-10 ${role === "TI" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}`}>TI</button>
                            <div className="absolute bottom-0 h-0.5 bg-blue-600 transition-all duration-300" style={{ width: '25%', left: role === "SP" ? '0%' : role === "ASP" ? '25%' : role === "SDOP" ? '50%' : '75%' }} />
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className='w-full flex flex-col gap-5'>
                        <div className="space-y-1.5">
                            <label htmlFor="email" className='text-[10px] font-black text-slate-500 uppercase tracking-widest block font-sans'>Email Address</label>
                            <input id="email" value={credentials.email} onChange={(e) => setCredentials({ ...credentials, email: e.target.value })} type="text" placeholder="Email" className='w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xs text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all' />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="password" className='text-[10px] font-black text-slate-500 uppercase tracking-widest block font-sans'>Password</label>
                            <input id="password" value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} type="password" placeholder="••••••••" className='w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xs text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all' />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className='w-full'>
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className={`w-full group flex items-center justify-center gap-3 bg-blue-600 text-white font-black py-3.5 px-4 rounded-xs transition-all duration-300 shadow-lg shadow-blue-500/20 text-[10px] tracking-[0.2em] uppercase
                            ${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700 hover:shadow-blue-500/30 active:scale-[0.98] cursor-pointer"}`}
                        >
                            {loading ? "Authenticating..." : "Sign In to Dashboard"}
                            <FaArrowRightLong className="text-lg group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
                {/* Public Portal Info (Left on Desktop, Top on Mobile) */}
                <div className='bg-linear-to-br from-blue-600 to-blue-700 p-8 md:p-10 flex flex-col justify-between text-white relative overflow-hidden'>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform max-sm:hidden">
                        <MdOutlineDashboardCustomize size={180} className="text-white -mr-20 -mt-10" />
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-3 ">
                            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center max-sm:hidden">
                                <MdOutlineDashboardCustomize className="text-white text-xl " />
                            </div>
                            <span className="text-lg font-black tracking-tight uppercase">Open Portal</span>
                        </div>

                        <div className="space-y-3 max-sm:hidden">
                            <h2 className="text-2xl md:text-3xl font-black leading-tight">
                                Register a Complaint Without Posting.
                            </h2>
                            <p className="text-blue-100 text-sm font-medium leading-relaxed opacity-90">
                                Are you a citizen looking to report an incident? Use our public portal to submit complaints directly to the department without an account.
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 pt-8 max-sm:pt-0">
                        <Link
                            href="/no-login-complaint"
                            className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold py-3 px-6 rounded-xs hover:bg-blue-50 transition-all shadow-lg active:scale-95 group"
                        >
                            <span>Open Public Portal</span>
                            <FaArrowRightLong className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mt-4 opacity-60 max-sm:hidden">
                            Available 24/7 • Secure & Anonymous
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
