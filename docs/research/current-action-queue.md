# Current Action Queue

Last updated: 2026-05-09

This is the short operational queue for the control tower.

Each item below should be launched as its own large goal in a separate window. Do not combine them unless the control tower explicitly decides to merge scopes.

Goal-window rule:

- One window = one big objective.
- The window keeps working until the objective is proven, or until it hits a real blocker.
- The report back must include evidence, counts where relevant, risks, and the recommended next action.

## Current Gate

### 1. Production Worker Smoke

Current status:

- Code is locally verified, live data is refreshed, and the site deploy is live.
- Railway worker runtime still needs heartbeat proof.
- Production provider-quality now exposes live Supabase truth and reports the missing worker heartbeat.
- Thread heartbeat automation `alphacamper-worker-heartbeat-watch` now reruns production smoke every 30 minutes.

Launch status:

- Ready now after the site deploy went live.

Goal objective:

- Prove the alert worker runtime now matches the new catalog truth.

Why this is first:

- The site path is live, but the worker heartbeat is not yet visible in Supabase.
- We should not market new alert coverage until the worker path is proven.

Done means:

- `alphacamper.com/api/check-availability` returns the retired Railway-worker message. Done.
- Vercel no longer has the alert polling cron. Done.
- Railway worker owns BC, Ontario, Parks Canada, GoingToCamp providers, New Brunswick, and Recreation.gov.
- New Brunswick can be searched and watched as alertable.
- Manitoba and Nova Scotia show as search-only, not alertable.
- A real authenticated watch-creation smoke test confirms unsupported/search-only rows do not create misleading alerts.

Current result:

- Local verification is green: worker tests/build, site tests/build, and `git diff --check`.
- Live schema is green.
- Live catalog refresh is green for six providers.
- Live site deploy is green: `/api/check-availability` returns 410 retired.
- Live catalog API now returns evidence fields for Bamberton and Sugarloaf.
- Worker heartbeat fix is pushed at `d7464921c` and CI is green.
- Live `https://alphacamper.com/api/admin/provider-quality` now returns `fetchedFrom: live_supabase`.
- The same production route reports 5 active watches and `railway_worker` degraded with `missing_worker_heartbeat`.
- Supabase `worker_status` still returns no heartbeat rows after the fix.
- GitHub deployment metadata shows the push deployed to Vercel, not proof of Railway worker deployment.
- Railway CLI is not authenticated in this shell.

Next action:

- Get Railway deploy/runtime access or confirm the worker service is running.
- Verify `worker_status` heartbeat and `/health` output if a public/internal worker URL exists.
- Smoke-test the customer path once the worker heartbeat is real.
- Intake heartbeat reports from `alphacamper-worker-heartbeat-watch`; do not mark this gate green until smoke is green and notification proof exists.

Use runbook for evidence:

- `docs/research/railway-worker-smoke-runbook.md`.
- `cd alphacamper-worker && npm run smoke:railway`.
- `cd alphacamper-worker && npm run smoke:production`.
- `docs/research/customer-watch-notification-smoke-runbook.md` after worker heartbeat is green.
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
- Keep the live provider-quality route wired into the operator/admin experience.
- Get campsite-level counts for alertable providers; do not use campground-row counts as the 50k success metric.

### 3. Alert Engine Cleanup

Launch status:

- Integrated in code 2026-05-09; live site route is deployed, Railway worker heartbeat proof pending.

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
- Production site deploy is proven.
- Production provider-quality reports live Supabase truth and flags the missing Railway worker heartbeat.
- Railway worker runtime still needs deploy/smoke proof.

Next action:

- Verify Railway worker health includes Recreation.gov.

## Next Big Runs

These should be separate goal windows when launched.

### 4. Billing Truth And Revenue Reporting

Goal objective:

- Make the $10k summer revenue goal measurable and trustworthy.

Why it matters:

- The product goal is not only more coverage. Campers need to pay, create watches, receive alerts, and believe Alphacamper improves their odds of getting a site.

Current truth:

- Checkout copy says the passes are one-time.
- `/api/checkout` currently uses Stripe subscription mode.
- The latest live Supabase aggregate read could not find the expected `subscriptions` or `funnel_events` tables.
- Stripe is the current money source of truth until the app database reporting path is fixed or intentionally replaced by Stripe-only reporting.

Next action:

- Decide one-time payment vs subscription, align checkout and copy, verify live billing storage/reporting, and build a simple operator revenue scoreboard.

Use runbook for framing:

- `docs/research/summer-revenue-scoreboard.md`.

### 5. Alberta/Saskatchewan Adapter Sprint

Goal objective:

- Build the shared adapter proof for Alberta first, then Saskatchewan.

Why it matters:

- These are the biggest visible Canada parity gaps after BC/Ontario/Parks Canada.

Current truth:

- Alberta and Saskatchewan are searchable roadmap targets, not alertable product coverage yet.
- Provider proof suggests they likely share an Aspira/ReserveAmerica-style adapter shape.

### 6. Provider Health/Admin Truth

Goal objective:

- Give operators a clear view of alertable, search-only, stale, and broken providers.

Why it matters:

- A tier-one alert product needs to know when a provider silently goes bad.

Current truth:

- `catalog_provider_syncs` now records provider refresh status.
- Worker health exists, but an admin-facing view is not proven.

### 7. Demand Capture And Conversion

Goal objective:

- Turn unsupported and search-only interest into a prioritization queue and revenue path.

Why it matters:

- The $10k summer revenue goal needs paid camper outcomes, not only infrastructure.

Current truth:

- Unsupported searches are not yet a strong prioritization signal.
- The product still needs clearer "we can help you get this site" flows.
- This should build on the revenue scoreboard so demand work is measured against paid conversion and booking outcomes.

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
