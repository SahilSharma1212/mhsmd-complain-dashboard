import React from 'react'

export default function DetailsSection() {
    return (
        <div className='bg-white p-3 grid grid-cols-3 rounded-lg hover:shadow-lg cursor-pointer w-full border shadow border-gray-200 max-md:text-sm max-sm:text-xs max-md:grid-cols-2'>
            <div className='flex gap-2 py-1'>
                <p className='font-semibold text-gray-500'>Name:</p>
                <p className='font-semibold'>Sahil Sharma</p>
            </div>
            <div className='flex gap-2 py-1'>
                <p className='font-semibold text-gray-500'>Role:</p>
                <p className='font-semibold'>SP</p>
            </div>
            <div className='flex gap-2 py-1'>
                <p className='font-semibold text-gray-500'>Mobile:</p>
                <p className='font-semibold'>9876543210</p>
            </div>
            <div className='flex gap-2 py-1'>
                <p className='font-semibold text-gray-500'>Address:</p>
                <p className='font-semibold'>123 Main Street</p>
            </div>
            <div className='flex gap-2 py-1'>
                <p className='font-semibold text-gray-500'>Thana:</p>
                <p className='font-semibold'>Nevai</p>
            </div>
            <div className='flex gap-2 py-1'>
                <p className='font-semibold text-gray-500'>Email:</p>
                <p className='font-semibold'>xyz@gmail.com</p>
            </div>
        </div>
    )
}
