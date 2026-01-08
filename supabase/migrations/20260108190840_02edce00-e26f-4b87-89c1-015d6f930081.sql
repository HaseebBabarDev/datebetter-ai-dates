-- Update the trigger function to default new users to unlimited
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan, candidates_limit, updates_per_candidate)
  VALUES (NEW.id, 'unlimited', 999, 999);
  RETURN NEW;
END;
$function$;

-- Upgrade all existing users to unlimited for testing
UPDATE public.user_subscriptions 
SET plan = 'unlimited', 
    candidates_limit = 999, 
    updates_per_candidate = 999,
    updated_at = now();