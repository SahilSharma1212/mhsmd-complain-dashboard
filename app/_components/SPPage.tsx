import React from 'react'
import DetailsSection from './DetailsSection'
import SPComplaintSection from './SPComplaintSection'
export default function SPPage() {
    return (
        <div className='flex flex-col items-center gap-2 w-full'>

            <DetailsSection />
            <SPComplaintSection />
        </div>
    )
}
