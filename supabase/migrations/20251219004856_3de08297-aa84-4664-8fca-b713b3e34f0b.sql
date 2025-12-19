-- Allow anyone to read screen names from profiles for community feature
CREATE POLICY "Anyone can view screen names"
ON public.profiles
FOR SELECT
USING (true);