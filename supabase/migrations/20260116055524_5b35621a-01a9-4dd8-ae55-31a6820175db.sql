-- Fix onboarding save errors by aligning backend enums with UI options
-- 1) Relationship status includes "In a Relationship"
ALTER TYPE public.relationship_status ADD VALUE IF NOT EXISTS 'in_relationship';

-- 2) Kids desire includes "Unsure"
ALTER TYPE public.kids_desire ADD VALUE IF NOT EXISTS 'unsure';

-- 3) Attachment style includes "Unsure"
ALTER TYPE public.attachment_style ADD VALUE IF NOT EXISTS 'unsure';
