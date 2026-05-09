# Live Catalog Migration Runbook

Last updated: 2026-05-09

## Purpose

Unblock the live campground catalog so Alphacamper can safely use support labels in customer search and watch creation.

This is the current control-tower gate. Do not start customer-facing coverage expansion until this runbook is complete and verified.

## Approval Required

Do not apply this migration without explicit approval from Ryan.

Approval prompt:

> Yes, apply the Phase 1 campground support-status migration to live Supabase project `tbdrmcdrfgunbcevslqf`, then re-run the read-only verification.

## Why This Is Needed

Epic 1 verified:

- Live Supabase project `tbdrmcdrfgunbcevslqf` is readable.
- Live `campgrounds.support_status` does not exist.
- Live `campgrounds` has 387 rows:
  - BC Parks: 144.
  - Ontario Parks: 129.
  - Parks Canada: 114.
- Customer-safe search still falls back to 174 static rows.
- Live-only rows are not safely exposed through `/api/campgrounds`.

## Migration File

Apply:

- `alphacamper-site/supabase/migrations/20260509000000_campground_support_status.sql`

Migration contents:

```sql
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
```

## Risk Read

This is an additive schema migration:

- Adds nullable metadata columns, except `support_status` with default `alertable`.
- Adds a check constraint for allowed support statuses.
- Adds an index on `support_status`.

Main risk:

- Defaulting all existing rows to `alertable` may overstate customer truth unless provider support is corrected immediately after verification.

Control-tower mitigation:

- Do not change public copy after migration.
- Re-run counts and support labels immediately.
- Confirm whether existing rows need provider-specific `search_only` or `coming_soon` updates before any marketing claim.

## Preflight Checks

Tooling preflight from this workspace:

- Supabase CLI is installed at `/opt/homebrew/bin/supabase`.
- Installed Supabase CLI version checked as `2.84.2`.
- `alphacamper-site/supabase/.temp/project-ref` points to `tbdrmcdrfgunbcevslqf`.
- Local Supabase stack is not running; that is not a blocker for the live SQL Editor path.

Tooling caution from the 2026-05-09 control-tower refresh:

- The default Supabase MCP connection did not point at the Alphacamper project; it exposed unrelated tables and `public.campgrounds` did not exist there.
- Running multiple `supabase db query --linked` checks in parallel hit Supabase pooler auth throttling.
- Use the Supabase SQL Editor for project `tbdrmcdrfgunbcevslqf` unless the exact MCP/CLI project target is confirmed first.

Reusable read-only verification SQL:

- `docs/research/live-catalog-verification.sql`

Before applying:

1. Confirm the target project is `tbdrmcdrfgunbcevslqf`.
2. Confirm live row count:

```sql
SELECT platform, COUNT(*)
FROM campgrounds
GROUP BY platform
ORDER BY platform;
```

3. Confirm columns are missing:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'campgrounds'
  AND column_name IN ('support_status', 'provider_key', 'source_url', 'last_verified_at')
ORDER BY column_name;
```

Expected before migration:

- no rows, or at least missing one or more required columns.

## Apply Step

Use the Supabase SQL Editor for project `tbdrmcdrfgunbcevslqf`.

Paste and run the migration SQL from:

- `alphacamper-site/supabase/migrations/20260509000000_campground_support_status.sql`

This follows the repo's prior manual-migration convention.

## Post-Migration Verification

Run:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'campgrounds'
  AND column_name IN ('support_status', 'provider_key', 'source_url', 'last_verified_at')
ORDER BY column_name;
```

Expected:

- `support_status` exists and defaults to `'alertable'::text` or equivalent.
- `provider_key` exists.
- `source_url` exists.
- `last_verified_at` exists.

Run:

```sql
SELECT support_status, COUNT(*)
FROM campgrounds
GROUP BY support_status
ORDER BY support_status;
```

Expected immediately after migration:

- likely all existing rows are `alertable` until follow-up normalization.

Run:

```sql
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'campgrounds'
  AND indexname = 'idx_campgrounds_support_status';
```

Expected:

- `idx_campgrounds_support_status`.

## Customer-Path Verification

After SQL verification, verify the customer path:

1. `/api/campgrounds?q=Alice` still returns fallback or DB result.
2. `/api/campgrounds?q=Bamberton` returns the live DB row.
3. `/api/campgrounds?id=-2430&platform=bc_parks` returns the live DB row if that ID exists.
4. `/api/watch` still respects support status.
5. Local tests for campground/watch guardrails pass.

Suggested local command:

```bash
cd /Users/ryan/Code/Alphacamper/alphacamper-site
npm test -- __tests__/api-routes.test.ts __tests__/watch-wizard.test.tsx __tests__/step-search.test.tsx
```

## Board Updates After Success

If verification passes:

- Change `Live catalog schema` gate from Red to Green.
- Change `Customer campground search` gate from Red to Yellow or Green depending on live API behavior.
- Update the count ledger from "verified live read but blocked" to "verified live catalog with support status."
- Keep Canada Coverage Sprint held until support statuses are normalized and not overclaiming.

## Board Updates If It Fails

If migration or verification fails:

- Keep Epic 1 Red.
- Record the exact SQL/API error.
- Do not launch coverage expansion.
- Do not update public copy.

## Next Work After This Is Green

Launch a new huge goal window:

> Verify New Brunswick GoingToCamp alertability, then run Alberta/Saskatchewan adapter discovery against official reservation pages. Keep every new provider searchable-only until site-level availability polling is proven.
