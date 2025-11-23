import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getTopHashtags, cleanupInactiveGroups } from '../lib/hashtags';
import { HallOfFame } from './HallOfFame';
import { ProfileModal } from './ProfileModal';
import { Hash, MessageCircle, Ghost, ChevronLeft, ChevronRight, LogOut, Plus, ChevronDown, ChevronUp, X, User } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
    college: string;
    currentFilter: string;
    onFilterChange: (filter: string) => void;
    onSignOut: () => void;
    username?: string;
    isOpen?: boolean;
    onClose?: () => void;
}

interface HashtagGroup {
    id: number;
    hashtag: string;
    message_count: number;
    last_message_at: string;
    created_by?: string;
    created_at?: string;
}

export function Sidebar({ college, currentFilter, onFilterChange, onSignOut, username, isOpen = false, onClose }: SidebarProps) {
    const [hashtagGroups, setHashtagGroups] = useState<HashtagGroup[]>([]);
    const [onlineCount, setOnlineCount] = useState(0);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showAllGroups, setShowAllGroups] = useState(false);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [timeToPurge, setTimeToPurge] = useState('');
    const [hallOfFameExpanded, setHallOfFameExpanded] = useState(true);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const displayedGroups = showAllGroups ? hashtagGroups : hashtagGroups.slice(0, 5);

    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);
        })();
    }, []);

    useEffect(() => {
        // Purge Timer Logic - IST Midnight (UTC+5:30)
        const updatePurgeTimer = () => {
            const now = new Date();

            // Convert current time to IST
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
            const istTime = new Date(utc + istOffset);

            // Calculate next midnight IST
            const nextMidnightIST = new Date(istTime);
            nextMidnightIST.setHours(24, 0, 0, 0);

            const diff = nextMidnightIST.getTime() - istTime.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeToPurge(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };

        updatePurgeTimer();
        const interval = setInterval(updatePurgeTimer, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Cleanup inactive groups on load
        cleanupInactiveGroups(college);

        // Fetch top hashtag groups
        const fetchHashtags = async () => {
            const groups = await getTopHashtags(college, 50);
            setHashtagGroups(groups);
        };

        fetchHashtags();

        // Subscribe to hashtag_groups changes
        const channel = supabase
            .channel('hashtag_groups_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'hashtag_groups', filter: `college=eq.${college}` },
                () => {
                    fetchHashtags();
                }
            )
            .subscribe();

        // Cleanup inactive groups every 5 minutes
        const cleanupInterval = setInterval(() => {
            cleanupInactiveGroups(college, 120); // Match the new 2-hour timeout
        }, 5 * 60 * 1000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(cleanupInterval);
        };
    }, [college]);

    useEffect(() => {
        // Track online presence
        const presenceChannel = supabase.channel(`presence:${college}`, {
            config: {
                presence: {
                    key: Math.random().toString(36).substring(7),
                },
            },
        });

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState();
                setOnlineCount(Object.keys(state).length);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            presenceChannel.untrack();
            supabase.removeChannel(presenceChannel);
        };
    }, [college]);

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        const tag = newGroupName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!tag) return;

        // Check for group limit (1 active group per user globally)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            // Check if user already has an active group (across all colleges)
            const { data: userGroups } = await supabase
                .from('hashtag_groups')
                .select('id, hashtag, college')
                .eq('created_by', user.id)
                .eq('is_active', true);

            if (userGroups && userGroups.length > 0) {
                alert(`You already have an active group: #${userGroups[0].hashtag} in ${userGroups[0].college}. You can only create one group total.`);
                return;
            }
        } catch (err) {
            console.warn('Could not check group limit:', err);
        }

        await supabase.from('hashtag_groups').insert({
            college,
            hashtag: tag,
            message_count: 0,
            last_message_at: new Date().toISOString(),
            created_by: user.id,
            is_active: true
        });

        setNewGroupName('');
        setIsCreatingGroup(false);
        onFilterChange(`#${tag}`);
        if (onClose) onClose(); // Close sidebar on mobile after selection
    };

    const handleFilterClick = (filter: string) => {
        onFilterChange(filter);
        if (onClose) onClose();
    };

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            <div
                className={cn(
                    "bg-slate-900/90 backdrop-blur-xl border-r border-white/10 flex flex-col h-full transition-all duration-300 ease-in-out z-50",
                    // Mobile styles
                    "fixed inset-y-0 left-0 w-[280px] transform",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    // Desktop styles
                    "md:relative md:translate-x-0 md:bg-slate-900/50 md:backdrop-blur-md",
                    isCollapsed ? "md:w-16" : "md:w-64"
                )}
            >
                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-1 text-gray-400 hover:text-white md:hidden z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Desktop Collapse Toggle */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-6 bg-slate-800 border border-white/10 rounded-full p-1 text-gray-400 hover:text-white hover:bg-slate-700 transition-colors z-50 hidden md:block"
                >
                    {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>

                {/* Header */}
                <div className={cn(
                    "border-b border-white/10 transition-all duration-300",
                    isCollapsed ? "p-3 flex flex-col items-center gap-4" : "p-4 space-y-4"
                )}>
                    {isCollapsed ? (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-violet-600 to-pink-600 flex items-center justify-center">
                            <span className="font-bold text-white text-lg">BH</span>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-violet-300 to-white">Black Hole</h2>
                            {username && (
                                <p className="text-xs text-gray-400 mt-1">@{username}</p>
                            )}
                            <div className="flex items-center space-x-2 mt-2">
                                <div className="flex items-center space-x-1.5 text-xs font-medium text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <span className="text-gray-300">{onlineCount} online</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {!isCollapsed && (
                        <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                            <span className="text-primary-light font-bold tracking-wide text-xs px-2 truncate max-w-[120px]" title={college}>
                                {college}
                            </span>
                            <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-mono text-red-400" title="Time until Purge">
                                    {timeToPurge}
                                </span>
                                <button
                                    onClick={() => setShowProfileModal(true)}
                                    className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded transition-all"
                                    title="My Profile"
                                >
                                    <User className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={onSignOut}
                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {/* Navigation */}
                    <div className="p-2 space-y-1">
                        <button
                            onClick={() => handleFilterClick('all')}
                            className={cn(
                                "w-full flex items-center transition-all duration-200 group relative",
                                isCollapsed ? "justify-center p-2 rounded-lg" : "space-x-3 px-3 py-2 rounded-lg",
                                currentFilter === 'all'
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                            )}
                            title={isCollapsed ? "Main Chat" : undefined}
                        >
                            <MessageCircle className={cn("transition-colors", isCollapsed ? "w-5 h-5" : "w-4 h-4")} />
                            {!isCollapsed && <span className="font-medium text-sm">Main Chat</span>}
                        </button>

                        <button
                            onClick={() => handleFilterClick('confession')}
                            className={cn(
                                "w-full flex items-center transition-all duration-200 group relative",
                                isCollapsed ? "justify-center p-2 rounded-lg" : "space-x-3 px-3 py-2 rounded-lg",
                                currentFilter === 'confession'
                                    ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                                    : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                            )}
                            title={isCollapsed ? "Confessions" : undefined}
                        >
                            <Ghost className={cn("transition-colors", isCollapsed ? "w-5 h-5" : "w-4 h-4")} />
                            {!isCollapsed && <span className="font-medium text-sm">Confessions</span>}
                        </button>
                    </div>

                    {/* Hashtag Groups */}
                    <div className={cn("px-2 pb-2", isCollapsed && "flex flex-col items-center")}>
                        {!isCollapsed && (
                            <div className="flex items-center justify-between px-3 mt-4 mb-2">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    Groups
                                </div>
                                <button
                                    onClick={() => setIsCreatingGroup(!isCreatingGroup)}
                                    className="text-gray-500 hover:text-white transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        {isCreatingGroup && !isCollapsed && (
                            <form onSubmit={handleCreateGroup} className="px-2 mb-2">
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="Group name..."
                                    className="w-full bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
                                    autoFocus
                                />
                            </form>
                        )}

                        <div className="space-y-0.5 w-full">
                            {displayedGroups.map((group, index) => (
                                <button
                                    key={group.id}
                                    onClick={() => handleFilterClick(`#${group.hashtag}`)}
                                    className={cn(
                                        "w-full flex items-center transition-all duration-200 group/item",
                                        isCollapsed ? "justify-center p-2 rounded-lg" : "justify-between px-3 py-2.5 rounded-lg",
                                        currentFilter === `#${group.hashtag}`
                                            ? "bg-white/10 text-white border border-white/10"
                                            : "text-gray-400 hover:bg-white/5 hover:text-gray-300"
                                    )}
                                    title={isCollapsed ? `#${group.hashtag} (${group.message_count} msgs)` : undefined}
                                >
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        {!isCollapsed && (
                                            <span className={cn(
                                                "text-[10px] font-bold w-4 text-center",
                                                index === 0 ? "text-yellow-400" :
                                                    index === 1 ? "text-gray-300" :
                                                        index === 2 ? "text-amber-600" : "text-gray-600"
                                            )}>
                                                {index + 1}
                                            </span>
                                        )}
                                        <div className="flex items-center space-x-2 truncate">
                                            <Hash className={cn("text-gray-500 flex-shrink-0", isCollapsed ? "w-4 h-4" : "w-3.5 h-3.5")} />
                                            {!isCollapsed && <span className="font-medium text-sm truncate">#{group.hashtag}</span>}
                                        </div>
                                    </div>
                                    {!isCollapsed && (
                                        <div className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-md min-w-[24px] text-center ml-2 transition-colors",
                                            currentFilter === `#${group.hashtag}`
                                                ? "bg-primary text-white shadow-sm"
                                                : "bg-white/5 text-gray-500 group-hover/item:bg-white/10 group-hover/item:text-gray-400"
                                        )}>
                                            {group.message_count}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {!isCollapsed && hashtagGroups.length > 5 && (
                            <button
                                onClick={() => setShowAllGroups(!showAllGroups)}
                                className="w-full flex items-center justify-center space-x-1 mt-2 py-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                            >
                                {showAllGroups ? (
                                    <>
                                        <ChevronUp className="w-3 h-3" />
                                        <span>Show Less</span>
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-3 h-3" />
                                        <span>Show More</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Hall of Fame */}
                    <div className="px-3 pb-3">
                        {!isCollapsed && (
                            <>
                                <button
                                    onClick={() => setHallOfFameExpanded(!hallOfFameExpanded)}
                                    className="w-full flex items-center justify-between px-4 mt-4 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors"
                                >
                                    <span>Hall of Fame</span>
                                    {hallOfFameExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                                {hallOfFameExpanded && (
                                    <HallOfFame college={college} />
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Collapsed Footer (Sign Out) */}
                {isCollapsed && (
                    <div className="p-3 border-t border-white/10 flex flex-col items-center gap-2">
                        <button
                            onClick={() => setShowProfileModal(true)}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                            title="My Profile"
                        >
                            <User className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onSignOut}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Sign Out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Profile Modal */}
            <ProfileModal
                userId={currentUserId}
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
            />
        </>
    );
}
