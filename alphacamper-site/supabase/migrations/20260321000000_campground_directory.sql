-- Full campground directory — synced by worker at startup from Camis /api/resourceLocation
-- Covers bc_parks, ontario_parks, parks_canada. Recreation.gov stays in the static lib/parks.ts array.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS campgrounds (
  id          TEXT NOT NULL,
  platform    TEXT NOT NULL,
  name        TEXT NOT NULL,
  short_name  TEXT,
  province    TEXT,         -- 'BC' | 'ON' | null (Parks Canada spans multiple provinces)
  synced_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (id, platform)
);

CREATE INDEX IF NOT EXISTS idx_campgrounds_platform ON campgrounds (platform);
CREATE INDEX IF NOT EXISTS idx_campgrounds_name_trgm ON campgrounds USING GIN (name gin_trgm_ops);

ALTER TABLE campgrounds ENABLE ROW LEVEL SECURITY;

-- Public read — search is unauthenticated
CREATE POLICY "campgrounds_public_read" ON campgrounds FOR SELECT USING (true);
-- No anon INSERT/UPDATE policy — only service role (worker) can write
