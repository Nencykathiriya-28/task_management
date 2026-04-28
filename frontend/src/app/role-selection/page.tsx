'use client';

import React from 'react';
import AuthLayout from '@/components/AuthLayout';
import { useRouter } from 'next/navigation';

const RoleSelection = () => {
    const router = useRouter();

    const handleRoleSelect = (role: 'admin' | 'user') => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('selectedRole', role);
        }
        router.push('/signup');
    };

    return (
        <AuthLayout>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Role</h1>
                <p className="text-gray-500 text-sm">
                    Select how you want to use the dashboard.<br />
                    You can't change this later without admin support.
                </p>
            </div>

            <div className="flex flex-col gap-6">
                {/* Admin Option */}
                <div 
                    onClick={() => handleRoleSelect('admin')}
                    className="border-2 border-[#5C59D9] rounded-3xl p-8 cursor-pointer hover:bg-indigo-50/50 transition-all group relative overflow-hidden"
                >
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="text-3xl font-extrabold text-[#5C59D9]">Admin</h2>
                    </div>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                        Create, assign, and manage<br /> tasks across all users.
                    </p>
                    <ul className="text-[13px] text-gray-500 space-y-2 mb-8 list-none">
                        <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span> Create, edit, and delete tasks
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span> Assign tasks to users
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span> View all tasks and users
                        </li>
                    </ul>
                    <button className="w-full bg-[#5C59D9] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#4a47b1] transition-all shadow-lg shadow-indigo-200">
                        Continue as Admin
                    </button>
                </div>

                {/* User Option */}
                <div 
                    onClick={() => handleRoleSelect('user')}
                    className="bg-white border-2 border-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 cursor-pointer hover:border-gray-200 hover:bg-gray-50/50 transition-all group"
                >
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="text-3xl font-extrabold text-gray-900">User</h2>
                    </div>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                        View and manage tasks<br /> assigned to you.
                    </p>
                    <ul className="text-[13px] text-gray-500 space-y-2 mb-8 list-none">
                        <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span> View assigned tasks
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span> Update task status
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span> Track your progress
                        </li>
                    </ul>
                    <button className="w-full bg-[#F3F4F6] text-gray-900 py-4 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all">
                        Continue as User
                    </button>
                </div>
            </div>
        </AuthLayout>
    );
};

export default RoleSelection;
