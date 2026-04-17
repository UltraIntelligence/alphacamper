# Alphacamper API

This is the new Python backend for a Campflare-style metadata, availability, and alerts platform.

What it does:
- Stores a normalized campground and campsite directory for Canada and the U.S.
- Pulls metadata from official/open sources first.
- Reads public availability data and turns it into alert events.
- Exposes a stable read API under `/v1`.

Why this exists:
- The current Alphacamper product has provider logic split across the site and worker.
- This service is the cleaner long-term backend for admin features, partner API access, and broader market coverage.

## Recommended Product Direction

Best practice:
- Keep this as a separate backend service from the marketing site and the current worker.
- Treat official metadata ingestion and live availability polling as different jobs.
- Keep the API strictly read-only plus alert subscriptions.
- Use session bootstrap adapters for WAF-protected providers instead of hardcoding browser tricks into every connector.

Recommended now:
- Start with Parks Canada, BC Parks, Ontario Parks, Recreation.gov, RIDB, and NPS.
- Add broader GoingToCamp domains after we confirm each domain's public JSON shape.
- Use this service as the future source of truth for campground search in the site.

## Quick Start

```bash
cd alphacamper-api
docker compose up -d
python3.11 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

## Environment Variables

Required:
- `DATABASE_URL`
- `REDIS_URL`

Optional now, but needed for full ingestion:
- `RIDB_API_KEY`
- `NPS_API_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `WEBHOOK_SIGNING_SECRET`
- `ADMIN_API_KEY`
- `PROVIDER_SESSION_BOOTSTRAP_COMMAND`

`PROVIDER_SESSION_BOOTSTRAP_COMMAND` is the future hook for WAF-protected providers like Parks Canada, BC Parks, and Ontario Parks. The backend keeps that session bootstrap separate from the core provider client so we can swap in a Playwright-assisted cookie refresh later without rewriting the connector itself.

Expected bootstrap command output:

```json
{
  "cookies": {
    "XSRF-TOKEN": "value"
  },
  "headers": {
    "X-XSRF-TOKEN": "value"
  }
}
```

For local CAMIS/Parks Canada polling, set:

```bash
PROVIDER_SESSION_BOOTSTRAP_COMMAND="node /Users/ryan/Code/Alphacamper/alphacamper-api/scripts/session_bootstrap.cjs"
PROVIDER_BROWSER_FETCH_COMMAND="node /Users/ryan/Code/Alphacamper/alphacamper-api/scripts/camis_browser_fetch.cjs"
PROVIDER_BROWSER_AVAILABILITY_COMMAND="node /Users/ryan/Code/Alphacamper/alphacamper-api/scripts/camis_availability_session.cjs"
```

Directory sync is incremental for CAMIS-backed providers. That means the admin can refresh campground lists on a slower timer, while customer-facing availability checks stay fast.

## Current Scope

Implemented in this first pass:
- FastAPI app scaffold and health route.
- SQLAlchemy models and initial Alembic migration.
- Repository layer and `/v1` read routes.
- Explicit campground search and notices endpoints.
- Campflare-style bulk availability shape and richer alert metadata/webhook payload structure.
- Initial provider clients for RIDB, NPS, Recreation.gov, Parks Canada, and GoingToCamp.
- Celery-backed polling path for Recreation.gov and CAMIS-family providers.
- Notification delivery history plus signed webhooks.
- Resend-backed email alert delivery and alert update operations.
- Provider directory endpoint plus batch polling scheduler/backoff helpers.
- Official NWS weather-alert ingestion path for notices.

Still needs manual verification:
- RIDB and NPS with real API keys.
- Parks Canada and other WAF-protected domains with a real session bootstrap.
- Domain-by-domain validation for non-CAMIS GoingToCamp systems.
- Broader open-data imports for boundaries, cell coverage, and non-booking discovery layers.

## Demo Flow

Seed a live Recreation.gov campground and run one end-to-end poll:

```bash
source .venv/bin/activate
python scripts/seed_recgov_demo.py
python scripts/run_recgov_demo.py
```

Run one Parks Canada poll:

```bash
source .venv/bin/activate
python scripts/run_parks_canada_demo.py
```

Run one BC Parks poll:

```bash
source .venv/bin/activate
python scripts/run_bc_parks_demo.py
```

Run one Ontario Parks poll:

```bash
source .venv/bin/activate
python scripts/run_ontario_parks_demo.py
```

Register the broader known GoingToCamp domains, and optionally seed them from curated JSON catalogs:

```bash
source .venv/bin/activate
python scripts/run_goingtocamp_seed_sync.py /abs/path/to/goingtocamp-seeds
```

Enrich the directory from a StatsCan ODRSF-style CSV:

```bash
source .venv/bin/activate
python scripts/run_open_data_enrichment.py /abs/path/to/odrsf.csv BC
```

Run the province boundary/meta enrichment helpers:

```bash
source .venv/bin/activate
python scripts/run_boundary_enrichment.py /abs/path/to/bc_parks.geojson /abs/path/to/ontario_parks.csv BC
python scripts/run_boundary_enrichment.py /abs/path/to/bc_parks.geojson /abs/path/to/ontario_parks.csv ON
```

## Public API Snapshot

- `GET /v1/campgrounds`
- `GET /v1/campgrounds/search`
- `GET /v1/campgrounds/{id}`
- `GET /v1/parks`
- `GET /v1/parks/{id}`
- `POST /v1/campgrounds/availability`
- `GET /v1/campsites`
- `GET /v1/campsites/{id}`
- `GET /v1/availability`
- `POST /v1/alerts`
- `GET /v1/alerts/{id}`
- `PATCH /v1/alerts/{id}`
- `DELETE /v1/alerts/{id}`
- `GET /v1/alerts/{id}/deliveries`
- `GET /v1/notices`
- `GET /v1/providers`
- `GET /v1/coverage`
- `POST /v1/admin/catalog-refresh-jobs`
- `GET /v1/admin/catalog-refresh-jobs`
- `GET /v1/admin/catalog-refresh-jobs/{id}`

`/v1/providers` and `/v1/coverage` now expose a simple provider quality view:
- `availability_mode`: `live_polling`, `directory_only`, or `metadata_only`
- `confidence`: `verified`, `inferred`, `seeded`, or `unknown`

## Delivery Notes

- Webhooks are signed with `X-Alphacamper-Signature` when `WEBHOOK_SIGNING_SECRET` is set.
- Email alerts are sent through Resend when `RESEND_API_KEY` is configured.
- Every webhook or email attempt is stored in `notification_deliveries`.
- `availability.poll_due` queues the next batch using hot-campground priority, active alert counts, and provider backoff state.

## Coverage Expansion Notes

- `sync_known_goingtocamp_providers` now registers the major white-label Canadian domains we want next.
- Each domain can be fed with a curated seed file named like `<domain>.json`.
- The live CAMIS-backed Ontario regional hosts now upgrade curated seed rows into real pollable campgrounds when the public domain is reachable.
- Seed files support:
  - `parks`: logical park rows
  - `campgrounds`: bookable campground rows with known map IDs and booking URLs
- Example seed structure: [examples/goingtocamp-seed.example.json](./examples/goingtocamp-seed.example.json)
- Suggested seed folder layout: [examples/goingtocamp-seeds/README.md](./examples/goingtocamp-seeds/README.md)
- Open-data enrichment can now attach StatsCan-style rows and GeoJSON source metadata onto existing parks and campgrounds.
- BC boundary enrichment now supports storing official park polygons in `boundary_geom`.
- Ontario boundary enrichment currently uses the regulated-park CSV metadata path because the mirrored GeoJSON export is flaky.
- Parks and coverage are now first-class read endpoints so the site and admin tools can understand discovery breadth, not just individual campgrounds.

## Catalog Refresh Jobs

Best practice:
- create a tracked refresh job first
- let a trusted runner process it
- then inspect the job result instead of trusting a terminal scrollback

The admin job flow is:

1. Create a queued job with the admin API key.
2. Run the job processor from a trusted machine that has access to the source catalog database.
3. Inspect the finished job in the admin API.

Queue a job:

```bash
curl -X POST https://alphacamper-api-production.up.railway.app/v1/admin/catalog-refresh-jobs \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: $ADMIN_API_KEY" \
  -d '{"mode":"promote_local_catalog","requested_by":"ryan","source_label":"local-postgis"}'
```

Process the next queued job:

```bash
source .venv/bin/activate
export DATABASE_URL="postgresql+psycopg://...target-production-db..."
export SOURCE_DATABASE_URL="postgresql+psycopg://...source-catalog-db..."
python scripts/process_catalog_refresh_jobs.py
```

Inspect recent jobs:

```bash
curl https://alphacamper-api-production.up.railway.app/v1/admin/catalog-refresh-jobs \
  -H "X-Admin-Key: $ADMIN_API_KEY"
```
