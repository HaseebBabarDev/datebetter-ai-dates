-- Recreate view with SECURITY INVOKER
CREATE OR REPLACE VIEW public.community_profiles
WITH (security_invoker = true) AS
SELECT user_id, screen_name, avatar_url, city
FROM public.profiles
WHERE screen_name IS NOT NULL;