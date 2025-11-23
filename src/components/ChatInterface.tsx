import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Send, AlertTriangle, Flame, Skull, Smile, Frown, MessageCircle, X, Menu, Ghost, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { updateHashtagGroup } from '../lib/hashtags';
import { ReportModal } from './ReportModal';
import { ProfileModal } from './ProfileModal';

interface ChatInterfaceProps {
    college: string;
    currentUserId: string;
    filter?: string;
    scrollToMessageId?: number | null;
    onOpenMenu?: () => void;
}

interface Message {
    id: number;
    content: string;
    username: string;
    avatar_color: string;
    type: 'text' | 'confession';
    aura: number;
    flags: number;
    reactions: Record<string, string[]>;
    reports: Record<string, string>;
    reply_to_id?: number;
    created_at: string;
    user_id: string;
    hashtags: string[];
    group_name: string;
}

export function ChatInterface({ college, currentUserId, filter = 'all', scrollToMessageId, onOpenMenu }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConfession, setIsConfession] = useState(filter === 'confession');
    const [loading, setLoading] = useState(false);
    const [isShake, setIsShake] = useState(false);
    const [activeMessageId, setActiveMessageId] = useState<number | null>(null);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [messageToReport, setMessageToReport] = useState<number | null>(null);
    // highlightedMessageId removed (unused)
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Update isConfession when filter changes
    useEffect(() => {
        setIsConfession(filter === 'confession');
    }, [filter]);

    // Calculate remaining confessions
    useEffect(() => {
        const checkRemainingConfessions = async () => {
            if (!isConfession) return;
            try {
                const now = new Date();
                const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                const istOffset = 5.5 * 60 * 60 * 1000;
                const istTime = new Date(utc + istOffset);
                const todayMidnightIST = new Date(istTime);
                todayMidnightIST.setHours(0, 0, 0, 0);

                const { data: confessions } = await supabase
                    .from('messages')
                    .select('id')
                    .eq('user_id', currentUserId)
                    .eq('type', 'confession')
                    .gte('created_at', todayMidnightIST.toISOString());

                const used = confessions?.length || 0;
                setRemainingConfessions(Math.max(0, 2 - used));
            } catch (e) {
                console.warn('Could not check remaining confessions:', e);
            }
        };
        checkRemainingConfessions();
    }, [isConfession, currentUserId, messages]);

    // Memoize particles to prevent re-rendering on every state change
    const particles = useMemo(() => {
        return [...Array(20)].map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`
        }));
    }, []); // Empty dependency array means this only runs once on mount

    // Helper to safely check reactions
    const hasReacted = (msg: Message, emoji: string, userId: string) => {
        const reactions = msg.reactions?.[emoji];
        return Array.isArray(reactions) && reactions.includes(userId);
    };

    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
            let query = supabase
                .from('messages')
                .select('*')
                .eq('college', college)
                .order('created_at', { ascending: true });

            // Increase limit to load more messages
            if (scrollToMessageId) {
                query = query.limit(500);
            } else {
                query = query.limit(500);
            }

            // Filter by group_name instead of type/hashtags
            if (filter === 'confession') {
                query = query.eq('group_name', 'confession');
            } else if (filter.startsWith('#')) {
                query = query.eq('group_name', filter.slice(1).toLowerCase());
            } else {
                // 'all' filter shows main group only
                query = query.eq('group_name', 'main');
            }

            const { data } = await query;

            if (data) {
                let list = data as Message[];
                if (scrollToMessageId) {
                    const exists = list.find(m => m.id === scrollToMessageId);
                    if (!exists) {
                        const { data: missingMsg } = await supabase
                            .from('messages')
                            .select('*')
                            .eq('id', scrollToMessageId)
                            .single();

                        if (missingMsg) {
                            list.push(missingMsg as Message);
                            list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                        }
                    }
                }
                setMessages(list);
            }
            setLoading(false);
        };

        fetchMessages();

        const channel = supabase
            .channel('public:messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `college=eq.${college}` },
                (payload) => {
                    const newMsg = payload.new as Message;
                    let shouldAdd = false;
                    
                    // Check if message belongs to current group/filter
                    if (filter === 'all' && newMsg.group_name === 'main') shouldAdd = true;
                    if (filter === 'confession' && newMsg.group_name === 'confession') shouldAdd = true;
                    if (filter.startsWith('#') && newMsg.group_name === filter.slice(1).toLowerCase()) shouldAdd = true;

                    if (shouldAdd) {
                        setMessages((prev) => [...prev, newMsg]);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'messages', filter: `college=eq.${college}` },
                (payload) => {
                    setMessages((prev) => prev.map(msg => msg.id === payload.new.id ? payload.new as Message : msg));
                }
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'messages', filter: `college=eq.${college}` },
                (payload) => {
                    setMessages((prev) => prev.filter(msg => msg.id !== payload.old.id));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [college, filter, scrollToMessageId]);

    useEffect(() => {
        if (scrollToMessageId) {
            const element = document.getElementById(`message-${scrollToMessageId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setActiveMessageId(scrollToMessageId);
            }
        } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, scrollToMessageId]);

    useEffect(() => {
        const localAura = parseInt(localStorage.getItem('universe_aura') || '0');
        if (localAura < 0) setIsShake(true);
    }, []);

    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [profileUserId, setProfileUserId] = useState<string | null>(null);
    const [remainingConfessions, setRemainingConfessions] = useState(2);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const timeout = localStorage.getItem('universe_timeout');
        if (timeout && new Date(timeout) > new Date()) {
            alert('You are timed out for bad vibes.');
            return;
        }

        // Check confession limit: max 2 confessions per day
        if (isConfession) {
            try {
                const now = new Date();
                const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                const istOffset = 5.5 * 60 * 60 * 1000;
                const istTime = new Date(utc + istOffset);
                const todayMidnightIST = new Date(istTime);
                todayMidnightIST.setHours(0, 0, 0, 0);

                const { data: confessions } = await supabase
                    .from('messages')
                    .select('id')
                    .eq('user_id', currentUserId)
                    .eq('type', 'confession')
                    .gte('created_at', todayMidnightIST.toISOString());

                if (confessions && confessions.length >= 2) {
                    alert('You can only post 2 confessions per day. Try again after midnight IST.');
                    return;
                }
            } catch (e) {
                console.warn('Could not check confession limit:', e);
            }
        }

        setLoading(true);
        const identity = JSON.parse(localStorage.getItem('universe_identity') || '{}');

        // Determine group_name based on current filter and confession mode
        let groupName = 'main';
        if (isConfession) {
            groupName = 'confession';
        } else if (filter.startsWith('#')) {
            groupName = filter.slice(1).toLowerCase();
        }

        const { error } = await supabase.from('messages').insert({
            college,
            content: newMessage,
            user_id: currentUserId,
            username: identity.username || 'Anon',
            avatar_color: identity.color || '#8B5CF6',
            type: isConfession ? 'confession' : 'text',
            group_name: groupName,
            aura: 0,
            flags: 0,
            reactions: {},
            reports: {},
            reply_to_id: replyingTo?.id || null,
            hashtags: groupName !== 'main' && groupName !== 'confession' ? [groupName] : []
        });

        if (error) {
            console.error('Error sending message:', error);
        } else {
            // Update hashtag group count if posting to a group
            if (groupName !== 'main' && groupName !== 'confession') {
                await updateHashtagGroup(college, groupName);
            }
            // Increase karma for user who posted
            try {
                const { data: profile } = await supabase.from('profiles').select('karma').eq('id', currentUserId).maybeSingle();
                const currentKarma = profile?.karma ?? 0;
                await supabase.from('profiles').update({ karma: currentKarma + 1 }).eq('id', currentUserId);
            } catch (e) {
                console.warn('Could not update karma:', e);
            }
            setNewMessage('');
            setReplyingTo(null);
        }
        setLoading(false);
    };

    const handleReaction = async (id: number, emoji: string) => {
        const msg = messages.find(m => m.id === id);
        if (!msg) return;

        const currentReactions = msg.reactions || {};
        let newReactions = { ...currentReactions };
        // Toggle reaction: remove current user's id from any existing emoji, then add to selected emoji
        Object.keys(newReactions).forEach(key => {
            if (Array.isArray(newReactions[key]) && newReactions[key].includes(currentUserId)) {
                newReactions[key] = newReactions[key].filter((uid: string) => uid !== currentUserId);
            }
        });

        const wasAlready = Array.isArray(currentReactions[emoji]) && currentReactions[emoji].includes(currentUserId);
        if (!wasAlready) {
            newReactions[emoji] = [...(newReactions[emoji] || []), currentUserId];
            
            // Increment karma for message author when they receive a reaction
            try {
                const { data: profile } = await supabase.from('profiles').select('karma').eq('id', msg.user_id).maybeSingle();
                const currentKarma = profile?.karma ?? 0;
                await supabase.from('profiles').update({ karma: currentKarma + 1 }).eq('id', msg.user_id);
            } catch (e) {
                console.warn('Could not update karma:', e);
            }
        }

        await supabase.from('messages').update({ reactions: newReactions }).eq('id', id);

        setActiveMessageId(null);
    };

    const handleFlag = (id: number) => {
        setMessageToReport(id);
        setReportModalOpen(true);
        setActiveMessageId(null);
    };

    const handleReportSubmit = async (reason: string) => {
        if (!messageToReport) return;

        const msg = messages.find(m => m.id === messageToReport);
        if (!msg) return;

        const currentFlags = msg.flags || 0;
        const newFlags = currentFlags + 1;
        const newReports = { ...(msg.reports || {}), [currentUserId]: reason };

        if (newFlags >= 5) {
            await supabase.from('messages').delete().eq('id', messageToReport);
        } else {
            await supabase.from('messages').update({
                flags: newFlags,
                reports: newReports
            }).eq('id', messageToReport);
        }

        setMessageToReport(null);
    };

    const handleReply = (msg: Message) => {
        setReplyingTo(msg);
        setActiveMessageId(null);
    };

    // handleReplyClick removed (unused)

    const filteredMessages = messages.filter(msg => {
        if (filter === 'all') return msg.group_name === 'main';
        if (filter === 'confession') return msg.group_name === 'confession';
        if (filter.startsWith('#')) {
            const groupName = filter.slice(1).toLowerCase();
            return msg.group_name === groupName;
        }
        return true;
    });

    return (
        <div className="flex flex-col h-full relative bg-black overflow-hidden">
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

                {/* Particle effects */}
                <div className="absolute inset-0">
                    {particles.map((particle) => (
                        <div
                            key={particle.id}
                            className="absolute w-1 h-1 bg-white/30 rounded-full animate-float"
                            style={{
                                left: particle.left,
                                top: particle.top,
                                animationDelay: particle.animationDelay,
                                animationDuration: particle.animationDuration
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Mobile menu button - positioned absolutely at top-left */}
            <button
                onClick={onOpenMenu}
                className="fixed top-3 left-3 p-2 text-gray-400 hover:text-white bg-slate-900/90 rounded-lg backdrop-blur-md border border-white/10 md:hidden z-[60]"
                aria-label="Open menu"
            >
                <Menu className="w-6 h-6" />
            </button>

            {/* Content with relative z-index */}
            <div className="px-4 py-3 bg-slate-900/90 border-b border-white/10 backdrop-blur-md z-50 fixed md:sticky top-0 left-0 right-0">
                <div className="flex items-center space-x-2 md:space-x-2 pl-12 md:pl-0">
                    {filter === 'confession' ? (
                        <>
                            <Ghost className="w-5 h-5 text-pink-400" />
                            <span className="text-pink-400 font-bold text-lg">Confessions</span>
                        </>
                    ) : filter.startsWith('#') ? (
                        <>
                            <span className="text-violet-400 font-bold text-lg">{filter}</span>
                            <span className="text-gray-400 text-sm">Topic</span>
                        </>
                    ) : (
                        <>
                            <MessageCircle className="w-5 h-5 text-primary" />
                            <span className="text-white font-bold text-lg">Main Chat</span>
                        </>
                    )}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 pt-16 md:pt-4 space-y-1 scrollbar-hide pb-32 relative z-0">
                {filteredMessages.map((msg, index) => {
                    const isMe = msg.user_id === currentUserId;
                    const isNextSame = filteredMessages[index + 1]?.user_id === msg.user_id;
                    const repliedMsg = msg.reply_to_id ? filteredMessages.find(m => m.id === msg.reply_to_id) : null;

                    return (
                        <div
                            key={msg.id}
                            id={`message-${msg.id}`}
                            className={cn(
                                "flex w-full relative group",
                                isMe ? "justify-end" : "justify-start",
                                isNextSame ? "mb-0.5" : "mb-3"
                            )}
                            onClick={() => setActiveMessageId(activeMessageId === msg.id ? null : msg.id)}
                        >
                            <div className={cn(
                                "max-w-[80%] min-w-[100px] relative px-3 py-2 shadow-sm transition-all cursor-pointer hover:shadow-md",
                                "rounded-lg backdrop-blur-sm",
                                isMe
                                    ? cn(
                                        msg.type === 'confession'
                                            ? "bg-pink-600 text-white"
                                            : "bg-primary text-white",
                                        isNextSame ? "rounded-br-sm" : "rounded-tr-none"
                                    )
                                    : cn(
                                        msg.type === 'confession'
                                            ? "bg-pink-600 text-white"
                                            : "bg-slate-800 text-gray-100 hover:bg-slate-700",
                                        isNextSame ? "rounded-bl-sm" : "rounded-tl-none"
                                    ),
                                msg.aura > 10 && "border border-yellow-500/30",
                                activeMessageId === msg.id ? "ring-2 ring-white/20 z-10" : ""
                            )}>
                                {!isMe && (
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="block text-[12px] font-bold tracking-wide opacity-90 truncate" style={{ color: msg.type === 'confession' ? '#fff' : msg.avatar_color }}>
                                            {msg.username}
                                        </span>
                                        {msg.type === 'confession' && (
                                            <span className="text-[8px] text-white/80 font-bold uppercase tracking-wider border border-white/30 px-1 rounded">
                                                Confession
                                            </span>
                                        )}
                                    </div>
                                )}

                                {repliedMsg && (
                                    <div className={cn(
                                        "mb-2 p-2 rounded-lg text-xs border-l-2",
                                        isMe ? "bg-black/20 border-white/50" : "bg-black/20 border-white/50"
                                    )}>
                                        <p className="font-bold opacity-70">{repliedMsg.username}</p>
                                        <p className="opacity-60 truncate">{repliedMsg.content}</p>
                                    </div>
                                )}

                                <p className="text-sm leading-snug break-words font-normal whitespace-pre-wrap">
                                    {msg.content}
                                </p>

                                {msg.reactions && Object.entries(msg.reactions).some(([_, users]) => users.length > 0) && (
                                    <div className="flex flex-wrap gap-1 mt-2 mb-1">
                                        {Object.entries(msg.reactions).map(([emoji, users]) => (
                                            users.length > 0 && (
                                                <span key={emoji} className={cn(
                                                    "text-[10px] px-1.5 py-0.5 rounded-full border flex items-center space-x-1 transition-colors",
                                                    users.includes(currentUserId)
                                                        ? "bg-primary/20 border-primary/50 text-white"
                                                        : "bg-white/5 border-white/5 text-gray-300"
                                                )}>
                                                    {emoji === 'fire' && <Flame className="w-3 h-3" />}
                                                    {emoji === 'skull' && <Skull className="w-3 h-3" />}
                                                    {emoji === 'laugh' && <Smile className="w-3 h-3" />}
                                                    {emoji === 'cry' && <Frown className="w-3 h-3" />}
                                                    <span className="font-bold">{users.length}</span>
                                                </span>
                                            )
                                        ))}
                                    </div>
                                )}

                                <div className={cn(
                                    "flex items-center justify-end mt-1 space-x-1",
                                    isMe ? "text-violet-200" : "text-gray-400",
                                    msg.type === 'confession' && "text-pink-100"
                                )}>
                                    <span className="text-[9px]">
                                        {format(new Date(msg.created_at), 'h:mm a')}
                                    </span>
                                    {msg.aura !== 0 && (
                                        <span className={cn(
                                            "text-[9px] font-bold ml-1",
                                            msg.aura > 0 ? "text-green-400" : "text-red-400"
                                        )}>
                                            {msg.aura > 0 ? '+' : ''}{msg.aura}
                                        </span>
                                    )}
                                </div>

                                {activeMessageId === msg.id && (
                                    <div className={cn(
                                        "absolute -bottom-10 bg-slate-900 border border-white/10 rounded-xl p-1.5 flex items-center space-x-1 shadow-xl z-20 animate-in fade-in zoom-in-95 duration-200",
                                        isMe ? "right-0" : "left-0"
                                    )}>
                                        <button onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, 'fire'); }} className={cn("p-1.5 rounded-lg transition-colors", hasReacted(msg, 'fire', currentUserId) ? "text-orange-400 bg-white/10" : "text-gray-400 hover:bg-white/10 hover:text-orange-400")} title="Fire">
                                            <Flame className="w-4 h-4" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, 'laugh'); }} className={cn("p-1.5 rounded-lg transition-colors", hasReacted(msg, 'laugh', currentUserId) ? "text-yellow-300 bg-white/10" : "text-gray-400 hover:bg-white/10 hover:text-yellow-300")} title="Laugh">
                                            <Smile className="w-4 h-4" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, 'cry'); }} className={cn("p-1.5 rounded-lg transition-colors", hasReacted(msg, 'cry', currentUserId) ? "text-blue-400 bg-white/10" : "text-gray-400 hover:bg-white/10 hover:text-blue-400")} title="Cry">
                                            <Frown className="w-4 h-4" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, 'skull'); }} className={cn("p-1.5 rounded-lg transition-colors", hasReacted(msg, 'skull', currentUserId) ? "text-red-500 bg-white/10" : "text-gray-400 hover:bg-white/10 hover:text-red-500")} title="Skull">
                                            <Skull className="w-4 h-4" />
                                        </button>
                                        <div className="w-px h-3 bg-white/10 mx-1" />
                                        <button onClick={(e) => { e.stopPropagation(); handleReply(msg); }} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-primary transition-colors" title="Reply">
                                            <MessageCircle className="w-4 h-4" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setProfileUserId(msg.user_id); setProfileModalOpen(true); }} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="View Profile">
                                            <User className="w-4 h-4" />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleFlag(msg.id); }} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-500 transition-colors">
                                            <AlertTriangle className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <ProfileModal isOpen={profileModalOpen} userId={profileUserId} onClose={() => setProfileModalOpen(false)} />

            <div className={cn(
                "absolute bottom-4 left-4 right-4 z-30",
                isShake && "animate-shake"
            )}>
                <div className="max-w-4xl mx-auto bg-slate-900 border border-white/10 rounded-xl p-2 shadow-lg">
                    {replyingTo && (
                        <div className="flex items-center justify-between bg-white/5 px-4 py-2 rounded-xl border border-white/5 mb-2 mx-1">
                            <div className="flex flex-col border-l-2 border-primary pl-3">
                                <span className="text-xs font-bold text-primary">Replying to {replyingTo.username}</span>
                                <span className="text-xs text-gray-400 truncate max-w-[200px]">{replyingTo.content}</span>
                            </div>
                            <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-white/10 rounded-full text-gray-400 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {filter !== 'confession' && (
                            <button
                                onClick={() => setIsConfession(!isConfession)}
                                className={cn(
                                    "p-3 rounded-lg transition-all duration-200",
                                    isConfession
                                        ? "bg-pink-500/20 text-pink-400"
                                        : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                                )}
                                title="Spill Tea (Confession)"
                            >
                                <Ghost className="w-5 h-5" />
                            </button>
                        )}

                        <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={isConfession ? `Spill the tea anonymously... (${remainingConfessions}/2 left today)` : "Yap here..."}
                                className={cn(
                                    "flex-1 bg-transparent text-white py-3 px-2 focus:outline-none placeholder-gray-500 text-[15px]",
                                    isConfession && "placeholder-pink-500/50"
                                )}
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={loading || !newMessage.trim()}
                                className={cn(
                                    "p-3 rounded-lg transition-all shadow-sm flex-none",
                                    isConfession
                                        ? "bg-pink-600 hover:bg-pink-700 text-white"
                                        : "bg-primary hover:bg-primary-hover text-white",
                                    (loading || !newMessage.trim()) && "opacity-50 cursor-not-allowed shadow-none"
                                )}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <ReportModal
                isOpen={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                onSubmit={handleReportSubmit}
            />

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
