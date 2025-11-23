-- Update messages table to include group_name column
-- This separates messages into different logical groups without needing separate tables

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS group_name text default 'main';

-- Create index for group queries
CREATE INDEX IF NOT EXISTS idx_messages_group_name ON public.messages(group_name);
CREATE INDEX IF NOT EXISTS idx_messages_college_group ON public.messages(college, group_name);

-- Update hashtag_groups to enforce one group per user globally
ALTER TABLE public.hashtag_groups ADD COLUMN IF NOT EXISTS is_active boolean default true;

-- Create unique constraint: one active group per user (across all colleges)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_group_per_user 
  ON public.hashtag_groups(created_by) 
  WHERE created_by IS NOT NULL AND is_active = true;

-- Create profiles table for user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users primary key,
  email text,
  college text,
  username text unique not null,
  avatar_color text,
  gender text,
  branch text,
  year text,
  karma integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING ( true );

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Enable Realtime for profiles
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Migration: Set group_name for existing messages
-- Main messages (no hashtags, not confession) -> 'main'
UPDATE public.messages 
SET group_name = 'main' 
WHERE (hashtags IS NULL OR array_length(hashtags, 1) IS NULL OR array_length(hashtags, 1) = 0) 
  AND type != 'confession';

-- Confession messages -> 'confession'
UPDATE public.messages 
SET group_name = 'confession' 
WHERE type = 'confession';

-- Messages with hashtags -> use first hashtag as group_name
UPDATE public.messages 
SET group_name = hashtags[1] 
WHERE hashtags IS NOT NULL 
  AND array_length(hashtags, 1) > 0 
  AND type != 'confession';
