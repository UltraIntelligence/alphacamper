CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  product_key TEXT NOT NULL CHECK (product_key IN ('summer_pass_2026', 'year_pass_2026')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due')),
  current_period_end TIMESTAMPTZ,
  amount_total INTEGER,
  currency TEXT,
  checkout_mode TEXT NOT NULL DEFAULT 'subscription' CHECK (checkout_mode IN ('subscription', 'payment')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  watch_id UUID REFERENCES watched_targets(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subscriptions
  ALTER COLUMN stripe_subscription_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS amount_total INTEGER,
  ADD COLUMN IF NOT EXISTS currency TEXT,
  ADD COLUMN IF NOT EXISTS checkout_mode TEXT NOT NULL DEFAULT 'subscription';

ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_checkout_mode_check,
  ADD CONSTRAINT subscriptions_checkout_mode_check
    CHECK (checkout_mode IN ('subscription', 'payment'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_id_key'
  ) THEN
    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_stripe_subscription_id_key'
  ) THEN
    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_stripe_payment_intent_id_key'
  ) THEN
    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_stripe_payment_intent_id_key UNIQUE (stripe_payment_intent_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_stripe_checkout_session_id_key'
  ) THEN
    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_stripe_checkout_session_id_key UNIQUE (stripe_checkout_session_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_funnel_events_user_created_at
  ON funnel_events (user_id, created_at DESC);
