-- Add zodiac_sign and zodiac_mode_enabled to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS zodiac_sign TEXT,
ADD COLUMN IF NOT EXISTS zodiac_mode_enabled BOOLEAN DEFAULT FALSE;