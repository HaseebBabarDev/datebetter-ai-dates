-- Add trial support to user_subscriptions
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone;

-- Add comment explaining the column
COMMENT ON COLUMN public.user_subscriptions.trial_ends_at IS 'When the trial period ends. NULL means no active trial.';
