-- Set Creator and Admin Role for sagarmh6364@gmail.com
-- Run this in Supabase SQL Editor after running the main schema

-- Update the profile to set creator and admin role
UPDATE public.profiles
SET 
  role = 'admin',
  is_creator = true
WHERE email = 'sagarmh6364@gmail.com';

-- Verify the update
SELECT id, email, username, role, is_creator 
FROM public.profiles 
WHERE email = 'sagarmh6364@gmail.com';

-- If profile doesn't exist yet, you can create it manually:
-- First, get the user_id from auth.users:
-- SELECT id FROM auth.users WHERE email = 'sagarmh6364@gmail.com';
-- Then insert with that ID:
-- INSERT INTO public.profiles (id, email, role, is_creator)
-- VALUES ('<user_id_here>', 'sagarmh6364@gmail.com', 'admin', true);
