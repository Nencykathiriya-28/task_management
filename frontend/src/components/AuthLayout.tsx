import React from 'react';
import Image from 'next/image';

interface AuthLayoutProps {
    children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
    return (
        <div className="flex min-h-screen w-full bg-white font-sans">
            {/* Left Side - Illustration (Hidden on mobile) */}
            <div className="hidden lg:flex flex-1 bg-[#F0F0FF] items-center justify-center p-12">
                <div className="relative w-full h-full max-w-[700px] max-h-[700px]">
                    <Image
                        src="/login_imgs/Frame 1.png"
                        alt="Task Management Illustration"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
            </div>

            {/* Right Side - Form Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16">
                <div className="w-full max-w-[440px]">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
