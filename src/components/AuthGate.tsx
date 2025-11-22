import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { generateIdentity, COLLEGES } from '../lib/utils';
import { Zap, Mail, ArrowRight, Building2 } from 'lucide-react';

interface AuthGateProps {
    onAuthSuccess: () => void;
}

export function AuthGate({ onAuthSuccess }: AuthGateProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedCollege, setSelectedCollege] = useState(COLLEGES[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let error;
            let data;

            if (isLogin) {
                // Login: don't generate new identity
                const res = await supabase.auth.signInWithPassword({ email, password });
                error = res.error;
                data = res.data;

                if (data?.session?.user) {
                    // For login, get existing identity from metadata and store in localStorage
                    const existingUsername = data.session.user.user_metadata?.username;
                    const existingColor = data.session.user.user_metadata?.avatar_color;
                    if (existingUsername && existingColor) {
                        localStorage.setItem('universe_identity', JSON.stringify({
                            username: existingUsername,
                            color: existingColor
                        }));
                    }
                }
            } else {
                // Signup: generate new identity only
                if (password !== confirmPassword) {
                    throw new Error("Passwords do not match");
                }

                const identity = generateIdentity();

                const res = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            college: selectedCollege,
                            username: identity.username,
                            avatar_color: identity.color
                        }
                    }
                });
                error = res.error;
                data = res.data;

                // Store identity in localStorage for new signups
                localStorage.setItem('universe_identity', JSON.stringify(identity));
            }

            if (error) throw error;

            if (!isLogin && data?.user && !data.session) {
                // Even if session is missing (email confirmation on), we treat it as success
                // relying on the user to have disabled "Confirm email" in Supabase
                // or accepting that they might need to verify but we won't block the UI.
                // Ideally, with "Confirm email" disabled, data.session will be present.
                onAuthSuccess();
            } else {
                onAuthSuccess();
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
            {/* Black Hole Background Effects - Matching Landing Page */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-violet-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-pink-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

                {/* Black hole center effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-20">
                    <div className="absolute inset-0 rounded-full bg-gradient-radial from-transparent via-violet-900/30 to-black blur-2xl animate-spin-slow"></div>
                </div>

                {/* Particle effects */}
                <div className="absolute inset-0">
                    {[...Array(15)].map((_, i) => (
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

            <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl relative z-10 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center space-x-3 mb-2">
                        <div className="w-12 h-12">
                            <img
                                src="/black_hole_logo.png"
                                alt="Black Hole Logo"
                                className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                            />
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-violet-300 to-white">
                            Black Hole
                        </h1>
                    </div>
                    <p className="text-gray-400 text-sm">
                        The anonymous social network for your campus.
                    </p>
                </div>

                <div className="space-y-4">
                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 placeholder-gray-500"
                                    placeholder="student@college.edu"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <div className="relative">
                                <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 placeholder-gray-500"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {!isLogin && (
                            <>
                                <div>
                                    <div className="relative">
                                        <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 placeholder-gray-500"
                                            placeholder="Re-enter Password"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <select
                                            value={selectedCollege}
                                            onChange={(e) => setSelectedCollege(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 appearance-none cursor-pointer"
                                        >
                                            {COLLEGES.map((c) => (
                                                <option key={c} value={c} className="bg-slate-900 text-white">
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-xl text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold py-3 px-4 rounded-xl hover:scale-105 transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center group"
                        >
                            {loading ? (
                                <span className="animate-pulse">Processing...</span>
                            ) : (
                                <>
                                    <span>{isLogin ? 'Log In' : 'Sign Up'}</span>
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-6">
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                        </button>
                    </div>
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
            `}</style>
        </div>
    );
}
