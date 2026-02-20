import { useUserStore } from '../_store/userStore'
import { BiUser } from 'react-icons/bi';
export default function DetailsSection() {
    const { user } = useUserStore();
    return (
        <>
            <h1 className='text-3xl font-bold text-slate-900 tracking-tight bg-white p-3 border-b border-gray-300 flex items-center justify-start gap-2'><BiUser className='text-gray-600' />Profile</h1>
            <div className='bg-white p-3 grid grid-cols-3 py-5 cursor-pointer w-full max-md:text-sm max-sm:text-xs max-md:grid-cols-2 max-sm:grid-cols-1 gap-3 border-b border-gray-300'>

                <div className='flex gap-2 py-1 w-full'>
                    <p className='font-semibold text-gray-500'>Name:</p>
                    <p className='font-semibold'>{user?.name.split(" ")
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}</p>
                </div>
                <div className='flex gap-2 py-1 w-full'>
                    <p className='font-semibold text-gray-500'>Role:</p>
                    <p className='font-semibold'>{user?.role}</p>
                </div>
                <div className='flex gap-2 py-1 w-full'>
                    <p className='font-semibold text-gray-500'>Mobile:</p>
                    <p className='font-semibold'>{user?.phone}</p>
                </div>
                <div className='flex gap-2 py-1 w-full'>
                    <p className='font-semibold text-gray-500'>Thana:</p>
                    <p className='font-semibold'>{user?.thana.split(" ")
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}</p>
                </div>
                <div className='flex gap-2 py-1 w-full'>
                    <p className='font-semibold text-gray-500'>Email:</p>
                    <p className='font-semibold break-all'>{user?.email}</p>
                </div>
                <div className='flex gap-2 py-1 w-full'>
                    <p className='font-semibold text-gray-500'>Address:</p>
                    <p className={`font-semibold break-all ${!user?.address && "text-gray-500"}`}>{user?.address ? user?.address : "-- NOT FOUND --"}</p>
                </div>
            </div>
        </>
    )
}
