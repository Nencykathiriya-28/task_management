'use client';

import React, { useState, useEffect } from 'react';
import AuthLayout from '@/components/AuthLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user'
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedRole = localStorage.getItem('selectedRole');
            if (savedRole) {
                setFormData(prev => ({ ...prev, role: savedRole }));
            } else {
                router.push('/role-selection');
            }
        }
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const result = await register(formData);
        if (result.success) {
            router.push('/');
        } else {
            setError(result.error || 'Registration failed');
        }
    };

    return (
        <AuthLayout>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
                <p className="text-gray-500 text-sm">
                    Get started with task management in seconds.
                </p>
            </div>

            {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#5C59D9]/10 focus:border-[#5C59D9] transition-all placeholder:text-gray-300"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email address"
                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#5C59D9]/10 focus:border-[#5C59D9] transition-all placeholder:text-gray-300"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#5C59D9]/10 focus:border-[#5C59D9] transition-all placeholder:text-gray-300"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-[#5C59D9] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#4a47b1] transition-all shadow-xl shadow-indigo-100"
                >
                    Create Account
                </button>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Already have an account? <Link href="/login" className="text-primary font-semibold hover:underline">Log In</Link>
                </p>
            </form>
        </AuthLayout>
    );
};

export default Signup;
