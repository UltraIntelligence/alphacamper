# Railway Worker Smoke Runbook

Last updated: 2026-05-09

Purpose: prove the Railway worker is actually running against live Supabase.

This is the current blocker for calling alert coverage production-ready.

## Current Evidence

- Live site route is retired correctly:
  - `https://alphacamper.com/api/check-availability` returns `410`.
  - Response says `engine: railway-worker`.
- Live catalog is refreshed and searchable:
  - 461 customer-searchable campground rows.
  - 396 alertable campground rows.
  - 65 search-only campground rows.
  - 3 unsupported stale rows.
- Worker heartbeat code is pushed:
  - `d7464921c Write worker heartbeat on quiet cycles`.
  - Quiet cycles now write `worker_status`.
- GitHub CI is green for site, worker, extension, and customer smoke.
- Live provider-quality route is deployed:
  - `https://alphacamper.com/api/admin/provider-quality` returns `fetchedFrom: live_supabase`.
  - It reports 5 active watches.
  - It reports `railway_worker` degraded with `missing_worker_heartbeat`.
- Live Supabase still has no `worker_status` heartbeat row.
- GitHub deployment metadata shows Vercel site deploys, not Railway worker deploy proof.
- Railway CLI was not authenticated in this shell.

## Success Criteria

Green means all of these are true:

- Railway service is deployed from the current `main` commit or a commit at/after `d7464921c`.
- Railway service has the expected live variables:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY` if email alerts should send.
  - `SENTDM_API_KEY` if SMS/WhatsApp/RCS alerts should send.
- Railway logs show the worker starting:
  - `Alphacamper Worker starting`
  - `Health check server on :8080`
- Live Supabase `worker_status` has a recent row.
- `worker_status.platforms_healthy` includes:
  - `bc_parks`
  - `ontario_parks`
  - `parks_canada`
  - `gtc_new_brunswick`
  - `recreation_gov`
- No unexpected alert burst is created during the smoke.

Yellow means:

- Site/catalog are green, but Railway runtime is not proven.
- Or the worker runs, but some provider/notification health is missing.

Red means:

- Railway is not deployed/running.
- Required live env vars are missing.
- Worker crashes on startup.
- Worker points at the wrong Supabase project.

## Commands

Run from `alphacamper-worker/` after Railway login/link:

```bash
npm run smoke:production
```

Current expected result before Railway is fixed: yellow with `missing_worker_heartbeat`.

```bash
railway status
railway service status
railway variables --json
railway logs --lines 100
railway logs --build --lines 100
```

If the service is stale or not running:

```bash
railway redeploy --yes
```

If the service is running but no heartbeat appears, inspect logs:

```bash
railway logs --since 15m --filter "Alphacamper Worker"
railway logs --since 15m --filter "Cycle failed"
railway logs --since 15m --filter "updateWorkerStatus failed"
railway logs --since 15m --filter "SUPABASE_URL"
```

Do not paste secret values into the report. Only report whether the variables exist and point to the live project.

## Live Supabase Checks

Worker heartbeat:

```sql
SELECT
  id,
  last_cycle_at,
  last_successful_poll_at,
  platforms_healthy,
  cycle_stats
FROM public.worker_status
ORDER BY last_cycle_at DESC
LIMIT 1;
```

Active watches:

```sql
SELECT platform, active, COUNT(*)::int
FROM public.watched_targets
GROUP BY platform, active
ORDER BY platform, active;
```

Recent alerts:

```sql
SELECT
  id,
  watched_target_id,
  user_id,
  notified_at,
  claimed,
  site_details
FROM public.availability_alerts
ORDER BY notified_at DESC
LIMIT 10;
```

Provider syncs:

```sql
SELECT
  provider_key,
  status,
  row_count,
  last_success_at,
  last_error
FROM public.catalog_provider_syncs
ORDER BY provider_key;
```

Production operator route:

```bash
curl -sS https://alphacamper.com/api/admin/provider-quality | jq '{available, reason, fetchedFrom, providerQuality, alertDelivery, worker: (.providers[]? | select(.provider_id == "railway_worker"))}'
```

Repo smoke command:

```bash
cd alphacamper-worker
npm run smoke:production
```

## Report Back

```text
Epic: Production Worker Smoke
Status: green / yellow / red

Railway service:
- Service name:
- Commit deployed:
- Started:
- Health endpoint:

Live Supabase:
- worker_status heartbeat:
- active watches:
- recent alerts:

Customer truth:
- Alert engine:
- Searchable:
- Alertable:
- Search-only:

Risks:
- ...

Recommended control-tower update:
- ...
```
