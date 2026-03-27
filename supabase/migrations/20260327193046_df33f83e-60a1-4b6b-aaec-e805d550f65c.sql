UPDATE user_subscriptions 
SET plan = 'dating_often', 
    trial_ends_at = NOW() + INTERVAL '90 days',
    candidates_limit = 7,
    updates_per_candidate = 5
WHERE user_id = 'f10ff70d-5065-4d66-af58-46f4964e7ad0';