-- Add missing income and education preference columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS income_range text,
ADD COLUMN IF NOT EXISTS preferred_education_level text,
ADD COLUMN IF NOT EXISTS preferred_income_range text;