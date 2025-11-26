-- Create enum for relationship status
CREATE TYPE relationship_status AS ENUM ('single', 'married', 'recently_divorced', 'ethical_non_monogamy');

-- Add to profiles table
ALTER TABLE public.profiles ADD COLUMN relationship_status relationship_status;

-- Add to candidates table  
ALTER TABLE public.candidates ADD COLUMN their_relationship_status relationship_status;