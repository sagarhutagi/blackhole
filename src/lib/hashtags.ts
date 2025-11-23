import { supabase } from './supabase';
import { getISTMidnight } from './utils';

/**
 * Extract hashtags from message content
 * Returns array of hashtags without the # symbol
 */
export function extractHashtags(content: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);

    if (!matches) return [];

    // Remove # and convert to lowercase, remove duplicates
    return [...new Set(matches.map(tag => tag.slice(1).toLowerCase()))];
}

/**
 * Get top N active hashtag groups for a college
 * Fixed: Using single optimized query instead of N+1 queries
 */
export async function getTopHashtags(college: string, limit: number = 50) {
    const { data, error } = await supabase
        .from('hashtag_groups')
        .select('*')
        .eq('college', college)
        .order('message_count', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching hashtags:', error);
        return [];
    }

    return data || [];
}

/**
 * Update or create hashtag group when a message with hashtag is sent
 * Note: Message counts are now automatically maintained by database triggers
 * This function only ensures the group exists
 */
export async function updateHashtagGroup(college: string, hashtag: string) {
    // Check if group exists, create if not
    // The trigger will handle count updates automatically
    const { data: existing } = await supabase
        .from('hashtag_groups')
        .select('id')
        .eq('college', college)
        .eq('hashtag', hashtag)
        .maybeSingle();

    if (!existing) {
        // Create new group (trigger will set count to 1 on first message)
        await supabase
            .from('hashtag_groups')
            .insert({
                college,
                hashtag,
                message_count: 0,
                last_message_at: new Date().toISOString()
            });
    }
}

/**
 * Clean up inactive hashtag groups and perform Global Purge
 * Removes groups with no messages in the last timeoutMinutes
 * AND removes ALL content older than the last Purge Time (Midnight IST)
 */
export async function cleanupInactiveGroups(college: string, timeoutMinutes: number = 120) {
    const now = new Date();

    // 1. Standard Inactive Group Cleanup (increased to 2 hours)
    const cutoffTime = new Date(now);
    cutoffTime.setMinutes(cutoffTime.getMinutes() - timeoutMinutes);

    const { error: groupError } = await supabase
        .from('hashtag_groups')
        .delete()
        .eq('college', college)
        .lt('last_message_at', cutoffTime.toISOString());

    if (groupError) {
        console.error('Error cleaning up hashtag groups:', groupError);
    }

    // 2. Global Purge Logic - IST Midnight (UTC+5:30)
    const lastPurgeTime = getISTMidnight();

    // Delete MESSAGES older than last purge time (midnight IST)
    const { error: msgPurgeError } = await supabase
        .from('messages')
        .delete()
        .eq('college', college)
        .lt('created_at', lastPurgeTime.toISOString());

    if (msgPurgeError) {
        console.error('Error purging old messages:', msgPurgeError);
    }

    // Delete GROUPS created before last purge time (midnight IST)
    const { error: groupPurgeError } = await supabase
        .from('hashtag_groups')
        .delete()
        .eq('college', college)
        .lt('created_at', lastPurgeTime.toISOString());

    if (groupPurgeError) {
        console.error('Error purging old groups:', groupPurgeError);
    }
}

/**
 * Get online user count using Supabase Presence
 */
export async function getOnlineUserCount(college: string): Promise<number> {
    const channel = supabase.channel(`presence:${college}`);
    const presenceState = await channel.presenceState();
    return Object.keys(presenceState).length;
}
