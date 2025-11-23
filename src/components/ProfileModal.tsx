import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Edit2, Save, Settings, Eye, EyeOff } from 'lucide-react';

interface ProfileModalProps {
    userId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ProfileModal({ userId, isOpen, onClose }: ProfileModalProps) {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [editGender, setEditGender] = useState('');
    const [editBranch, setEditBranch] = useState('');
    const [editYear, setEditYear] = useState('');
    const [showGender, setShowGender] = useState(true);
    const [showBranch, setShowBranch] = useState(true);
    const [showYear, setShowYear] = useState(true);
    const [showKarma, setShowKarma] = useState(true);

    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);
        })();
    }, []);

    useEffect(() => {
        if (!isOpen || !userId) return;
        let mounted = true;
        setLoading(true);
        setIsEditing(false);
        setShowSettings(false);
        (async () => {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
            if (!mounted) return;
            if (error) {
                console.error('Error loading profile:', error);
            } else {
                setProfile(data);
                setEditGender(data?.gender || '');
                setEditBranch(data?.branch || '');
                setEditYear(data?.year || '');
                setShowGender(data?.show_gender ?? true);
                setShowBranch(data?.show_branch ?? true);
                setShowYear(data?.show_year ?? true);
                setShowKarma(data?.show_karma ?? true);
            }
            setLoading(false);
        })();
        return () => { mounted = false; };
    }, [isOpen, userId]);

    const handleSaveProfile = async () => {
        if (!userId) return;
        setLoading(true);
        const { error } = await supabase.from('profiles').update({
            gender: editGender || null,
            branch: editBranch || null,
            year: editYear || null
        }).eq('id', userId);
        
        if (error) {
            console.error('Error updating profile:', error);
        } else {
            setProfile({ ...profile, gender: editGender, branch: editBranch, year: editYear });
            setIsEditing(false);
        }
        setLoading(false);
    };

    const handleSaveSettings = async () => {
        if (!userId) return;
        setLoading(true);
        const { error } = await supabase.from('profiles').update({
            show_gender: showGender,
            show_branch: showBranch,
            show_year: showYear,
            show_karma: showKarma
        }).eq('id', userId);
        
        if (error) {
            console.error('Error updating settings:', error);
        } else {
            setProfile({ 
                ...profile, 
                show_gender: showGender, 
                show_branch: showBranch, 
                show_year: showYear,
                show_karma: showKarma 
            });
            setShowSettings(false);
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    const isOwnProfile = userId === currentUserId;
    const shouldShowField = (field: 'gender' | 'branch' | 'year' | 'karma') => {
        if (isOwnProfile) return true;
        const fieldMap = {
            gender: profile?.show_gender ?? true,
            branch: profile?.show_branch ?? true,
            year: profile?.show_year ?? true,
            karma: profile?.show_karma ?? true
        };
        return fieldMap[field];
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-slate-900/95 border border-white/10 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">{showSettings ? 'Privacy Settings' : 'Profile'}</h3>
                    <div className="flex items-center gap-2">
                        {isOwnProfile && profile && !isEditing && !showSettings && (
                            <>
                                <button onClick={() => setShowSettings(true)} className="p-1 text-gray-400 hover:text-white" title="Privacy Settings">
                                    <Settings className="w-5 h-5" />
                                </button>
                                <button onClick={() => setIsEditing(true)} className="p-1 text-gray-400 hover:text-white" title="Edit Profile">
                                    <Edit2 className="w-5 h-5" />
                                </button>
                            </>
                        )}
                        {isEditing && (
                            <button onClick={handleSaveProfile} disabled={loading} className="p-1 text-green-400 hover:text-green-300">
                                <Save className="w-5 h-5" />
                            </button>
                        )}
                        {showSettings && (
                            <button onClick={handleSaveSettings} disabled={loading} className="p-1 text-green-400 hover:text-green-300">
                                <Save className="w-5 h-5" />
                            </button>
                        )}
                        <button onClick={onClose} className="p-1 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                </div>
                {loading ? (
                    <div className="text-gray-300">Loading...</div>
                ) : !profile ? (
                    <div className="text-gray-400">
                        <p>Profile not found.</p>
                        <p className="text-sm mt-2">This user hasn't completed their profile yet.</p>
                    </div>
                ) : profile ? (
                    showSettings ? (
                        <div className="space-y-4">
                            <p className="text-xs text-gray-400">Control what information is visible to others when they view your profile</p>
                            
                            <div className="space-y-3">
                                <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        {showGender ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                                        <span className="text-sm">Gender</span>
                                    </div>
                                    <button
                                        onClick={() => setShowGender(!showGender)}
                                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                            showGender 
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                        }`}
                                    >
                                        {showGender ? 'Visible' : 'Hidden'}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        {showBranch ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                                        <span className="text-sm">Branch</span>
                                    </div>
                                    <button
                                        onClick={() => setShowBranch(!showBranch)}
                                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                            showBranch 
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                        }`}
                                    >
                                        {showBranch ? 'Visible' : 'Hidden'}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        {showYear ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                                        <span className="text-sm">Year</span>
                                    </div>
                                    <button
                                        onClick={() => setShowYear(!showYear)}
                                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                            showYear 
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                        }`}
                                    >
                                        {showYear ? 'Visible' : 'Hidden'}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        {showKarma ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                                        <span className="text-sm">Karma</span>
                                    </div>
                                    <button
                                        onClick={() => setShowKarma(!showKarma)}
                                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                            showKarma 
                                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                        }`}
                                    >
                                        {showKarma ? 'Visible' : 'Hidden'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3 text-sm text-gray-200">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-full" style={{ background: profile.avatar_color }} />
                            <div>
                                <div className="font-bold text-white">{profile.username}</div>
                                <div className="text-xs text-gray-400">{profile.college}</div>
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="space-y-2">
                                <div>
                                    <label className="text-xs text-gray-400">Gender</label>
                                    <select value={editGender} onChange={(e) => setEditGender(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded py-2 px-3 mt-1">
                                        <option value="" className="bg-slate-900">Select Gender</option>
                                        <option value="Male" className="bg-slate-900">Male</option>
                                        <option value="Female" className="bg-slate-900">Female</option>
                                        <option value="Other" className="bg-slate-900">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400">Branch</label>
                                    <input type="text" value={editBranch} onChange={(e) => setEditBranch(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded py-2 px-3 mt-1" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400">Year</label>
                                    <select value={editYear} onChange={(e) => setEditYear(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded py-2 px-3 mt-1">
                                        <option value="" className="bg-slate-900">Select Year</option>
                                        <option value="1st Year" className="bg-slate-900">1st Year</option>
                                        <option value="2nd Year" className="bg-slate-900">2nd Year</option>
                                        <option value="3rd Year" className="bg-slate-900">3rd Year</option>
                                        <option value="4th Year" className="bg-slate-900">4th Year</option>
                                        <option value="Graduate" className="bg-slate-900">Graduate</option>
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {shouldShowField('gender') && (
                                    <div className="bg-white/5 p-3 rounded">Gender<br/><span className="font-bold">{profile.gender || '—'}</span></div>
                                )}
                                {shouldShowField('branch') && (
                                    <div className="bg-white/5 p-3 rounded">Branch<br/><span className="font-bold">{profile.branch || '—'}</span></div>
                                )}
                                {shouldShowField('year') && (
                                    <div className="bg-white/5 p-3 rounded">Year<br/><span className="font-bold">{profile.year || '—'}</span></div>
                                )}
                                {shouldShowField('karma') && (
                                    <div className="bg-white/5 p-3 rounded">Karma<br/><span className="font-bold">{profile.karma ?? 0}</span></div>
                                )}
                            </div>
                        )}

                        <div className="text-xs text-gray-400">Joined: {profile.created_at ? new Date(profile.created_at).toLocaleString() : '—'}</div>
                    </div>
                    )
                ) : (
                    <div className="text-gray-400">Profile not found.</div>
                )}
            </div>
        </div>
    );
}
