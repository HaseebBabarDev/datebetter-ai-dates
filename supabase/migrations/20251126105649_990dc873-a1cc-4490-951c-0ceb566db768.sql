-- Add height, body_type, and activity_level columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS body_type text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS activity_level text;