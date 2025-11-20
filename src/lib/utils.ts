import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

export const COLLEGES = [
    'PES University',
    'IIT Bombay',
    'RVCE',
    'Manipal'
];
