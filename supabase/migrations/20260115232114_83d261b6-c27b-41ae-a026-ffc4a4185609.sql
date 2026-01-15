-- Add 'prefer_not_say' to the politics enum
ALTER TYPE public.politics ADD VALUE IF NOT EXISTS 'prefer_not_say';