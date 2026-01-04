-- Add Devi communication style preference to profiles
ALTER TABLE public.profiles
ADD COLUMN devi_style text DEFAULT 'balanced';

COMMENT ON COLUMN public.profiles.devi_style IS 'Devi communication style: direct, balanced, or gentle';