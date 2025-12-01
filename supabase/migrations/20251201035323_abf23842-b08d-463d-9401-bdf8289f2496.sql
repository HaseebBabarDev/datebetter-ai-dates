-- Add dating motivation field to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dating_motivation text[] DEFAULT '{}';

-- Add partner_type field for understanding who they're dating (influencer, athlete, etc.)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS typical_partner_type text;

COMMENT ON COLUMN public.profiles.dating_motivation IS 'What the user is primarily looking for: love, social_status, financial_help, companionship, adventure';
COMMENT ON COLUMN public.profiles.typical_partner_type IS 'Type of partners they typically date: regular, influencer, athlete, musician_dj, celebrity, wealthy, other';