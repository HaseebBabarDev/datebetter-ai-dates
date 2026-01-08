-- Add expanded family fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS parent_status text,
ADD COLUMN IF NOT EXISTS mother_status text,
ADD COLUMN IF NOT EXISTS father_status text,
ADD COLUMN IF NOT EXISTS full_siblings integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS half_siblings integer DEFAULT 0;

-- Add expanded family fields to candidates table
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS their_parent_status text,
ADD COLUMN IF NOT EXISTS their_mother_status text,
ADD COLUMN IF NOT EXISTS their_father_status text,
ADD COLUMN IF NOT EXISTS their_siblings integer DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.parent_status IS 'Overall parent situation (married_together, unmarried_together, divorced, separated, adopted, orphan_system, other_guardians)';
COMMENT ON COLUMN public.profiles.mother_status IS 'Mother status (present, absent, deceased, unknown)';
COMMENT ON COLUMN public.profiles.father_status IS 'Father status (present, absent, deceased, unknown)';
COMMENT ON COLUMN public.profiles.full_siblings IS 'Number of full siblings';
COMMENT ON COLUMN public.profiles.half_siblings IS 'Number of half siblings';

COMMENT ON COLUMN public.candidates.their_parent_status IS 'Candidate overall parent situation';
COMMENT ON COLUMN public.candidates.their_mother_status IS 'Candidate mother status';
COMMENT ON COLUMN public.candidates.their_father_status IS 'Candidate father status';
COMMENT ON COLUMN public.candidates.their_siblings IS 'Number of siblings candidate has';