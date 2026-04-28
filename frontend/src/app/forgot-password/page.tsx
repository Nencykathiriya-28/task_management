'use client';

import React, { useState } from 'react';
import AuthLayout from '@/components/AuthLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const { login } = useAuth() as any;
    const router = useRouter();

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/forgotpassword', { email });
            setMessage('OTP sent to your email. Please check your inbox.');
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/verifyotp', { email, otp });
            setMessage('OTP verified. Now set your new password.');
            setStep(3);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid or expired OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await api.put('/auth/resetpassword', { email, otp, password });
            
            // Login user after successful reset
            // We use the token from the response
            const { token, user } = res.data;
            localStorage.setItem('token', token);
            window.location.href = '/'; // Hard redirect to ensure auth context updates
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {step === 1 && 'Forgot Password?'}
                    {step === 2 && 'Verify OTP'}
                    {step === 3 && 'New Password'}
                </h1>
                <p className="text-gray-500 text-sm">
                    {step === 1 && "No worries! Enter your email and we'll send you an OTP."}
                    {step === 2 && `We've sent an OTP to ${email}`}
                    {step === 3 && 'Set a strong password for your account.'}
                </p>
            </div>

            {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center font-semibold">{error}</div>}
            {message && step !== 3 && <div className="bg-emerald-50 text-emerald-500 p-3 rounded-lg mb-4 text-sm text-center font-semibold">{message}</div>}

            {step === 1 && (
                <form onSubmit={handleSendOTP} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#5C59D9]/10 focus:border-[#5C59D9] transition-all placeholder:text-gray-300"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#5C59D9] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#4a47b1] transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                    >
                        {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                </form>
            )}

            {step === 2 && (
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">6-Digit OTP</label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter the OTP"
                            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#5C59D9]/10 focus:border-[#5C59D9] transition-all placeholder:text-gray-300 text-center text-2xl tracking-[0.5em] font-bold"
                            maxLength={6}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#5C59D9] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#4a47b1] transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                    <div className="text-center">
                        <button type="button" onClick={() => setStep(1)} className="text-sm text-[#5C59D9] font-bold hover:underline">Change email</button>
                    </div>
                </form>
            )}

            {step === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#5C59D9]/10 focus:border-[#5C59D9] transition-all placeholder:text-gray-300"
                            required
                            minLength={6}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-type your password"
                            className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#5C59D9]/10 focus:border-[#5C59D9] transition-all placeholder:text-gray-300"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#5C59D9] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#4a47b1] transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                    >
                        {loading ? 'Resetting...' : 'Reset & Login'}
                    </button>
                </form>
            )}

            <p className="text-center text-sm text-gray-500 mt-8">
                Remember your password? <Link href="/login" className="text-[#5C59D9] font-semibold hover:underline">Back to login</Link>
            </p>
        </AuthLayout>
    );
};

export default ForgotPassword;
