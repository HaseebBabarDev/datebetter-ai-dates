-- Tighten referrals INSERT policy (fix permissive RLS warning)
DO $$
BEGIN
  -- Drop overly permissive policy if present
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'referrals'
      AND policyname = 'Anyone can insert referral'
  ) THEN
    EXECUTE 'DROP POLICY "Anyone can insert referral" ON public.referrals';
  END IF;

  -- Create safer insert policy (idempotent)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'referrals'
      AND policyname = 'Users can insert their own referral'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can insert their own referral" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referred_id)';
  END IF;
END $$;
