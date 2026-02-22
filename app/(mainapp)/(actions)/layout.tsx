'use client'
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '../../_store/userStore';

export default function ActionsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname();
    const { user } = useUserStore();

    const tabs = [
        { id: "manage", label: "Manage Complaints", href: "/manage-complaints", color: "#7a00b3", indicatorColor: "#dd00ff" },
        { id: "unallocated", label: "Unallocated Complaints", href: "/unallocated-complaints", color: "#e67e22", indicatorColor: "#f39c12" },
        { id: "register", label: "Register Complaint", href: "/register-complaint", color: "#0000ff", indicatorColor: "#0000ff" },
        { id: "admin", label: "Admin Actions", href: "/admin-actions", color: "#06a600", indicatorColor: "#00ff00" },
    ];

    // Filter tabs for non-SP users
    const visibleTabs = user?.role === "SP" ? tabs : tabs.filter(tab => tab.id !== "admin" && tab.id !== "unallocated");

    const getActiveTab = () => {
        if (pathname.includes("/manage-complaints")) return "manage";
        if (pathname.includes("/unallocated-complaints")) return "unallocated";
        if (pathname.includes("/register-complaint")) return "register";
        if (pathname.includes("/admin-actions")) return "admin";
        return "manage";
    };

    const activeTabId = getActiveTab();
    const activeTab = tabs.find(t => t.id === activeTabId);

    return (
        <div className='bg-white rounded-lg w-full flex flex-col items-start'>
            <div className="relative flex border-b py-2 border-gray-100 w-full">
                {visibleTabs.map((tab) => (
                    <Link
                        key={tab.id}
                        href={tab.href}
                        className={`flex-1 py-3 text-sm font-semibold transition-colors duration-200 text-center`}
                        style={{
                            color: activeTabId === tab.id ? tab.color : "#64748b",
                        }}
                    >
                        {tab.label}
                    </Link>
                ))}

                {/* Active Indicator */}
                <div
                    className={`absolute bottom-0 h-[2px] transition-all duration-300`}
                    style={{
                        width: `${100 / visibleTabs.length}%`,
                        left: `${(visibleTabs.findIndex(t => t.id === activeTabId)) * (100 / visibleTabs.length)}%`,
                        backgroundColor: activeTab?.indicatorColor || "#000",
                    }}
                />
                <div
                    className={`absolute bottom-0 h-full transition-all duration-300 z-0`}
                    style={{
                        width: `${100 / visibleTabs.length}%`,
                        left: `${(visibleTabs.findIndex(t => t.id === activeTabId)) * (100 / visibleTabs.length)}%`,
                        backgroundColor: `${activeTab?.indicatorColor}05` || "transparent",
                    }}
                />
            </div>
            <div className="w-full">
                {children}
            </div>
        </div>
    );
}
