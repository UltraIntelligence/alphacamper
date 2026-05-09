# Current Action Queue

Last updated: 2026-05-09

This is the short operational queue for the control tower.

Current external blockers are grouped in `Control Tower: Reliability + Revenue Gates`:

https://github.com/UltraIntelligence/alphacamper/milestone/1

Current next-epic trackers are grouped in `Control Tower: Next Epic Runs`:

https://github.com/UltraIntelligence/alphacamper/milestone/2

Each item below should be launched as its own large goal in a separate window. Do not combine them unless the control tower explicitly decides to merge scopes.

Goal-window rule:

- One window = one big objective.
- The window keeps working until the objective is proven, or until it hits a real blocker.
- The report back must include evidence, counts where relevant, risks, and the recommended next action.

GitHub tracker map:

| Order | Tracker | Reasoning | Launch status |
|---:|---|---|---|
| 1 | [#9 Production worker heartbeat](https://github.com/UltraIntelligence/alphacamper/issues/9) | High | Active blocker |
| 2 | [#10 Stripe production checkout and revenue proof](https://github.com/UltraIntelligence/alphacamper/issues/10) | High | Active blocker |
| 3 | [#19 Demand capture and conversion path](https://github.com/UltraIntelligence/alphacamper/issues/19) | High | Safe parallel revenue-intent lane; do not call revenue or reliability green |
| 4 | [#16 First paid cohort sprint](https://github.com/UltraIntelligence/alphacamper/issues/16) | High | Hold until #10 is green; launch cautiously if #9/#13 are still yellow |
| 5 | [#13 Customer watch and notification delivery](https://github.com/UltraIntelligence/alphacamper/issues/13) | High | Hold until #9 is green |
| 6 | [#18 Manitoba/Nova Scotia label sync](https://github.com/UltraIntelligence/alphacamper/issues/18) | High | Hold until #9 is green; do not market reliability until #13 is green |
| 7 | [#11 Provider health and admin truth loop](https://github.com/UltraIntelligence/alphacamper/issues/11) | High | Hold until #9 is green |
| 8 | [#15 Get-you-the-site paid assist loop](https://github.com/UltraIntelligence/alphacamper/issues/15) | Extra high | Hold until #9, #10, and #13 are green |
| 9 | [#17 Canada parity expansion](https://github.com/UltraIntelligence/alphacamper/issues/17) | Extra high | Hold until #9 and #13 are green |
| 10 | [#12 Alberta and Saskatchewan adapter discovery](https://github.com/UltraIntelligence/alphacamper/issues/12) | Extra high | Closed discovery; implementation waits for reliability gates |
| 11 | [#14 Parks Canada province and customer coverage](https://github.com/UltraIntelligence/alphacamper/issues/14) | High | Closed; live province search and six province pages verified |

## Current And Recent Epic Windows

Current and recent goal windows from the control tower on 2026-05-09:

| Agent | Reasoning | Objective | Current control-tower status |
|---|---|---|---|
| Linnaeus | High | Worker Reliability Gate Captain | Reported yellow/blocked; Railway/operator access required; no patch |
| Darwin | High | Revenue Gate Captain | Reported yellow; checkout webhook proof hardening landed in `28336c0a6` |
| Epicurus | High | Product Moat Captain | Reported yellow; next goal-window order confirmed |
| Jason | Extra high | 50k Canada Gap Sprint | Reported green inventory proof; repo-side patch complete |
| Ohm | Extra high | 50k Verified Campsite Coverage Proof | Reported green inventory proof; verified and integrated |
| Pauli | High | Revenue Readiness Toward $10k Summer Target | Reported yellow; verified and integrated |
| Tesla | High | Production Ops Reliability And Railway Heartbeat Clarity | Reported yellow/blocked; verified and integrated |
| Curie | Extra high | "Get You The Site" Product Moat Plan | Reported yellow product proof; strategy integrated |
| Russell | Extra high | Alberta/Saskatchewan Adapter Discovery Follow-up | Reported yellow; verified and integrated |
| Ampere | High | Parks Canada Province And Customer Coverage Enrichment | Reported yellow; verified and integrated |

Previous windows launched from the control tower on 2026-05-09:

| Agent | Reasoning | Objective | Current control-tower status |
|---|---|---|---|
| Maxwell | Extra high | Alberta/Saskatchewan Adapter Sprint | Reported yellow; discovery intaken and closed; live implementation waits for #9/#13 |
| Feynman | Extra high | Realtime Campsite Inventory Count Proof | Superseded by Ohm/Jason's verified 51,997 count |
| Noether | High | Production Worker Heartbeat Recovery | Reported yellow; heartbeat hardening landed |
| Nash | High | Customer Watch And Notification Smoke | Reported yellow; read-only helper verified; held until Railway heartbeat is green |
| Descartes | High | Demand Capture And Search-Only Revenue Path | Reported green for public demand proof; intaken into #19; protected operator proof pending |

Report-back rule:

- Do not merge an agent result just because code changed.
- First check the stated evidence, run the relevant tests/smokes, and keep customer-facing claims yellow until live proof exists.
- If multiple agents touch overlapping files, reconcile manually and preserve the narrowest safe change.

## Current Gate

### 1. Production Worker Smoke

Current status:

- Code is locally verified, live data is refreshed, and the site deploy is live.
- Railway worker runtime still needs heartbeat proof.
- Production provider-quality now exposes live Supabase truth and reports the missing worker heartbeat.
- Thread heartbeat automation `alphacamper-worker-heartbeat-watch` now reruns worker reliability smoke and billing readiness smoke every 30 minutes. It comments on #9 or #10 only when the matching gate changes, turns green, or reveals a new blocker.

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
- Manitoba and Nova Scotia stay search-only on production until the new repo-side alertable/live-polling profile is deployed and synced.
- A real authenticated watch-creation smoke test confirms unsupported/search-only rows do not create misleading alerts.

Current result:

- Local verification is green: worker tests/build, site tests/build, and `git diff --check`.
- Live schema is green.
- Live catalog refresh is green for six providers.
- Live site deploy is green: `/api/check-availability` returns 410 retired.
- Live catalog API now returns evidence fields for Bamberton and Sugarloaf.
- Worker heartbeat fix is pushed, and latest main CI is green in GitHub Actions.
- Live `https://alphacamper.com/api/admin/provider-quality` now returns `fetchedFrom: live_supabase`.
- The same production route reports 5 active watches split across `bc_parks:4` and `ontario_parks:1`, with `railway_worker` degraded by `missing_worker_heartbeat`.
- Supabase `worker_status` still returns no heartbeat rows after the fix.
- GitHub deployment metadata shows the push deployed to Vercel, not proof of Railway worker deployment.
- Railway CLI is not authenticated in this shell.
- Repo now includes `alphacamper-worker/railway.json` to make the worker's Railway build/deploy settings explicit.
- Worker health now listens on Railway's `PORT` when provided, with `8080` as the fallback.
- `npm run smoke:railway -- --allow-blocked` now prints live production heartbeat proof before Railway auth/log checks.
- Latest verified worker smoke at 2026-05-09T16:27:19Z remains yellow: active watches 5, active watch split `bc_parks:4` and `ontario_parks:1`, total alerts 0, delivered alerts 0, worker degraded with `missing_worker_heartbeat`, no Supabase heartbeat, and missing worker platforms `bc_parks`, `ontario_parks`, `parks_canada`, `gtc_new_brunswick`, and `recreation_gov`.
- Latest Railway diagnostic at 2026-05-09T16:27:19Z remains blocked from this shell: live proof is yellow and Railway auth is not authenticated.
- GitHub tracker: https://github.com/UltraIntelligence/alphacamper/issues/9

Next action:

- Get Railway deploy/runtime access or confirm the worker service is running.
- Confirm Railway service root directory is `/alphacamper-worker` and config file path is `/alphacamper-worker/railway.json` if it is not auto-detected.
- Verify `worker_status` heartbeat and `/health` output if a public/internal worker URL exists.
- Smoke-test the customer path once the worker heartbeat is real.
- Intake heartbeat reports from `alphacamper-worker-heartbeat-watch`; do not mark this gate green until worker smoke is green and notification proof exists.

Use runbook for evidence:

- `docs/research/control-tower-operator-unblock-pack.md`.
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
- Counts stay separated between searchable rows, alertable campground rows, and provider-inventory campsite IDs.

Current result:

- Live known catalog rows: 464.
- Live customer-searchable rows: 461.
- Verified alertable campground rows: 396 live; 461 repo-ready after Manitoba and Nova Scotia sync.
- Verified provider-inventory campsite IDs: 51,997 from provider availability-matrix proof across BC Parks, Ontario Parks, Parks Canada, New Brunswick, Manitoba, and Nova Scotia.
- Provider campsite counts: BC Parks 10,410; Ontario Parks 21,640; Parks Canada 11,336; New Brunswick 1,431; Manitoba 5,480; Nova Scotia 1,700.
- The first 50,000 Canada inventory line is crossed by 1,997 campsite IDs.
- Search-only campground rows: 65 live; 0 after the Manitoba and Nova Scotia sync.
- Unsupported stale rows: 3.

Next action:

- Add recurring provider refresh and an admin-facing provider health view.
- Keep the live provider-quality route wired into the operator/admin experience.
- Deploy/sync the Manitoba and Nova Scotia catalog-label update; do not use campground-row counts as the 50k success metric.
- Keep reliability yellow until Railway heartbeat, active watch polling, alert creation, and notifications are proven.
- Use `docs/research/control-tower-operator-unblock-pack.md` for the current unblock plan: Railway heartbeat and Stripe setup can move in parallel; notification proof and Manitoba/Nova Scotia live-label sync wait on worker reliability.

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

## Active And Held Runs

These should be separate goal windows when launched.

### 4. Billing Truth And Revenue Reporting

Goal objective:

- Make the $10k net summer revenue goal measurable and trustworthy.

Why it matters:

- The product goal is not only more coverage. Campers need to pay, create watches, receive alerts, and believe Alphacamper improves their odds of getting a site.

Launch status:

- Relaunched as Pauli on 2026-05-09.

Current truth:

- Checkout copy says the passes are one-time.
- `/api/checkout` now uses Stripe one-time payment mode in code.
- Live Supabase now has `subscriptions`, `stripe_webhook_events`, and `funnel_events`.
- The protected operator revenue-quality view is built in the site dashboard for allowlisted operator accounts.
- The live tables currently have 0 billing/conversion rows.
- Production Vercel is missing Stripe env vars, so live checkout still cannot be called green.
- `npm run smoke:billing -- --allow-yellow` now reports paid active passes, summer/year split, payment-mode pass count, gross app-recorded revenue, checkout/webhook proof, and net/refund reporting state.
- Billing smoke now requires a real one-time payment-mode pass plus a recorded `checkout.session.completed` webhook row; legacy subscription-style evidence cannot make the gate green.
- Latest verified billing smoke at 2026-05-09T16:27:19Z is yellow: 0 paid active passes, 0 summer passes, 0 year passes, 0 payment-mode passes, no gross app revenue, 0 funnel events, 0 webhook events, 0 checkout-completed webhooks, no checkout/webhook proof, net/refund reporting not verified, and the five production Stripe env vars missing.
- Direct `vercel env list production` confirms the five missing names are not configured in production.
- The available Stripe connector is currently logged into the Superpress Stripe account (`acct_1NpT2lFVQSJKvEIh`), not an obvious Alphacamper account, so do not create or reuse Stripe products from that connector without confirming the correct account first.
- `docs/research/revenue-readiness-runbook.md` defines the first-paid-customer proof path without doing a fake live-money charge.
- GitHub tracker: https://github.com/UltraIntelligence/alphacamper/issues/10

Next action:

- Confirm the correct Alphacamper Stripe account, configure production Stripe env vars and one-time live prices, create the production webhook for `checkout.session.completed`, prove one approved live checkout/webhook path, and wire net/refund reporting from Stripe into the operator revenue-quality view.

Use runbook for framing:

- `docs/research/summer-revenue-scoreboard.md`.
- `cd alphacamper-site && npm run smoke:billing`.
- Protected app route: `/api/admin/revenue-quality`.

### 5. Alberta/Saskatchewan Adapter Sprint

Goal objective:

- Future-only: build live polling for Alberta first, then Saskatchewan, after reliability gates are green.

Why it matters:

- These are the biggest visible Canada parity gaps after BC/Ontario/Parks Canada.

Current truth:

- Russell reported back and the control tower verified the core finding.
- Alberta and Saskatchewan are searchable roadmap targets, not alertable product coverage yet.
- Live Alberta directory fetch returned `resultTotal = 109` for contract `ABPP`.
- Live Saskatchewan directory fetch returned `resultTotal = 24` for contract `SKPP`.
- Worker-side parser proof confirms they share an Aspira/ReserveAmerica-style directory and calendar shape.
- `alphacamper-worker/src/aspira.ts` registers both providers as `search_only`.
- They are intentionally not in active worker `SUPPORTED_PLATFORMS` yet, so customers cannot be misled into live alerts.
- `npm test -- aspira.test.ts` passes with 6 tests.
- Intake artifact: `docs/research/alberta-saskatchewan-adapter-intake-2026-05-09.md`.
- Tracker #12 is closed as discovery-complete; this should not be relaunched until the scope is live implementation after #9/#13 are green.

Next action:

- Do nothing here until #9 and #13 are green.
- Then turn the parser proof into a live polling implementation.
- Then prove a controlled watch, provider poll, alert row, and customer notification before upgrading labels from search-only to alertable.

### 6. Get You The Site Moat

Launch status:

- Launched as Curie on 2026-05-09; reported back and integrated.

Goal objective:

- Turn Alphacamper's distinction into product work that helps campers actually get the site, not only hear that a site exists.

Why it matters:

- This is the difference between a plain alert tool and a product regular campers will pay for and trust.

Current truth:

- The repo already has alerts, watch creation, and a Chrome extension with autofill/rehearsal pieces.
- `docs/research/get-the-site-moat-plan.md` now ranks the moat around alert-to-official-review handoff.
- Launch-critical moat features are alert-to-assist handoff, saved booking details, safe review-step handoff, rehearsal, honest coverage, outcome tracking, and paid-pass confidence.
- Product proof is still yellow until one paid BC/Ontario alert-to-assist loop is proven.

Next action:

- After Railway heartbeat, customer notification proof, and billing truth are unblocked, prove one full paid loop: paid watch, extension connected, details saved, alert received, tap alert, official booking page opened, assist started, and review-ready state reached.

### 7. Provider Health/Admin Truth

Goal objective:

- Give operators a clear view of alertable, search-only, stale, and broken providers.

Why it matters:

- A tier-one alert product needs to know when a provider silently goes bad.

Current truth:

- `catalog_provider_syncs` now records provider refresh status.
- Worker health exists, but an admin-facing view is not proven.

### 8. Demand Capture And Conversion

Goal objective:

- Turn unsupported and search-only interest into a prioritization queue and revenue path.

Why it matters:

- The $10k net summer revenue goal needs paid camper outcomes, not only infrastructure.

Current truth:

- Search-only, coming-soon, and unsupported campground selections now have a built and deployed email capture path.
- The live route was proven with a synthetic row and the test row was deleted after verification.
- The product still needs clearer "we can help you get this site" flows.
- This should build on the revenue scoreboard so demand work is measured against paid conversion and booking outcomes.

Current intake:

- Demand capture is green as a campground-interest signal.
- Repo-side operator visibility is now built into the protected revenue-quality view and deployed route shape is live: `campground_interest` is aggregated into total requests, unique requested campgrounds, seven-day requests, support-status mix, platform mix, and top requested campground rows without exposing customer emails.
- Live demand smoke is green as of 2026-05-09T15:24:48Z: `npm run smoke:demand` posted one controlled `coming_soon` request through `alphacamper.com/api/campground-interest`, verified the row in the aggregate, and deleted it.
- Production `OPERATOR_EMAIL_ALLOWLIST` exists, so the remaining proof is an approved operator session/token, not missing production config.
- `npm run smoke:demand` now accepts `ALPHACAMPER_ACCESS_TOKEN=...` to verify the protected `/api/admin/revenue-quality` demand queue while the controlled test row exists, then clean it up.
- It must not be described as realtime alert coverage.
- The captured signal is campground-level interest, not a paid conversion yet.
- Tracker #19 now owns the next step: use an approved operator account/token to prove the protected dashboard panel or API renders the demand queue from live data.

## Completed And Closed

### 9. Parks Canada Enrichment

Goal objective:

- Make Parks Canada rows useful for province search and honest province coverage pages without guessing.

Current result:

- Ampere reported back and the control tower verified the core finding.
- Repo patch is implemented: worker catalog ingestion derives province from official URL paths, and the site API expands full province names to stored province codes.
- Live one-provider sync completed: 113 Parks Canada rows now have province; 2 unsupported stale rows remain null province instead of guessed.
- Live customer searches for `Alberta`, `Prince Edward Island`, `Saskatchewan`, and `New Brunswick` return province-matched Parks Canada rows.
- Six production province pages are live and in the sitemap.
- Tracker #14 is closed.
- Intake artifact: `docs/research/parks-canada-enrichment-intake-2026-05-09.md`.

Next action:

- Do not relaunch unless the scope changes. Reliability claims still belong to #9/#13.

## Report-Back Rule

When a window finishes, paste the report into this thread and update:

- `docs/research/control-tower-status-board.md`
- `docs/research/current-action-queue.md`

Only update strategy docs if the report changes the recommended order or product truth.
