-- Add height column to candidates table for height preference matching
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS height text;