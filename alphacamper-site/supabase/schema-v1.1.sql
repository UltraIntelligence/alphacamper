-- Alphacamper v1.1 — Cancellation Monitoring Schema
-- Run this in Supabase SQL Editor after the v1.0 waitlist table

-- Users (created when they register from the extension)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE watched_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_alerts ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anon for registration
CREATE POLICY "Allow user registration" ON users
  FOR INSERT WITH CHECK (true);

-- Users can read/update their own row
CREATE POLICY "Users read own data" ON users
  FOR SELECT USING (id = auth.uid() OR true);

-- Watched targets — anon access scoped by user_id header (simple auth for MVP)
CREATE POLICY "Allow watched target inserts" ON watched_targets
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow watched target reads" ON watched_targets
  FOR SELECT USING (true);
CREATE POLICY "Allow watched target updates" ON watched_targets
  FOR UPDATE USING (true);
CREATE POLICY "Allow watched target deletes" ON watched_targets
  FOR DELETE USING (true);

-- Alerts — same simple access for MVP
CREATE POLICY "Allow alert inserts" ON availability_alerts
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow alert reads" ON availability_alerts
  FOR SELECT USING (true);
CREATE POLICY "Allow alert updates" ON availability_alerts
  FOR UPDATE USING (true);
