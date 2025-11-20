import { useState, useEffect } from 'react';
import { ArrowRight, MessageCircle, Shield, Sparkles, Users, TrendingUp, PartyPopper, Flame } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LandingPageProps {
    onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
    const [onlineCount, setOnlineCount] = useState(0);

    useEffect(() => {
        // Get online user count using Supabase Presence
        const channel = supabase.channel('online-users-landing');

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                setOnlineCount(Object.keys(state).length);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ online_at: new Date().toISOString() });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="w-screen min-h-screen bg-black text-white overflow-y-auto">
            {/* Animated Background with Black Hole Effects */}
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

                {/* Particle effects */}
                <div className="absolute inset-0">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-white/30 rounded-full animate-float"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 5}s`,
                                animationDuration: `${5 + Math.random() * 10}s`
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Scrollable content */}
            <div className="relative z-10">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    {/* Header */}
                    <header className="flex items-center justify-between mb-16 sticky top-0 bg-black/50 backdrop-blur-md py-4 -mx-4 px-8 rounded-2xl z-50">
                        <div className="flex items-center space-x-3">
                            <div className="relative w-12 h-12">
                                <img
                                    src="/black_hole_logo.png"
                                    alt="Black Hole Logo"
                                    className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                                />
                            </div>
                            <span className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-violet-300 to-white">
                                Black Hole
                            </span>
                        </div>
                        <button
                            onClick={onGetStarted}
                            className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-bold transition-all hover:scale-105"
                        >
                            Log In
                        </button>
                    </header>

                    {/* Hero Section */}
                    <section className="flex flex-col items-center justify-center text-center space-y-8 mb-32 min-h-[80vh]">
                        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-1000 delay-200">
                            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-600/20 to-pink-600/20 border border-white/10 text-sm font-medium text-violet-300 mb-4 backdrop-blur-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="font-bold">{onlineCount} Students Online Now 🔥</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
                                <span className="block bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/50">
                                    Where Your Campus
                                </span>
                                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 animate-gradient-x">
                                    Gets Real 💯
                                </span>
                            </h1>
                            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
                                Slide into the most <span className="text-violet-400 font-semibold">unhinged</span> campus chat.
                                <br className="hidden md:block" />
                                Confess your secrets, start beef, or just <span className="text-pink-400 font-semibold">vibe check</span> the timeline.
                                <br className="hidden md:block" />
                                <span className="text-white font-bold text-2xl">No cap. No receipts. Just chaos. ✨</span>
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                            <button
                                onClick={onGetStarted}
                                className="group relative px-10 py-5 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-full font-black text-xl transition-all hover:scale-105 hover:shadow-[0_0_60px_-10px_rgba(139,92,246,0.8)] overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center space-x-3">
                                    <span>Enter the Void</span>
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </button>
                        </div>
                    </section>

                    {/* Features Section */}
                    <section className="py-20 space-y-12">
                        <div className="text-center space-y-4 mb-16">
                            <h2 className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                                Why It Hits Different 🎯
                            </h2>
                            <p className="text-xl text-gray-400">The realest campus experience, period.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="p-8 rounded-3xl bg-gradient-to-br from-violet-600/10 to-violet-600/5 border border-violet-500/20 backdrop-blur-sm hover:border-violet-500/40 transition-all group hover:scale-105">
                                <div className="w-14 h-14 bg-violet-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Shield className="w-7 h-7 text-violet-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">100% Ghost Mode 👻</h3>
                                <p className="text-gray-400 leading-relaxed">Say what you really think with zero fear. Your identity stays buried deeper than your exes' texts.</p>
                            </div>

                            <div className="p-8 rounded-3xl bg-gradient-to-br from-pink-600/10 to-pink-600/5 border border-pink-500/20 backdrop-blur-sm hover:border-pink-500/40 transition-all group hover:scale-105">
                                <div className="w-14 h-14 bg-pink-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Flame className="w-7 h-7 text-pink-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Live Tea Spills ☕</h3>
                                <p className="text-gray-400 leading-relaxed">Campus drama unfolds in real-time. Catch the hottest takes before they get cold.</p>
                            </div>

                            <div className="p-8 rounded-3xl bg-gradient-to-br from-orange-600/10 to-orange-600/5 border border-orange-500/20 backdrop-blur-sm hover:border-orange-500/40 transition-all group hover:scale-105">
                                <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <MessageCircle className="w-7 h-7 text-orange-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Confessions Space 🤫</h3>
                                <p className="text-gray-400 leading-relaxed">A whole section dedicated to your deepest secrets. What happens here, stays here.</p>
                            </div>

                            <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600/10 to-blue-600/5 border border-blue-500/20 backdrop-blur-sm hover:border-blue-500/40 transition-all group hover:scale-105">
                                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Users className="w-7 h-7 text-blue-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Your Tribe Only 🎓</h3>
                                <p className="text-gray-400 leading-relaxed">Exclusive to your college. No randoms, no bots, just your campus community.</p>
                            </div>

                            <div className="p-8 rounded-3xl bg-gradient-to-br from-green-600/10 to-green-600/5 border border-green-500/20 backdrop-blur-sm hover:border-green-500/40 transition-all group hover:scale-105">
                                <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <TrendingUp className="w-7 h-7 text-green-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Aura System 💫</h3>
                                <p className="text-gray-400 leading-relaxed">React with fire or skull emojis. Build your rep or get ratio'd trying.</p>
                            </div>

                            <div className="p-8 rounded-3xl bg-gradient-to-br from-yellow-600/10 to-yellow-600/5 border border-yellow-500/20 backdrop-blur-sm hover:border-yellow-500/40 transition-all group hover:scale-105">
                                <div className="w-14 h-14 bg-yellow-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <PartyPopper className="w-7 h-7 text-yellow-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3">Topic Groups 🗣️</h3>
                                <p className="text-gray-400 leading-relaxed">Create groups for anything. Roommate beef? Study stress? It's all here.</p>
                            </div>
                        </div>
                    </section>

                    {/* CTA Section */}
                    <section className="py-20 text-center space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-5xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400">
                                Ready to Get Sucked In?
                            </h2>
                            <p className="text-2xl text-gray-400 max-w-2xl mx-auto">
                                Join the most chaotic corner of your campus. <br className="hidden md:block" />
                                <span className="text-white font-bold">Warning: Highly addictive. 🚨</span>
                            </p>
                        </div>
                        <button
                            onClick={onGetStarted}
                            className="group relative px-12 py-6 bg-white text-black rounded-full font-black text-2xl transition-all hover:scale-105 hover:shadow-[0_0_80px_-10px_rgba(255,255,255,0.5)] overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center space-x-3">
                                <Sparkles className="w-6 h-6" />
                                <span>Let's Go 🚀</span>
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-200 to-pink-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </button>
                    </section>

                    {/* Footer */}
                    <footer className="text-center text-gray-600 text-sm py-12 border-t border-white/5">
                        <p className="mb-2">© 2024 Black Hole. Where campus secrets disappear.</p>
                        <p className="text-xs text-gray-700">Built by students who get it. For students who get it. 💜</p>
                    </footer>
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
                    50% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
                }
                .animate-float {
                    animation: float linear infinite;
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 60s linear infinite;
                }
                @keyframes gradient-x {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 3s ease infinite;
                }
            `}</style>
        </div>
    );
}
