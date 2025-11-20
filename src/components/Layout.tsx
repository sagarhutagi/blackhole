import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
    return (
        <div className="h-screen w-screen text-white font-sans relative overflow-hidden flex flex-col bg-black">
            {/* Animated Background with Black Hole Effects - Same as Landing Page */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {/* Main gradients */}
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-violet-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-pink-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
                <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-2000" />
                <div className="absolute top-[60%] left-[40%] w-[20%] h-[20%] bg-orange-600/15 rounded-full blur-[100px] animate-pulse delay-3000" />

                {/* Black hole center effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-20">
                    <div className="absolute inset-0 rounded-full bg-gradient-radial from-transparent via-violet-900/30 to-black blur-2xl animate-spin-slow"></div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 relative z-10 overflow-hidden w-full">
                {children}
            </main>
        </div>
    );
}
