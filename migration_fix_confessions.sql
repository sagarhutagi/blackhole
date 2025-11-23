-- Fix existing confession messages that have wrong group_name
-- This updates all messages with type='confession' to have group_name='confession'

UPDATE public.messages 
SET group_name = 'confession' 
WHERE type = 'confession' AND group_name != 'confession';

-- Fix messages with hashtags that should be in their respective groups
-- Update group_name to match the first hashtag
UPDATE public.messages 
SET group_name = hashtags[1] 
WHERE hashtags IS NOT NULL 
  AND array_length(hashtags, 1) > 0 
  AND type != 'confession'
  AND (group_name = 'main' OR group_name IS NULL);

-- Verify the updates
SELECT 
  'Confessions' as category,
  COUNT(*) as count 
FROM public.messages 
WHERE type = 'confession' AND group_name = 'confession'

UNION ALL

SELECT 
  'Group messages' as category,
  COUNT(*) as count
FROM public.messages 
WHERE hashtags IS NOT NULL AND array_length(hashtags, 1) > 0 AND group_name = hashtags[1]

UNION ALL

SELECT 
  'Main messages' as category,
  COUNT(*) as count
FROM public.messages 
WHERE group_name = 'main' AND (hashtags IS NULL OR array_length(hashtags, 1) = 0) AND type != 'confession';
