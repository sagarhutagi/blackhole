import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Star, Flame } from 'lucide-react';
import { cn } from '../lib/utils';

interface HallOfFameProps {
    college: string;
}

interface TopMessage {
    id: number;
    content: string;
    username: string;
    user_id: string;
    total_reactions: number;
    avatar_color: string;
}

export function HallOfFame({ college }: HallOfFameProps) {
    const [topMessages, setTopMessages] = useState<TopMessage[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchTopMessages = async () => {
            setLoading(true);
            try {
                // Fetch all messages from the college
                const { data, error } = await supabase
                    .from('messages')
                    .select('id, content, username, user_id, reactions, avatar_color')
                    .eq('college', college);

                if (error) throw error;

                if (data) {
                    // Calculate total reactions for each message
                    const messagesWithReactions = data.map((msg: any) => {
                        const totalReactions = Object.values(msg.reactions || {}).reduce(
                            (sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0),
                            0
                        );
                        return {
                            id: msg.id,
                            content: msg.content,
                            username: msg.username,
                            user_id: msg.user_id,
                            total_reactions: totalReactions,
                            avatar_color: msg.avatar_color,
                        };
                    });

                    // Sort by reactions and get top 3
                    const sorted = messagesWithReactions
                        .sort((a, b) => b.total_reactions - a.total_reactions)
                        .slice(0, 3);

                    setTopMessages(sorted);
                }
            } catch (err) {
                console.error('Error fetching top messages:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTopMessages();

        // Subscribe to message changes to update in real-time
        const channel = supabase
            .channel(`messages_${college}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'messages', filter: `college=eq.${college}` },
                () => {
                    fetchTopMessages();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [college]);

    if (loading) {
        return (
            <div className="px-2 py-2">
                <div className="text-xs text-gray-500 text-center">Loading...</div>
            </div>
        );
    }

    if (topMessages.length === 0) {
        return (
            <div className="px-2 py-2">
                <div className="text-xs text-gray-600 text-center">No posts yet</div>
            </div>
        );
    }

    return (
        <div className="space-y-1 px-2 pb-2">
            {topMessages.map((msg, index) => (
                <div
                    key={msg.id}
                    className={cn(
                        "flex items-start justify-between px-2 py-2 rounded-lg transition-colors",
                        "bg-white/5 hover:bg-white/10 border border-white/5"
                    )}
                >
                    <div className="flex items-start space-x-2 min-w-0 flex-1">
                        {/* Rank Icon */}
                        <div className="flex-shrink-0 pt-0.5">
                            {index === 0 ? (
                                <Trophy className="w-4 h-4 text-yellow-400" />
                            ) : index === 1 ? (
                                <Star className="w-4 h-4 text-gray-300" />
                            ) : index === 2 ? (
                                <Flame className="w-4 h-4 text-orange-400" />
                            ) : null}
                        </div>

                        {/* Avatar and Content */}
                        <div className="flex items-start space-x-2 min-w-0 flex-1">
                            <div
                                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                                style={{ backgroundColor: msg.avatar_color }}
                            >
                                {msg.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-white truncate">
                                    {msg.username}
                                </p>
                                <p className="text-[10px] text-gray-400 line-clamp-2">
                                    {msg.content.substring(0, 50)}{msg.content.length > 50 ? '...' : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Reactions Count */}
                    <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                        <Flame className={cn(
                            "w-3 h-3",
                            index === 0 ? "text-yellow-400" :
                                index === 1 ? "text-gray-300" :
                                    index === 2 ? "text-orange-400" : "text-gray-600"
                        )} />
                        <span className={cn(
                            "text-xs font-bold",
                            index === 0 ? "text-yellow-400" :
                                index === 1 ? "text-gray-300" :
                                    index === 2 ? "text-orange-400" : "text-gray-500"
                        )}>
                            {msg.total_reactions}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
