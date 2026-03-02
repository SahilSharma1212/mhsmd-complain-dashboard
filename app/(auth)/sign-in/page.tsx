'use client'
import { useState } from 'react'
import { Role, User } from '../../types'
import axios from "axios"
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/app/_store/userStore'
import toast from "react-hot-toast"
import { FaArrowRightLong } from 'react-icons/fa6'
import { MdOutlineDashboardCustomize } from "react-icons/md"
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
            <div className='w-full max-w-[400px] bg-white rounded-xs border border-slate-200 shadow-sm overflow-hidden flex flex-col p-8 space-y-8'>
                {/* Branding Section */}
                <div className='flex flex-col items-center gap-4 text-center'>
                    <div className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                            <MdOutlineDashboardCustomize className="text-white text-xl" />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                                Complain<span className="text-blue-600">Dashboard</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                System Portal
                            </span>
                        </div>
                    </div>
                    <div className='space-y-1 mt-2'>
                        <h1 className='text-2xl font-bold text-slate-900 tracking-tight'>
                            Welcome Back
                        </h1>
                        <p className='text-sm text-slate-500 font-medium'>Sign in to your dashboard</p>
                    </div>
                </div>

                {/* Role Selector */}
                <div className='w-full space-y-3'>
                    <div className="relative flex border-b border-slate-100 w-full">
                        <button
                            onClick={() => setRole("SP")}
                            className={`flex-1 py-3 text-sm font-bold transition-all duration-200 text-center relative z-10 ${role === "SP" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                                }`}
                        >
                            SP
                        </button>
                        <button
                            onClick={() => setRole("ASP")}
                            className={`flex-1 py-3 text-sm font-bold transition-all duration-200 text-center relative z-10 ${role === "ASP" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                                }`}
                        >
                            ASP
                        </button>
                        <button
                            onClick={() => setRole("SDOP")}
                            className={`flex-1 py-3 text-sm font-bold transition-all duration-200 text-center relative z-10 ${role === "SDOP" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                                }`}
                        >
                            SDOP
                        </button>
                        <button
                            onClick={() => setRole("TI")}
                            className={`flex-1 py-3 text-sm font-bold transition-all duration-200 text-center relative z-10 ${role === "TI" ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                                }`}
                        >
                            TI
                        </button>
                        <div
                            className="absolute bottom-0 h-0.5 bg-blue-600 transition-all duration-300"
                            style={{
                                width: '25%',
                                left: role === "SP" ? '0%' : role === "ASP" ? '25%' : role === "SDOP" ? '50%' : '75%'
                            }}
                        />
                    </div>
                </div>

                {/* Form Fields */}
                <div className='w-full flex flex-col gap-5'>
                    <div className="space-y-1.5">
                        <label htmlFor="email" className='text-[11px] font-bold text-slate-400 uppercase tracking-wider block'>
                            Email Address
                        </label>
                        <input
                            id="email"
                            value={credentials.email}
                            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                            type="text"
                            placeholder='name@department.gov'
                            className='w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xs text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all'
                        />
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label htmlFor="password" className='text-[11px] font-bold text-slate-400 uppercase tracking-wider block'>
                                Password
                            </label>
                        </div>
                        <input
                            id="password"
                            value={credentials.password}
                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                            type="password"
                            placeholder='••••••••'
                            className='w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xs text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all'
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className='w-full pt-2'>
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className={`w-full group flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-xs transition-all duration-300 shadow-lg shadow-blue-500/20
    ${loading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700 hover:shadow-blue-500/30 active:scale-[0.98] cursor-pointer"}`}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Authenticating...
                            </span>
                        ) : (
                            <>
                                <span>Sign In to Dashboard</span>
                                <FaArrowRightLong className="text-lg group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                    <p className='mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest'>
                        Secure System Access • 2026
                    </p>
                </div>
            </div>
        </div>
    )
}
