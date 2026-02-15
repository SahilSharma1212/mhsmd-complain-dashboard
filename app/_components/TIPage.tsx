import React from 'react'
import DetailsSection from './DetailsSection'
import ComplaintsSection from './ComplaintsSection'
export default function TIPage() {
    return (
        <div className='flex flex-col items-center gap-2 w-full'>

            <DetailsSection />
            <ComplaintsSection />
        </div>
    )
}
