-- Add past relationship trauma fields to candidates table
ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS their_past_relationships jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS their_relationship_notes text DEFAULT NULL;