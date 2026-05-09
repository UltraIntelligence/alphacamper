# Control Tower Snapshot — 2026-05-09

## North Star

Product ambition:

- Build a tier-one Campnab/Campflare competitor.
- Distinction: not just finding the site, but helping the camper get the site.
- Help regular campers become Alphacampers: prepared, fast to act, and guided toward the best realistic booking move.

First success line:

- 50,000 verified realtime-alertable Canadian campsites.

Longer-term category leadership line:

- 250,000 to 350,000+ realtime-alertable North American campsites, plus a better customer experience for finding realistic openings.

Business line:

- $10k net collected revenue by the end of summer.
- Count net collected revenue as the real success number; use gross revenue as an early signal.

## Current Verdict

We have the right strategy and the right workstreams.

We are not yet ready to claim broad Canadian alertable coverage.

We are also not yet ready to claim app-side revenue reporting is trustworthy.

The live catalog schema blocker is cleared:

- Live Supabase has 464 known catalog rows.
- 461 are safe customer-searchable rows.
- 396 are verified alertable campground rows.
- 65 are verified search-only campground rows.
- 3 stale rows are marked unsupported.
- The Phase 1 support-status and catalog-evidence migrations were applied and verified on 2026-05-09.
- `/api/campgrounds?q=Bamberton` now returns a live-only Supabase row.
- `/api/campgrounds?q=Sugarloaf` returns the New Brunswick provider-proof row.
- `/api/check-availability` now returns 410 retired on the live site.
- `/api/admin/provider-quality` now reads live Supabase on production and reports 5 active watches.
- Support labels are normalized for BC, Ontario, Parks Canada, and New Brunswick live; Manitoba and Nova Scotia are repo-ready for alertable/live-polling after the next deploy/sync.
- Production provider-quality reports `railway_worker` degraded with `missing_worker_heartbeat`.
- Worker heartbeat code is pushed, but live `worker_status` still has no rows, so Railway runtime health remains unverified.
- GitHub/Vercel status does not prove the worker deployed; Railway itself must show a successful `alphacamper-worker` deploy and a live heartbeat.
- Checkout code now uses one-time Stripe payment mode to match the one-time pass copy.
- Live Supabase now has `subscriptions` and `funnel_events`, both currently with 0 rows.
- Production Vercel is missing Stripe env vars, so live checkout is not green yet.
- 51,997 campsite IDs are now verified from provider availability-matrix responses across BC Parks, Ontario Parks, Parks Canada, New Brunswick, Manitoba, and Nova Scotia.
- The first 50,000 Canada inventory line is crossed by 1,997 IDs, but worker heartbeat/notification proof remains separate.
- Worker polling and notifications are still not proven, so do not use this count as a reliability claim.

## Control Tower Tracker Lanes

External blocker lane:

- https://github.com/UltraIntelligence/alphacamper/milestone/1
- #9 Railway worker heartbeat.
- #10 Stripe production checkout and revenue proof.

Next epic lane:

- https://github.com/UltraIntelligence/alphacamper/milestone/2
- #19 Demand capture and conversion path.
- #16 First paid cohort sprint.
- #13 Customer watch and notification delivery.
- #18 Manitoba/Nova Scotia label sync.
- #11 Provider health/admin truth.
- #15 Paid alert-to-assist loop.
- #17 Canada parity expansion.
- #12 Alberta/Saskatchewan adapter discovery is closed; future live implementation waits for #9/#13.
- #14 Parks Canada enrichment is closed; live province search and six production province pages are verified.

Current intake rule:

- Match every returning goal-window report to its GitHub tracker.
- Comment the evidence back on that tracker.
- Update the status board only after checking the evidence.
- Do not relaunch old windows just because the conversation was forked.

## Completed Goal Windows

### Epic 1: Phase 2 Live Catalog Fix

Status: yellow.

What changed:

- Live Supabase project `tbdrmcdrfgunbcevslqf` is readable.
- Live `campgrounds.support_status`, `provider_key`, `source_url`, and `last_verified_at` now exist.
- `idx_campgrounds_support_status` exists.
- Initial post-migration live DB rows were 387 before the provider refresh.
- `/api/campgrounds?q=Bamberton` returns the live-only Bamberton row.
- Local guardrail tests passed: 3 files, 18 tests.
- The follow-up live refresh now has:
  - BC Parks: 145 alertable.
  - Ontario Parks: 129 alertable.
  - Parks Canada: 113 alertable.
  - New Brunswick: 9 alertable.
  - Manitoba: 45 search-only.
  - Nova Scotia: 20 search-only.
  - Unsupported stale rows: 3.

Decision:

- Smoke-test the Railway worker runtime and customer watch path.
- Do not market campground-row counts as campsite-level coverage.

Next proof:

> Verify Railway worker health, production watch creation, and customer notification delivery.

### Epic 3: Alert Engine Truth Audit

Status: yellow.

What we learned:

- Railway worker should be the real Canadian alert engine.
- Worker supports the broader Canadian Camis/GoingToCamp-style set.
- Vercel cron is a weaker legacy path.
- Follow-up cleanup moved Recreation.gov into Railway worker in code.
- Follow-up cleanup retired `/api/check-availability` and removed Vercel cron in code.
- The site deployment is proven; Railway worker heartbeat is still pending.
- Production provider-quality now makes that blocker visible without manual SQL.

Decision:

- Do not count Vercel cron toward the 50,000 Canadian realtime-alertable target.
- Verify the Railway worker heartbeat before treating this as fully live truth.
- Alertable should mean search + watch creation + worker polling + notification path are verified.

### Epic 5: North America Provider Roadmap

Status: yellow.

Top roadmap bets:

1. Alberta Parks.
2. Saskatchewan Parks.
3. PEI.
4. US GoingToCamp cluster: Washington, Wisconsin, Michigan, Maryland.
5. ReserveCalifornia later, after Canada core.

Decision:

- New Brunswick is already in the alertable set after provider proof.
- Alberta/Saskatchewan discovery is closed; future live implementation waits for Railway heartbeat and customer notification proof.
- Keep SEPAQ research-only until Cloudflare and French-first UX risks are solved.
- Hold broad US rollout until Canada parity providers are visibly searchable and verified alertable.

## Follow-Up Goal Windows Integrated

### 1. Canada provider proof window

Result:

- New Brunswick is alertable after directory and site-level availability proof.
- Alberta and Saskatchewan discovery is closed: official `ABPP` and `SKPP` paths are proven, but both remain search-only until live polling and notification proof exist.

Next action:

- Do not launch implementation until #9 and #13 are green. Then build Alberta live polling first, transfer the adapter to Saskatchewan if the shape holds, and only upgrade labels after watch -> poll -> alert -> notification proof.

### 2. Alert-engine cleanup window

Result:

- Recreation.gov worker support exists in code.
- The Vercel cron path is retired in code and on the live site.

Next action:

- Prove Railway worker deploy/runtime behavior from Railway itself, then rerun worker smokes.

### 3. Catalog ingestion factory

Result:

- Official/provider imports exist for six providers.
- Live refresh succeeded for all six.
- Stale rows are now unsupported.

Next action:

- Make provider sync and worker health visible to admins.

### 4. Billing truth and revenue scoreboard

Result:

- `docs/research/summer-revenue-scoreboard.md` defines the $10k target, pass-count math, net-vs-gross rule, and the current billing/reporting blocker.
- Follow-up code now aligns checkout with one-time pass purchases and creates the live billing/conversion tables.

Next action:

- Configure production Stripe env vars, prove one checkout/webhook path, then verify revenue and funnel reporting from Stripe and/or live Supabase.

## What Not To Claim Yet

Do not claim:

- broad Canadian coverage
- 50,000 realtime-alertable campsites
- Manitoba/Nova Scotia live alertability labels, or Alberta/Saskatchewan alertability
- all search results are alertable
- Vercel cron-backed providers count toward the Canadian realtime target
- $10k progress is measurable from the app database

Safe claim:

- Alphacamper has the foundation for Canada-first expansion.
- Alphacamper's expanded live catalog search is now working with 461 safe searchable campground rows.
- New Brunswick is now in the alertable set after provider proof.
- The first 50,000 Canadian campsite-inventory line has been crossed with 51,997 verified provider campsite IDs, but reliability remains yellow.
- The next work is Railway worker proof, billing truth, first paid cohort, customer notification smoke, provider health/admin truth, paid alert-to-assist proof, and Canada parity expansion after reliability is green. Alberta/Saskatchewan discovery and Parks Canada enrichment are already closed unless the scope changes.
