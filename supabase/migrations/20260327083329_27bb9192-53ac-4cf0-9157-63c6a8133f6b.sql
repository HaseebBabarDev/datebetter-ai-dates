UPDATE public.user_subscriptions SET plan = 'free', candidates_limit = 1, updates_per_candidate = 5, trial_ends_at = NULL WHERE user_id = '759cc588-c41b-4b2d-b2f0-1e7615aab637';

UPDATE public.user_subscriptions SET trial_ends_at = (NOW() + INTERVAL '30 days') WHERE user_id = '7416c7f0-236f-4e87-8c2f-183deaf215d2';