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

Use high reasoning for:

- Canada Coverage Sprint.
- Parks Canada Enrichment.

Use medium or lower only for narrow follow-up chores like formatting docs, recounting known files, or small copy changes.

North-star metric:

- First success line: 50,000 verified realtime-alertable Canadian campsites.
- Longer-term leadership line: 250,000 to 350,000+ realtime-alertable North American campsites.
- Search-only, coming-soon, unverified seed, and static fallback rows do not count toward realtime success.

## Current Launch State

Already reported back:

1. Phase 2 Live Catalog Fix: red.
2. Alert Engine Truth Audit: yellow.
3. North America Provider Roadmap: yellow.

Do not relaunch those same windows unless the scope changes.

Current gate:

1. Get approval to apply and verify the live catalog migration.
2. Use `live-catalog-migration-runbook.md`.
3. After Epic 1 is no longer red, use `post-migration-launch-pack.md`.

Start after the live catalog is verified:

1. Canada Coverage Sprint.
2. Catalog Ingestion Factory.

Start when official Parks Canada source data is selected:

1. Parks Canada Enrichment.

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

## Intake Instruction

When a goal window reports back, update:

- `docs/research/control-tower-status-board.md`
- `docs/research/north-america-control-tower.md` only if the strategy or next order changes
- `docs/research/competitor-data-pipeline-playbook.md` only if new data-source learnings change the ingestion plan
