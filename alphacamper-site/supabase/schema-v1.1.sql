-- Alphacamper v1.1 — Cancellation Monitoring Schema
-- Run this in Supabase SQL Editor after the v1.0 waitlist table

-- Users (created when they register from the extension)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  push_subscription JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Watched targets (campgrounds the user wants monitored)
CREATE TABLE IF NOT EXISTS watched_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  campground_id TEXT NOT NULL,
  campground_name TEXT NOT NULL,
  site_number TEXT,
  arrival_date DATE NOT NULL,
  departure_date DATE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Availability alerts (detected openings)
CREATE TABLE IF NOT EXISTS availability_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  watched_target_id UUID REFERENCES watched_targets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  site_details JSONB,
  notified_at TIMESTAMPTZ DEFAULT now(),
  claimed BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  product_key TEXT NOT NULL CHECK (product_key IN ('summer_pass_2026', 'year_pass_2026')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE watched_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_alerts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.rls_dev_override_enabled()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    lower(
      COALESCE(
        (
          COALESCE(
            NULLIF(current_setting('request.headers', true), ''),
            '{}'
          )::jsonb ->> 'x-rls-dev-override'
        ),
        'false'
      )
    ) = 'true',
    false
  );
$$;

DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Users read own data" ON users;
DROP POLICY IF EXISTS "Users update own data" ON users;
DROP POLICY IF EXISTS "Users delete own data" ON users;
DROP POLICY IF EXISTS "Allow watched target inserts" ON watched_targets;
DROP POLICY IF EXISTS "Allow watched target reads" ON watched_targets;
DROP POLICY IF EXISTS "Allow watched target updates" ON watched_targets;
DROP POLICY IF EXISTS "Allow watched target deletes" ON watched_targets;
DROP POLICY IF EXISTS "Allow alert inserts" ON availability_alerts;
DROP POLICY IF EXISTS "Allow alert reads" ON availability_alerts;
DROP POLICY IF EXISTS "Allow alert updates" ON availability_alerts;
DROP POLICY IF EXISTS "Allow alert deletes" ON availability_alerts;

CREATE POLICY "Users insert own data" ON users
  FOR INSERT WITH CHECK (
    public.rls_dev_override_enabled()
    OR auth.uid() = id
  );
CREATE POLICY "Users read own data" ON users
  FOR SELECT USING (
    public.rls_dev_override_enabled()
    OR auth.uid() = id
  );
CREATE POLICY "Users update own data" ON users
  FOR UPDATE USING (
    public.rls_dev_override_enabled()
    OR auth.uid() = id
  )
  WITH CHECK (
    public.rls_dev_override_enabled()
    OR auth.uid() = id
  );
CREATE POLICY "Users delete own data" ON users
  FOR DELETE USING (
    public.rls_dev_override_enabled()
    OR auth.uid() = id
  );

CREATE POLICY "Watched targets insert own data" ON watched_targets
  FOR INSERT WITH CHECK (
    public.rls_dev_override_enabled()
    OR auth.uid() = user_id
  );
CREATE POLICY "Watched targets read own data" ON watched_targets
  FOR SELECT USING (
    public.rls_dev_override_enabled()
    OR auth.uid() = user_id
  );
CREATE POLICY "Watched targets update own data" ON watched_targets
  FOR UPDATE USING (
    public.rls_dev_override_enabled()
    OR auth.uid() = user_id
  )
  WITH CHECK (
    public.rls_dev_override_enabled()
    OR auth.uid() = user_id
  );
CREATE POLICY "Watched targets delete own data" ON watched_targets
  FOR DELETE USING (
    public.rls_dev_override_enabled()
    OR auth.uid() = user_id
  );

CREATE POLICY "Alerts insert own data" ON availability_alerts
  FOR INSERT WITH CHECK (
    public.rls_dev_override_enabled()
    OR auth.uid() = user_id
  );
CREATE POLICY "Alerts read own data" ON availability_alerts
  FOR SELECT USING (
    public.rls_dev_override_enabled()
    OR auth.uid() = user_id
  );
CREATE POLICY "Alerts update own data" ON availability_alerts
  FOR UPDATE USING (
    public.rls_dev_override_enabled()
    OR auth.uid() = user_id
  )
  WITH CHECK (
    public.rls_dev_override_enabled()
    OR auth.uid() = user_id
  );
CREATE POLICY "Alerts delete own data" ON availability_alerts
  FOR DELETE USING (
    public.rls_dev_override_enabled()
    OR auth.uid() = user_id
  );
