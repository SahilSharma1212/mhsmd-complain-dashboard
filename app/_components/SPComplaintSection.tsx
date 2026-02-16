'use client'
import { IoMdSearch } from 'react-icons/io'
import { useState } from 'react'

export default function SPComplaintSection() {
    const [activeTab, setActiveTab] = useState("manage");

    const tabs = [
        { id: "manage", label: "Manage Complaints", color: "#7a00b3" },
        { id: "register", label: "Register Complaint", color: "#0000ff" },
        { id: "admin", label: "Admin Actions", color: "#06a600" },
    ];
    return (
        <div className='bg-white p-2 rounded-lg w-full border shadow border-gray-200 flex flex-col gap-2 items-start'>
            <div className="relative flex border-b w-full">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-3 text-sm font-medium transition-colors duration-200`}
                        style={{
                            color: activeTab === tab.id ? tab.color : "#000000",
                        }}
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
                        backgroundColor:
                            activeTab === "manage"
                                ? "#dd00ff"
                                : activeTab === "register"
                                    ? "#0000ff"
                                    : "#00ff00",
                    }}
                />
                <div
                    className={`absolute bottom-0 h-full w-full transition-all duration-300`}
                    style={{
                        width: "33.33%",
                        left:
                            activeTab === "manage"
                                ? "0%"
                                : activeTab === "register"
                                    ? "33.33%"
                                    : "66.66%",
                        backgroundColor:
                            activeTab === "manage"
                                ? "#dd00ff05"
                                : activeTab === "register"
                                    ? "#0000ff05"
                                    : "#00ff0005",
                    }}
                />
            </div>


            {/* COMPLAINTS TABLE */}
            {
                activeTab === "manage" && (
                    <div className='w-full px-3'>
                        <form action="" className='py-3'>
                            <div className='flex'>
                                <input type="text" className='p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' placeholder='Search' />
                                <button className='bg-blue-500 text-white p-2 rounded-md rounded-l-none border border-blue-500'><IoMdSearch size={20} /></button>
                            </div>
                        </form>
                        <h1 className='text-xl font-semibold text-gray-600 py-3'>Complaints Table</h1>
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
                                        { id: 'CMP-101', name: 'Rajesh Kumar', contact: '+91 98765 43210', addressedTo: 'SP', subject: 'Noise Disturbance', date: '2023-10-25', status: 'No Contact', color: 'bg-red-100 text-red-800' },
                                        { id: 'CMP-102', name: 'Anita Sharma', contact: '+91 87654 32109', addressedTo: 'TI', subject: 'Water Leakage', date: '2023-10-24', status: 'NON FIR', color: 'bg-yellow-100 text-yellow-800' },
                                        { id: 'CMP-103', name: 'Rajesh Kumar', contact: '+91 98765 43210', addressedTo: 'SP', subject: 'Noise Disturbance', date: '2023-10-25', status: 'FIR', color: 'bg-orange-100 text-orange-800' },
                                        { id: 'CMP-104', name: 'Anita Sharma', contact: '+91 87654 32109', addressedTo: 'TI', subject: 'Water Leakage', date: '2023-10-24', status: 'FILE', color: 'bg-blue-100 text-blue-800' },
                                        { id: 'CMP-105', name: 'Rajesh Kumar', contact: '+91 98765 43210', addressedTo: 'SP', subject: 'Noise Disturbance', date: '2023-10-25', status: 'No Contact', color: 'bg-red-100 text-red-800' },
                                        { id: 'CMP-106', name: 'Anita Sharma', contact: '+91 87654 32109', addressedTo: 'TI', subject: 'Water Leakage', date: '2023-10-24', status: 'NON FIR', color: 'bg-yellow-100 text-yellow-800' },
                                        { id: 'CMP-107', name: 'Rajesh Kumar', contact: '+91 98765 43210', addressedTo: 'SP', subject: 'Noise Disturbance', date: '2023-10-25', status: 'FIR', color: 'bg-orange-100 text-orange-800' },
                                        { id: 'CMP-108', name: 'Anita Sharma', contact: '+91 87654 32109', addressedTo: 'TI', subject: 'Water Leakage', date: '2023-10-24', status: 'FILE', color: 'bg-blue-100 text-blue-800' },
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

            {/* REGISTER COMPLAINTS TABLE */}
            {
                activeTab === "register" && (
                    <div className='w-full px-3'>
                        <div className='grid grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-4 w-full mt-5'>
                            <div className="flex flex-col items-start gap-2 justify-center">
                                <label htmlFor="name">Addressed to:</label>
                                <input placeholder="Enter recipient's name" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' />
                            </div>
                            <div className="flex flex-col items-start gap-2 justify-center">
                                <label htmlFor="name">Recipient Address</label>
                                <input placeholder="Enter recipient's address" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' />
                            </div>
                            <div className="flex flex-col items-start gap-2 justify-center">
                                <label htmlFor="name">Subject</label>
                                <input placeholder="Enter complaint subject" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' />
                            </div>
                            <div className="flex flex-col items-start gap-2 justify-center">
                                <label htmlFor="name">Date</label>
                                <input placeholder="DD/MM/YYYY" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' />
                            </div>
                            <div className="flex flex-col items-start gap-2 justify-center">
                                <label htmlFor="name">Name of Complainer</label>
                                <input placeholder="Enter full name" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' />
                            </div>
                            <div className="flex flex-col items-start gap-2 justify-center">
                                <label htmlFor="name">Mobile No. of Complainer</label>
                                <input placeholder="Enter 10-digit mobile number" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' />
                            </div>

                            <div className="flex flex-col items-start gap-2 justify-center">
                                <label htmlFor="name">Allocate to Thana</label>
                                <input placeholder="Enter Thana name" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' />
                            </div>
                            <div className='w-full relative bottom-0'>

                                <button className='w-full absolute h-10 bottom-0 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none bg-blue-500 text-white hover:bg-blue-600 transition-colors cursor-pointer'>Submit</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ADMIN ACTIONS */}
            {
                activeTab === "admin" && (
                    <div className='w-full px-3'>

                        <div className='grid grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-4 w-full mt-5'>
                            <div className='flex flex-col items-start justify-start gap-3 border-gray-300 border bg-white shadow-lg p-3 rounded-lg'>
                                <h1 className='text-lg font-semibold text-gray-600 text-center'>Add a Thana</h1>
                                <div className='flex flex-col items-start gap-2 justify-center w-full mt-3'>
                                    <label htmlFor="name" className='text-gray-600'>Thana Name</label>
                                    <input placeholder="Enter Thana Name" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' />
                                </div>

                                <div className='flex flex-col items-start gap-2 justify-center w-full'>
                                    <label htmlFor="name" className='text-gray-600'>Thana Contact No.</label>
                                    <input placeholder="Enter Contact Number" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none' />
                                </div>

                                <div className='flex flex-col items-start gap-2 justify-center w-full'>
                                    <label htmlFor="name" className='text-gray-600'>City</label>
                                    <input placeholder="Enter City" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none' />
                                </div>

                                <div className='flex flex-col items-start gap-2 justify-center w-full'>
                                    <label htmlFor="name" className='text-gray-600'>Pin Code</label>
                                    <input placeholder="Enter Pin Code" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none' />
                                </div>
                                <button className='w-full h-10 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none bg-green-500 text-white hover:bg-green-600 transition-colors cursor-pointer'>Add Thana</button>
                            </div>

                            <div className='flex flex-col items-start justify-start gap-3 border-gray-300 border bg-white shadow-lg p-3 rounded-lg'>
                                <h1 className='text-lg font-semibold text-gray-600 text-center w-full'>Allocate TI</h1>
                                <div className='flex flex-col items-start gap-2 justify-center w-full mt-3'>
                                    <label htmlFor="name" className='text-gray-600'>Select Thana</label>
                                    <select
                                        id="name"
                                        className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none'
                                    >
                                        <option value="">Select Thana</option>
                                        <option value="">Select Thana</option>
                                        <option value="">Select Thana</option>
                                        <option value="">Select Thana</option>
                                    </select>
                                </div>
                                <div className='flex flex-col items-start gap-2 justify-center w-full'>
                                    <label htmlFor="name" className='text-gray-600'>Name</label>
                                    <input placeholder="Enter TI Name" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none' />
                                </div>
                                <div className='flex flex-col items-start gap-2 justify-center w-full'>
                                    <label htmlFor="name" className='text-gray-600'>Contact No.</label>
                                    <input placeholder="Enter Contact Number" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none' />
                                </div>
                                <div className='flex flex-col items-start gap-2 justify-center w-full'>
                                    <label htmlFor="name" className='text-gray-600'>Email</label>
                                    <input placeholder="Enter Email Address" type="email" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none' />
                                </div>
                                <button className='w-full h-10 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none bg-blue-500 text-white hover:bg-blue-600 transition-colors cursor-pointer'>Submit</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    )
}
