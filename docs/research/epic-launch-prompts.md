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

Use high reasoning for:

- Production Worker Smoke.
- Customer Watch And Notification Smoke.
- Billing Truth And Revenue Reporting.
- Canada Coverage Sprint.
- Parks Canada Enrichment.
- Provider Health/Admin Truth.
- Demand Capture And Conversion.

Use medium or lower only for narrow follow-up chores like formatting docs, recounting known files, or small copy changes.

North-star metric:

- First success line: 50,000 verified realtime-alertable Canadian campsites.
- Longer-term leadership line: 250,000 to 350,000+ realtime-alertable North American campsites.
- Search-only, coming-soon, unverified seed, and static fallback rows do not count toward realtime success.

## Current Launch State

Already reported back:

1. Phase 2 Live Catalog Fix: yellow after live migration and search verification.
2. Alert Engine Truth Audit: yellow.
3. North America Provider Roadmap: yellow.
4. Canada Provider Proof: yellow; New Brunswick alertable, Alberta/Saskatchewan need adapter work.
5. Alert Engine Cleanup: yellow until Railway worker runtime proof.
6. Catalog Ingestion Factory: yellow until recurring ops/admin health are proven.

Do not relaunch those same windows unless the scope changes.

Next recommended windows:

1. Production Worker Smoke.
2. Customer Watch And Notification Smoke, only after worker heartbeat is green.
3. Billing Truth And Revenue Reporting.
4. Alberta/Saskatchewan Adapter Sprint.
5. Provider Health/Admin Truth.
6. Demand Capture And Conversion.
7. Parks Canada Enrichment when official source data is chosen.

## Prompt 1: Phase 2 Live Catalog Fix

```text
Act as an Alphacamper goal window.

Objective:
Apply and verify the Phase 1 Supabase migration for Alphacamper. Confirm the live campgrounds table has support_status, provider_key, source_url, and last_verified_at. Verify /api/campgrounds works against live Supabase and safely falls back only when needed. Report exact searchable and alertable counts by provider. Do not expand coverage until the live schema and customer search path are verified.

Context:
- Repo: /Users/ryan/Code/Alphacamper
- Site app: alphacamper-site
- Current pushed commit: 98f9d4fc6 Add Canadian campground support status
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
- Do not overclaim campsite-level totals.
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
- Business target: $10k revenue by end of summer.
- Product distinction: not just finding the site, but helping the camper get the site.
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
- Do not count any campsite toward the 50k realtime-alertable goal until this proof exists.

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
Make the $10k summer revenue goal measurable and customer-safe. Decide whether the summer/year passes are one-time purchases or subscriptions, align checkout copy and Stripe Checkout mode, verify the live billing and funnel reporting source of truth, and produce a simple operator revenue scoreboard.

Context:
- Repo: /Users/ryan/Code/Alphacamper
- Site app: alphacamper-site
- Checkout UI: alphacamper-site/components/checkout/CheckoutView.tsx
- Checkout API: alphacamper-site/app/api/checkout/route.ts
- Stripe webhook: alphacamper-site/app/api/stripe/webhook/route.ts
- Funnel events API: alphacamper-site/app/api/events/route.ts
- Revenue framing: docs/research/summer-revenue-scoreboard.md
- Current issue: checkout now uses one-time payment mode in code and live Supabase has billing/conversion tables, but production Vercel is missing Stripe env vars and operator revenue reporting is not complete.

Rules:
- Treat Stripe as the source of truth for real money unless live database reporting is explicitly verified.
- Do not print Stripe keys, Supabase keys, customer emails, or payment details.
- Keep the customer language clear: if it renews, say subscription; if it does not renew, use one-time payment mode.
- Prefer the simplest customer-safe path for summer 2026.

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

## Intake Instruction

When a goal window reports back, update:

- `docs/research/control-tower-status-board.md`
- `docs/research/north-america-control-tower.md` only if the strategy or next order changes
- `docs/research/summer-revenue-scoreboard.md` if billing or conversion truth changes
- `docs/research/competitor-data-pipeline-playbook.md` only if new data-source learnings change the ingestion plan
