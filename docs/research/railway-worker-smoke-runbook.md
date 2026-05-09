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
- GitHub CI is green for site, worker, extension, and customer smoke through `91b0d7fc1`.
- Live provider-quality route is deployed:
  - `https://alphacamper.com/api/admin/provider-quality` returns `fetchedFrom: live_supabase`.
  - It reports 5 active watches.
  - It reports `railway_worker` degraded with `missing_worker_heartbeat`.
- Live Supabase still has no `worker_status` heartbeat row.
- GitHub deployment metadata shows Vercel site deploys, not Railway worker deploy proof.
- Railway CLI was not authenticated in this shell.
- Repo inspection found no committed Railway project link.
- Worker deploy config now exists at `alphacamper-worker/railway.json`.
- Worker `/health` now listens on Railway's `PORT` when provided, with `8080` as the local/default fallback.
- Worker health now goes degraded if the `worker_status` heartbeat write fails, so a Railway green healthcheck is closer to real alert readiness.
- `npm run smoke:railway` now includes live production heartbeat proof. Railway startup logs alone cannot mark the gate green if the live provider-quality route or Supabase heartbeat is still missing.

## Success Criteria

Green means all of these are true:

- Railway service is deployed from the current `main` commit or a commit at/after `d7464921c`.
- Railway service root directory is `/alphacamper-worker`.
- Railway config file path is `/alphacamper-worker/railway.json` if the service does not auto-detect it.
- Railway service has the expected live variables:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY` if email alerts should send.
  - `SENTDM_API_KEY` if SMS/WhatsApp/RCS alerts should send.
- Railway logs show the worker starting:
  - `Alphacamper Worker starting`
  - `Health check server on :<port>`
- Railway logs do not show:
  - `worker_status heartbeat write failed`
  - `updateWorkerStatus failed`
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

## Railway Service Setup Checklist

Use this when the local CLI reports `blocked` because it is not authenticated.

In Railway, the worker service should be configured like this:

| Setting | Expected value |
|---|---|
| GitHub repo | `UltraIntelligence/alphacamper` |
| Service root directory | `/alphacamper-worker` |
| Config file path | `/alphacamper-worker/railway.json` if Railway does not auto-detect it |
| Builder | Dockerfile |
| Dockerfile | `alphacamper-worker/Dockerfile` through the service root |
| Healthcheck path | `/health` |
| Restart policy | On failure |
| Watch path | `/alphacamper-worker/**` |

Why these matter:

- Railway monorepo services need the worker app as the root directory.
- Railway uses a `Dockerfile` at the source root, so the source root must be `alphacamper-worker`.
- Railway provides a `PORT` variable for service health/routing; the worker now honors it and falls back to `8080`.

Expected live variables:

| Variable | Required | Notes |
|---|---|---|
| `SUPABASE_URL` | Yes | Must point to live project `tbdrmcdrfgunbcevslqf`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Do not paste the value into reports. |
| `RESEND_API_KEY` | For email delivery | Needed before customer email notification proof. |
| `RESEND_FROM_EMAIL` | For production email | Should be a verified sender such as `alerts@alphacamper.com`. |
| `SENTDM_API_KEY` | For SMS/WhatsApp/RCS delivery | Needed before mobile notification proof. |
| `SENTDM_TEMPLATE_NAME` | Optional | Defaults to `campsite_alert`. |
| `DISABLED_PLATFORMS` | Optional | Kill switch only. Should not disable BC, Ontario, Parks Canada, New Brunswick, or Recreation.gov during the smoke. |

After any service setting or variable change:

```bash
railway redeploy --yes
```

Official Railway docs checked on 2026-05-09:

- Railway monorepo services should set a root directory for isolated apps: `https://docs.railway.com/deployments/monorepo`.
- Railway looks for a `Dockerfile` at the source directory root: `https://docs.railway.com/builds/dockerfiles`.
- Railway config-as-code can set build/deploy settings such as builder, watch paths, healthcheck, and restart policy: `https://docs.railway.com/config-as-code/reference`.
- Railway healthchecks use the app's health endpoint during deploy, and Railway injects `PORT` for service health/routing: `https://docs.railway.com/guides/healthchecks-and-restarts`.

Run from `alphacamper-worker/` after Railway login/link:

```bash
npm run smoke:railway
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

Fastest operator unblock path:

```bash
cd /Users/ryan/Code/Alphacamper/alphacamper-worker
railway login
railway link
railway service link alphacamper-worker

# Check service/env without printing secret values.
npm run smoke:railway -- --service alphacamper-worker --environment production --allow-blocked

# If service settings or env vars are fixed in Railway, redeploy and rerun.
railway redeploy --service alphacamper-worker --yes
npm run smoke:railway -- --service alphacamper-worker --environment production
npm run smoke:production
```

The first green proof we need is not an alert. It is `npm run smoke:railway`
showing Railway auth/config/logs are clean and a recent live `worker_status`
heartbeat exists with the expected platforms listed. Only after that should the
customer notification smoke move from setup proof to delivery proof.

If the service is running but no heartbeat appears, inspect logs:

```bash
railway logs --since 15m --filter "Alphacamper Worker"
railway logs --since 15m --filter "Cycle failed"
railway logs --since 15m --filter "updateWorkerStatus failed"
railway logs --since 15m --filter "worker_status heartbeat write failed"
railway logs --since 15m --filter "SUPABASE_URL"
```

Do not paste secret values into the report. Only report whether the variables exist and point to the live project.

Secret-safe Railway diagnostic:

```bash
cd alphacamper-worker
npm run smoke:railway
```

If Railway is not authenticated or linked, the command still prints live
production heartbeat proof first, then reports `blocked` and tells you to run
`railway login` or `railway link`.

If the Railway project has multiple services or environments, pass explicit names:

```bash
npm run smoke:railway -- --service alphacamper-worker --environment production
```

If you only want to confirm the local shell is blocked without failing an
automation step:

```bash
npm run smoke:railway -- --service alphacamper-worker --environment production --allow-blocked
```

Treat `blocked` as operator-only. It means the repo-side command cannot inspect
Railway service settings from this shell, not that the worker is healthy.

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
