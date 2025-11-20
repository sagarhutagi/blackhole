import { supabase } from './supabase';

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
 */
export async function updateHashtagGroup(college: string, hashtag: string) {
    // Try to update existing group
    const { data: existing } = await supabase
        .from('hashtag_groups')
        .select('*')
        .eq('college', college)
        .eq('hashtag', hashtag)
        .single();

    if (existing) {
        // Update existing group
        await supabase
            .from('hashtag_groups')
            .update({
                message_count: existing.message_count + 1,
                last_message_at: new Date().toISOString()
            })
            .eq('id', existing.id);
    } else {
        // Create new group
        await supabase
            .from('hashtag_groups')
            .insert({
                college,
                hashtag,
                message_count: 1,
                last_message_at: new Date().toISOString()
            });
    }
}

/**
 * Clean up inactive hashtag groups
 * Removes groups with no messages in the last timeoutMinutes
 */
/**
 * Clean up inactive hashtag groups and perform Global Purge
 * Removes groups with no messages in the last timeoutMinutes
 * AND removes ALL content older than the last Purge Time (Midnight UTC)
 */
export async function cleanupInactiveGroups(college: string, timeoutMinutes: number = 30) {
    const now = new Date();

    // 1. Standard Inactive Group Cleanup
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

    // 2. Global Purge Logic
    // Calculate the last purge time (Midnight UTC today or yesterday)
    const lastPurgeTime = new Date(now);
    lastPurgeTime.setUTCHours(0, 0, 0, 0);
    if (now < lastPurgeTime) {
        // Should not happen if setUTCHours works as expected for "today 00:00", 
        // but if we are at 23:00, today 00:00 is past. 
        // If we are at 00:01, today 00:00 is past.
        // So lastPurgeTime is always <= now.
    }

    // Delete MESSAGES older than last purge time
    const { error: msgPurgeError } = await supabase
        .from('messages')
        .delete()
        .eq('college', college)
        .lt('created_at', lastPurgeTime.toISOString());

    if (msgPurgeError) {
        console.error('Error purging old messages:', msgPurgeError);
    }

    // Delete GROUPS created before last purge time
    // (Optional: maybe we want to keep groups but empty them? User said "everything gets deleted")
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
