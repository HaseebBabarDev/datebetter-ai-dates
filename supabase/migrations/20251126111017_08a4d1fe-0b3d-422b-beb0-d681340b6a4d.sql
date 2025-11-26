-- Add schedule flexibility to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS schedule_flexibility text;

-- Add distance approximation and schedule flexibility to candidates
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS distance_approximation text;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS their_schedule_flexibility text;