-- Add mental health and neurodivergence columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_neurodivergent text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS neurodivergence_types jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS mental_health_openness text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS in_therapy boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS mental_health_importance integer DEFAULT 3;

-- Add mental health columns to candidates
ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS their_neurodivergent text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS their_neurodivergence_types jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS their_mental_health_awareness text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS their_in_therapy text DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.is_neurodivergent IS 'yes, no, prefer_not_to_say, exploring';
COMMENT ON COLUMN public.profiles.neurodivergence_types IS 'Array of types: adhd, autism, dyslexia, etc.';
COMMENT ON COLUMN public.profiles.mental_health_openness IS 'How open user is about mental health';
COMMENT ON COLUMN public.profiles.mental_health_importance IS 'How important partner understanding is (1-5)';