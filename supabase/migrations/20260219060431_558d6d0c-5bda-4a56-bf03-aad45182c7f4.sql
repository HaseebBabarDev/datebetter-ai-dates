
-- Add a column to store per-phase practice completion state
ALTER TABLE public.detachment_plans
  ADD COLUMN IF NOT EXISTS practice_checks jsonb NOT NULL DEFAULT '{}';
-- practice_checks structure: { "phaseNumber": [true, false, true, ...] }
