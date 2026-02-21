'use client'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useEffect } from 'react'
import { useUserStore } from '../_store/userStore'
import { RiDashboardLine } from 'react-icons/ri'

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
        <div className='p-6 flex flex-col gap-6 bg-white'>
            <h1 className='text-2xl font-bold text-slate-900 tracking-tight flex items-center justify-start gap-3'>
                <RiDashboardLine strokeWidth={0.05} className='text-gray-600' />Dashboard
            </h1>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <Link href="/manage-complaints" className='bg-white p-6 rounded-xs border border-gray-200 shadow-sm hover:shadow-md transition-all group'>
                    <h2 className='text-xl font-bold text-indigo-600 mb-2 group-hover:underline'>Manage Complaints</h2>
                    <p className='text-gray-500 text-sm'>View, filter, and update status of all submitted complaints.</p>
                </Link>

                <Link href="/register-complaint" className='bg-white p-6 rounded-xs border border-gray-200 shadow-sm hover:shadow-md transition-all group'>
                    <h2 className='text-xl font-bold text-blue-600 mb-2 group-hover:underline'>Register Complaint</h2>
                    <p className='text-gray-500 text-sm'>File a new complaint with details and attachments.</p>
                </Link>

                {user?.role === "SP" && (
                    <Link href="/admin-actions" className='bg-white p-6 rounded-xs border border-gray-200 shadow-sm hover:shadow-md transition-all group'>
                        <h2 className='text-xl font-bold text-green-600 mb-2 group-hover:underline'>Admin Actions</h2>
                        <p className='text-gray-500 text-sm'>Add thanas, allocate TIs, and manage user accounts.</p>
                    </Link>
                )}
            </div>
        </div>
    )
}
