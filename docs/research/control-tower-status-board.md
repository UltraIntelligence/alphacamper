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
| Live catalog schema | Green | Live Supabase has support labels, provider evidence, and sync tracking | Support-status and catalog-evidence migrations applied and verified 2026-05-09 |
| Customer campground search | Green | `/api/campgrounds` works against live Supabase and labels support clearly | Live-only Bamberton and New Brunswick Sugarloaf rows now return from `alphacamper.com/api/campgrounds` |
| Watch creation guardrails | Yellow | Customers cannot create misleading alerts for unsupported rows | Local guardrail tests pass; live authenticated watch creation still needs a customer-path smoke test |
| Alert engine source of truth | Yellow | Railway worker vs Vercel cron ownership is decided | Vercel cron route is retired live; worker heartbeat fix is pushed, but Railway runtime is not writing `worker_status` yet |
| Provider health/admin truth | Yellow | Admin can see alertable/search-only/stale/broken providers | Live `/api/admin/provider-quality` now reads Supabase and shows the missing worker heartbeat; admin UI/recurring ops still need completion |
| Revenue measurement | Red | Stripe, checkout copy, and operator reporting agree on paid pass revenue | Checkout copy says one-time, checkout code uses subscription mode, and live DB reporting tables were not found in the latest aggregate read |
| Demand capture | Red | Unsupported searches become a prioritization queue | Not built/proven |

## Current Count Ledger

These numbers should be treated differently depending on their evidence level.

| Count | Value | Evidence Level | Product Meaning | Next Verification Needed |
|---|---:|---|---|---|
| Static fallback campgrounds | 174 | Verified by Avicenna report | Safest current customer-facing searchable fallback | Recount from `alphacamper-site/lib/parks.ts` when needed |
| Live known catalog rows | 464 | Verified live read after catalog refresh | Official/provider directory rows are now in live Supabase, including stale rows marked unsupported | Keep refreshing from official sources |
| Live customer-searchable rows | 461 | Verified live read after catalog refresh | Safe searchable inventory excluding unsupported stale rows | Deploy updated UI/API evidence fields |
| Verified alertable campground rows | 396 | Verified live read after provider proof and refresh | BC, Ontario, Parks Canada, and New Brunswick are marked alertable with live-polling evidence | Convert this into campsite-level counts and health |
| Search-only campground rows | 65 | Verified live read after provider proof and refresh | Manitoba and Nova Scotia are visible but not marketed as realtime alertable yet | Prove or build live polling before upgrading |
| Unsupported stale rows | 3 | Verified live read after refresh | Carmanah Walbran, Grand-Pre, and Internet are not treated as alert inventory | Keep stale rows out of customer claims |
| BC Parks alertable rows | 145 | Verified live provider refresh | Strong BC catalog base with source evidence | Verify campsite-level alertability count |
| Ontario Parks alertable rows | 129 | Verified live provider refresh | Strong Ontario catalog base with source evidence | Verify campsite-level alertability count |
| Parks Canada alertable rows | 113 | Verified live provider refresh | Useful Parks Canada base, but province enrichment remains weak | Add/verify province enrichment |
| New Brunswick alertable rows | 9 | Verified provider proof and live refresh | First Atlantic realtime-alertable province slice | Deploy worker support and smoke-test alerts |
| Manitoba search-only rows | 45 | Verified live provider refresh | Searchable, honest expansion inventory | Prove worker polling before upgrading |
| Nova Scotia search-only rows | 20 | Verified live provider refresh | Searchable, honest expansion inventory | Prove worker polling before upgrading |
| Active live watches | 5 | Verified production provider-quality route | Real customers/admin tests have active watches waiting on worker polling | Prove Railway heartbeat and notification delivery |

Control-tower rule:

- Reported counts are useful for planning.
- Verified counts are the only numbers safe for customer-facing claims.

## Business Ledger

| Count | Value | Evidence Level | Product Meaning | Next Verification Needed |
|---|---:|---|---|---|
| Summer revenue target | $10k | Ryan's business target | The summer work needs to turn into paid camper trust | Track gross and net Stripe revenue weekly |
| Summer-pass path to $10k | 345 passes | Calculated from $29 checkout copy | Shows the size of the short-term sales target | Verify price/mode in Stripe |
| Year-pass path to $10k | 205 passes | Calculated from $49 checkout copy | Shows the size of the higher-trust sales target | Verify price/mode in Stripe |
| Verified paid-pass count from app DB | Not verified | Latest live read could not find `subscriptions` | App-side revenue reporting is not trustworthy yet | Resolve billing mode and live reporting source |
| Verified funnel-event count from app DB | Not verified | Latest live read could not find `funnel_events` | Operator-wide conversion reporting is not trustworthy yet | Verify or add live funnel storage |

## Decision Log

| Date | Decision | Reason | Status |
|---|---|---|---|
| 2026-05-09 | Keep Canada-first as the immediate wedge | Campnab is the Canadian parity target and Alphacamper already has Canadian provider bones | Active |
| 2026-05-09 | Treat searchable and alertable as separate product states | Prevents misleading customers while allowing broader discovery | Active |
| 2026-05-09 | Make live catalog trust the first gate | More coverage is risky until Supabase schema/search/watch behavior are verified | Active |
| 2026-05-09 | Prefer Railway worker as likely alert-engine owner | Epic 3 found Railway worker is the right Canadian alert-engine owner; Recreation.gov has now been moved into the worker in code | Active |
| 2026-05-09 | Build a catalog ingestion factory, not a hand-curated list | Competitor-scale coverage requires repeatable official/provider data pipelines | Planned |
| 2026-05-09 | Do not count Vercel cron toward the 50,000 Canadian north-star target | Pasteur found Vercel cron is a weaker legacy path; cleanup code retires it once deployed | Active |
| 2026-05-09 | Operate autonomously unless a move is unusually destructive or risky | Ryan wants the control tower to move like an owner, not wait on normal execution approvals | Active |
| 2026-05-09 | Add business north star: $10k revenue by end of summer | Coverage work should ladder into paid camper outcomes, not only infrastructure | Active |
| 2026-05-09 | Treat net collected revenue as the real $10k target | The 30-day guarantee means gross sales alone can overstate success | Active |
| 2026-05-09 | Resolve one-time pass vs subscription before trusting revenue reporting | Checkout copy and checkout mode currently disagree | Active |
| 2026-05-09 | Treat New Brunswick as alertable after provider proof | The New Brunswick CAMIS/GoingToCamp path returned directory and site-level availability evidence | Active |
| 2026-05-09 | Keep Manitoba and Nova Scotia search-only for now | Their official directories are verified, but live alert polling has not been proven end to end | Active |
| 2026-05-09 | Move all alert polling toward Railway worker | Recreation.gov worker support now exists in code, and the old Vercel cron is retired live; Railway heartbeat still needs proof | Active |

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
- Live base catalog was refreshed from official/provider sources on 2026-05-09.
- Live known catalog now has 464 rows.
- Live customer-searchable rows excluding unsupported stale rows: 461.
- Verified alertable campground rows: 396.
- Search-only campground rows: 65.
- Unsupported stale rows: 3.
- Live API returns Bamberton and New Brunswick Sugarloaf from Supabase with alertable labels and source evidence.
- Live `/api/check-availability` now returns 410 retired with `engine: railway-worker`.
- Worker heartbeat fix pushed at `d7464921c`: quiet cycles now write `worker_status`.
- GitHub CI is green for the heartbeat fix.
- Live `/api/admin/provider-quality` now reads live Supabase and reports `railway_worker` as degraded with `missing_worker_heartbeat`.
- The same production route reports 5 active watches.
- Live `worker_status` still returns no rows after the fix, so Railway runtime health remains unverified.
- GitHub deployment metadata for the fix points to Vercel site deployment, not Railway worker deployment.
- Realtime-alertable campsite estimate remains unverified; campground rows do not equal campsite count.

Next prompt:

> Smoke-test live watch creation and Railway worker health. Keep campsite-level counts separate from campground-row counts.

### Epic 2: Canada Coverage Sprint

Status: Yellow

Customer promise affected:

- Whether Alphacamper feels Canada-first instead of BC/Ontario-first.

Must prove:

- Manitoba and Nova Scotia are visible in search.
- Support statuses are correct.
- Worker can poll the provider or the product labels it honestly as not alertable yet.
- No unsupported provider is marketed as working.

Current result:

- New Brunswick provider proof is green enough to mark 9 campground rows alertable.
- Manitoba and Nova Scotia are live in search as verified search-only rows: 45 and 20.
- Alberta and Saskatchewan were researched as likely shared Aspira/ReserveAmerica-style adapter work, but remain 0 alertable rows.

Next prompt:

> Build the next provider adapter proof: Alberta first, then Saskatchewan if the adapter pattern transfers. In parallel, prove Manitoba/Nova Scotia live polling before upgrading them from search-only.

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

Current result:

- Code now moves Recreation.gov into the Railway worker.
- Code retires `/api/check-availability` and removes the Vercel cron schedule.
- Live `/api/check-availability` now returns the retired Railway-worker message.
- Local worker/site tests and builds pass.
- Live Supabase `worker_status` currently has no heartbeat row, so worker runtime health still needs Railway-side verification.
- Railway CLI in this shell is not authenticated, so the worker service status could not be checked directly.

Next prompt:

> Verify Railway worker deployment/health and confirm the heartbeat includes Recreation.gov.

### Epic 4: Parks Canada Enrichment

Status: Yellow

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

Current result:

- Catalog ingestion factory exists in code for BC, Ontario, Parks Canada, Manitoba, Nova Scotia, and New Brunswick.
- Live refresh completed from official/provider directories on 2026-05-09.
- Provider sync records show six succeeded refreshes.
- Stale rows were marked unsupported instead of counted as alertable.
- Not green yet because the recurring deploy/ops path is not proven.

Next prompt:

> Turn the importer into an operational job with provider health surfaced to admins, then extend it to Newfoundland/Labrador and the Ontario regional systems.

### Epic 7: Billing Truth And Revenue Reporting

Status: Red

Customer promise affected:

- Whether campers understand what they are buying and whether Alphacamper can honestly track progress toward $10k by summer end.

Must prove:

- Checkout copy matches Stripe mode.
- The live database has the billing/conversion tables the app expects, or reporting intentionally uses Stripe as the source of truth.
- Operators can see gross revenue, net revenue, paid pass counts, refunds, active watches, delivered alerts, and booking outcome events.

Current result:

- Checkout UI says the summer and year passes are one-time.
- `/api/checkout` creates Stripe sessions with `mode: "subscription"`.
- `/api/stripe/webhook` writes subscription state into a `subscriptions` table.
- The latest live aggregate read could not find `subscriptions` or `funnel_events` in the live schema cache.
- `docs/research/summer-revenue-scoreboard.md` now defines the $10k scoreboard and the recommended decision.

Next prompt:

> Resolve one-time payment vs subscription, align the customer copy and Stripe mode, then prove weekly operator revenue reporting from Stripe and/or live Supabase.

## Current Recommended Next Runs

Already reported:

1. Phase 2 Live Catalog Fix: yellow after migration and customer-search verification.
2. Alert Engine Truth Audit: yellow.
3. North America Provider Roadmap: yellow.

Do not relaunch those same windows unless the scope changes.

Reported back and integrated:

1. Canada Provider Proof: New Brunswick alertable; Alberta/Saskatchewan need adapter work.
2. Alert Engine Cleanup: Recreation.gov moved into Railway in code; Vercel cron retired in code.
3. Catalog Ingestion Factory: official/provider refresh ran live for six providers.

Next recommended runs:

1. Production Worker Smoke: verify Railway worker deploy/health and heartbeat.
2. Customer Watch And Notification Smoke: once heartbeat is green, prove one real watch, notification, guardrail, and cleanup path.
3. Billing Truth And Revenue Reporting: make the $10k goal measurable and fix the one-time-vs-subscription mismatch.
4. Alberta/Saskatchewan Adapter Sprint: build the shared adapter proof without marketing them as alertable yet.
5. Provider Health/Admin Truth: turn sync records and worker health into an admin-facing operator view.
6. Demand Capture: let unsupported searches become a prioritization queue.

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
- Live Supabase now powers 461 safe searchable rows from official/provider directories.
- We have 396 verified alertable campground rows, but not a verified campsite-level count yet.
- We should not claim broad alertable Canada coverage until worker heartbeat, notification smoke, and campsite-level counts are proven.
- We should not claim the $10k goal is measurable from the app database until billing mode and live revenue reporting are fixed.
- The next real unlock is Railway worker proof, then customer watch/notification smoke, then billing truth, then Alberta/Saskatchewan adapter work.

## North Star

Major success line:

- 50,000 verified realtime-alertable Canadian campsites.

Longer-term category leadership line:

- 250,000 to 350,000+ realtime-alertable North American campsites, plus a better customer experience for finding realistic openings.

Business line:

- $10k revenue by the end of summer.
- Count net collected revenue as the real success number; use gross revenue as an early warning signal.

Only count realtime-alertable inventory when measuring this goal. Search-only rows, static fallback rows, unverified seeds, and coming-soon providers are useful, but they do not count toward the realtime success number.
