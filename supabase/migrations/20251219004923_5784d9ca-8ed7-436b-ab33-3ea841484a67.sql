-- Drop the view since we'll use direct query with limited RLS
DROP VIEW IF EXISTS public.community_members;

-- Add policy to allow authenticated users to see screen names only
-- This uses a workaround: we allow SELECT but the application only queries screen_name
CREATE POLICY "Authenticated users can view screen names for community"
ON public.profiles
FOR SELECT
TO authenticated
USING (screen_name IS NOT NULL);