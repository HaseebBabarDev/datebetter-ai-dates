-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Service role can insert login history" ON public.user_login_history;

-- The service role bypasses RLS anyway, so we don't need an INSERT policy for regular users
-- This table should only be written to by the edge function using service role