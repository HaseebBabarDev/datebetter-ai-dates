-- Create enum for tester type
CREATE TYPE public.tester_type AS ENUM ('internal', 'external');

-- Create user_tester_status table to track tester classification
CREATE TABLE public.user_tester_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  tester_type tester_type NOT NULL DEFAULT 'external',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_tester_status ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage tester status
CREATE POLICY "Admins can view all tester statuses"
ON public.user_tester_status
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert tester statuses"
ON public.user_tester_status
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tester statuses"
ON public.user_tester_status
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tester statuses"
ON public.user_tester_status
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_user_tester_status_updated_at
BEFORE UPDATE ON public.user_tester_status
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();