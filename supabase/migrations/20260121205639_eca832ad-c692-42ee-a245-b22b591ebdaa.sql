-- Add a column for what the USER wants with this specific candidate
-- (distinct from their_relationship_goal which is what the CANDIDATE is looking for)
ALTER TABLE public.candidates
ADD COLUMN user_goal_for_candidate text;

-- Add a comment to clarify the distinction
COMMENT ON COLUMN public.candidates.user_goal_for_candidate IS 'What the user is specifically looking for with this candidate (casual, situationship, dating, serious, marriage, unsure)';
COMMENT ON COLUMN public.candidates.their_relationship_goal IS 'What the candidate has stated they are looking for';