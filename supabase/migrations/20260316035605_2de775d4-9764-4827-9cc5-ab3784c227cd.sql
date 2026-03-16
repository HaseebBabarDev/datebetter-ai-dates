ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS relationship_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS relationship_intention text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS relationship_started_at timestamp with time zone DEFAULT NULL;