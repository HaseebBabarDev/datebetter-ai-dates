-- Add devi_voice column to profiles for voice preference
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS devi_voice TEXT DEFAULT 'mature';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.devi_voice IS 'Voice maturity preference for D.E.V.I. TTS: mature or younger';