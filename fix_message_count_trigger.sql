-- Create a trigger to automatically update message counts
-- This eliminates race conditions by using database-level counting

-- Function to update message count when a message is inserted
CREATE OR REPLACE FUNCTION update_group_message_count_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update for hashtag groups (not main or confession)
    IF NEW.group_name != 'main' AND NEW.group_name != 'confession' THEN
        -- Update or insert the hashtag group
        INSERT INTO public.hashtag_groups (college, hashtag, message_count, last_message_at)
        VALUES (NEW.college, NEW.group_name, 1, NEW.created_at)
        ON CONFLICT (college, hashtag) 
        DO UPDATE SET 
            message_count = hashtag_groups.message_count + 1,
            last_message_at = NEW.created_at;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update message count when a message is deleted
CREATE OR REPLACE FUNCTION update_group_message_count_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update for hashtag groups (not main or confession)
    IF OLD.group_name != 'main' AND OLD.group_name != 'confession' THEN
        UPDATE public.hashtag_groups
        SET message_count = GREATEST(0, message_count - 1)
        WHERE college = OLD.college AND hashtag = OLD.group_name;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_group_count_insert ON public.messages;
DROP TRIGGER IF EXISTS trigger_update_group_count_delete ON public.messages;

-- Create triggers
CREATE TRIGGER trigger_update_group_count_insert
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_group_message_count_on_insert();

CREATE TRIGGER trigger_update_group_count_delete
    AFTER DELETE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_group_message_count_on_delete();

-- Add unique constraint to prevent duplicate groups (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hashtag_groups_college_hashtag_key'
    ) THEN
        ALTER TABLE public.hashtag_groups
        ADD CONSTRAINT hashtag_groups_college_hashtag_key UNIQUE (college, hashtag);
    END IF;
END $$;

-- Fix all existing counts to match reality
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
    (SELECT COUNT(*) FROM public.messages m WHERE m.college = hg.college AND m.group_name = hg.hashtag) as actual_count,
    CASE 
        WHEN hg.message_count = (SELECT COUNT(*) FROM public.messages m WHERE m.college = hg.college AND m.group_name = hg.hashtag)
        THEN '✓ Match'
        ELSE '✗ Mismatch'
    END as status
FROM public.hashtag_groups hg
ORDER BY hg.college, hg.message_count DESC;
