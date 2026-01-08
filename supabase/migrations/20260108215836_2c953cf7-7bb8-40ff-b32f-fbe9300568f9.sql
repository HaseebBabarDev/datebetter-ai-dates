-- Create table to track survey requests from admin
CREATE TABLE public.survey_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  requested_by UUID NOT NULL,
  survey_type TEXT NOT NULL DEFAULT 'wtp',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.survey_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own pending requests
CREATE POLICY "Users can view their own survey requests"
ON public.survey_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own requests (mark as completed)
CREATE POLICY "Users can update their own survey requests"
ON public.survey_requests
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can manage all survey requests
CREATE POLICY "Admins can manage survey requests"
ON public.survey_requests
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));