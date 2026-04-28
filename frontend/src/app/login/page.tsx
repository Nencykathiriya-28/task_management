'use client';

import React, { useState } from 'react';
import AuthLayout from '@/components/AuthLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const result = await login(formData);
        if (result.success) {
            router.push('/');
        } else {
            setError(result.error || 'Login failed');
        }
    };

    return (
        <AuthLayout>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back 👋</h1>
                <p className="text-gray-500 text-sm">
                    Log in to manage your tasks and track progress.
                </p>
            </div>

            {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#5C59D9]/10 focus:border-[#5C59D9] transition-all placeholder:text-gray-300 mb-2"
                        required
                    />
                    <div className="text-right">
                        <Link href="/forgot-password"  className="text-xs text-red-400 hover:underline">Forgot your password?</Link>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-[#5C59D9] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#4a47b1] transition-all shadow-xl shadow-indigo-100"
                >
                    Sign In
                </button>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Don't have an account? <Link href="/role-selection" className="text-primary font-semibold hover:underline">Sign up</Link>
                </p>
            </form>
        </AuthLayout>
    );
};

export default Login;
