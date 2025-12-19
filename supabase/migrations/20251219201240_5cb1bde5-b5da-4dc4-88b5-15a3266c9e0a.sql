-- Create referrals table to track referral signups
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  converted_at timestamp with time zone,
  trial_granted boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view referrals they made
CREATE POLICY "Users can view own referrals" 
ON public.referrals 
FOR SELECT 
USING (auth.uid() = referrer_id);

-- Anyone can insert a referral (for tracking pending)
CREATE POLICY "Anyone can insert referral" 
ON public.referrals 
FOR INSERT 
WITH CHECK (true);

-- System can update referrals
CREATE POLICY "Users can update referrals they made" 
ON public.referrals 
FOR UPDATE 
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Admins can view all referrals
CREATE POLICY "Admins can view all referrals" 
ON public.referrals 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX idx_referrals_referrer_id ON public.referrals(referrer_id);