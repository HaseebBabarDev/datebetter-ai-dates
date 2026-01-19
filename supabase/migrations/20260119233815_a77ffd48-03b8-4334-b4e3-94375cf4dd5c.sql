-- Add male dating assessment fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dating_honesty_intent text,
ADD COLUMN IF NOT EXISTS relationship_blockers jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS relationship_blocker_timeline text,
ADD COLUMN IF NOT EXISTS attachment_security_level text,
ADD COLUMN IF NOT EXISTS relationship_motivation text,
ADD COLUMN IF NOT EXISTS jealousy_triggers jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dating_skill_challenges jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS quiz_dating_style_completed_at timestamptz;

-- Add comments for clarity
COMMENT ON COLUMN public.profiles.dating_honesty_intent IS 'Whether user wants to be honest or play games in dating';
COMMENT ON COLUMN public.profiles.relationship_blockers IS 'Array of things preventing relationship (retroactive_jealousy, enjoying_youth, financial, etc)';
COMMENT ON COLUMN public.profiles.relationship_blocker_timeline IS 'When they expect blockers to resolve';
COMMENT ON COLUMN public.profiles.attachment_security_level IS 'Self-assessed security level in dating';
COMMENT ON COLUMN public.profiles.relationship_motivation IS 'genuine_care vs transactional motivation';
COMMENT ON COLUMN public.profiles.jealousy_triggers IS 'JSON storing scenario-based jealousy responses';
COMMENT ON COLUMN public.profiles.dating_skill_challenges IS 'Array of dating challenges (interview_mode, oversharing, defensive)';
COMMENT ON COLUMN public.profiles.quiz_dating_style_completed_at IS 'When user completed the dating style assessment quiz';