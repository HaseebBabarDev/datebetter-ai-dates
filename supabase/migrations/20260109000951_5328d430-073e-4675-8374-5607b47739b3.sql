-- Add free-form family experience notes field to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS family_upbringing_notes TEXT;