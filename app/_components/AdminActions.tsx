'use client'
import { useState } from 'react'
import toast from 'react-hot-toast';
import axios from 'axios';
import { IoPersonAddOutline, IoBusinessOutline, IoCheckmarkDoneCircleOutline, IoShieldCheckmarkOutline } from 'react-icons/io5';
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
        return (
            <div className="flex items-center justify-center h-[200px] w-full bg-red-50 border border-red-100 rounded-xs">
                <p className="text-red-600 font-bold uppercase tracking-widest text-xs">Access Restricted to Official Personnel Only</p>
            </div>
        );
    }

    return (
        <div className='w-full flex flex-col gap-8'>
            <div className="flex p-4 pb-0 items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xs flex items-center justify-center border border-indigo-100">
                    <IoShieldCheckmarkOutline className="text-indigo-600 text-xl" />
                </div>
                <div className="flex flex-col">
                    <h1 className='text-sm font-bold text-slate-900 uppercase tracking-wider'>Admin Actions</h1>
                    <span className='text-[10px] font-bold text-slate-600 uppercase tracking-widest'>Admin Control Panel</span>
                </div>
            </div>

            <div className='grid grid-cols-2 max-lg:grid-cols-1 gap-8 w-full items-start'>

                {/* ADD THANA — SP only */}
                {user?.role === "SP" && (
                    <div className='bg-white border border-slate-200 rounded-xs shadow-sm overflow-hidden flex flex-col'>
                        <div className='p-4 bg-white border-b border-slate-100 flex items-center gap-3'>
                            <div className="w-8 h-8 bg-emerald-600 rounded-xs flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <IoBusinessOutline className="text-white text-sm" />
                            </div>
                            <h2 className='text-[11px] font-bold text-slate-900 uppercase tracking-widest'>
                                Register New Physical Thana
                            </h2>
                        </div>

                        <div className='flex flex-col gap-5 p-6'>
                            <div className='flex flex-col gap-1.5'>
                                <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider'>Thana Identification Name</label>
                                <input value={addThanaDetails.name}
                                    onChange={(e) => setAddThanaDetails({ ...addThanaDetails, name: e.target.value })}
                                    placeholder="Enter Thana Name" type="text"
                                    className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xs focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all text-xs font-semibold text-slate-900 placeholder:text-slate-500' />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className='flex flex-col gap-1.5'>
                                    <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider'>Contact Number</label>
                                    <input value={addThanaDetails.contact_number}
                                        onChange={(e) => setAddThanaDetails({ ...addThanaDetails, contact_number: e.target.value })}
                                        placeholder="Enter Contact Number" type="text"
                                        className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xs focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all text-xs font-semibold text-slate-900 placeholder:text-slate-500' />
                                </div>
                                <div className='flex flex-col gap-1.5'>
                                    <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider'>City / Region</label>
                                    <input value={addThanaDetails.city}
                                        onChange={(e) => setAddThanaDetails({ ...addThanaDetails, city: e.target.value })}
                                        placeholder="Enter City" type="text"
                                        className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xs focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all text-xs font-semibold text-slate-900 placeholder:text-slate-500' />
                                </div>
                            </div>

                            <div className='flex flex-col gap-1.5'>
                                <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider'>Postal Index Number (PIN)</label>
                                <input value={addThanaDetails.pin_code}
                                    onChange={(e) => setAddThanaDetails({ ...addThanaDetails, pin_code: e.target.value })}
                                    placeholder="Enter Pin Code" type="text"
                                    className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xs focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all text-xs font-semibold text-slate-900 placeholder:text-slate-500' />
                            </div>

                            <button onClick={addThana} disabled={addThanaLoading}
                                className='w-full h-11 bg-emerald-600 text-white hover:bg-emerald-700 transition-all rounded-xs text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-600/10 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 mt-2'>
                                {addThanaLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : <IoBusinessOutline size={16} />}
                                {addThanaLoading ? "Registering Jurisdiction..." : "Register Thana Profile"}
                            </button>
                        </div>
                    </div>
                )}
                {/* CREATE TI USER */}
                <div className='bg-white border border-slate-200 rounded-xs shadow-sm overflow-hidden flex flex-col'>
                    <div className='p-4 bg-white border-b border-slate-100 flex items-center gap-3'>
                        <div className="w-8 h-8 bg-indigo-600 rounded-xs flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <IoPersonAddOutline className="text-white text-sm" />
                        </div>
                        <h2 className='text-[11px] font-bold text-slate-900 uppercase tracking-widest'>
                            Provision New Thana In-charge
                        </h2>
                    </div>

                    <div className='flex flex-col gap-5 p-6'>
                        <div className='flex flex-col gap-1.5'>
                            <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider'>Head Name</label>
                            <input value={addUserDetails.name}
                                onChange={(e) => setAddUserDetails({ ...addUserDetails, name: e.target.value })}
                                placeholder="Enter Full Name" type="text"
                                className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xs focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all text-xs font-semibold text-slate-900 placeholder:text-slate-500' />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className='flex flex-col gap-1.5'>
                                <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider'>Official Email</label>
                                <input value={addUserDetails.email}
                                    onChange={(e) => setAddUserDetails({ ...addUserDetails, email: e.target.value })}
                                    placeholder="Enter Email" type="email"
                                    className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xs focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all text-xs font-semibold text-slate-900 placeholder:text-slate-500' />
                            </div>
                            <div className='flex flex-col gap-1.5'>
                                <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider'>Contact Number</label>
                                <input value={addUserDetails.phone}
                                    onChange={(e) => setAddUserDetails({ ...addUserDetails, phone: e.target.value })}
                                    placeholder="Enter Phone" type="text"
                                    className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xs focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all text-xs font-semibold text-slate-900 placeholder:text-slate-500' />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className='flex flex-col gap-1.5'>
                                <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider'>Assigned Role</label>
                                <div className='w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xs text-[10px] text-slate-700 font-bold uppercase tracking-widest flex items-center gap-2'>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse"></div>
                                    TI (Thana In-charge)
                                </div>
                            </div>

                            <div className='flex flex-col gap-1.5'>
                                <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider'>Allocated Jurisdiction</label>
                                {user?.role === "SP" ? (
                                    <select value={addUserDetails.thana}
                                        onChange={(e) => setAddUserDetails({ ...addUserDetails, thana: e.target.value })}
                                        className='w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xs focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all text-xs font-semibold text-slate-900'>
                                        <option value="">-- Select Thana --</option>
                                        {thana?.map((th, index) => (
                                            <option key={index} value={th?.name}>{th?.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className='w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xs text-[10px] text-slate-700 font-bold uppercase tracking-widest'>
                                        {user?.thana ?? "Not Allocated"}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button onClick={createNewUser} disabled={addUserLoading}
                            className='w-full h-11 bg-indigo-600 text-white hover:bg-indigo-700 transition-all rounded-xs text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-600/10 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 mt-2'>
                            {addUserLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : <IoPersonAddOutline size={16} />}
                            {addUserLoading ? "Processing Authorization..." : "Authorize TI Account"}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
