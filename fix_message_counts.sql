-- Fix message counts in hashtag_groups table to match actual message counts
-- Run this in Supabase SQL Editor to correct any discrepancies

UPDATE public.hashtag_groups hg
SET message_count = (
    SELECT COUNT(*)
    FROM public.messages m
    WHERE m.college = hg.college
    AND m.group_name = hg.hashtag
);

-- Verify the results
SELECT 
    hg.hashtag,
    hg.college,
    hg.message_count as stored_count,
    (SELECT COUNT(*) FROM public.messages m WHERE m.college = hg.college AND m.group_name = hg.hashtag) as actual_count
FROM public.hashtag_groups hg
ORDER BY hg.college, hg.message_count DESC;
