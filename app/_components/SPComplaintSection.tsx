'use client'
import { IoMdSearch } from 'react-icons/io'
import { useState } from 'react'

export default function SPComplaintSection() {
    const [activeTab, setActiveTab] = useState("manage");

    const tabs = [
        { id: "manage", label: "Manage Complaints" },
        { id: "register", label: "Register Complaint" },
        { id: "admin", label: "Admin Actions" },
    ];
    return (
        <div className='bg-white p-2 rounded-lg w-full border shadow border-gray-200 flex flex-col gap-2 items-start'>
            <div className="relative flex border-b w-full">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-3 text-sm font-medium transition-colors duration-200
              ${activeTab === tab.id
                                ? "text-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                            }
            `}
                    >
                        {tab.label}
                    </button>
                ))}

                {/* Active Indicator */}
                <div
                    className={`absolute bottom-0 h-[2px] bg-blue-600 transition-all duration-300`}
                    style={{
                        width: "33.33%",
                        left:
                            activeTab === "manage"
                                ? "0%"
                                : activeTab === "register"
                                    ? "33.33%"
                                    : "66.66%",
                    }}
                />
            </div>

            {/* Content */}
            <div className="p-6">
                {activeTab === "manage" && <div>Manage Complaints Content</div>}
                {activeTab === "register" && <div>Register Complaint Content</div>}
                {activeTab === "admin" && <div>Admin Actions Content</div>}
            </div>
            <form action="">
                <div className='flex'>
                    <input type="text" className='p-2 rounded-md border border-gray-200 focus:border-gray-400 border-r-none focus:outline-none rounded-r-none' placeholder='Search' />
                    <button className='bg-blue-500 text-white p-2 rounded-md rounded-l-none border border-blue-500'><IoMdSearch size={20} /></button>
                </div>
            </form>

            {/* COMPLAINTS TABLE */}
            <h1 className='text-xl font-semibold text-gray-600'>Complaints Table</h1>
            <div className='overflow-x-auto w-full'>


                <table className='w-full text-left border-collapse'>
                    <thead>
                        <tr className='bg-gray-50 border-b border-gray-200'>
                            <th className='p-3 text-sm font-semibold text-gray-600'>Complaint ID</th>
                            <th className='p-3 text-sm font-semibold text-gray-600'>Name of the Complainer</th>
                            <th className='p-3 text-sm font-semibold text-gray-600'>Complaint Date</th>
                            <th className='p-3 text-sm font-semibold text-gray-600'>Addressed To</th>
                            <th className='p-3 text-sm font-semibold text-gray-600'>Subject</th>
                            <th className='p-3 text-sm font-semibold text-gray-600 text-center'>Complaint Status</th>
                        </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-100'>
                        {[
                            { id: 'CMP-101', name: 'Rajesh Kumar', contact: '+91 98765 43210', addressedTo: 'SP', subject: 'Noise Disturbance', date: '2023-10-25', status: 'FIR', color: 'bg-red-100 text-red-800' },
                            { id: 'CMP-102', name: 'Anita Sharma', contact: '+91 87654 32109', addressedTo: 'TI', subject: 'Water Leakage', date: '2023-10-24', status: 'NON FIR', color: 'bg-yellow-100 text-yellow-800' },
                            { id: 'CMP-103', name: 'Rajesh Kumar', contact: '+91 98765 43210', addressedTo: 'SP', subject: 'Noise Disturbance', date: '2023-10-25', status: 'FIR', color: 'bg-red-100 text-red-800' },
                            { id: 'CMP-104', name: 'Anita Sharma', contact: '+91 87654 32109', addressedTo: 'TI', subject: 'Water Leakage', date: '2023-10-24', status: 'NON FIR', color: 'bg-yellow-100 text-yellow-800' },
                            { id: 'CMP-105', name: 'Rajesh Kumar', contact: '+91 98765 43210', addressedTo: 'SP', subject: 'Noise Disturbance', date: '2023-10-25', status: 'FIR', color: 'bg-red-100 text-red-800' },
                            { id: 'CMP-106', name: 'Anita Sharma', contact: '+91 87654 32109', addressedTo: 'TI', subject: 'Water Leakage', date: '2023-10-24', status: 'NON FIR', color: 'bg-yellow-100 text-yellow-800' },
                            { id: 'CMP-107', name: 'Rajesh Kumar', contact: '+91 98765 43210', addressedTo: 'SP', subject: 'Noise Disturbance', date: '2023-10-25', status: 'FIR', color: 'bg-red-100 text-red-800' },
                            { id: 'CMP-108', name: 'Anita Sharma', contact: '+91 87654 32109', addressedTo: 'TI', subject: 'Water Leakage', date: '2023-10-24', status: 'NON FIR', color: 'bg-yellow-100 text-yellow-800' },
                            { id: 'CMP-109', name: 'Rajesh Kumar', contact: '+91 98765 43210', addressedTo: 'SP', subject: 'Noise Disturbance', date: '2023-10-25', status: 'FIR', color: 'bg-red-100 text-red-800' },
                            { id: 'CMP-110', name: 'Anita Sharma', contact: '+91 87654 32109', addressedTo: 'TI', subject: 'Water Leakage', date: '2023-10-24', status: 'NON FIR', color: 'bg-yellow-100 text-yellow-800' },
                        ].map((complaint) => (
                            <tr key={complaint.id} className='hover:bg-gray-50 cursor-pointer transition-colors'>
                                <td className='p-3 text-sm text-gray-700 font-medium'>{complaint.id}</td>
                                <td className='p-3 text-sm text-gray-700 font-medium'>{complaint.name}</td>
                                <td className='p-3 text-sm text-gray-700'>{complaint.date}</td>
                                <td className='p-3 text-sm text-gray-700'>{complaint.addressedTo}</td>
                                <td className='p-3 text-sm text-gray-700'>{complaint.subject}</td>
                                <td className='p-3 text-sm text-center'>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${complaint.color}`}>
                                        {complaint.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    )
}
