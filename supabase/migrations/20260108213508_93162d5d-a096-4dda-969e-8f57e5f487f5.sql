-- Create table for willingness to pay survey responses
CREATE TABLE public.willingness_to_pay_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  candidate_count_at_survey INTEGER NOT NULL DEFAULT 10,
  preferred_plan TEXT,
  max_monthly_price NUMERIC,
  most_valued_features TEXT[],
  feedback TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.willingness_to_pay_surveys ENABLE ROW LEVEL SECURITY;

-- Users can insert their own survey responses
CREATE POLICY "Users can insert own survey responses"
ON public.willingness_to_pay_surveys
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own survey responses
CREATE POLICY "Users can view own survey responses"
ON public.willingness_to_pay_surveys
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all survey responses
CREATE POLICY "Admins can view all survey responses"
ON public.willingness_to_pay_surveys
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));