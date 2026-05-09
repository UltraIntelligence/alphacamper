# Alphacamper Control Tower Status Board

Last updated: 2026-05-09

## How To Use This Board

This is the report-back board for long-running goal windows.

When a separate window finishes an epic, paste its report into this thread. The control tower should then update:

- status
- verified evidence
- customer-facing truth
- blocker
- next action

Do not mark an epic green because code was written. Mark it green only when the customer path is verified.

## Status Key

- Green: verified end to end and safe to use in the customer story.
- Yellow: useful progress, but some customer-facing claim is still unsafe.
- Red: blocked, broken, or not verified.
- Not started: no current evidence.

## Master Gates

These gates protect the product from over-promising.

| Gate | Status | What Must Be True | Current Read |
|---|---|---|---|
| Live catalog schema | Green | Live Supabase has `support_status`, `provider_key`, `source_url`, and `last_verified_at` | Migration applied and verified 2026-05-09 |
| Customer campground search | Green | `/api/campgrounds` works against live Supabase and labels support clearly | Live-only Bamberton row now returns from `alphacamper.com/api/campgrounds` |
| Watch creation guardrails | Yellow | Customers cannot create misleading alerts for unsupported rows | Local guardrail tests pass; live authenticated watch creation still needs a customer-path smoke test |
| Alert engine source of truth | Yellow | Railway worker vs Vercel cron ownership is decided | Pasteur recommends Railway worker as Canadian alert-engine owner; Recreation.gov still blocks full cleanup |
| Provider health/admin truth | Red | Admin can see alertable/search-only/stale/broken providers | Not proven in beta |
| Demand capture | Red | Unsupported searches become a prioritization queue | Not built/proven |

## Current Count Ledger

These numbers should be treated differently depending on their evidence level.

| Count | Value | Evidence Level | Product Meaning | Next Verification Needed |
|---|---:|---|---|---|
| Static fallback campgrounds | 174 | Verified by Avicenna report | Safest current customer-facing searchable fallback | Recount from `alphacamper-site/lib/parks.ts` when needed |
| Live Supabase campgrounds | 387 | Verified live read after migration | Bigger Canadian catalog now powers customer search, but support labels still need provider truth | Normalize provider support/source metadata before marketing |
| BC Parks live rows | 144 | Verified live read after migration | Strong BC catalog base now searchable from live DB | Verify campsite-level alertability count |
| Ontario Parks live rows | 129 | Verified live read after migration | Strong Ontario catalog base now searchable from live DB | Verify campsite-level alertability count |
| Parks Canada live rows | 114 | Verified live read after migration | Useful Parks Canada base, but province/source enrichment remains weak | Add/verify province/source enrichment |
| Default `alertable` support labels | 387 | Verified live read after migration | Migration default only; not customer truth by itself | Provider proof must confirm or downgrade labels |
| Seeded future GoingToCamp rows | 86 | Repo seed-reported | Near-term Canada expansion inventory | Sync into live catalog and verify provider health |

Control-tower rule:

- Reported counts are useful for planning.
- Verified counts are the only numbers safe for customer-facing claims.

## Decision Log

| Date | Decision | Reason | Status |
|---|---|---|---|
| 2026-05-09 | Keep Canada-first as the immediate wedge | Campnab is the Canadian parity target and Alphacamper already has Canadian provider bones | Active |
| 2026-05-09 | Treat searchable and alertable as separate product states | Prevents misleading customers while allowing broader discovery | Active |
| 2026-05-09 | Make live catalog trust the first gate | More coverage is risky until Supabase schema/search/watch behavior are verified | Active |
| 2026-05-09 | Prefer Railway worker as likely alert-engine owner | Epic 3 found Railway worker is the right Canadian alert-engine owner; Recreation.gov still blocks retiring Vercel cron | Active |
| 2026-05-09 | Build a catalog ingestion factory, not a hand-curated list | Competitor-scale coverage requires repeatable official/provider data pipelines | Planned |
| 2026-05-09 | Do not count Vercel cron toward the 50,000 Canadian north-star target | Pasteur found Vercel cron is a weaker legacy path and Recreation.gov-only gap blocks retiring it today | Active |
| 2026-05-09 | Operate autonomously unless a move is unusually destructive or risky | Ryan wants the control tower to move like an owner, not wait on normal execution approvals | Active |
| 2026-05-09 | Add business north star: $10k revenue by end of summer | Coverage work should ladder into paid camper outcomes, not only infrastructure | Active |

## Epic Board

### Epic 1: Phase 2 Live Catalog Fix

Status: Yellow

Owner window: launched 2026-05-09 as Avicenna

Customer promise affected:

- Whether customers can safely search the bigger campground database.

Must prove:

- Live Supabase schema has the Phase 1 columns.
- `/api/campgrounds` returns live rows without falling back because of schema errors.
- Search results show clear support status.
- Watch creation respects support status.
- Exact counts by provider and support status are reported.

Current result:

- Migration applied to live Supabase project `tbdrmcdrfgunbcevslqf` on 2026-05-09.
- Verified columns now exist: `support_status`, `provider_key`, `source_url`, and `last_verified_at`.
- Verified index exists: `idx_campgrounds_support_status`.
- Live base catalog remains 387 rows: BC Parks 144, Ontario Parks 129, Parks Canada 114.
- Live API now returns the live-only Bamberton row at `/api/campgrounds?q=Bamberton`.
- All 387 rows defaulted to `alertable`; this is schema truth, not final customer/provider truth.
- Realtime-alertable campsite estimate remains unverified until provider proof confirms worker polling and notifications.

Next prompt:

> Normalize support labels and provider metadata so `alertable` means search + watch creation + worker polling + notification path are verified. Downgrade any unproven rows to `search_only` or `coming_soon`.

### Epic 2: Canada Coverage Sprint

Status: Not started

Customer promise affected:

- Whether Alphacamper feels Canada-first instead of BC/Ontario-first.

Must prove:

- Manitoba and Nova Scotia are visible in search.
- Support statuses are correct.
- Worker can poll the provider or the product labels it honestly as not alertable yet.
- No unsupported provider is marketed as working.

Current blocker:

- Wait for Epic 1 unless this work is done in a safe preview/local environment.

Next prompt:

> Bring Manitoba and Nova Scotia GoingToCamp campgrounds live in Alphacamper search and watch creation, then verify worker alertability end to end. If those are clean, continue to Newfoundland and Labrador plus Long Point, Maitland, and St. Clair. Report exact counts, provider failures, and customer-facing gaps.

### Epic 3: Alert Engine Truth Audit

Status: Yellow

Owner window: launched 2026-05-09 as Pasteur

Customer promise affected:

- Whether an alert customers create is actually watched by the strongest available engine.

Must prove:

- Railway worker coverage.
- Vercel cron coverage.
- Overlap, gaps, or duplicate behavior.
- Recommended ownership model.
- Cleanup/routing plan.

Current blocker:

- Railway worker should be the Canadian alert-engine owner, but Recreation.gov is still only covered by the older Vercel cron path.
- BC/Ontario may be checked by both engines today, which creates duplicate traffic and alert-risk ambiguity.

Next prompt:

> Move Recreation.gov into the Railway worker or explicitly mark it as Vercel-cron-only/search-limited until it is moved. Then narrow or retire `/api/check-availability` so customer alerts have one true engine.

### Epic 4: Parks Canada Enrichment

Status: Not started

Customer promise affected:

- Whether Parks Canada rows can support province pages and province search.

Must prove:

- Parks Canada rows have province/source metadata.
- Uncertain rows are not guessed.
- Before/after counts are reported.

Current blocker:

- Can run after or alongside Epic 1, but live exposure depends on Epic 1.

Next prompt:

> Fix Parks Canada province and source metadata so customers can search by province and Alphacamper can build honest province coverage pages. Use official or verified source data only. Report before/after counts and any rows that remain uncertain.

### Epic 5: North America Provider Roadmap

Status: Yellow

Owner window: relaunched 2026-05-09 as Euler after Kepler was not found in this fork

Customer promise affected:

- Which providers Alphacamper should chase after core Canada parity.

Must prove:

- Ranked provider backlog.
- Build-vs-research recommendation per provider.
- Demand/value score.
- Difficulty/risk score.
- First five next bets.

Current blocker:

- Euler completed the ranking, but all new providers remain research/searchable-only until adapter proof and live worker polling are verified.
- Broad US rollout should wait until Canada core is stable.

Next prompt:

> Launch the next proof window after Epic 1 is unblocked: verify New Brunswick GoingToCamp alertability, then run Alberta/Saskatchewan adapter discovery against official reservation pages. Keep every new provider searchable-only until site-level availability polling is proven.

Top roadmap bets:

- Alberta Parks: biggest Canadian gap, but likely needs a new ReserveAmerica/Aspira-style adapter.
- Saskatchewan Parks: similar parity value and likely reusable adapter work after Alberta.
- New Brunswick, then PEI: Atlantic quick win; NB may fit GoingToCamp, PEI is small but trust-building.
- US GoingToCamp cluster: Washington, Wisconsin, Michigan, Maryland.
- ReserveCalifornia: huge marketing value, but build after Canada core because it needs a new UseDirect-style adapter.

### Epic 6: Catalog Ingestion Factory

Status: Not started

Customer promise affected:

- Whether Alphacamper can grow like a serious coverage product instead of a hand-curated list.

Must prove:

- Provider directory imports use official/provider data.
- Rows keep source evidence.
- Rows are deduped and normalized.
- Rows include support status, availability mode, last verified date, and confidence.
- Exact counts, failed providers, stale rows, and safe customer exposure are reported.

Current blocker:

- Epic 1 should define the live catalog shape first.

Next prompt:

> Build Alphacamper's catalog ingestion factory. Start from official/provider data, not competitor data. Create or verify jobs that import provider directories, normalize park/campground/campsite rows, store source URLs and raw payloads, dedupe names, attach province/state, and mark `support_status`, `availability_mode`, `last_verified_at`, and confidence. Start with BC, Ontario, Parks Canada, Manitoba, and Nova Scotia. Report exact counts, failed providers, stale rows, and what is safe to expose to customers.

## Current Recommended Next Runs

Already reported:

1. Phase 2 Live Catalog Fix: yellow after migration and customer-search verification.
2. Alert Engine Truth Audit: yellow.
3. North America Provider Roadmap: yellow.

Do not relaunch those same windows unless the scope changes.

Running now:

1. Canada Provider Proof: New Brunswick alertability, then Alberta/Saskatchewan adapter discovery.
2. Alert Engine Cleanup: move Recreation.gov into Railway worker or isolate the legacy Vercel cron path.
3. Catalog Ingestion Factory: build the official/provider-data pipeline once provider proof teaches the real shape.

Keep research-only for now:

1. SEPAQ, until Cloudflare and French-first UX risk are solved.
2. Broad US rollout, until Canada core is stable and verified alertable.

## Report Intake Template

```text
Epic:
Status: green / yellow / red

Verified evidence:
- ...

Counts:
- Searchable:
- Alertable:
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

## Current Product Truth

Short version:

- We have the foundation for Canadian expansion.
- Live Supabase now powers the expanded campground search.
- We should not claim broad alertable Canada coverage until provider proof verifies worker polling and notifications.
- The next real unlock is turning default support labels into honest provider truth.

## North Star

Major success line:

- 50,000 verified realtime-alertable Canadian campsites.

Longer-term category leadership line:

- 250,000 to 350,000+ realtime-alertable North American campsites, plus a better customer experience for finding realistic openings.

Business line:

- $10k revenue by the end of summer.

Only count realtime-alertable inventory when measuring this goal. Search-only rows, static fallback rows, unverified seeds, and coming-soon providers are useful, but they do not count toward the realtime success number.
