'use client'
import { IoMdSearch } from 'react-icons/io'
import { useState } from 'react'
import { Complaint, Thana } from '../types';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useUserStore } from '../_store/userStore';
import { FcRefresh } from 'react-icons/fc';
export default function SPComplaintSection() {
    const [activeTab, setActiveTab] = useState("manage");
    const [loading, setLoading] = useState(false);
    const [addThanaLoading, setAddThanaLoading] = useState(false);
    const [allocateThanaLoading, setAllocateThanaLoading] = useState(false);
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
    const [addThanaDetails, setAddThanaDetails] = useState({
        name: "",
        pin_code: "",
        city: "",
        contact_number: "",
    })

    const [thanaAdminInfo, setThanaAdminInfo] = useState({
        thana: "",
        name: "",
        email: "",
        contact_number: "",
    })
    const { thana, user, complaints, setComplaints } = useUserStore();

    const allocateThanaTI = async () => {
        setAllocateThanaLoading(true);
        if (!thanaAdminInfo.name || !thanaAdminInfo.email || !thanaAdminInfo.contact_number || !thanaAdminInfo.thana) {
            toast.error("Please fill all the fields");
            setAllocateThanaLoading(false);
            return;
        }
        try {
            const response = await axios.post("/api/thana/allocate-ti", thanaAdminInfo);
            if (response.data.success) {
                toast.success("Thana allocated successfully");
                setThanaAdminInfo({
                    name: "",
                    email: "",
                    contact_number: "",
                    thana: "",
                });
            }
        } catch (error) {
            toast.error("Failed to allocate thana");
        } finally {
            setAllocateThanaLoading(false);
        }
    }

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

        const finalComplaint = {
            ...complaintDetails,
            current_status: "Pending",
            submitted_by: user?.name,
        }

        if (!finalComplaint.role_addressed_to || !finalComplaint.recipient_address || !finalComplaint.subject || !finalComplaint.date || !finalComplaint.current_status || !finalComplaint.name_of_complainer || !finalComplaint.complainer_contact_number || !finalComplaint.allocated_thana || !finalComplaint.submitted_by) {
            toast.error("Please fill all the fields");
            setLoading(false);
            return;
        }
        try {
            const response = await axios.post("/api/complaint", finalComplaint);
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

    const complaintStatusColors: Record<string, { bg: string, text: string }> = {
        "PENDING": { bg: "#0000ff20", text: "#0000ff" },
        "FIR": { bg: "#ff5e0020", text: "#ff5e00" },
        "NON FIR": { bg: "#7a00b320", text: "#7a00b3" },
        "FILE": { bg: "#99999920", text: "#999999" },
        "NO CONTACT": { bg: "#ff000020", text: "#ff0000" },
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
                        <h1 className='text-xl font-semibold text-gray-600 py-3 flex items-center justify-start gap-3'>
                            Complaints Table
                            <button onClick={() => fetchComplaints()} className='cursor-pointer border p-1 rounded-md hover:bg-blue-500/10 border-blue-500'><FcRefresh size={20} /></button>
                        </h1>
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
                                    {complaints?.map((complaint) => (
                                        <tr key={complaint.id} className='hover:bg-gray-50 cursor-pointer transition-colors'>
                                            <td className='p-3 text-sm text-gray-700 font-medium'>{complaint.id}</td>
                                            <td className='p-3 text-sm text-gray-700 font-medium'>{complaint.name_of_complainer}</td>
                                            <td className='p-3 text-sm text-gray-700'>{complaint.date}</td>
                                            <td className='p-3 text-sm text-gray-700'>{complaint.role_addressed_to}</td>
                                            <td className='p-3 text-sm text-gray-700'>{complaint.subject}</td>
                                            <td className='p-3 text-sm text-center'>
                                                <div
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                                                    style={{
                                                        color: complaintStatusColors[complaint.current_status]?.text,
                                                        backgroundColor: complaintStatusColors[complaint.current_status]?.bg,
                                                    }}
                                                >
                                                    {complaint.current_status}
                                                </div>
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
                                <input
                                    value={complaintDetails.complainer_contact_number}
                                    onChange={(e) => setComplaintDetails({ ...complaintDetails, complainer_contact_number: e.target.value })}
                                    placeholder="Enter 10-digit mobile number" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none rounded-r-none' />
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
                                        value={thanaAdminInfo.thana}
                                        onChange={(e) => setThanaAdminInfo({ ...thanaAdminInfo, thana: e.target.value })}
                                        className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none'
                                    >
                                        <option value="">Select Thana</option>
                                        {thana?.map((th, index) => (
                                            <option key={index} value={th?.name}>
                                                {th?.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className='flex flex-col items-start gap-2 justify-center w-full'>
                                    <label htmlFor="name" className='text-gray-600'>Name</label>
                                    <input
                                        value={thanaAdminInfo.name}
                                        onChange={(e) => setThanaAdminInfo({ ...thanaAdminInfo, name: e.target.value })}
                                        placeholder="Enter TI Name" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none' />
                                </div>
                                <div className='flex flex-col items-start gap-2 justify-center w-full'>
                                    <label htmlFor="name" className='text-gray-600'>Contact No.</label>
                                    <input
                                        value={thanaAdminInfo.contact_number}
                                        onChange={(e) => setThanaAdminInfo({ ...thanaAdminInfo, contact_number: e.target.value })}
                                        placeholder="Enter Contact Number" type="text" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none' />
                                </div>
                                <div className='flex flex-col items-start gap-2 justify-center w-full'>
                                    <label htmlFor="name" className='text-gray-600'>Email</label>
                                    <input
                                        value={thanaAdminInfo.email}
                                        onChange={(e) => setThanaAdminInfo({ ...thanaAdminInfo, email: e.target.value })}
                                        placeholder="Enter Email Address" type="email" id="name" className='w-full p-2 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none' />
                                </div>
                                <button onClick={allocateThanaTI} disabled={allocateThanaLoading} className='w-full h-10 rounded-md border border-gray-300 focus:border-gray-500 border-r-none focus:outline-none bg-blue-500 text-white hover:bg-blue-600 transition-colors cursor-pointer'>{allocateThanaLoading ? "Allocating..." : "Submit"}</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    )
}
