-- Migration: Add email and username to user_profiles
-- This fixes the issue where members cannot be invited because their email is not stored in the public profile.

-- 1. Add missing columns
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS username text;

-- 2. Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);

-- 3. (Optional) Sync existing emails from auth.users if any profiles exist without emails
-- This requires running as a superuser/admin which is true for Supabase SQL Editor
UPDATE public.user_profiles
SET email = au.email,
    username = split_part(au.email, '@', 1)
FROM auth.users au
WHERE public.user_profiles.id = au.id
AND (public.user_profiles.email IS NULL OR public.user_profiles.email = '');

-- 4. Update RLS policies to allow authenticated users to view other profiles (needed for search/invite)
-- Currently it might be restricted to 'id = auth.uid()'
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view all profiles" 
ON public.user_profiles FOR SELECT 
TO authenticated
USING (true);
