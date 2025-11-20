import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trash2, Ban, RefreshCw, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
    id: number;
    content: string;
    username: string;
    college: string;
    flags: number;
    created_at: string;
    user_id: string;
}

export function AdminDashboard() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchMessages = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (data) setMessages(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this message?')) return;

        const { error } = await supabase.from('messages').delete().eq('id', id);
        if (!error) {
            setMessages(messages.filter(m => m.id !== id));
        }
    };

    const handleBanUser = (userId: string) => {
        // In a real app, we'd write to a 'banned_users' table.
        // For this MVP, we'll just log it or maybe delete all their messages.
        if (!confirm('Ban this user and delete all their messages?')) return;

        // Delete all messages from this user
        supabase.from('messages').delete().eq('user_id', userId).then(() => {
            fetchMessages();
        });

        alert(`User ${userId} has been purged.`);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center space-x-3">
                        <Shield className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    </div>
                    <button
                        onClick={fetchMessages}
                        className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900/50 text-slate-400 text-sm uppercase tracking-wider">
                                    <th className="p-4 font-semibold">Time</th>
                                    <th className="p-4 font-semibold">User</th>
                                    <th className="p-4 font-semibold">College</th>
                                    <th className="p-4 font-semibold">Content</th>
                                    <th className="p-4 font-semibold text-center">Flags</th>
                                    <th className="p-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {messages.map((msg) => (
                                    <tr key={msg.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4 text-sm text-slate-400 whitespace-nowrap">
                                            {format(new Date(msg.created_at), 'MMM d, HH:mm')}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-slate-200">
                                            {msg.username}
                                            <div className="text-[10px] text-slate-500 font-mono">{msg.user_id.slice(0, 8)}...</div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-300">
                                            <span className="bg-slate-700 px-2 py-1 rounded text-xs">
                                                {msg.college}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-200 max-w-md truncate">
                                            {msg.content}
                                        </td>
                                        <td className="p-4 text-center">
                                            {msg.flags > 0 && (
                                                <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs font-bold">
                                                    {msg.flags}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleDelete(msg.id)}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                title="Delete Message"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleBanUser(msg.user_id)}
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                title="Ban User"
                                            >
                                                <Ban className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
