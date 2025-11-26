-- Add missing columns to candidates table for full AI rating intake
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS their_education_level text,
ADD COLUMN IF NOT EXISTS their_social_style text,
ADD COLUMN IF NOT EXISTS their_drinking text,
ADD COLUMN IF NOT EXISTS their_smoking text,
ADD COLUMN IF NOT EXISTS their_exercise text;