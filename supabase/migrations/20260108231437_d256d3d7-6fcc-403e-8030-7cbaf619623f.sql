-- Add family upbringing fields to candidates table
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS their_parents_relationship text,
ADD COLUMN IF NOT EXISTS their_felt_loved_as_child text,
ADD COLUMN IF NOT EXISTS their_family_stability text,
ADD COLUMN IF NOT EXISTS their_socioeconomic_background text,
ADD COLUMN IF NOT EXISTS their_parent_wounds jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS their_generational_patterns jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS their_healthy_relationship_models boolean,
ADD COLUMN IF NOT EXISTS their_family_notes text;

-- Add comment for documentation
COMMENT ON COLUMN public.candidates.their_parents_relationship IS 'How their parents relationship was (together_healthy, together_unhealthy, divorced_amicable, divorced_contentious, single_parent, etc)';
COMMENT ON COLUMN public.candidates.their_felt_loved_as_child IS 'Whether they felt loved growing up (yes_consistently, sometimes, rarely, no)';
COMMENT ON COLUMN public.candidates.their_family_stability IS 'Family stability during childhood (very_stable, mostly_stable, some_instability, frequent_chaos)';
COMMENT ON COLUMN public.candidates.their_socioeconomic_background IS 'Socioeconomic background (upper_class, middle_class, working_class, poverty, varied)';
COMMENT ON COLUMN public.candidates.their_parent_wounds IS 'Array of parent wounds they may have (abandonment, enmeshment, criticism, neglect, etc)';
COMMENT ON COLUMN public.candidates.their_generational_patterns IS 'Array of generational patterns in their family (addiction, divorce, abuse, mental_illness, etc)';
COMMENT ON COLUMN public.candidates.their_healthy_relationship_models IS 'Whether they had healthy relationship role models growing up';
COMMENT ON COLUMN public.candidates.their_family_notes IS 'Free-form notes about their family background';