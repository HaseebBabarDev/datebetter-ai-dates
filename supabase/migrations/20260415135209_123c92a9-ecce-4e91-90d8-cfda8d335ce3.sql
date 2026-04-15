
-- Reset Ramin's score to force a clean recalculation
UPDATE candidates 
SET compatibility_score = NULL, 
    score_breakdown = NULL, 
    last_score_update = NULL 
WHERE id = '730d7ad0-abb0-4e8d-9af3-8d651fe543e6';

-- Remove the false "D.E.V.I. Score Update" interactions that were caused by the bug
DELETE FROM interactions 
WHERE candidate_id = '730d7ad0-abb0-4e8d-9af3-8d651fe543e6' 
AND notes LIKE 'D.E.V.I. Score Update:%';
