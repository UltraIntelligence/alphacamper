CREATE TABLE IF NOT EXISTS campground_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  platform TEXT NOT NULL,
  campground_id TEXT NOT NULL,
  campground_name TEXT NOT NULL,
  support_status TEXT NOT NULL CHECK (support_status IN ('search_only', 'coming_soon', 'unsupported')),
  source TEXT NOT NULL DEFAULT 'watch_search',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (email, platform, campground_id)
);

CREATE INDEX IF NOT EXISTS idx_campground_interest_campground_created_at
  ON campground_interest (platform, campground_id, created_at DESC);

ALTER TABLE campground_interest ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "anon_insert_campground_interest"
    ON campground_interest FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "block_read_campground_interest"
    ON campground_interest FOR SELECT
    USING (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
