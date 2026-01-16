-- Add 'prefer_not_say' to the religion enum
ALTER TYPE public.religion ADD VALUE IF NOT EXISTS 'prefer_not_say';