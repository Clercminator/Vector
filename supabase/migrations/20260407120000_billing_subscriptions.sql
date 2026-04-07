-- Subscription-aware billing storage and profile sync helpers.
-- Builder and Max are now recurring plans, so subscription lifecycle state must be tracked separately from one-off payment rows.

CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_subscription_id TEXT NOT NULL,
  provider_customer_id TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('builder', 'max')),
  status TEXT NOT NULL,
  status_formatted TEXT,
  billing_interval TEXT NOT NULL DEFAULT 'month',
  product_name TEXT,
  variant_name TEXT,
  user_email TEXT,
  order_id TEXT,
  order_item_id TEXT,
  variant_id TEXT,
  renews_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  paused BOOLEAN NOT NULL DEFAULT FALSE,
  cancel_requested BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT billing_subscriptions_provider_subscription_key UNIQUE (provider, provider_subscription_id)
);

ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own billing subscriptions" ON public.billing_subscriptions;
CREATE POLICY "Users can view own billing subscriptions"
  ON public.billing_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all billing subscriptions" ON public.billing_subscriptions;
CREATE POLICY "Admins can view all billing subscriptions"
  ON public.billing_subscriptions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_user_id
  ON public.billing_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_provider_status
  ON public.billing_subscriptions(provider, status);

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS tier TEXT,
  ADD COLUMN IF NOT EXISTS payment_type TEXT NOT NULL DEFAULT 'one_time',
  ADD COLUMN IF NOT EXISTS billing_interval TEXT,
  ADD COLUMN IF NOT EXISTS billing_reason TEXT,
  ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_customer_id TEXT;

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_payment_type_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_payment_type_check
  CHECK (payment_type IN ('one_time', 'subscription_invoice'));

CREATE INDEX IF NOT EXISTS idx_payments_provider_subscription_id
  ON public.payments(provider, provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL AND provider_subscription_id != '';

CREATE OR REPLACE FUNCTION public.apply_subscription_credits(
  target_user_id UUID,
  amount_to_add INTEGER,
  cycle_ends_at TIMESTAMPTZ
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  effective_cycle_ends_at TIMESTAMPTZ;
  new_credits INTEGER;
BEGIN
  PERFORM public.ensure_profile_for_user(target_user_id);

  effective_cycle_ends_at := COALESCE(cycle_ends_at, now() + interval '1 month');

  -- Subscription credits reset each cycle. Unused included plan credits do not roll over.
  new_credits := GREATEST(amount_to_add, 0);

  UPDATE public.profiles
  SET
    credits = new_credits,
    credits_expires_at = effective_cycle_ends_at
  WHERE user_id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'apply_subscription_credits: no profile row for user_id %', target_user_id;
  END IF;

  RETURN new_credits;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_subscription_credits(UUID, INTEGER, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_subscription_credits(UUID, INTEGER, TIMESTAMPTZ) TO service_role;

CREATE OR REPLACE FUNCTION public.sync_profile_tier_from_billing(target_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_tier TEXT;
  resolved_tier TEXT;
BEGIN
  PERFORM public.ensure_profile_for_user(target_user_id);

  SELECT tier
  INTO current_tier
  FROM public.profiles
  WHERE user_id = target_user_id
  FOR UPDATE;

  IF current_tier = 'enterprise' THEN
    RETURN current_tier;
  END IF;

  SELECT bs.tier
  INTO resolved_tier
  FROM public.billing_subscriptions bs
  WHERE bs.user_id = target_user_id
    AND (
      bs.status IN ('on_trial', 'active', 'past_due', 'paused')
      OR (bs.status = 'cancelled' AND (bs.ends_at IS NULL OR bs.ends_at > now()))
    )
  ORDER BY
    CASE bs.tier WHEN 'max' THEN 2 WHEN 'builder' THEN 1 ELSE 0 END DESC,
    COALESCE(bs.renews_at, bs.updated_at) DESC,
    bs.updated_at DESC
  LIMIT 1;

  resolved_tier := COALESCE(resolved_tier, 'architect');

  UPDATE public.profiles
  SET tier = resolved_tier
  WHERE user_id = target_user_id;

  RETURN resolved_tier;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_profile_tier_from_billing(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_profile_tier_from_billing(UUID) TO service_role;