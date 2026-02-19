
-- Add auto_disqualify_rules to profiles (user's rule configuration)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS auto_disqualify_rules JSONB DEFAULT '[]'::jsonb;

-- Add auto-disqualify tracking columns to candidates
ALTER TABLE public.candidates 
  ADD COLUMN IF NOT EXISTS is_auto_disqualified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_disqualify_reasons JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS auto_disqualify_override BOOLEAN DEFAULT false;
