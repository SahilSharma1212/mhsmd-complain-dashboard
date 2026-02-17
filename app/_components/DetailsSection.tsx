import { useUserStore } from '../_store/userStore'
export default function DetailsSection() {
    const { user } = useUserStore();
    return (
        <div className='bg-white p-3 grid grid-cols-3 rounded-lg hover:shadow-lg cursor-pointer w-full border shadow border-gray-200 max-md:text-sm max-sm:text-xs max-md:grid-cols-2 max-sm:grid-cols-1 gap-3'>
            <div className='flex gap-2 py-1 w-full'>
                <p className='font-semibold text-gray-500'>Name:</p>
                <p className='font-semibold'>{user?.name}</p>
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
                <p className='font-semibold'>{user?.thana}</p>
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
    )
}
