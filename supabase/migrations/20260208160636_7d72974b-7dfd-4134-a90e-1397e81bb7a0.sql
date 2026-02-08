-- Add additional interaction types for better tracking from D.E.V.I. chat
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'date';
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'video_call';
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'met_friends';
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'met_family';
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'trip_together';
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'moved_in';
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'engaged';
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'ghosted';
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'argument';
ALTER TYPE public.interaction_type ADD VALUE IF NOT EXISTS 'other';