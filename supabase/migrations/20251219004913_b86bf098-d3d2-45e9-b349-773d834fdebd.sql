-- Drop the view and recreate with proper security
DROP VIEW IF EXISTS public.community_members;

-- Create the view with security invoker (not definer) - this is the default
CREATE VIEW public.community_members 
WITH (security_invoker = true)
AS
SELECT user_id, screen_name
FROM public.profiles
WHERE screen_name IS NOT NULL;

-- Grant access to authenticated users
GRANT SELECT ON public.community_members TO authenticated;