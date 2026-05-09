# Alphacamper Epic Launch Prompts

Last updated: 2026-05-09

Use these prompts to launch separate long-running goal windows. Paste each report back into the control-tower thread when it finishes.

## Goal Window Rule

Each prompt below is meant to become its own large goal.

Do not treat these as small one-step tasks. The window should keep working until it has either:

- completed the full goal with evidence, or
- hit a real blocker and can explain exactly what is needed next.

The report back should be strong enough for the control tower to update customer truth, counts, status, and next action without redoing the whole investigation.

## Reasoning Level Guidance

Budget posture: assume Ryan is prioritizing quality and category-winning decisions over saving compute.

Use extra-high reasoning for:

- Phase 2 Live Catalog Fix.
- Alert Engine Truth Audit.
- North America Provider Roadmap.
- Catalog Ingestion Factory.
- Alberta/Saskatchewan Adapter Sprint.
- Paid Alert-To-Assist Moat Proof.
- Canada Parity Expansion after reliability proof.

Use high reasoning for:

- Production Worker Smoke.
- Customer Watch And Notification Smoke.
- Billing Truth And Revenue Reporting.
- First Paid Cohort Sprint.
- Manitoba/Nova Scotia Label Sync.
- Canada Coverage Sprint.
- Parks Canada Enrichment.
- Provider Health/Admin Truth.
- Demand Capture And Conversion.

Use medium or lower only for narrow follow-up chores like formatting docs, recounting known files, or small copy changes.

North-star metric:

- First success line: 50,000 verified realtime-alertable Canadian campsites.
- Current provider-inventory proof: 51,997 verified campsite IDs from provider availability-matrix responses across BC Parks, Ontario Parks, Parks Canada, New Brunswick, Manitoba, and Nova Scotia.
- Longer-term leadership line: 250,000 to 350,000+ realtime-alertable North American campsites.
- Search-only, coming-soon, unverified seed, and static fallback rows do not count toward realtime success.
- Reliability is still yellow until Railway heartbeat, active watch polling, alert creation, and notification delivery are proven.
- Business success line: $10k net collected revenue by the end of summer.

## Current Launch State

Already reported back and intaken:

1. Phase 2 Live Catalog Fix: yellow after live migration and search verification.
2. Alert Engine Truth Audit: yellow.
3. North America Provider Roadmap: yellow.
4. Canada Provider Proof: yellow; New Brunswick alertable, Manitoba/Nova Scotia repo-ready, Alberta/Saskatchewan discovery closed with live implementation waiting for reliability gates.
5. Alert Engine Cleanup: yellow until Railway worker runtime proof.
6. Catalog Ingestion Factory: yellow until recurring ops/admin health are proven.
7. 50k Canada Gap Sprint: green for provider-inventory proof; reliability still yellow.
8. Billing Truth And Revenue Reporting: yellow until Stripe production envs, webhook proof, and net/refund truth are green.
9. Get You The Site Moat: yellow product proof; strategy is integrated but one paid alert-to-assist loop still needs proof.

Do not relaunch those same windows unless the scope changes.

Next recommended windows:

1. Production Worker Smoke. High reasoning. Tracker: https://github.com/UltraIntelligence/alphacamper/issues/9. Launch/continue now; likely blocked on Railway access.
2. Billing Truth And Revenue Reporting. High reasoning. Tracker: https://github.com/UltraIntelligence/alphacamper/issues/10. Continue after the correct Alphacamper Stripe account and production Vercel env vars are confirmed.
3. Demand Capture And Conversion. High reasoning. Tracker: https://github.com/UltraIntelligence/alphacamper/issues/19. Safe parallel revenue-intent lane; do not call revenue or reliability green.
4. First Paid Cohort Sprint. High reasoning. Tracker: https://github.com/UltraIntelligence/alphacamper/issues/16. Launch after #10 is green enough to take payment safely; measure 10-25 real paid passes against Stripe, app DB, watches, alerts, refunds, and net revenue.
5. Customer Watch And Notification Smoke. High reasoning. Tracker: https://github.com/UltraIntelligence/alphacamper/issues/13. Hold until worker heartbeat is green.
6. Manitoba/Nova Scotia Label Sync. High reasoning. Tracker: https://github.com/UltraIntelligence/alphacamper/issues/18. Hold until worker heartbeat is green; do not market reliability until notification proof is green.
7. Provider Health/Admin Truth. High reasoning. Tracker: https://github.com/UltraIntelligence/alphacamper/issues/11. Hold until live worker heartbeat creates real provider health data.
8. Paid Alert-To-Assist Moat Proof. Extra-high reasoning. Tracker: https://github.com/UltraIntelligence/alphacamper/issues/15. Hold until #9, #10, and #13 are green.
9. Canada Parity Expansion. Extra-high reasoning. Tracker: https://github.com/UltraIntelligence/alphacamper/issues/17. Hold until reliability and notification proof are green; keep new providers search-only until watch, poll, alert, and notification proof exists.

Closed or future-only scopes:

1. Alberta/Saskatchewan Adapter Sprint. Tracker: https://github.com/UltraIntelligence/alphacamper/issues/12. Discovery is closed; live implementation waits for #9/#13.
2. Parks Canada Enrichment. Tracker: https://github.com/UltraIntelligence/alphacamper/issues/14. Closed after live province search and six production province pages were verified; do not relaunch unless the scope changes.

## Prompt 1: Phase 2 Live Catalog Fix

```text
Act as an Alphacamper goal window.

Objective:
Apply and verify the Phase 1 Supabase migration for Alphacamper. Confirm the live campgrounds table has support_status, provider_key, source_url, and last_verified_at. Verify /api/campgrounds works against live Supabase and safely falls back only when needed. Report exact searchable and alertable counts by provider. Do not expand coverage until the live schema and customer search path are verified.

Context:
- Repo: /Users/ryan/Code/Alphacamper
- Site app: alphacamper-site
- Current branch: main
- Migration file: alphacamper-site/supabase/migrations/20260509000000_campground_support_status.sql
- Site API: alphacamper-site/app/api/campgrounds/route.ts
- Watch API: alphacamper-site/app/api/watch/route.ts
- Control board: docs/research/control-tower-status-board.md

Rules:
- Do not market broad Canada coverage unless verified.
- Separate searchable from alertable.
- Verify live Supabase, not just local files.
- If production changes are risky, stop and report the exact approval needed.

Report back:
Epic:
Status: green / yellow / red
Verified evidence:
- ...
Counts:
- Searchable:
- Alertable:
- Realtime-alertable campsite estimate:
- Search only:
- Coming soon:
- Unsupported:
Customer-facing truth:
- ...
Blockers:
- ...
Recommended control-tower update:
- ...
```

## Prompt 2: Alert Engine Truth Audit

```text
Act as an Alphacamper goal window.

Objective:
Audit Alphacamper's alert engines and decide whether Railway worker is the only real alert engine. Compare Railway worker coverage against the older Vercel cron /api/check-availability path. Explain customer impact, production risk, and the safest cleanup path. Recommend what to keep, hide, retire, or route differently.

Context:
- Repo: /Users/ryan/Code/Alphacamper
- Worker app: alphacamper-worker
- Site app: alphacamper-site
- Worker config: alphacamper-worker/src/config.ts
- Site cron route: alphacamper-site/app/api/check-availability
- Vercel cron config: alphacamper-site/vercel.json
- Current supported platforms are documented in AGENTS.md
- Control board: docs/research/control-tower-status-board.md

Rules:
- This is an audit unless a tiny safe docs/code correction is clearly needed.
- Focus on customer truth: if a user creates an alert, which engine actually watches it?
- Identify duplicate, weaker, stale, or misleading paths.

Report back:
Epic:
Status: green / yellow / red
Verified evidence:
- ...
Customer-facing truth:
- ...
Coverage by engine:
- Railway worker:
- Vercel cron:
Risks:
- ...
Recommended ownership model:
- ...
Recommended control-tower update:
- ...
```

## Prompt 3: North America Provider Roadmap

```text
Act as an Alphacamper goal window.

Objective:
Research and rank the next 20 campsite-alert provider systems across Canada and the United States by customer demand, technical difficulty, campground count, alert feasibility, and marketing value. Start with Alberta, Saskatchewan, PEI, Quebec/SEPAQ, and high-demand US state systems. Produce a three-week execution order and note any legal, anti-bot, or API risks.

Context:
- Repo: /Users/ryan/Code/Alphacamper
- Current control docs:
  - docs/research/north-america-control-tower.md
  - docs/research/competitor-data-pipeline-playbook.md
  - docs/research/control-tower-status-board.md
  - docs/research/provider-scoring-rubric.md
- Competitor benchmarks:
  - Campnab = Canadian breadth/trust benchmark
  - Campflare = US/data-rich benchmark

Rules:
- Use official reservation systems and official/open data sources.
- Do not copy competitor directories.
- Prefer providers that unlock many campgrounds through one adapter.
- Give a simple product recommendation, not only technical notes.

Report back:
Epic:
Status: green / yellow / red
Top five next bets:
- ...
Ranked provider table:
- provider / region / estimated value / difficulty / alert feasibility / risk / recommendation
Three-week execution order:
- ...
Risks:
- ...
Recommended control-tower update:
- ...
```

## Prompt 4: Canada Coverage Sprint

```text
Act as an Alphacamper goal window.

Objective:
Bring Manitoba and Nova Scotia GoingToCamp campgrounds live in Alphacamper search and watch creation, then verify worker alertability end to end. If those are clean, continue to Newfoundland and Labrador plus Long Point, Maitland, and St. Clair. Report exact counts, provider failures, and customer-facing gaps.

Context:
- Repo: /Users/ryan/Code/Alphacamper
- Worker app: alphacamper-worker
- Site app: alphacamper-site
- Known worker platforms: alphacamper-worker/src/config.ts
- Directory sync: alphacamper-worker/src/directory-sync.ts and alphacamper-worker/scripts/sync-directory.ts
- GoingToCamp seeds: alphacamper-api/examples/goingtocamp-seeds/
- Control board: docs/research/control-tower-status-board.md

Rules:
- Start only after the live catalog schema is verified or work only in safe preview/local mode.
- Do not sync Manitoba/Nova Scotia production alertable labels until Railway heartbeat is green.
- Do not mark a provider alertable unless search, watch creation, worker polling, and notification path are verified.
- If a provider is searchable but not alertable, label it honestly.

Report back:
Epic:
Status: green / yellow / red
What changed:
- ...
Verified evidence:
- ...
Counts by provider:
- ...
Current customer truth:
- Searchable:
- Alertable:
- Realtime-alertable campsite estimate:
- Coming soon:
- Unsupported / request only:
Risks:
- ...
Recommended control-tower update:
- ...
```

## Prompt 5: Catalog Ingestion Factory

```text
Act as an Alphacamper goal window.

Objective:
Build Alphacamper's catalog ingestion factory. Start from official/provider data, not competitor data. Create or verify jobs that import provider directories, normalize park/campground/campsite rows, store source URLs and raw payloads, dedupe names, attach province/state, and mark support_status, availability_mode, last_verified_at, and confidence. Start with BC, Ontario, Parks Canada, Manitoba, and Nova Scotia. Report exact counts, failed providers, stale rows, and what is safe to expose to customers.

Context:
- Repo: /Users/ryan/Code/Alphacamper
- Playbook: docs/research/competitor-data-pipeline-playbook.md
- Python API: alphacamper-api
- Worker directory sync: alphacamper-worker/src/directory-sync.ts
- Site catalog API: alphacamper-site/app/api/campgrounds/route.ts
- Current live schema must be verified before production exposure.

Rules:
- Use official/provider data only.
- Preserve source evidence.
- Treat the database as the product source of truth.
- Do not build a one-off hand-curated list.

Report back:
Epic:
Status: green / yellow / red
Ingestion jobs verified or created:
- ...
Counts:
- ...
Failed/stale providers:
- ...
Safe customer exposure:
- ...
Recommended control-tower update:
- ...
```

## Prompt 6: Parks Canada Enrichment

```text
Status:
This scope has already been executed once from the control tower. Do not relaunch it as-is. Relaunch only if the new objective is broader, such as adding more province pages or tying Parks Canada pages to a proven alert-to-notification loop.

Act as an Alphacamper goal window.

Objective:
Fix Parks Canada province and source metadata so customers can search by province and Alphacamper can build honest province coverage pages. Use official or verified source data only. Report before/after counts and any rows that remain uncertain.

Context:
- Repo: /Users/ryan/Code/Alphacamper
- Parks Canada research: docs/research/parks-canada-api.md
- Site catalog API: alphacamper-site/app/api/campgrounds/route.ts
- Existing issue: live Parks Canada rows were reported to have blank province.

Rules:
- Do not guess province.
- Use official/verified source data.
- Preserve uncertainty if a row cannot be confidently mapped.

Report back:
Epic:
Status: green / yellow / red
Before counts:
- ...
After counts:
- ...
Verified source data:
- ...
Uncertain rows:
- ...
Recommended control-tower update:
- ...
```

## Prompt 7: Production Worker Smoke

```text
Act as an Alphacamper goal window.

Objective:
Verify that the worker changes are live and safe for customers. The site deploy is already proven: /api/check-availability returns 410 retired. Confirm the Railway worker owns Recreation.gov plus Canadian providers, New Brunswick can be watched as alertable, and Manitoba/Nova Scotia remain search-only. Report exact production evidence and any rollback risk.

Context:
- Repo: /Users/ryan/Code/Alphacamper
- Site app: alphacamper-site
- Worker app: alphacamper-worker
- Live site: https://alphacamper.com
- Current expected live catalog: 461 searchable rows, 396 alertable campground rows, 65 search-only rows, 3 unsupported stale rows.
- Current provider-quality proof: `/api/admin/provider-quality` reads live Supabase, reports 5 active watches, and flags `railway_worker` with `missing_worker_heartbeat`.
- Current known gap: live `worker_status` currently has no heartbeat rows.
- Repo smoke command: from `alphacamper-worker`, run `npm run smoke:production`.
- Railway diagnostic command: from `alphacamper-worker`, run `npm run smoke:railway`.

Rules:
- Treat this as production verification, not new feature work.
- Treat 51,997 as provider-inventory proof, not customer reliability proof.
- If the worker is not live yet, say exactly what is pending and keep watching if possible.
- Do not print secret values from Railway or Supabase. Only report whether required variables exist and point to the live project.

Report back:
Epic:
Status: green / yellow / red
Production evidence:
- ...
Customer path smoke:
- ...
Worker health:
- ...
Risks:
- ...
Recommended control-tower update:
- ...
```

## Prompt 8: Alberta/Saskatchewan Adapter Sprint

```text
Status:
Discovery is already closed. Do not relaunch as discovery. Relaunch only after #9/#13 are green and the objective is live implementation proof.

Act as an Alphacamper goal window.

Objective:
Build or prove the shared Alberta/Saskatchewan reservation adapter. Start with Alberta, then confirm whether the same pattern works for Saskatchewan. Keep both providers search-only or coming-soon until site-level availability polling and notification behavior are proven.

Context:
- Repo: /Users/ryan/Code/Alphacamper
- Provider proof found Alberta uses contract ABPP and Saskatchewan uses SKPP.
- Likely adapter family: Aspira/ReserveAmerica-style.
- North star: 50,000 verified realtime-alertable Canadian campsites.

Rules:
- Use official reservation systems.
- Do not scrape competitor data.
- Do not mark a provider alertable until search, watch creation, worker polling, and notification path are proven.

Report back:
Epic:
Status: green / yellow / red
Providers:
- Alberta:
- Saskatchewan:
Adapter proof:
- ...
Counts:
- Searchable:
- Alertable:
- Search-only:
Risks:
- ...
Recommended control-tower update:
- ...
```

## Prompt 9: Provider Health/Admin Truth

```text
Act as an Alphacamper goal window.

Objective:
Create or verify an operator view that shows provider sync status, worker health, alertable/search-only/unsupported counts, stale providers, and recent failures. The admin/operator should know when a provider silently breaks before customers are misled.

Context:
- Repo: /Users/ryan/Code/Alphacamper
- Provider sync table: catalog_provider_syncs
- Worker health endpoint: alphacamper-worker/src/index.ts
- Site admin routes already include provider-quality and catalog-refresh surfaces.

Rules:
- Keep the view operational and simple.
- Show customer-impact language, not only technical errors.
- Do not expose service-role data to public users.

Report back:
Epic:
Status: green / yellow / red
Admin/operator evidence:
- ...
Provider health fields:
- ...
Customer-impact states:
- ...
Risks:
- ...
Recommended control-tower update:
- ...
```

## Prompt 10: Demand Capture And Conversion

```text
Act as an Alphacamper goal window.

Objective:
Turn unsupported, search-only, and coming-soon campground interest into a demand queue and revenue path. Customers should be able to request support, see nearby alertable alternatives where possible, and understand why paying improves their odds.

Context:
- Repo: /Users/ryan/Code/Alphacamper
- Business target: $10k net collected revenue by end of summer.
- Product distinction: not just finding the site, but helping the camper get the site.
- Tracker: https://github.com/UltraIntelligence/alphacamper/issues/19
- Current gap: unsupported searches are not yet a strong prioritization signal.

Rules:
- Keep language honest about what is alertable now.
- Do not make unsupported coverage look like a live alert.
- Prioritize regular camper clarity over internal labels.

Report back:
Epic:
Status: green / yellow / red
Customer flow:
- ...
Demand data captured:
- ...
Revenue/conversion impact:
- ...
Risks:
- ...
Recommended control-tower update:
- ...
```

## Prompt 11: Customer Watch And Notification Smoke

```text
Act as an Alphacamper goal window.

Objective:
After Production Worker Smoke is green, prove the real customer watch and notification path. Create one controlled test watch through the UI or authenticated API, confirm it appears in live Supabase, confirm the worker checks it, confirm a controlled notification path writes a real availability_alert with notified_at, test one search-only/unsupported guardrail, clean up the smoke watch, and report exact evidence.

Context:
- Repo: /Users/ryan/Code/Alphacamper
- Site app: alphacamper-site
- Worker app: alphacamper-worker
- Live site: https://alphacamper.com
- Runbook: docs/research/customer-watch-notification-smoke-runbook.md
- Current rule: exact dates plus optional exact site number only.
- The 51,997 campsite inventory proof is already counted for provider coverage; do not market customer reliability until this smoke is green.

Rules:
- Use a controlled test account, not a real customer account.
- Do not paste access tokens, service-role keys, Railway variables, Resend keys, or Sent.dm keys.
- Do not create broad watches across many dates/providers.
- Do not mark green unless watch creation, worker check, notification delivery, guardrail, and cleanup are all proven.

Report back:
Epic:
Status: green / yellow / red
Worker prerequisite:
- ...
Watch creation:
- ...
Notification proof:
- ...
Guardrail proof:
- ...
Cleanup:
- ...
Risks:
- ...
Recommended control-tower update:
- ...
```

## Prompt 12: Billing Truth And Revenue Reporting

```text
Act as an Alphacamper goal window.

Objective:
Make the $10k net summer revenue goal measurable and customer-safe. Verify the summer/year passes are one-time purchases, keep checkout copy and Stripe Checkout mode aligned, verify the live billing and funnel reporting source of truth, and produce a simple operator revenue scoreboard.

Context:
- Repo: /Users/ryan/Code/Alphacamper
- Site app: alphacamper-site
- Checkout UI: alphacamper-site/components/checkout/CheckoutView.tsx
- Checkout API: alphacamper-site/app/api/checkout/route.ts
- Stripe webhook: alphacamper-site/app/api/stripe/webhook/route.ts
- Funnel events API: alphacamper-site/app/api/events/route.ts
- Revenue quality API: alphacamper-site/app/api/admin/revenue-quality/route.ts
- Revenue quality panel: alphacamper-site/components/dashboard/RevenueQualityPanel.tsx
- Revenue framing: docs/research/summer-revenue-scoreboard.md
- Billing smoke command: from alphacamper-site, run npm run smoke:billing
- Current issue: checkout now uses one-time payment mode in code and live Supabase has billing/conversion tables. The protected operator revenue-quality view exists for gross app-side reporting, but production Vercel is missing Stripe env vars, no one-time paid pass exists yet, no `checkout.session.completed` webhook row exists yet, and net/refund reporting from Stripe is not complete.

Rules:
- Treat Stripe as the source of truth for real money unless live database reporting is explicitly verified.
- Do not print Stripe keys, Supabase keys, customer emails, or payment details.
- Keep the customer language clear: if it renews, say subscription; if it does not renew, use one-time payment mode.
- Prefer the simplest customer-safe path for summer 2026.
- Do not call this green until the smoke proves a payment-mode pass row, a `checkout.session.completed` webhook row, and Stripe-tied net/refund reporting.

Report back:
Epic:
Status: green / yellow / red
Billing decision:
- one-time / subscription / blocked
Customer copy:
- ...
Stripe/source-of-truth evidence:
- ...
Operator scoreboard:
- gross revenue:
- net revenue:
- paid summer passes:
- paid year passes:
- refunds:
- active watches:
- delivered alerts:
- booking outcomes:
Risks:
- ...
Recommended control-tower update:
- ...
```

## Prompt 13: First Paid Cohort Sprint

```text
Act as an Alphacamper goal window.

Objective:
After production checkout proof is green, run the first paid cohort sprint. Prove that 10-25 real paid campers can buy a pass, create or keep watches, receive honest status, and be measured against the $10k net revenue goal. The goal is not just sales; it is paid camper trust.

Context:
- Repo: /Users/ryan/Code/Alphacamper
- Site app: alphacamper-site
- Business target: $10k net collected revenue by end of summer
- Revenue scoreboard: docs/research/summer-revenue-scoreboard.md
- Revenue runbook: docs/research/revenue-readiness-runbook.md
- Tracker: https://github.com/UltraIntelligence/alphacamper/issues/16
- Billing smoke command: from alphacamper-site, run npm run smoke:billing
- Current rule: gross revenue is an early signal; net collected revenue after refunds/chargebacks is the real target.

Rules:
- Launch only after the correct Alphacamper Stripe account, production env vars, live one-time prices, webhook, first checkout, and net/refund reporting path are verified.
- Track real Stripe revenue and app DB rows separately; do not guess if they disagree.
- Every paid pass should connect to a customer outcome: watch created, alert received, alert acted on, booking submitted, or booking confirmed.
- Do not paste customer payment details, secrets, or private emails.

Report back:
Epic:
Status: green / yellow / red
Paid cohort:
- buyers:
- summer passes:
- year passes:
- gross revenue:
- net revenue:
- refunds:
Product usage:
- active watches:
- delivered alerts:
- alert taps:
- booking submissions:
- booking confirmations:
Trust risks:
- ...
Recommended control-tower update:
- ...
```

## Prompt 14: Paid Alert-To-Assist Moat Proof

```text
Act as an Alphacamper goal window.

Objective:
Prove Alphacamper's core distinction: not just finding the site, but helping the camper get the site. Run one controlled paid BC Parks or Ontario Parks loop from watch to alert to official booking-page assist. The final booking confirmation stays with the camper; Alphacamper should get them to the official review-ready step faster and more confidently.

Context:
- Repo: /Users/ryan/Code/Alphacamper
- Extension app: alphacamper-extension
- Site app: alphacamper-site
- Worker app: alphacamper-worker
- Moat plan: docs/research/get-the-site-moat-plan.md
- Tracker: https://github.com/UltraIntelligence/alphacamper/issues/15
- Prerequisites: #9 Railway worker heartbeat green, #10 checkout/revenue proof green, and #13 customer watch/notification proof green.

Rules:
- Use a controlled test account or explicitly approved internal paid account.
- Keep the official reservation site's final confirmation action with the camper.
- Do not store or expose payment cards, campsite account passwords, or private customer data.
- Do not mark green unless the alert-to-assist path is proven end to end.

Report back:
Epic:
Status: green / yellow / red
Prerequisites:
- worker heartbeat:
- checkout/revenue proof:
- notification proof:
Paid loop proof:
- paid pass:
- watch:
- alert:
- alert tap:
- extension connected:
- saved booking details:
- official page opened:
- assist/autofill:
- review-ready handoff:
Customer truth:
- ...
Risks:
- ...
Recommended control-tower update:
- ...
```

## Prompt 15: Canada Parity Expansion

```text
Act as an Alphacamper goal window.

Objective:
After Railway reliability and customer notification proof are green, turn the next Canadian provider systems from search-only or discovery into live alertable proof. This is implementation proof, not another broad discovery pass. Start with Alberta/Saskatchewan if they remain the best next bets from #12, then continue only to providers that can be proven through official/provider data.

Context:
- Repo: /Users/ryan/Code/Alphacamper
- Worker app: alphacamper-worker
- Site app: alphacamper-site
- Tracker: https://github.com/UltraIntelligence/alphacamper/issues/17
- Closed discovery tracker: https://github.com/UltraIntelligence/alphacamper/issues/12
- Provider scoring: docs/research/provider-scoring-rubric.md
- Alberta/Saskatchewan intake: docs/research/alberta-saskatchewan-adapter-intake-2026-05-09.md
- Current rule: search-only, coming-soon, unverified seed, and static fallback rows do not count toward realtime-alertable success.

Rules:
- Do not relaunch Alberta/Saskatchewan discovery; use the closed intake as starting evidence.
- Keep each provider search-only until watch creation, worker polling, alert row, and customer notification are proven.
- Use official reservation systems and official/provider data only.
- Preserve source evidence, support status, availability mode, confidence, and last verified date.
- Do not over-market Canada-wide reliability until the customer path is proven for each provider family.

Report back:
Epic:
Status: green / yellow / red
Providers attempted:
- ...
Implementation proof:
- parser/adapter:
- watch creation:
- worker poll:
- alert row:
- notification delivery:
Counts:
- searchable rows:
- alertable campground rows:
- realtime-alertable campsite IDs:
- search-only rows:
Customer-facing truth:
- ...
Risks:
- ...
Recommended control-tower update:
- ...
```

## Prompt 16: Manitoba And Nova Scotia Catalog Label Sync

```text
Act as an Alphacamper goal window.

Objective:
After the Railway worker heartbeat is green, sync Manitoba and Nova Scotia from repo-ready alertable/live-polling profiles into the live production catalog. This is a careful label-sync and proof window, not a marketing launch.

Context:
- Repo: /Users/ryan/Code/Alphacamper
- Site app: alphacamper-site
- Worker app: alphacamper-worker
- Tracker: https://github.com/UltraIntelligence/alphacamper/issues/18
- Worker blocker tracker: https://github.com/UltraIntelligence/alphacamper/issues/9
- Customer notification tracker: https://github.com/UltraIntelligence/alphacamper/issues/13
- Current proof: Manitoba has 5,480 verified provider-inventory campsite IDs from 45/45 countable rows; Nova Scotia has 1,700 from 20/20 countable rows.
- Current caution: production catalog labels are still search-only until sync/deploy. Reliability claims stay yellow until customer watch and notification proof is green.

Rules:
- Do not start until #9 is green.
- Do not market Manitoba/Nova Scotia as reliable customer alert coverage until #13 is green.
- Keep source evidence, support status, availability mode, confidence, and last verified date intact.
- Prove live watch creation allows supported Manitoba/Nova Scotia rows after the sync.
- Preserve rollback notes if any live rows change unexpectedly.

Report back:
Epic:
Status: green / yellow / red
Tracker:
- #18:
Dependency proof:
- #9 worker heartbeat:
- #13 notification proof:
Live catalog proof:
- Manitoba rows changed:
- Nova Scotia rows changed:
- support status:
- availability mode:
- source evidence:
Customer-path proof:
- search/API response:
- watch creation:
- worker polling:
- alert row:
- notification delivery:
Counts:
- Manitoba campsite IDs:
- Nova Scotia campsite IDs:
- total provider-inventory IDs:
Risks:
- ...
Rollback note:
- ...
Recommended control-tower update:
- ...
```

## Intake Instruction

When a goal window reports back, update:

- `docs/research/control-tower-status-board.md`
- `docs/research/north-america-control-tower.md` only if the strategy or next order changes
- `docs/research/summer-revenue-scoreboard.md` if billing or conversion truth changes
- `docs/research/competitor-data-pipeline-playbook.md` only if new data-source learnings change the ingestion plan
