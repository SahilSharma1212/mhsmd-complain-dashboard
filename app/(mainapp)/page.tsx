'use client'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useEffect } from 'react'
import { useUserStore } from '../_store/userStore'
import { RiDashboardLine } from 'react-icons/ri'
import { IoLayersOutline, IoCreateOutline, IoSettingsOutline, IoArrowForwardCircleOutline } from 'react-icons/io5'

import Link from 'next/link'


export default function Home() {
    const { user, setUser, thana, setThana } = useUserStore();

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
                    Dashboard Overview
                </h1>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Version 1.0.4
                </span>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {/* Manage Complaints */}
                <Link href="/manage-complaints" className='bg-white p-6 rounded-xs border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col justify-between h-full'>
                    <div>
                        <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <IoLayersOutline className="text-indigo-600 text-2xl" />
                        </div>
                        <h2 className='text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors'>Manage Complaints</h2>
                        <p className='text-slate-500 text-sm leading-relaxed mb-6'>
                            Access the central database to view, filter, and update the status of all submitted complaints across jurisdictions.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
                        <span>Access Records</span>
                        <IoArrowForwardCircleOutline className="text-xl group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

                {/* Register Complaint */}
                <Link href="/register-complaint" className='bg-white p-6 rounded-xs border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group flex flex-col justify-between h-full'>
                    <div>
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <IoCreateOutline className="text-blue-600 text-2xl" />
                        </div>
                        <h2 className='text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors'>Register Complaint</h2>
                        <p className='text-slate-500 text-sm leading-relaxed mb-6'>
                            Standardized entry form for filing new citizen grievances with precise categorization and official attachments.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
                        <span>New Submission</span>
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
                            <h2 className='text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors'>Admin Actions</h2>
                            <p className='text-slate-500 text-sm leading-relaxed mb-6'>
                                System management tools for authorized personnel to configure thanas, allocate TIs, and monitor user accounts.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider">
                            <span>Control Panel</span>
                            <IoArrowForwardCircleOutline className="text-xl group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                )}
            </div>

        </div>
    )
}
