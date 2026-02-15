'use client'
import { useState } from 'react'
import { Role } from '@/app/types'
import { FaGoogle } from 'react-icons/fa'
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth } from "../../_config/firbase"


export default function SignInPage() {
    const [role, setRole] = useState<Role["role"]>("SP")
    const handleGoogleSignIn = async () => {
        try {
            const provider = new GoogleAuthProvider()
            const result = await signInWithPopup(auth, provider)
            const user = result.user

            console.log("User:", user)
            console.log("Selected Role:", role)

        } catch (error) {
            console.error(error)
        }
    }


    return (
        <div className='min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4'>
            <div className='w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 p-8 flex flex-col items-center space-y-8'>
                <div className='text-center space-y-2'>
                    <h1 className='text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                        Welcome Back
                    </h1>
                    <p className='text-gray-500 font-medium'>Sign in to your dashboard</p>
                </div>

                <div className='w-full space-y-3'>
                    <p className='text-xs font-semibold text-gray-400 uppercase tracking-wider text-center'>Select Role</p>
                    <div className='grid grid-cols-2 p-1.5 bg-gray-100/80 rounded-xl relative'>
                        <button
                            onClick={() => setRole("SP")}
                            className={`relative z-10 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${role === "SP"
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                SP
                            </span>
                        </button>

                        <button
                            onClick={() => setRole("THANA HEAD")}
                            className={`relative z-10 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${role === "THANA HEAD"
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                Thana Head
                            </span>
                        </button>
                    </div>
                </div>

                <div className='w-full pt-2'>
                    <button
                        onClick={handleGoogleSignIn}
                        className='w-full group flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold py-3.5 px-4 rounded-xl transition-all duration-300 hover:shadow-md hover:border-gray-300 active:scale-[0.98]'>
                        <FaGoogle className="text-xl text-blue-500 group-hover:scale-110 transition-transform duration-300" />
                        <span>Continue with Google</span>
                    </button>
                    <p className='mt-6 text-center text-xs text-gray-400'>
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    )
}
