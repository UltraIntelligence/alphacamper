# Control Tower Snapshot — 2026-05-09

## North Star

First success line:

- 50,000 verified realtime-alertable Canadian campsites.

Longer-term category leadership line:

- 250,000 to 350,000+ realtime-alertable North American campsites, plus a better customer experience for finding realistic openings.

Business line:

- $10k revenue by the end of summer.

## Current Verdict

We have the right strategy and the right workstreams.

We are not yet ready to claim broad Canadian alertable coverage.

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
- Support labels are normalized for BC, Ontario, Parks Canada, Manitoba, Nova Scotia, and New Brunswick.
- Worker heartbeat fix is pushed at `d7464921c`, but live `worker_status` still has no rows, so Railway runtime health remains unverified.
- Zero campsites should be counted toward the 50,000 realtime-alertable north-star target until worker polling and notifications are verified by provider.

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

> Verify Railway worker health, production watch creation, and campsite-level counts.

### Epic 3: Alert Engine Truth Audit

Status: yellow.

What we learned:

- Railway worker should be the real Canadian alert engine.
- Worker supports the broader Canadian Camis/GoingToCamp-style set.
- Vercel cron is a weaker legacy path.
- Follow-up cleanup moved Recreation.gov into Railway worker in code.
- Follow-up cleanup retired `/api/check-availability` and removed Vercel cron in code.
- The site deployment is proven; Railway worker heartbeat is still pending.

Decision:

- Do not count Vercel cron toward the 50,000 Canadian realtime-alertable target.
- Verify the Railway worker heartbeat before treating this as fully live truth.
- Alertable should mean search + watch creation + worker polling + notification path are verified.

### Epic 5: North America Provider Roadmap

Status: yellow.

Top next bets:

1. Alberta Parks.
2. Saskatchewan Parks.
3. New Brunswick, then PEI.
4. US GoingToCamp cluster: Washington, Wisconsin, Michigan, Maryland.
5. ReserveCalifornia later, after Canada core.

Decision:

- Next proof workstream after catalog unblocks:
  - New Brunswick GoingToCamp alertability.
  - Alberta/Saskatchewan adapter discovery.
- Keep SEPAQ research-only until Cloudflare and French-first UX risks are solved.
- Hold broad US rollout until Canada parity providers are visibly searchable and verified alertable.

## Follow-Up Goal Windows Integrated

### 1. Canada provider proof window

Result:

- New Brunswick is alertable after directory and site-level availability proof.
- Alberta and Saskatchewan likely need shared Aspira/ReserveAmerica-style adapter work.

Next action:

- Build Alberta first, then transfer the adapter to Saskatchewan if the shape holds.

### 2. Alert-engine cleanup window

Result:

- Recreation.gov worker support exists in code.
- The Vercel cron path is retired in code.

Next action:

- Deploy and smoke-test production behavior.

### 3. Catalog ingestion factory

Result:

- Official/provider imports exist for six providers.
- Live refresh succeeded for all six.
- Stale rows are now unsupported.

Next action:

- Make provider sync and worker health visible to admins.

## What Not To Claim Yet

Do not claim:

- broad Canadian coverage
- 50,000 realtime-alertable campsites
- Manitoba/Nova Scotia/Alberta/Saskatchewan alertability
- all search results are alertable
- Vercel cron-backed providers count toward the Canadian realtime target

Safe claim:

- Alphacamper has the foundation for Canada-first expansion.
- Alphacamper's expanded live catalog search is now working with 461 safe searchable campground rows.
- New Brunswick is now in the alertable set after provider proof.
- The next work is Railway worker proof, campsite-level counts, and Alberta/Saskatchewan adapter work.
