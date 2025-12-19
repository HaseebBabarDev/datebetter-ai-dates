-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view screen names" ON public.profiles;

-- Create a view that only exposes screen names for community use
CREATE OR REPLACE VIEW public.community_members AS
SELECT user_id, screen_name
FROM public.profiles
WHERE screen_name IS NOT NULL;