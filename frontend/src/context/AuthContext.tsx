'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/utils/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: any;
    loading: boolean;
    register: (userData: any) => Promise<{ success: boolean; error?: string }>;
    login: (credentials: any) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    setUser(res.data.data);
                } catch (err) {
                    if (typeof window !== 'undefined') localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const register = async (userData: any) => {
        try {
            const res = await api.post('/auth/register', userData);
            if (typeof window !== 'undefined') localStorage.setItem('token', res.data.token);
            setUser(res.data.user);
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.response?.data?.error || 'Registration failed' };
        }
    };

    const login = async (credentials: any) => {
        try {
            const res = await api.post('/auth/login', credentials);
            if (typeof window !== 'undefined') localStorage.setItem('token', res.data.token);
            setUser(res.data.user);
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.response?.data?.error || 'Login failed' };
        }
    };

    const logout = () => {
        if (typeof window !== 'undefined') localStorage.removeItem('token');
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, register, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
