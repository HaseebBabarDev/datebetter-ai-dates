-- Create a public view that excludes owner_user_id for security
CREATE OR REPLACE VIEW public.studios_public AS
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

-- Allow public read access to the view
GRANT SELECT ON public.studios_public TO anon, authenticated;

-- Add comment explaining the security measure
COMMENT ON VIEW public.studios_public IS 'Public view of studios that excludes owner_user_id to prevent owner identification by competitors';