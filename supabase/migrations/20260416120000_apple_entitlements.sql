-- Mirror of App Store / RevenueCat entitlement state (updated by revenuecat-webhook only).
-- Used by check-subscription (C-lite) alongside Stripe; does not replace Stripe checkout.

CREATE TABLE public.apple_entitlements (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  unlimited_active boolean NOT NULL DEFAULT false,
  unlimited_expires_at timestamptz,
  text_simulator_active boolean NOT NULL DEFAULT false,
  detachment_plan_active boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.apple_entitlements IS 'RevenueCat / App Store entitlements; upserted by edge function revenuecat-webhook.';

CREATE INDEX apple_entitlements_updated_at_idx ON public.apple_entitlements (updated_at DESC);

ALTER TABLE public.apple_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own apple entitlements"
ON public.apple_entitlements
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Inserts/updates: service role (webhook) only; no policy for authenticated write
