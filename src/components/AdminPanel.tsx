import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
    Users, MessageSquare, Flag, Shield, Trash2, 
    Ban, CheckCircle, Search, Crown, 
    Activity, BarChart3, Clock, Hash, Ghost, Award, Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface AdminPanelProps {
    college: string;
    onClose: () => void;
}

interface User {
    id: string;
    email: string;
    username: string;
    college: string;
    aura: number;
    role: string;
    is_creator: boolean;
    created_at: string;
}

interface Message {
    id: number;
    content: string;
    username: string;
    type: string;
    flags: number;
    group_name: string;
    created_at: string;
    user_id: string;
}

interface Stats {
    totalUsers: number;
    totalMessages: number;
    totalConfessions: number;
    flaggedMessages: number;
    activeGroups: number;
    todayMessages: number;
}

export function AdminPanel({ college, onClose }: AdminPanelProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'messages' | 'moderation'>('overview');
    const [users, setUsers] = useState<User[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        totalMessages: 0,
        totalConfessions: 0,
        flaggedMessages: 0,
        activeGroups: 0,
        todayMessages: 0
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'flagged' | 'confessions'>('all');

    useEffect(() => {
        fetchStats();
        fetchUsers();
        fetchMessages();
    }, [college]);

    const fetchStats = async () => {
        try {
            // Total users
            const { count: userCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('college', college);

            // Total messages
            const { count: messageCount } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('college', college);

            // Total confessions
            const { count: confessionCount } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('college', college)
                .eq('type', 'confession');

            // Flagged messages
            const { count: flaggedCount } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('college', college)
                .gt('flags', 0);

            // Active groups
            const { count: groupCount } = await supabase
                .from('hashtag_groups')
                .select('*', { count: 'exact', head: true })
                .eq('college', college)
                .eq('is_active', true);

            // Today's messages
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { count: todayCount } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('college', college)
                .gte('created_at', today.toISOString());

            setStats({
                totalUsers: userCount || 0,
                totalMessages: messageCount || 0,
                totalConfessions: confessionCount || 0,
                flaggedMessages: flaggedCount || 0,
                activeGroups: groupCount || 0,
                todayMessages: todayCount || 0
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('college', college)
                .order('aura', { ascending: false })
                .limit(100);

            if (data) setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchMessages = async () => {
        try {
            let query = supabase
                .from('messages')
                .select('*')
                .eq('college', college)
                .order('created_at', { ascending: false })
                .limit(100);

            if (filterType === 'flagged') {
                query = query.gt('flags', 0);
            } else if (filterType === 'confessions') {
                query = query.eq('type', 'confession');
            }

            const { data } = await query;
            if (data) setMessages(data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, [filterType]);

    const handleDeleteMessage = async (messageId: number) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;

        await supabase.from('messages').delete().eq('id', messageId);
        fetchMessages();
        fetchStats();
    };

    const handleBanUser = async (userId: string, username: string) => {
        if (!window.confirm(`Ban user ${username}? This will delete their account.`)) return;

        try {
            // Delete user's messages
            await supabase.from('messages').delete().eq('user_id', userId);
            // Delete user's profile
            await supabase.from('profiles').delete().eq('id', userId);
            
            alert('User banned successfully');
            fetchUsers();
            fetchStats();
        } catch (error) {
            console.error('Error banning user:', error);
            alert('Failed to ban user');
        }
    };

    const handlePromoteUser = async (userId: string, username: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        
        if (!window.confirm(`${newRole === 'admin' ? 'Promote' : 'Demote'} ${username} ${newRole === 'admin' ? 'to' : 'from'} admin?`)) return;

        await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);

        fetchUsers();
    };

    const handleClearFlags = async (messageId: number) => {
        await supabase
            .from('messages')
            .update({ flags: 0, reports: {} })
            .eq('id', messageId);

        fetchMessages();
        fetchStats();
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredMessages = messages.filter(msg =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg overflow-y-auto">
            <div className="min-h-screen p-4 md:p-8">
                {/* Header */}
                <div className="max-w-7xl mx-auto mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-r from-violet-600 to-pink-600 rounded-lg">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                                <p className="text-sm text-gray-400">{college}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                        {[
                            { id: 'overview', label: 'Overview', icon: BarChart3 },
                            { id: 'users', label: 'Users', icon: Users },
                            { id: 'messages', label: 'Messages', icon: MessageSquare },
                            { id: 'moderation', label: 'Moderation', icon: Flag }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "bg-primary text-white"
                                        : "bg-slate-800 text-gray-400 hover:bg-slate-700"
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="max-w-7xl mx-auto">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <StatCard
                                icon={Users}
                                label="Total Users"
                                value={stats.totalUsers}
                                color="blue"
                            />
                            <StatCard
                                icon={MessageSquare}
                                label="Total Messages"
                                value={stats.totalMessages}
                                color="green"
                            />
                            <StatCard
                                icon={Ghost}
                                label="Confessions"
                                value={stats.totalConfessions}
                                color="pink"
                            />
                            <StatCard
                                icon={Flag}
                                label="Flagged Messages"
                                value={stats.flaggedMessages}
                                color="red"
                            />
                            <StatCard
                                icon={Hash}
                                label="Active Groups"
                                value={stats.activeGroups}
                                color="purple"
                            />
                            <StatCard
                                icon={Clock}
                                label="Today's Messages"
                                value={stats.todayMessages}
                                color="orange"
                            />
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div className="bg-slate-900/50 rounded-xl border border-white/10 overflow-hidden">
                            {/* Search */}
                            <div className="p-4 border-b border-white/10">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search users..."
                                        className="w-full bg-slate-800 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                            </div>

                            {/* Users List */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-800/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">User</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Email</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Aura</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Role</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Joined</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredUsers.map(user => (
                                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-medium text-white">{user.username}</span>
                                                        {user.is_creator && (
                                                            <Crown className="w-4 h-4 text-yellow-500" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-400">{user.email}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center space-x-1">
                                                        <Zap className="w-3 h-3 text-yellow-500" />
                                                        <span className="text-sm font-semibold text-white">+{user.aura}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={cn(
                                                        "px-2 py-1 text-xs font-semibold rounded",
                                                        user.role === 'admin' ? "bg-violet-500/20 text-violet-400" : "bg-slate-700 text-gray-400"
                                                    )}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-400">
                                                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        {!user.is_creator && (
                                                            <>
                                                                <button
                                                                    onClick={() => handlePromoteUser(user.id, user.username, user.role)}
                                                                    className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                                                    title={user.role === 'admin' ? 'Demote' : 'Promote to Admin'}
                                                                >
                                                                    <Award className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleBanUser(user.id, user.username)}
                                                                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                                    title="Ban User"
                                                                >
                                                                    <Ban className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Messages Tab */}
                    {activeTab === 'messages' && (
                        <div className="bg-slate-900/50 rounded-xl border border-white/10 overflow-hidden">
                            {/* Filters */}
                            <div className="p-4 border-b border-white/10 space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search messages..."
                                        className="w-full bg-slate-800 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
                                    />
                                </div>
                                <div className="flex space-x-2">
                                    {[
                                        { id: 'all', label: 'All' },
                                        { id: 'flagged', label: 'Flagged' },
                                        { id: 'confessions', label: 'Confessions' }
                                    ].map(filter => (
                                        <button
                                            key={filter.id}
                                            onClick={() => setFilterType(filter.id as any)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-sm transition-colors",
                                                filterType === filter.id
                                                    ? "bg-primary text-white"
                                                    : "bg-slate-800 text-gray-400 hover:bg-slate-700"
                                            )}
                                        >
                                            {filter.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
                                {filteredMessages.map(msg => (
                                    <div key={msg.id} className="p-4 hover:bg-white/5 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <span className="font-semibold text-white">{msg.username}</span>
                                                    {msg.type === 'confession' && (
                                                        <span className="px-2 py-0.5 text-xs bg-pink-500/20 text-pink-400 rounded">
                                                            Confession
                                                        </span>
                                                    )}
                                                    <span className="px-2 py-0.5 text-xs bg-slate-700 text-gray-400 rounded">
                                                        #{msg.group_name}
                                                    </span>
                                                    {msg.flags > 0 && (
                                                        <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                                                            {msg.flags} flags
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-300 mb-2 break-words">{msg.content}</p>
                                                <span className="text-xs text-gray-500">
                                                    {format(new Date(msg.created_at), 'MMM d, yyyy h:mm a')}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2 flex-shrink-0">
                                                {msg.flags > 0 && (
                                                    <button
                                                        onClick={() => handleClearFlags(msg.id)}
                                                        className="p-1.5 text-green-400 hover:bg-green-500/10 rounded transition-colors"
                                                        title="Clear Flags"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                                    title="Delete Message"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Moderation Tab */}
                    {activeTab === 'moderation' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 rounded-xl border border-white/10 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Flag className="w-5 h-5 mr-2 text-red-400" />
                                    Flagged Content
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">Flagged Messages</span>
                                        <span className="text-2xl font-bold text-red-400">{stats.flaggedMessages}</span>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('messages')}
                                        className="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                    >
                                        Review Flagged Messages
                                    </button>
                                </div>
                            </div>

                            <div className="bg-slate-900/50 rounded-xl border border-white/10 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <Activity className="w-5 h-5 mr-2 text-green-400" />
                                    Quick Actions
                                </h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setActiveTab('users')}
                                        className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-left"
                                    >
                                        Manage Users
                                    </button>
                                    <button
                                        onClick={fetchStats}
                                        className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-left"
                                    >
                                        Refresh Statistics
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface StatCardProps {
    icon: React.ElementType;
    label: string;
    value: number;
    color: 'blue' | 'green' | 'pink' | 'red' | 'purple' | 'orange';
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
    const colorClasses = {
        blue: 'from-blue-600 to-cyan-600',
        green: 'from-green-600 to-emerald-600',
        pink: 'from-pink-600 to-rose-600',
        red: 'from-red-600 to-orange-600',
        purple: 'from-purple-600 to-violet-600',
        orange: 'from-orange-600 to-yellow-600'
    };

    return (
        <div className="bg-slate-900/50 rounded-xl border border-white/10 p-6 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-lg bg-gradient-to-br", colorClasses[color])}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-sm text-gray-400">{label}</p>
                <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
            </div>
        </div>
    );
}
