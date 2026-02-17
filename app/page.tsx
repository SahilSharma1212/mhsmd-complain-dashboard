'use client'
import axios from 'axios'
import toast from 'react-hot-toast'
import { MdOutlineLogout } from 'react-icons/md'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import SPPage from './_components/SPPage'
import { useUserStore } from './_store/userStore'
import DetailsSection from './_components/DetailsSection'

export default function Home() {
  const router = useRouter()
  const { user, setUser, thana, setThana, complaints, setComplaints } = useUserStore();

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

  const fetchComplaints = async () => {
    if (!complaints) {
      try {
        const response = await axios.get("/api/complaint");
        if (response.data && response.data.success) {
          const complaintData = response.data.data;
          if (Array.isArray(complaintData)) {
            setComplaints(complaintData);
          } else {
            setComplaints([complaintData]);
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
    fetchComplaints();
  }, []);

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
    <div className='p-3 flex flex-col gap-4 items-center justify-start'>
      <nav className='flex bg-blue-500 text-white p-2 w-full rounded-md justify-between items-center px-4'>
        <p className='text-2xl font-semibold'><span className='max-sm:hidden'>Complain</span> <span className=''>Dashboard</span></p>

        <div className='flex gap-2 items-center text-base'>

          <button
            onClick={handleLogout}
            className='flex p-1 text-base items-center justify-center gap-2 border border-white rounded-md px-2 cursor-pointer hover:bg-white/10'
          >
            <span className='max-[400px]:hidden'>Logout</span> <MdOutlineLogout />
          </button>
        </div>
      </nav>
      {/* <TIPage /> */}
      <DetailsSection />
      <SPPage />
    </div>
  )
}
