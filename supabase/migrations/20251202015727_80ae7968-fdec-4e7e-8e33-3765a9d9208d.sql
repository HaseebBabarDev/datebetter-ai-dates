-- Fix the view to use SECURITY INVOKER (more secure)
CREATE OR REPLACE VIEW public.studios_public 
WITH (security_invoker = true) AS
SELECT 
  id,
  title,
  description,
  size,
  area_sqm,
  amenities,
  base_hourly_rate,
  status,
  cover_image,
  created_at,
  updated_at
FROM public.studios
WHERE status = 'active';

-- Comment explaining the security measure
COMMENT ON VIEW public.studios_public IS 'Public view of studios that excludes owner_user_id to prevent owner identification by competitors. Uses security_invoker for proper RLS enforcement.';