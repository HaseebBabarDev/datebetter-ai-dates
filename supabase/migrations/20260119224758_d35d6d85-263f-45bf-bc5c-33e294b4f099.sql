-- Add columns for Self-Discovery quiz results
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS primary_love_language TEXT,
ADD COLUMN IF NOT EXISTS secondary_love_language TEXT,
ADD COLUMN IF NOT EXISTS personality_type TEXT,
ADD COLUMN IF NOT EXISTS personality_dimensions JSONB,
ADD COLUMN IF NOT EXISTS attachment_tendencies JSONB,
ADD COLUMN IF NOT EXISTS quiz_attachment_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS quiz_love_language_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS quiz_personality_completed_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.primary_love_language IS 'Primary love language from quiz (words_of_affirmation, quality_time, acts_of_service, physical_touch, receiving_gifts)';
COMMENT ON COLUMN public.profiles.secondary_love_language IS 'Secondary love language from quiz';
COMMENT ON COLUMN public.profiles.personality_type IS 'Myers-Briggs personality type (e.g., INTJ, ENFP)';
COMMENT ON COLUMN public.profiles.personality_dimensions IS 'Individual personality dimensions (E/I, S/N, T/F, J/P scores)';
COMMENT ON COLUMN public.profiles.attachment_tendencies IS 'Secondary attachment signals from quiz';
COMMENT ON COLUMN public.profiles.quiz_attachment_completed_at IS 'When attachment style quiz was completed';
COMMENT ON COLUMN public.profiles.quiz_love_language_completed_at IS 'When love language quiz was completed';
COMMENT ON COLUMN public.profiles.quiz_personality_completed_at IS 'When personality preferences quiz was completed';