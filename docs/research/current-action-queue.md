# Current Action Queue

Last updated: 2026-05-09

This is the short operational queue for the control tower.

Each item below should be launched as its own large goal in a separate window. Do not combine them unless the control tower explicitly decides to merge scopes.

Goal-window rule:

- One window = one big objective.
- The window keeps working until the objective is proven, or until it hits a real blocker.
- The report back must include evidence, counts where relevant, risks, and the recommended next action.

## Current Gate

### 1. Production Deploy Smoke

Current status:

- Code is locally verified and live data is refreshed.
- Production still needs the updated site and worker deployed and smoke-tested.

Launch status:

- Ready now after Canada Provider Proof, Alert Engine Cleanup, and Catalog Ingestion Factory reported back.

Goal objective:

- Prove the customer-facing product and alert worker now match the new catalog truth.

Why this is first:

- The database is ahead of the deployed app until the site/worker code lands.
- We should not market new alert coverage until the production path is proven.

Done means:

- `alphacamper.com/api/check-availability` returns the retired Railway-worker message.
- Vercel no longer has the alert polling cron.
- Railway worker owns BC, Ontario, Parks Canada, GoingToCamp providers, New Brunswick, and Recreation.gov.
- New Brunswick can be searched and watched as alertable.
- Manitoba and Nova Scotia show as search-only, not alertable.
- A real authenticated watch-creation smoke test confirms unsupported/search-only rows do not create misleading alerts.

Current result:

- Local verification is green: worker tests/build, site tests/build, and `git diff --check`.
- Live schema is green.
- Live catalog refresh is green for six providers.
- Live code deploy is not yet proven in production.

Next action:

- Commit and push the integrated work.
- Watch the site and worker deploys.
- Smoke-test the customer path and worker health.

Use runbook for evidence:

- `docs/research/live-catalog-migration-runbook.md`.
- Use `docs/research/live-catalog-verification.sql` for repeat checks.

### 2. Live Catalog Truth

Launch status:

- Integrated 2026-05-09.

Goal objective:

- Keep the live catalog honest as coverage grows.

Why this result matters:

- Searchable coverage helps customers discover parks, but alertable coverage is what we can charge trust around.

Done means:

- Every row has support status, source evidence, availability mode, confidence, and last verified date.
- Stale rows are downgraded instead of marketed.
- Counts stay separated between searchable rows, alertable campground rows, and realtime-alertable campsite inventory.

Current result:

- Live known catalog rows: 464.
- Live customer-searchable rows: 461.
- Verified alertable campground rows: 396.
- Search-only campground rows: 65.
- Unsupported stale rows: 3.

Next action:

- Add recurring provider refresh and an admin-facing provider health view.
- Get campsite-level counts for alertable providers; do not use campground-row counts as the 50k success metric.

### 3. Alert Engine Cleanup

Launch status:

- Integrated in code 2026-05-09; production deploy proof pending.

Goal objective:

- Make Railway worker the one real alert engine.

Why this result matters:

- Customers should not have hidden differences between alert engines.

Done means:

- Recreation.gov is checked by Railway worker.
- Vercel cron is retired.
- Alerts are not double-polled.
- Worker health tells us when a provider is stale or broken.

Current result:

- Code now moves Recreation.gov into Railway worker.
- Code retires `/api/check-availability`.
- Code removes the Vercel cron schedule.
- Local verification passed.
- Production still needs deploy/smoke proof.

Next action:

- After deploy, verify `/api/check-availability` returns 410 retired and Railway worker health includes Recreation.gov.

## Next Big Runs

These should be separate goal windows when launched.

### 4. Alberta/Saskatchewan Adapter Sprint

Goal objective:

- Build the shared adapter proof for Alberta first, then Saskatchewan.

Why it matters:

- These are the biggest visible Canada parity gaps after BC/Ontario/Parks Canada.

Current truth:

- Alberta and Saskatchewan are searchable roadmap targets, not alertable product coverage yet.
- Provider proof suggests they likely share an Aspira/ReserveAmerica-style adapter shape.

### 5. Provider Health/Admin Truth

Goal objective:

- Give operators a clear view of alertable, search-only, stale, and broken providers.

Why it matters:

- A tier-one alert product needs to know when a provider silently goes bad.

Current truth:

- `catalog_provider_syncs` now records provider refresh status.
- Worker health exists, but an admin-facing view is not proven.

### 6. Demand Capture And Conversion

Goal objective:

- Turn unsupported and search-only interest into a prioritization queue and revenue path.

Why it matters:

- The $10k summer revenue goal needs paid camper outcomes, not only infrastructure.

Current truth:

- Unsupported searches are not yet a strong prioritization signal.
- The product still needs clearer "we can help you get this site" flows.

## Run When Source Data Is Chosen

### 7. Parks Canada Enrichment

Goal objective:

- Make Parks Canada rows useful for province search and honest province coverage pages without guessing.

Why it waits:

- We should not guess province/source metadata.

Use prompt:

- `docs/research/epic-launch-prompts.md` → Prompt 6.

## Report-Back Rule

When a window finishes, paste the report into this thread and update:

- `docs/research/control-tower-status-board.md`
- `docs/research/current-action-queue.md`

Only update strategy docs if the report changes the recommended order or product truth.
