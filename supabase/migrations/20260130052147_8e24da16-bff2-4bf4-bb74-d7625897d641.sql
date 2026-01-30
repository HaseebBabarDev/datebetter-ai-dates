-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create celibacy_tracking table for tracking celibacy streaks
CREATE TABLE public.celibacy_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.celibacy_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own celibacy tracking"
ON public.celibacy_tracking
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own celibacy tracking"
ON public.celibacy_tracking
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own celibacy tracking"
ON public.celibacy_tracking
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own celibacy tracking"
ON public.celibacy_tracking
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_celibacy_tracking_updated_at
BEFORE UPDATE ON public.celibacy_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();