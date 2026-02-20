'use client'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useEffect } from 'react'
import { useUserStore } from '../_store/userStore'
import ComplaintSection from '../_components/ComplaintSection'
import { RiDashboardLine } from 'react-icons/ri'

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
        <>
            <h1 className='text-2xl font-bold text-slate-900 tracking-tight bg-gray-50 p-3 border-b border-gray-200 flex items-center justify-start gap-3'><RiDashboardLine strokeWidth={0.05} className='text-gray-600' />Dashboard</h1>
            <ComplaintSection />
        </>
    )
}
