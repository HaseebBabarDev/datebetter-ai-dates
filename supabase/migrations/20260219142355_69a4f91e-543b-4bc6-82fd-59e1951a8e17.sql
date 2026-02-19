-- Add sort_order column to candidates for manual dashboard ordering
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT NULL;

-- Add index for efficient ordering
CREATE INDEX IF NOT EXISTS idx_candidates_sort_order ON public.candidates(user_id, sort_order NULLS LAST);
