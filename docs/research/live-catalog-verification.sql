-- Alphacamper live catalog verification
-- Project: tbdrmcdrfgunbcevslqf
-- Purpose: read-only checks before and after the support-status migration.
--
-- Expected use:
-- 1. Run sections 1-3 before migration.
-- 2. Apply alphacamper-site/supabase/migrations/20260509000000_campground_support_status.sql.
-- 3. Run all sections again.

-- 1. Provider row counts.
SELECT platform, COUNT(*) AS campgrounds
FROM campgrounds
GROUP BY platform
ORDER BY platform;

-- 2. Required support-status columns.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'campgrounds'
  AND column_name IN ('support_status', 'provider_key', 'source_url', 'last_verified_at')
ORDER BY column_name;

-- 3. Support-status index.
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'campgrounds'
  AND indexname = 'idx_campgrounds_support_status';

-- 4. Support-status distribution.
-- Before migration this will fail if support_status does not exist.
-- After migration it should return the current support labels.
SELECT support_status, COUNT(*) AS campgrounds
FROM campgrounds
GROUP BY support_status
ORDER BY support_status;

-- 5. Sample live-only catalog checks.
-- Bamberton was reported as a live Supabase row that did not appear through
-- the customer API before the migration.
SELECT id, platform, root_map_id, name, short_name, province, support_status, provider_key, source_url, last_verified_at
FROM campgrounds
WHERE name ILIKE '%Bamberton%'
ORDER BY name
LIMIT 10;

-- 6. Sample known fallback/live ID check.
SELECT id, platform, root_map_id, name, short_name, province, support_status, provider_key, source_url, last_verified_at
FROM campgrounds
WHERE id = '-2430'
  AND platform = 'bc_parks'
LIMIT 10;
