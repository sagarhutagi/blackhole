import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Save } from 'lucide-react';

interface ProfileCompletionModalProps {
    userId: string;
    onComplete: () => void;
}

export function ProfileCompletionModal({ userId, onComplete }: ProfileCompletionModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [gender, setGender] = useState('');
    const [branch, setBranch] = useState('');
    const [year, setYear] = useState('');

    useEffect(() => {
        checkProfileCompletion();
    }, [userId]);

    const checkProfileCompletion = async () => {
        const { data: profile } = await supabase
            .from('profiles')
            .select('gender, branch, year')
            .eq('id', userId)
            .maybeSingle();

        if (profile && (!profile.gender || !profile.branch || !profile.year)) {
            setIsOpen(true);
            setGender(profile.gender || '');
            setBranch(profile.branch || '');
            setYear(profile.year || '');
        }
    };

    const handleSaveProfile = async () => {
        if (!gender || !branch || !year) {
            alert('Please fill in all fields');
            return;
        }

        setLoading(true);
        const { error } = await supabase
            .from('profiles')
            .update({ gender, branch, year })
            .eq('id', userId);

        if (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        } else {
            setIsOpen(false);
            onComplete();
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-slate-900/95 border border-white/10 rounded-xl p-6 w-full max-w-md">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-white mb-2">Complete Your Profile</h3>
                    <p className="text-sm text-gray-400">Please complete your profile to continue</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-300 mb-2">Gender *</label>
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-white rounded py-2 px-3"
                            required
                        >
                            <option value="" className="bg-slate-900">Select Gender</option>
                            <option value="Male" className="bg-slate-900">Male</option>
                            <option value="Female" className="bg-slate-900">Female</option>
                            <option value="Other" className="bg-slate-900">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-2">Branch *</label>
                        <input
                            type="text"
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            placeholder="e.g., Computer Science"
                            className="w-full bg-white/5 border border-white/10 text-white rounded py-2 px-3"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-2">Year *</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-white rounded py-2 px-3"
                            required
                        >
                            <option value="" className="bg-slate-900">Select Year</option>
                            <option value="1st Year" className="bg-slate-900">1st Year</option>
                            <option value="2nd Year" className="bg-slate-900">2nd Year</option>
                            <option value="3rd Year" className="bg-slate-900">3rd Year</option>
                            <option value="4th Year" className="bg-slate-900">4th Year</option>
                            <option value="Graduate" className="bg-slate-900">Graduate</option>
                        </select>
                    </div>

                    <button
                        onClick={handleSaveProfile}
                        disabled={loading || !gender || !branch || !year}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </div>
        </div>
    );
}
