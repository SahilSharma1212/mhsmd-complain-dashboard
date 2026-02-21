'use client'
import { useState } from 'react'
import { Role, User } from '../../types'
import axios from "axios"
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/app/_store/userStore'
import toast from "react-hot-toast"
import { FaArrowRightLong } from 'react-icons/fa6'
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
        <div className='min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4'>
            <div className='w-full max-w-md bg-white/80 backdrop-blur-xl rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 p-8 flex flex-col items-center space-y-8'>
                <div className='text-center space-y-2'>
                    <h1 className='text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                        Welcome Back
                    </h1>
                    <p className='text-gray-500 font-medium'>Sign in to your dashboard</p>
                </div>

                <div className='w-full space-y-3'>
                    <p className='text-xs font-semibold text-gray-400 uppercase tracking-wider text-center font-mono'>Select Role</p>
                    <div className='grid grid-cols-2 p-1.5 bg-gray-100/80 rounded-sm relative'>
                        <button
                            onClick={() => setRole("SP")}
                            className={`relative z-10 py-2.5 text-sm font-semibold rounded-sm transition-all duration-300 cursor-pointer hover:bg-gray-50 ${role === "SP"
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                SP
                            </span>
                        </button>

                        <button
                            onClick={() => setRole("TI")}
                            className={`relative z-10 py-2.5 text-sm font-semibold rounded-sm transition-all duration-300 hover:bg-gray-50 cursor-pointer ${role === "TI"
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                TI
                            </span>
                        </button>
                    </div>
                </div>

                <div className='w-full flex flex-col gap-2 items-center'>
                    <label htmlFor="email" className='text-left text-gray-700 w-full'>Email</label>
                    <input value={credentials.email} onChange={(e) => setCredentials({ ...credentials, email: e.target.value })} type="text" placeholder='xyz@gmail.com' className='w-full p-2 border border-gray-200 focus:outline-none focus:border-blue-500' />
                    <label htmlFor="password" className='text-left text-gray-700 w-full'>Password</label>
                    <input value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} type="password" placeholder='Password' className='w-full p-2 border border-gray-200 focus:outline-none focus:border-blue-500' />
                </div>

                <div className='w-full '>
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className={`w-full group flex items-center justify-center gap-3 bg-blue-500 text-white border border-gray-200 font-semibold py-3.5 px-4 rounded-sm transition-all duration-300 
    ${loading ? "opacity-70 cursor-not-allowed" : "hover:shadow-md hover:border-gray-300 active:scale-[0.98] cursor-pointer"}`}
                    >
                        {loading ? (
                            <span>Signing in...</span>
                        ) : (
                            <>
                                <span className='max-sm:text-sm'>Sign In</span>
                                <FaArrowRightLong className="text-xl text-white group-hover:scale-110 transition-transform duration-300" />
                            </>
                        )}
                    </button>
                    <p className='mt-6 text-center text-xs text-gray-400'>
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    )
}
