-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Studios are viewable by everyone" ON public.studios;

-- Create restricted public access policy that requires using the public view
-- This policy allows viewing basic studio info for discovery
CREATE POLICY "Public studios viewable" 
ON public.studios 
FOR SELECT 
TO anon, authenticated
USING (status = 'active');

-- Create a separate policy for owners to view their full studio details including owner_user_id
CREATE POLICY "Owners can view own studios fully" 
ON public.studios 
FOR SELECT 
TO authenticated
USING (auth.uid() = owner_user_id);

-- Add explanatory comment
COMMENT ON POLICY "Public studios viewable" ON public.studios IS 
'Allows public to view active studios but app should use studios_public view to exclude owner_user_id';

COMMENT ON POLICY "Owners can view own studios fully" ON public.studios IS 
'Allows studio owners to see all fields including owner_user_id for their own studios';