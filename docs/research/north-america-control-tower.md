# Alphacamper North America Control Tower

Last updated: 2026-05-09

## Mission

Make Alphacamper the clearest, most useful campsite-alert product for Canadian campers first, then expand into broader North America.

The winning promise is not "we monitor everything" yet. The winning promise is:

> Canada-first campsite alerts that clearly show what is alertable now, what is searchable, and what is coming next.

Major success line:

- 50,000 verified realtime-alertable Canadian campsites.

Longer-term category leadership line:

- 250,000 to 350,000+ realtime-alertable North American campsites, plus a better customer experience for finding realistic openings.

## Operating Model

This thread is the control tower.

Each separate work window should have its own large goal. These are not small tickets. Each goal window is expected to run deep: research, implement where appropriate, verify against real evidence, and report back.

The control tower owns:

- the big arc
- launch order
- status intake
- customer-facing truth
- avoiding overclaims
- deciding the next large goal

The goal windows own:

- deep investigation
- implementation or audit work
- verification
- exact counts/evidence
- risk notes
- a clear next recommendation

## Current Truth

### Product state

- Phase 1 code is on `main` at `98f9d4fc6 Add Canadian campground support status`.
- The site can search the Supabase `campgrounds` table and merge static fallback results.
- The Phase 1 migration exists locally and adds `support_status`, `provider_key`, `source_url`, and `last_verified_at`.
- Reported blocker: live Supabase has not had that migration applied yet.
- Until that is applied and verified, customer campground search can fall back to the older static list.

### Coverage state

Safest customer-facing number today:

- Static fallback search: 174 campgrounds.

Reported live Supabase rows before Phase 1 migration:

- 387 Canadian campgrounds.
- BC Parks: 144.
- Ontario Parks: 129.
- Parks Canada: 114, with province blank.

Seeded future coverage in repo:

- Manitoba: 26.
- Nova Scotia: 20.
- Newfoundland and Labrador: 13.
- New Brunswick: 10.
- Ontario regional systems: 17.
- Total seeded future coverage: 86.

### Alert engine state

Worker code knows:

- BC Parks.
- Ontario Parks.
- Parks Canada.
- Manitoba Parks.
- Nova Scotia Parks.
- Long Point Region.
- Maitland Valley.
- St. Clair Region.
- Newfoundland and Labrador Parks.

The older site cron path is narrower. Control-tower recommendation: Railway worker should become the one real alert engine, and the older Vercel cron path should be audited, demoted, or retired.

## Competitor Bar

### Campnab

Campnab is the Canadian parity target. Their public claim is broad Canada support, including BC, Alberta, Saskatchewan, Nova Scotia, Ontario, Manitoba, PEI, and Canada National Parks. They also publicly claim thousands of parks/campgrounds and 350k+ campsites.

Control-tower read: Campnab wins by breadth and trust. Alphacamper must first make search feel comprehensive and honest.

Likely data path:

- Reservation-system directory pulls for each provider.
- Active scans only for parks/customers that requested monitoring.
- Provider-specific adapters because each booking system exposes different links, filters, and IDs.
- Internal health monitoring because provider APIs, networks, and park platforms change.
- Manual/operator cleanup for names, direct booking links, and edge cases where providers do not expose clean campsite permalinks.

### Campflare

Campflare is the data-rich US benchmark. Their public product/data story includes campsite-level availability, alerts, amenities, official notices, photos, map layers, cell service, and near-all public US campground support.

Control-tower read: Campflare is the long-term richness benchmark, not the first Canadian parity target.

Likely data path:

- Public Recreation.gov/RIDB data for US federal campground metadata.
- Reservation-system availability polling for campsite-level status.
- NPS/NWS/USFS/public-land datasets for notices, park descriptions, alerts, and map context.
- Licensed or attributed public image sources.
- Third-party or public telecom/map layers for cell service and coverage overlays.
- A normalized campground/campsite model that merges many public sources into one app experience.

## How Competitors Probably Built Their Data

There is no magic private list. The quality comes from a data pipeline with several layers:

1. **Directory layer**
   - Pull every park, campground, campsite, and official ID from reservation systems.
   - Examples: Recreation.gov/RIDB, Camis/GoingToCamp `resourceLocation`, ReserveAmerica/UseDirect-style systems, state/provincial reservation portals.

2. **Availability layer**
   - Poll the reservation system APIs for the customer's dates.
   - Store normalized availability snapshots.
   - Alert only when a site flips into a bookable state.

3. **Enrichment layer**
   - Add official descriptions, coordinates, amenities, rules, photos, notices, and booking windows from government/open-data sources.
   - This makes the app feel high quality before the customer even creates an alert.

4. **Normalization layer**
   - Convert every provider's messy names and fields into one product model:
     - provider
     - park
     - campground
     - campsite
     - dates
     - equipment requirements
     - booking URL
     - source URL
     - verification status

5. **Quality-control layer**
   - Deduplicate names.
   - Attach province/state.
   - Mark stale rows.
   - Track provider health.
   - Handle provider changes without silently breaking customer alerts.

6. **Demand layer**
   - Let customers search unsupported parks.
   - Capture requests.
   - Prioritize the providers and campgrounds people actually want.

Alphacamper can do this. The current repo already has pieces of this shape in the worker and the richer Python API. The immediate job is to deploy the catalog path, then fill it with official/provider data.

## Three-Week Operating Plan

### Week 1: Make The Foundation Real

Goal: The live product can safely use the new catalog shape.

Must prove:

- Live Supabase has the Phase 1 columns.
- `/api/campgrounds` works against live Supabase.
- Search results clearly label alertable, search-only, coming-soon, or unsupported.
- Watch creation cannot create misleading alerts for unsupported campgrounds.
- Static fallback still protects the customer if live data has gaps.

Main output:

- Exact current counts by provider and support status.
- A short "safe to market / not safe to market" read.

### Week 2: Canada Core Coverage

Goal: Make Alphacamper feel like a Canadian campsite product, not only BC/Ontario.

Order:

1. Lock BC, Ontario, and Parks Canada as trustworthy.
2. Add province/source metadata for Parks Canada.
3. Bring Manitoba live.
4. Bring Nova Scotia live.
5. Bring Newfoundland and Labrador live.
6. Bring Long Point, Maitland, and St. Clair live.
7. Bring New Brunswick live if the provider path is verified.

Main output:

- Alertable count.
- Searchable count.
- Coming-soon count.
- Provider health list.
- Known broken systems and why.

### Week 3: Domination Layer

Goal: Turn coverage into customer advantage.

Build toward:

- Province-by-province coverage pages.
- "Request this park" demand capture.
- Nearby alertable campground suggestions.
- Booking-window reminders.
- Flexible date and multi-campground scans.
- Basic requirements: vehicle length, hookups, accessibility, site type where provider data supports it.

Research track:

- Alberta Parks.
- Saskatchewan Parks.
- PEI Parks.
- Quebec / SEPAQ.
- High-demand US systems beyond Recreation.gov.

Main output:

- Ranked next-provider roadmap.
- Customer-facing coverage pages.
- A sharper homepage promise.

## Epic Goal Windows

Use these as standalone prompts in separate long-running windows. Report back here with the report format below.

### Epic 1: Phase 2 Live Catalog Fix

Prompt:

> Apply and verify the Phase 1 Supabase migration for Alphacamper. Confirm the live `campgrounds` table has `support_status`, `provider_key`, `source_url`, and `last_verified_at`. Verify `/api/campgrounds` works against live Supabase and safely falls back only when needed. Report exact searchable and alertable counts by provider. Do not expand coverage until the live schema and customer search path are verified.

Success means:

- Live schema verified.
- Search API verified.
- Watch creation behavior checked.
- Counts reported.
- Clear customer impact statement.

### Epic 2: Canada Coverage Sprint

Prompt:

> Bring Manitoba and Nova Scotia GoingToCamp campgrounds live in Alphacamper search and watch creation, then verify worker alertability end to end. If those are clean, continue to Newfoundland and Labrador plus Long Point, Maitland, and St. Clair. Report exact counts, provider failures, and customer-facing gaps.

Success means:

- New campgrounds visible in search.
- Support status correct.
- Worker can poll the platform or it is honestly labeled as not alertable yet.
- No unsupported provider is marketed as working.

### Epic 3: Alert Engine Truth Audit

Prompt:

> Audit Alphacamper's alert engines and decide whether Railway worker is the only real alert engine. Compare Railway worker coverage against the older Vercel cron `/api/check-availability` path. Explain customer impact, production risk, and the safest cleanup path. Recommend what to keep, hide, retire, or route differently.

Success means:

- One source of truth for alert execution is recommended.
- Any duplicate or weaker path is identified.
- Product copy and admin health can reflect reality.

### Epic 4: Parks Canada Enrichment

Prompt:

> Fix Parks Canada province and source metadata so customers can search by province and Alphacamper can build honest province coverage pages. Use official or verified source data only. Report before/after counts and any rows that remain uncertain.

Success means:

- Parks Canada rows are province-searchable.
- Source URLs or verification notes are present where possible.
- Uncertain rows are not guessed.

### Epic 5: North America Provider Roadmap

Prompt:

> Research and rank the next 20 campsite-alert provider systems across Canada and the United States by customer demand, technical difficulty, campground count, alert feasibility, and marketing value. Start with Alberta, Saskatchewan, PEI, Quebec/SEPAQ, and high-demand US state systems. Produce a three-week execution order and note any legal, anti-bot, or API risks.

Success means:

- Ranked provider backlog.
- Build-vs-research recommendation per provider.
- No copied competitor data.
- Clear first five next bets.

### Epic 6: Catalog Ingestion Factory

Prompt:

> Build Alphacamper's catalog ingestion factory. Start from official/provider data, not competitor data. Create or verify jobs that import provider directories, normalize park/campground/campsite rows, store source URLs and raw payloads, dedupe names, attach province/state, and mark `support_status`, `availability_mode`, `last_verified_at`, and confidence. Start with BC, Ontario, Parks Canada, Manitoba, and Nova Scotia. Report exact counts, failed providers, stale rows, and what is safe to expose to customers.

Success means:

- The database grows from official/provider sources, not hand-curated static lists.
- Each row has source evidence.
- Admins can see which rows are alertable, search-only, coming soon, or unsupported.
- Customer search is broader but still honest.

Reference:

- `docs/research/competitor-data-pipeline-playbook.md`

## Report-Back Format

Every long-running window should report back in this shape:

```text
Epic:
Status: green / yellow / red

What changed:
- ...

Verified evidence:
- command, URL, migration, query, count, or file

Current customer truth:
- Searchable:
- Alertable:
- Coming soon:
- Unsupported / request only:

Risks:
- ...

Next recommended action:
- ...
```

## Control-Tower Rules

- Do not market a provider as alertable until search, watch creation, worker polling, and notifications are verified.
- Separate "searchable" from "alertable" everywhere.
- Prefer official reservation systems and official open data.
- Do not scrape or copy competitor directories.
- Use unsupported searches as demand capture.
- Canada parity comes before broad US parity.
- Public pages should be honest and useful, not inflated.
- The user-facing language should explain what a camper can do next, not how the database works.

## Current Next Action

Start Epic 1. The schema mismatch is the gate. Everything else gets easier once live Supabase is the trusted catalog.

## Companion Docs

- `docs/research/control-tower-status-board.md` tracks epic status, blockers, and report intake.
- `docs/research/control-tower-snapshot-2026-05-09.md` gives the current executive snapshot after the first three goal windows.
- `docs/research/north-star-success-metrics.md` defines the major goal and campsite-count thresholds for success.
- `docs/research/live-catalog-migration-runbook.md` gives the approval-gated steps for applying and verifying the live Supabase catalog migration.
- `docs/research/current-action-queue.md` lists what to launch now, what is held, and why.
- `docs/research/post-migration-launch-pack.md` defines the next huge goal windows once the live catalog migration is verified.
- `docs/research/competitor-data-pipeline-playbook.md` explains how competitor-scale campground data is likely built and how Alphacamper can build its own official-data pipeline.
- `docs/research/epic-launch-prompts.md` contains copy-paste prompts for each long-running goal window.
- `docs/research/provider-scoring-rubric.md` gives provider-roadmap work a consistent scoring model.
- `docs/research/report-intake-procedure.md` explains how to process goal-window reports and update the control tower.
- `docs/research/control-tower-artifact-audit.md` maps the original control-tower request to the actual artifacts.
