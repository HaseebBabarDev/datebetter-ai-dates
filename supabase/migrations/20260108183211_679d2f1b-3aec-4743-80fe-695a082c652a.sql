-- Create table to track NDA and agreement acceptances
CREATE TABLE public.user_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  agreement_type TEXT NOT NULL,
  agreement_version TEXT NOT NULL DEFAULT '1.0',
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to prevent duplicate acceptances of same version
CREATE UNIQUE INDEX idx_user_agreements_unique ON public.user_agreements (user_id, agreement_type, agreement_version);

-- Create index for faster lookups
CREATE INDEX idx_user_agreements_user_id ON public.user_agreements (user_id);
CREATE INDEX idx_user_agreements_type ON public.user_agreements (agreement_type);

-- Enable Row Level Security
ALTER TABLE public.user_agreements ENABLE ROW LEVEL SECURITY;

-- Users can view their own agreements
CREATE POLICY "Users can view own agreements"
ON public.user_agreements
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own agreements
CREATE POLICY "Users can insert own agreements"
ON public.user_agreements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all agreements for compliance
CREATE POLICY "Admins can view all agreements"
ON public.user_agreements
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));