import { Building2, ChevronRight } from 'lucide-react';
import { COLLEGES } from '../lib/utils';

interface CollegeSelectorProps {
    onSelect: (college: string) => void;
}

export function CollegeSelector({ onSelect }: CollegeSelectorProps) {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center">
            <h2 className="text-4xl font-bold mb-2 text-center">
                Where do you belong?
            </h2>
            <p className="text-gray-400 mb-10 text-center">
                Select your campus to join the conversation.
            </p>

            <div className="w-full max-w-md space-y-4">
                {COLLEGES.map((college) => (
                    <button
                        key={college}
                        onClick={() => onSelect(college)}
                        className="w-full glass-card p-6 rounded-2xl text-left group transition-all hover:bg-white/10 hover:scale-[1.02] flex items-center justify-between"
                    >
                        <div className="flex items-center">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mr-4 group-hover:bg-primary/30 transition-colors">
                                <Building2 className="w-6 h-6 text-primary-light" />
                            </div>
                            <span className="font-semibold text-lg text-white">
                                {college}
                            </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                    </button>
                ))}
            </div>
        </div>
    );
}
