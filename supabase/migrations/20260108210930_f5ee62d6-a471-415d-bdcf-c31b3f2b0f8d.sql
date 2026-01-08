-- Update the trigger function to default new users to dating_often with 30 updates
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan, candidates_limit, updates_per_candidate)
  VALUES (NEW.id, 'dating_often', 10, 30);
  RETURN NEW;
END;
$$;

-- Update all existing users to dating_often with 30 updates
UPDATE public.user_subscriptions 
SET plan = 'dating_often', 
    candidates_limit = 10, 
    updates_per_candidate = 30;