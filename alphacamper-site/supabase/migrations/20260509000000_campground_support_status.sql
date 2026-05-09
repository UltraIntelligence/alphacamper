ALTER TABLE campgrounds
ADD COLUMN IF NOT EXISTS support_status TEXT NOT NULL DEFAULT 'alertable',
ADD COLUMN IF NOT EXISTS provider_key TEXT,
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

ALTER TABLE campgrounds
DROP CONSTRAINT IF EXISTS campgrounds_support_status_check;

ALTER TABLE campgrounds
ADD CONSTRAINT campgrounds_support_status_check
CHECK (support_status IN ('alertable', 'search_only', 'coming_soon', 'unsupported'));

CREATE INDEX IF NOT EXISTS idx_campgrounds_support_status ON campgrounds (support_status);
