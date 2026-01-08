-- Add family background and upbringing fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS parents_relationship_dynamic text,
ADD COLUMN IF NOT EXISTS parents_conflict_style text,
ADD COLUMN IF NOT EXISTS childhood_love_expression text,
ADD COLUMN IF NOT EXISTS felt_loved_as_child text,
ADD COLUMN IF NOT EXISTS childhood_emotional_needs_met text,
ADD COLUMN IF NOT EXISTS parent_wound_types jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS childhood_trauma_types jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS abuse_history jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS socioeconomic_background text,
ADD COLUMN IF NOT EXISTS family_stability text,
ADD COLUMN IF NOT EXISTS caregiver_consistency text,
ADD COLUMN IF NOT EXISTS healthy_relationship_models boolean DEFAULT null,
ADD COLUMN IF NOT EXISTS generational_patterns jsonb DEFAULT '[]'::jsonb;