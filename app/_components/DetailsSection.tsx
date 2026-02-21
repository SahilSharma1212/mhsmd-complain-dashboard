"use client"

import { useUserStore } from '../_store/userStore'
import { IoPersonOutline, IoShieldCheckmarkOutline, IoCallOutline, IoMailOutline, IoLocationOutline, IoHomeOutline } from 'react-icons/io5'

export default function DetailsSection() {
    const { user } = useUserStore();

    if (!user) return null;

    const initials = user.name
        .split(" ")
        .map(word => word.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const formattedName = user.name
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");

    return (
        <div className="bg-white rounded-xs border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <IoHomeOutline className="text-blue-500" />
                    User Profile & Information
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight uppercase border ${user.role === 'SP' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                    {user.role} Account
                </span>
            </div>

            <div className="p-6">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-3 min-w-[120px]">
                        <div className="w-20 h-20 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg ring-1 ring-slate-200">
                            {initials}
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-slate-900">{formattedName}</p>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">{user.role}</p>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <IoPersonOutline size={12} className="text-blue-500" />
                                Full Name
                            </p>
                            <p className="text-sm font-semibold text-slate-700">{formattedName}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <IoShieldCheckmarkOutline size={12} className="text-blue-500" />
                                Designation / Role
                            </p>
                            <p className="text-sm font-semibold text-slate-700">{user.role}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <IoCallOutline size={12} className="text-blue-500" />
                                Contact Number
                            </p>
                            <p className="text-sm font-semibold text-slate-700">{user.phone}</p>
                        </div>

                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <IoHomeOutline size={12} className="text-blue-500" />
                                Allocated Thana
                            </p>
                            <p className="text-sm font-semibold text-slate-700">
                                {user.role === "SP"
                                    ? "Multiple In Control"
                                    : user.thana.split(" ")
                                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                        .join(" ")
                                }
                            </p>
                        </div>

                        <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <IoMailOutline size={12} className="text-blue-500" />
                                Email Address
                            </p>
                            <p className="text-sm font-semibold text-slate-700 break-all">{user.email}</p>
                        </div>

                        <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <IoLocationOutline size={12} className="text-blue-500" />
                                Official Address
                            </p>
                            <p className={`text-sm font-semibold text-slate-700 ${!user.address && "text-slate-400 italic font-medium"}`}>
                                {user.address || "Address not provided"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
