'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface DashboardLayoutProps {
    children: React.ReactNode;
    onSearch?: (term: string) => void;
}

const DashboardLayout = ({ children, onSearch }: DashboardLayoutProps) => {
    const pathname = usePathname();
    const { logout, user } = useAuth() as any;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const menuItems = [
        {
            name: 'Dashboard',
            path: '/',
            icon: (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="1" y="1" width="7" height="7" rx="1.5" fill="currentColor" />
                    <rect x="10" y="1" width="7" height="7" rx="1.5" fill="currentColor" />
                    <rect x="1" y="10" width="7" height="7" rx="1.5" fill="currentColor" />
                    <rect x="10" y="10" width="7" height="7" rx="1.5" fill="currentColor" />
                </svg>
            ),
        },
        ...(user?.role === 'admin'
            ? [{
                name: 'Tasks',
                path: '/tasks',
                icon: (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <circle cx="3" cy="5" r="1.5" fill="currentColor" />
                        <line x1="6.5" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="3" cy="9" r="1.5" fill="currentColor" />
                        <line x1="6.5" y1="9" x2="17" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <circle cx="3" cy="13" r="1.5" fill="currentColor" />
                        <line x1="6.5" y1="13" x2="17" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                ),
            }]
            : []),
    ];

    const SidebarContent = () => (
        <>
            <div className="px-6 py-7 flex justify-between items-center lg:block">
                <h1 className="text-lg font-black text-gray-900 tracking-tight leading-tight">
                    Task Management
                </h1>
                <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="lg:hidden text-gray-400 hover:text-gray-600"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <nav className="flex-1 px-3 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                                isActive
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                            }`}
                        >
                            <span className={isActive ? 'text-gray-700' : 'text-gray-400'}>
                                {item.icon}
                            </span>
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-5 border-t border-gray-50">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full text-gray-400 hover:text-red-400 transition-colors text-sm font-semibold"
                >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M7 3H3.5C2.67 3 2 3.67 2 4.5v9C2 14.33 2.67 15 3.5 15H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M12 6l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="15" y1="9" x2="7" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span>Logout</span>
                </button>
            </div>
        </>
    );

    return (
        <div className="flex min-h-screen bg-white relative">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar Desktop */}
            <aside className="hidden lg:flex w-56 bg-white border-r border-gray-100 flex-col fixed h-full z-50">
                <SidebarContent />
            </aside>

            {/* Sidebar Mobile */}
            <aside className={`fixed top-0 left-0 h-full w-64 bg-white z-50 transform transition-transform duration-300 lg:hidden ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-56 min-h-screen bg-white w-full overflow-hidden">
                {/* Header */}
                <header className="flex justify-between items-center px-4 lg:px-8 py-4 lg:py-5 border-b border-gray-50 bg-white/80 backdrop-blur-md sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 hover:bg-gray-50 rounded-lg text-gray-500 transition-colors"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                        
                        <div className="relative w-40 sm:w-64 lg:w-80">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300">
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M11 11l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search..."
                                onChange={(e) => onSearch?.(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 lg:py-2.5 bg-gray-50/50 border border-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200 transition-all text-sm placeholder:text-gray-300"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-3">
                        <span className="hidden sm:inline text-xs font-bold text-gray-400 uppercase tracking-widest">
                            {user?.role}
                        </span>
                        <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gray-200 overflow-hidden border border-gray-100 shadow-sm">
                            <img
                                src={`https://ui-avatars.com/api/?name=${user?.name || user?.role}&background=random`}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </header>

                <div className="p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;