-- Add pros and cons columns to candidates table
ALTER TABLE public.candidates
ADD COLUMN pros jsonb DEFAULT '[]'::jsonb,
ADD COLUMN cons jsonb DEFAULT '[]'::jsonb;