'use client'
import { useState } from 'react'
import toast from 'react-hot-toast';
import axios from 'axios';
import { useUserStore } from '../_store/userStore';

export default function AdminActions() {
    const { thana, user } = useUserStore();
    const [addThanaLoading, setAddThanaLoading] = useState(false);
    const [addUserLoading, setAddUserLoading] = useState(false);
    const [addThanaDetails, setAddThanaDetails] = useState({
        name: "", pin_code: "", city: "", contact_number: "",
    });
    const [addUserDetails, setAddUserDetails] = useState({
        name: "",
        email: "",
        role: "TI" as "TI",
        phone: "",
        thana: user?.role === "TI" ? (user?.thana ?? "") : "",
    });

    const addThana = async () => {
        setAddThanaLoading(true);
        if (!addThanaDetails.name || !addThanaDetails.pin_code || !addThanaDetails.city || !addThanaDetails.contact_number) {
            toast.error("Please fill all the fields");
            setAddThanaLoading(false);
            return;
        }
        try {
            const response = await axios.post("/api/thana", addThanaDetails);
            if (response.data.success) {
                toast.success("Thana added successfully");
                setAddThanaDetails({ name: "", pin_code: "", city: "", contact_number: "" });
            }
        } catch {
            toast.error("Failed to add thana");
        } finally {
            setAddThanaLoading(false);
        }
    };

    const createNewUser = async () => {
        if (addUserLoading) return;
        if (!addUserDetails.name || !addUserDetails.email || !addUserDetails.phone) {
            toast.error("Please fill all required fields");
            return;
        }
        if (!addUserDetails.thana) {
            toast.error("Please select a thana");
            return;
        }
        try {
            setAddUserLoading(true);
            const response = await axios.post("/api/user", { ...addUserDetails, role: "TI" });
            if (response.data.success) {
                toast.success("User created successfully");
                setAddUserDetails({
                    name: "", email: "", role: "TI", phone: "",
                    thana: user?.role === "TI" ? (user?.thana ?? "") : "",
                });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to create user");
        } finally {
            setAddUserLoading(false);
        }
    };

    if (user?.role !== "SP" && user?.role !== "TI") {
        return <p className="text-red-500 p-4">Access Denied.</p>;
    }

    return (
        <div className='w-full px-3'>
            <h1 className='text-xl font-bold text-slate-900 tracking-tight py-4'>Admin Actions</h1>
            <div className='grid grid-cols-3 max-lg:grid-cols-2 max-sm:grid-cols-1 gap-4 w-full'>

                {/* CREATE TI USER */}
                <div className='flex flex-col gap-3 bg-white border border-gray-200 rounded-sm shadow-sm'>
                    <h2 className='text-base font-semibold text-gray-600 text-center p-3 w-full bg-indigo-50 border-b border-indigo-100'>
                        Create a New TI User
                    </h2>
                    <div className='flex flex-col gap-4 px-4 pb-4'>
                        <div className='flex flex-col gap-1.5'>
                            <label className='text-sm text-gray-600 font-medium'>Full Name</label>
                            <input value={addUserDetails.name}
                                onChange={(e) => setAddUserDetails({ ...addUserDetails, name: e.target.value })}
                                placeholder="Enter User's Name" type="text"
                                className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm' />
                        </div>
                        <div className='flex flex-col gap-1.5'>
                            <label className='text-sm text-gray-600 font-medium'>Email Address</label>
                            <input value={addUserDetails.email}
                                onChange={(e) => setAddUserDetails({ ...addUserDetails, email: e.target.value })}
                                placeholder="Enter Email Address" type="email"
                                className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm' />
                        </div>
                        <div className='flex flex-col gap-1.5'>
                            <label className='text-sm text-gray-600 font-medium'>Phone Number</label>
                            <input value={addUserDetails.phone}
                                onChange={(e) => setAddUserDetails({ ...addUserDetails, phone: e.target.value })}
                                placeholder="Enter Phone Number" type="text"
                                className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm' />
                        </div>

                        {/* Role — fixed, just a display badge */}
                        <div className='flex flex-col gap-1.5'>
                            <label className='text-sm text-gray-600 font-medium'>Role</label>
                            <div className='w-full p-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-500 font-semibold'>
                                TI (Thana In-charge)
                            </div>
                        </div>

                        {/* Thana — SP picks from list, TI sees their own thana */}
                        <div className='flex flex-col gap-1.5'>
                            <label className='text-sm text-gray-600 font-medium'>Allocate Thana</label>
                            {user?.role === "SP" ? (
                                <select value={addUserDetails.thana}
                                    onChange={(e) => setAddUserDetails({ ...addUserDetails, thana: e.target.value })}
                                    className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm'>
                                    <option value="">-- Select Thana --</option>
                                    {thana?.map((th, index) => (
                                        <option key={index} value={th?.name}>{th?.name}</option>
                                    ))}
                                </select>
                            ) : (
                                // TI — auto-locked to their own thana
                                <div className='w-full p-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-500'>
                                    {user?.thana ?? "—"}
                                </div>
                            )}
                        </div>

                        <button onClick={createNewUser} disabled={addUserLoading}
                            className='w-full h-10 bg-indigo-500 text-white hover:bg-indigo-600 transition-colors rounded-md text-sm font-medium disabled:opacity-60'>
                            {addUserLoading ? "Creating..." : "Create TI User"}
                        </button>
                    </div>
                </div>

                {/* ADD THANA — SP only */}
                {user?.role === "SP" && (
                    <div className='flex flex-col gap-3 bg-white border border-gray-200 rounded-sm shadow-sm'>
                        <h2 className='text-base font-semibold text-gray-600 text-center p-3 w-full bg-green-50 border-b border-green-100'>
                            Add a Thana
                        </h2>
                        <div className='flex flex-col gap-4 px-4 pb-4'>
                            <div className='flex flex-col gap-1.5'>
                                <label className='text-sm text-gray-600 font-medium'>Thana Name</label>
                                <input value={addThanaDetails.name}
                                    onChange={(e) => setAddThanaDetails({ ...addThanaDetails, name: e.target.value })}
                                    placeholder="Enter Thana Name" type="text"
                                    className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none text-sm' />
                            </div>
                            <div className='flex flex-col gap-1.5'>
                                <label className='text-sm text-gray-600 font-medium'>Contact No.</label>
                                <input value={addThanaDetails.contact_number}
                                    onChange={(e) => setAddThanaDetails({ ...addThanaDetails, contact_number: e.target.value })}
                                    placeholder="Enter Contact Number" type="text"
                                    className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none text-sm' />
                            </div>
                            <div className='flex flex-col gap-1.5'>
                                <label className='text-sm text-gray-600 font-medium'>City</label>
                                <input value={addThanaDetails.city}
                                    onChange={(e) => setAddThanaDetails({ ...addThanaDetails, city: e.target.value })}
                                    placeholder="Enter City" type="text"
                                    className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none text-sm' />
                            </div>
                            <div className='flex flex-col gap-1.5'>
                                <label className='text-sm text-gray-600 font-medium'>Pin Code</label>
                                <input value={addThanaDetails.pin_code}
                                    onChange={(e) => setAddThanaDetails({ ...addThanaDetails, pin_code: e.target.value })}
                                    placeholder="Enter Pin Code" type="text"
                                    className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none text-sm' />
                            </div>
                            <button onClick={addThana} disabled={addThanaLoading}
                                className='w-full h-10 bg-green-500 text-white hover:bg-green-600 transition-colors rounded-md text-sm font-medium disabled:opacity-60'>
                                {addThanaLoading ? "Adding..." : "Add Thana"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}