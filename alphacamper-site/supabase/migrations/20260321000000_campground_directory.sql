-- Full campground directory — synced by worker at startup from Camis /api/resourceLocation
-- Covers bc_parks, ontario_parks, parks_canada. Recreation.gov stays in the static lib/parks.ts array.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS campgrounds (
  id          TEXT NOT NULL,
  platform    TEXT NOT NULL,
  root_map_id BIGINT,
  name        TEXT NOT NULL,
  short_name  TEXT,
  province    TEXT,         -- 'BC' | 'ON' | null (Parks Canada spans multiple provinces)
  support_status TEXT NOT NULL DEFAULT 'alertable',
  provider_key TEXT,
  source_url TEXT,
  last_verified_at TIMESTAMPTZ,
  synced_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id, platform),
  CONSTRAINT campgrounds_support_status_check
    CHECK (support_status IN ('alertable', 'search_only', 'coming_soon', 'unsupported'))
);

CREATE INDEX IF NOT EXISTS idx_campgrounds_platform ON campgrounds (platform);
CREATE INDEX IF NOT EXISTS idx_campgrounds_support_status ON campgrounds (support_status);
CREATE INDEX IF NOT EXISTS idx_campgrounds_name_trgm ON campgrounds USING GIN (name gin_trgm_ops);

ALTER TABLE campgrounds ENABLE ROW LEVEL SECURITY;

-- Public read — search is unauthenticated
CREATE POLICY "campgrounds_public_read" ON campgrounds FOR SELECT USING (true);
-- No anon INSERT/UPDATE policy — only service role (worker) can write
