import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from './supabase';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Gen Z Usernames
const ADJECTIVES = [
    'Sus', 'Based', 'Cringe', 'Goated', 'Mid', 'Salty', 'Woke', 'Dank', 'Ghosted', 'Simp',
    'Glitchy', 'Neon', 'Cyber', 'Toxic', 'Savage', 'Moody', 'Hype', 'Chill', 'Vibing'
];

const NOUNS = [
    'NPC', 'MainCharacter', 'Backbencher', 'Topper', 'Dropout', 'Intern', 'Fresher', 'Senior',
    'Influencer', 'Gamer', 'Hacker', 'Bot', 'Stan', 'Chad', 'Karen', 'Zoomer', 'Doomer'
];

export function generateIdentity() {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const username = `${adj} ${noun}`;

    // Neon Colors
    const colors = [
        '#39FF14', // Neon Green
        '#FF00FF', // Neon Pink
        '#00FFFF', // Neon Cyan
        '#FFFF00', // Neon Yellow
        '#FF3131', // Neon Red
        '#1F51FF', // Neon Blue
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    return { username, color };
}

export function getUsernameFromSession(session: any) {
    // Try to get from user metadata first
    if (session?.user?.user_metadata?.username) {
        return session.user.user_metadata.username;
    }

    // Fallback to localStorage
    try {
        const identity = JSON.parse(localStorage.getItem('universe_identity') || '{}');
        return identity.username || 'Anonymous';
    } catch {
        return 'Anonymous';
    }
}

export function initializeDailyUsernameRefresh(session: any) {
    if (!session?.user?.id) return;

    const calculateTimeToMidnightIST = () => {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
        const istTime = new Date(utc + istOffset);

        const nextMidnightIST = new Date(istTime);
        nextMidnightIST.setHours(24, 0, 0, 0);

        return nextMidnightIST.getTime() - istTime.getTime();
    };

    const refreshUsername = async () => {
        const identity = generateIdentity();

        // Update Supabase first
        const { error } = await supabase.auth.updateUser({
            data: {
                username: identity.username,
                avatar_color: identity.color
            }
        });

        if (!error) {
            localStorage.setItem('universe_identity', JSON.stringify(identity));
            // Reload the page to reflect new username
            window.location.reload();
        }
    };

    const timeToMidnight = calculateTimeToMidnightIST();
    const timeout = setTimeout(refreshUsername, timeToMidnight);

    return () => clearTimeout(timeout);
}

export async function syncLocalIdentityToSupabase(session: any) {
    if (!session?.user) return;

    try {
        const localIdentityStr = localStorage.getItem('universe_identity');
        if (!localIdentityStr) return;

        const localIdentity = JSON.parse(localIdentityStr);
        const serverIdentity = session.user.user_metadata;

        // If local identity exists and is different from server, update server
        // This handles the case where daily refresh happened locally but didn't sync
        if (localIdentity.username &&
            (localIdentity.username !== serverIdentity?.username ||
                localIdentity.color !== serverIdentity?.avatar_color)) {

            await supabase.auth.updateUser({
                data: {
                    username: localIdentity.username,
                    avatar_color: localIdentity.color
                }
            });
        }
    } catch (error) {
        console.error('Error syncing identity:', error);
    }
}

export const COLLEGES = [
    'PES University',
    'IIT Bombay',
    'RVCE',
    'Manipal'
];
