-- Create table to track user login history with location
CREATE TABLE public.user_login_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ip_address TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  country_code TEXT,
  timezone TEXT,
  isp TEXT,
  logged_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_login_history ENABLE ROW LEVEL SECURITY;

-- Only admins can read login history
CREATE POLICY "Admins can read all login history"
  ON public.user_login_history
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow inserts from service role only (edge function will insert)
CREATE POLICY "Service role can insert login history"
  ON public.user_login_history
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_user_login_history_user_id ON public.user_login_history(user_id);
CREATE INDEX idx_user_login_history_logged_in_at ON public.user_login_history(logged_in_at DESC);