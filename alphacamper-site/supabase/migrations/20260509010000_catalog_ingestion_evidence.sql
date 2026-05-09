ALTER TABLE campgrounds
ADD COLUMN IF NOT EXISTS availability_mode TEXT NOT NULL DEFAULT 'directory_only',
ADD COLUMN IF NOT EXISTS confidence TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS source_evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS raw_payload JSONB,
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE campgrounds
ALTER COLUMN support_status SET DEFAULT 'search_only';

ALTER TABLE campgrounds
DROP CONSTRAINT IF EXISTS campgrounds_availability_mode_check;

ALTER TABLE campgrounds
ADD CONSTRAINT campgrounds_availability_mode_check
CHECK (availability_mode IN ('live_polling', 'directory_only', 'metadata_only'));

ALTER TABLE campgrounds
DROP CONSTRAINT IF EXISTS campgrounds_confidence_check;

ALTER TABLE campgrounds
ADD CONSTRAINT campgrounds_confidence_check
CHECK (confidence IN ('verified', 'inferred', 'seeded', 'unknown'));

CREATE TABLE IF NOT EXISTS catalog_provider_syncs (
  provider_key TEXT PRIMARY KEY,
  provider_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  support_status TEXT NOT NULL,
  availability_mode TEXT NOT NULL,
  confidence TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'failed',
  row_count INTEGER NOT NULL DEFAULT 0,
  last_attempted_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  stale_after_hours INTEGER NOT NULL DEFAULT 24,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT catalog_provider_syncs_support_status_check
    CHECK (support_status IN ('alertable', 'search_only', 'coming_soon', 'unsupported')),
  CONSTRAINT catalog_provider_syncs_availability_mode_check
    CHECK (availability_mode IN ('live_polling', 'directory_only', 'metadata_only')),
  CONSTRAINT catalog_provider_syncs_confidence_check
    CHECK (confidence IN ('verified', 'inferred', 'seeded', 'unknown')),
  CONSTRAINT catalog_provider_syncs_status_check
    CHECK (status IN ('succeeded', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_catalog_provider_syncs_status
  ON catalog_provider_syncs (status, last_success_at);

ALTER TABLE catalog_provider_syncs ENABLE ROW LEVEL SECURITY;
