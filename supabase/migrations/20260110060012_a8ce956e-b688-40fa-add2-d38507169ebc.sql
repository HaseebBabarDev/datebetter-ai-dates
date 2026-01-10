-- Add healing assessment fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ex_contact_status TEXT,
ADD COLUMN IF NOT EXISTS over_ex_level INTEGER CHECK (over_ex_level >= 0 AND over_ex_level <= 100),
ADD COLUMN IF NOT EXISTS attachment_to_past INTEGER CHECK (attachment_to_past >= 0 AND attachment_to_past <= 100),
ADD COLUMN IF NOT EXISTS healing_score INTEGER CHECK (healing_score >= 0 AND healing_score <= 100),
ADD COLUMN IF NOT EXISTS healing_assessment_date TIMESTAMP WITH TIME ZONE;

-- Create healing scores tracking table
CREATE TABLE IF NOT EXISTS public.healing_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  previous_score INTEGER,
  score_change INTEGER,
  ai_insights TEXT,
  trigger_type TEXT NOT NULL DEFAULT 'assessment',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on healing_scores
ALTER TABLE public.healing_scores ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for healing_scores
CREATE POLICY "Users can view their own healing scores"
ON public.healing_scores
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own healing scores"
ON public.healing_scores
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_healing_scores_user_id ON public.healing_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_healing_scores_created_at ON public.healing_scores(created_at DESC);