CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  push_subscription JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS availability_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  watched_target_id UUID REFERENCES watched_targets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  site_details JSONB,
  notified_at TIMESTAMPTZ DEFAULT now(),
  claimed BOOLEAN DEFAULT false
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE watched_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_alerts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "anon_insert_waitlist" ON waitlist FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "block_read_waitlist" ON waitlist FOR SELECT USING (false); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "user_insert" ON users FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "user_select" ON users FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "wt_insert" ON watched_targets FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "wt_select" ON watched_targets FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "wt_update" ON watched_targets FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "wt_delete" ON watched_targets FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "alert_insert" ON availability_alerts FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "alert_select" ON availability_alerts FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "alert_update" ON availability_alerts FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
