-- Add relationship trauma tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS past_relationship_traumas JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS relationship_trauma_notes TEXT,
ADD COLUMN IF NOT EXISTS personal_section_acknowledged BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.past_relationship_traumas IS 'Array of past relationships with trauma details: [{label, duration, traumas[], notes, endReason}]';