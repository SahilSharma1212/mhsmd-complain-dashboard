'use client'
import { IoMdSearch } from 'react-icons/io'
import { useState } from 'react'
import { Complaint, Thana } from '../types';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useUserStore } from '../_store/userStore';
export default function SPComplaintSection() {
    const [activeTab, setActiveTab] = useState("manage");
    const [loading, setLoading] = useState(false);
    const [complaintDetails, setComplaintDetails] = useState<Complaint>({
        role_addressed_to: "",
        recipient_address: "",
        subject: "",
        date: "",
        current_status: "",
        name_of_complainer: "",
        complainer_contact_number: "",
        allocated_thana: "",
        submitted_by: "",
    });
    const [addThanaLoading, setAddThanaLoading] = useState(false);
    const [addThanaDetails, setAddThanaDetails] = useState({
        name: "",
        pin_code: "",
        city: "",
        contact_number: "",
    })

    const [thanaAdminInfo, setThanaAdminInfo] = useState({
        name: "",
        pin_code: "",
        city: "",
        contact_number: "",
    })
    const { thana } = useUserStore();

    const addThana = async () => {
        setAddThanaLoading(true);
        if (!addThanaDetails.name || !addThanaDetails.pin_code || !addThanaDetails.city || !addThanaDetails.contact_number) {
            toast.error("Please fill all the fields");
            return;
        }
        try {
            const response = await axios.post("/api/thana", addThanaDetails);
            if (response.data.success) {
                toast.success("Thana added successfully");
                setAddThanaDetails({
                    name: "",
                    pin_code: "",
                    city: "",
                    contact_number: "",
                });
            }
        } catch (error) {
            toast.error("Failed to add thana");
        } finally {
            setAddThanaLoading(false);
        }
    }

    const submitComplaint = async () => {
        setLoading(true);
        if (!complaintDetails.role_addressed_to || !complaintDetails.recipient_address || !complaintDetails.subject || !complaintDetails.date || !complaintDetails.current_status || !complaintDetails.name_of_complainer || !complaintDetails.complainer_contact_number || !complaintDetails.allocated_thana || !complaintDetails.submitted_by) {
            toast.error("Please fill all the fields");
            return;
        }
        try {
            const response = await axios.post("/api/complaint", complaintDetails);
            if (response.data.success) {
                toast.success("Complaint submitted successfully");
                setComplaintDetails({
                    role_addressed_to: "",
                    recipient_address: "",
                    subject: "",
                    date: "",
                    current_status: "",
                    name_of_complainer: "",
                    complainer_contact_number: "",
                    allocated_thana: "",
                    submitted_by: "",
                });
            }
        } catch (error) {
            toast.error("Failed to submit complaint");
        } finally {
            setLoading(false);
        }
    }

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
                                <select
                                    value={complaintDetails.role_addressed_to}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, role_addressed_to: e.target.value })}
                                    id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' >
                                    <option value="">-- Select Recipient --</option>
                                    <option value="SP">SP</option>
                                    <option value="TI">TI</option>
                                </select>
                            </div>
                            <div className="flex flex-col items-start gap-2 justify-center">
                                <label htmlFor="name">Recipient Address</label>
                                <input
                                    value={complaintDetails.recipient_address}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, recipient_address: e.target.value })}
                                    placeholder="Enter recipient's address" type="text"
                                    id="name"
                                    className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' />
                            </div>
                            <div className="flex flex-col items-start gap-2 justify-center">
                                <label htmlFor="name">Subject</label>
                                <input
                                    value={complaintDetails.subject}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, subject: e.target.value })}
                                    placeholder="Enter complaint subject" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' />
                            </div>
                            <div className="flex flex-col items-start gap-2 justify-center">
                                <label htmlFor="name">Date</label>
                                <input
                                    type='date'
                                    value={complaintDetails.date}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, date: e.target.value })} id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' />
                            </div>
                            <div className="flex flex-col items-start gap-2 justify-center">
                                <label htmlFor="name">Name of Complainer</label>
                                <input
                                    value={complaintDetails.name_of_complainer}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, name_of_complainer: e.target.value })}
                                    placeholder="Enter full name" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' />
                            </div>
                            <div className="flex flex-col items-start gap-2 justify-center">
                                <label htmlFor="name">Mobile No. of Complainer</label>
                                <input placeholder="Enter 10-digit mobile number" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' />
                            </div>

                            <div className="flex flex-col items-start gap-2 justify-center">
                                <label htmlFor="name">Allocate to Thana</label>
                                <select
                                    value={complaintDetails.allocated_thana}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, allocated_thana: e.target.value })}
                                    id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' >

                                    <option value="">-- Select Thana --</option>
                                    {
                                        thana?.map((th: Thana, index: number) => (
                                            <option key={index} value={th.name}>{th.name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div className='w-full relative bottom-0'>

                                <button
                                    onClick={submitComplaint}
                                    disabled={loading}
                                    className='w-full absolute h-10 bottom-0 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none bg-blue-500 text-white hover:bg-blue-600 transition-colors cursor-pointer'>{loading ? "Submitting..." : "Submit"}</button>
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

                            {/* ADD THANA */}
                            <div className='flex flex-col items-start justify-start gap-3 border-gray-300 border bg-white shadow-lg p-3 rounded-lg'>
                                <h1 className='text-lg font-semibold text-gray-600 text-center'>Add a Thana</h1>
                                <div className='flex flex-col items-start gap-2 justify-center w-full mt-3'>
                                    <label htmlFor="name" className='text-gray-600'>Thana Name</label>
                                    <input
                                        value={addThanaDetails.name}
                                        onChange={(e) => setAddThanaDetails({ ...addThanaDetails, name: e.target.value })}
                                        placeholder="Enter Thana Name" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' />
                                </div>

                                <div className='flex flex-col items-start gap-2 justify-center w-full'>
                                    <label htmlFor="name" className='text-gray-600'>Thana Contact No.</label>
                                    <input
                                        value={addThanaDetails.contact_number}
                                        onChange={(e) => setAddThanaDetails({ ...addThanaDetails, contact_number: e.target.value })}
                                        placeholder="Enter Contact Number" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none' />
                                </div>

                                <div className='flex flex-col items-start gap-2 justify-center w-full'>
                                    <label htmlFor="name" className='text-gray-600'>City</label>
                                    <input
                                        value={addThanaDetails.city}
                                        onChange={(e) => setAddThanaDetails({ ...addThanaDetails, city: e.target.value })}
                                        placeholder="Enter City" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none' />
                                </div>

                                <div className='flex flex-col items-start gap-2 justify-center w-full'>
                                    <label htmlFor="name" className='text-gray-600'>Pin Code</label>
                                    <input
                                        value={addThanaDetails.pin_code}
                                        onChange={(e) => setAddThanaDetails({ ...addThanaDetails, pin_code: e.target.value })}
                                        placeholder="Enter Pin Code" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none' />
                                </div>
                                <button
                                    onClick={addThana}
                                    disabled={addThanaLoading}
                                    className='w-full h-10 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none bg-green-500 text-white hover:bg-green-600 transition-colors cursor-pointer'>{addThanaLoading ? "Adding..." : "Add Thana"}</button>
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
