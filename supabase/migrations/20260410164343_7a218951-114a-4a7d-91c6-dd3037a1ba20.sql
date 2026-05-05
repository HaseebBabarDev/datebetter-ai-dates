-- 1. Fix profiles community policy: create a view for community-safe data
-- Drop the overly permissive community SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view screen names for community" ON public.profiles;

-- Create a view that only exposes community-safe columns
CREATE OR REPLACE VIEW public.community_profiles AS
SELECT user_id, screen_name, avatar_url, city
FROM public.profiles
WHERE screen_name IS NOT NULL;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.community_profiles TO authenticated;

-- 2. Fix forum likes: restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can view post likes" ON public.forum_post_likes;
CREATE POLICY "Authenticated users can view post likes"
ON public.forum_post_likes
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can view comment likes" ON public.forum_comment_likes;
CREATE POLICY "Authenticated users can view comment likes"
ON public.forum_comment_likes
FOR SELECT
TO authenticated
USING (true);