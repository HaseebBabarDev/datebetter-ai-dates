-- Create table for storing user PINs (hashed)
CREATE TABLE public.user_pins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  pin_hash text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_pins ENABLE ROW LEVEL SECURITY;

-- Users can only view their own PIN record
CREATE POLICY "Users can view own pin"
ON public.user_pins
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own PIN
CREATE POLICY "Users can insert own pin"
ON public.user_pins
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own PIN
CREATE POLICY "Users can update own pin"
ON public.user_pins
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own PIN
CREATE POLICY "Users can delete own pin"
ON public.user_pins
FOR DELETE
USING (auth.uid() = user_id);