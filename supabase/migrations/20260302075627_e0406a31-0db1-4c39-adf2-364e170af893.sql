
-- Track pitch deck views
CREATE TABLE public.pitch_deck_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  viewer_ip TEXT,
  viewer_email TEXT,
  user_agent TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  country_code TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT,
  slides_viewed INTEGER DEFAULT 1
);

-- Enable RLS
ALTER TABLE public.pitch_deck_views ENABLE ROW LEVEL SECURITY;

-- Only admins can read views
CREATE POLICY "Admins can view all pitch deck views"
ON public.pitch_deck_views
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow anonymous inserts (viewers aren't authenticated)
CREATE POLICY "Anyone can insert pitch deck views"
ON public.pitch_deck_views
FOR INSERT
WITH CHECK (true);
