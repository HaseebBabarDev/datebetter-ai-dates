
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan, candidates_limit, updates_per_candidate, trial_ends_at)
  VALUES (NEW.id, 'free', 1, 1, NULL);
  RETURN NEW;
END;
$function$;
