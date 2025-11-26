-- Add fields to track relationship endings
ALTER TABLE public.candidates 
ADD COLUMN relationship_ended_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN end_reason TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.candidates.relationship_ended_at IS 'When the relationship was ended/archived';
COMMENT ON COLUMN public.candidates.end_reason IS 'Reason for ending the relationship';