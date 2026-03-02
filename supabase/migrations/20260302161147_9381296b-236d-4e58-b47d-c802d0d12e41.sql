
-- Table to store text simulator sessions and their messages
CREATE TABLE public.text_simulator_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  turn_count integer NOT NULL DEFAULT 0,
  is_complete boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.text_simulator_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own simulator sessions"
ON public.text_simulator_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own simulator sessions"
ON public.text_simulator_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own simulator sessions"
ON public.text_simulator_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own simulator sessions"
ON public.text_simulator_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_text_simulator_sessions_updated_at
BEFORE UPDATE ON public.text_simulator_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_text_simulator_sessions_user_candidate 
ON public.text_simulator_sessions(user_id, candidate_id);
