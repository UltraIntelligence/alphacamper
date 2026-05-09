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

- Live Supabase has 387 campground rows.
- The Phase 1 support-status migration was applied and verified on 2026-05-09.
- `/api/campgrounds?q=Bamberton` now returns a live-only Supabase row.
- All existing rows defaulted to `alertable`, so support truth still needs provider normalization.
- Zero campsites should be counted toward the 50,000 realtime-alertable north-star target until worker polling and notifications are verified by provider.

## Completed Goal Windows

### Epic 1: Phase 2 Live Catalog Fix

Status: yellow.

What changed:

- Live Supabase project `tbdrmcdrfgunbcevslqf` is readable.
- Live `campgrounds.support_status`, `provider_key`, `source_url`, and `last_verified_at` now exist.
- `idx_campgrounds_support_status` exists.
- Live DB rows:
  - BC Parks: 144.
  - Ontario Parks: 129.
  - Parks Canada: 114.
  - Total: 387.
- `/api/campgrounds?q=Bamberton` returns the live-only Bamberton row.
- Local guardrail tests passed: 3 files, 18 tests.

Decision:

- Start provider proof and ingestion work.
- Do not market 387 rows as truly alertable until support labels are normalized by provider proof.

Next proof:

> Verify worker polling and notification truth, then downgrade any unproven live rows to `search_only` or `coming_soon`.

### Epic 3: Alert Engine Truth Audit

Status: yellow.

What we learned:

- Railway worker should be the real Canadian alert engine.
- Worker supports the broader Canadian Camis/GoingToCamp-style set.
- Vercel cron is a weaker legacy path.
- Recreation.gov still depends on Vercel cron.
- BC/Ontario may currently be touched by both engines.

Decision:

- Do not count Vercel cron toward the 50,000 Canadian realtime-alertable target.
- Move Recreation.gov into Railway worker before retiring Vercel cron.
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

## Running Now

### 1. Canada provider proof window

Scope:

- New Brunswick GoingToCamp alertability.
- Alberta/Saskatchewan adapter discovery.

Reason:

- New Brunswick may be a fast Canada parity win.
- Alberta and Saskatchewan are the biggest visible Canadian gaps.

### 2. Alert-engine cleanup window

Scope:

- Move Recreation.gov into Railway worker or explicitly label it as Vercel-cron-only/search-limited until moved.
- Narrow or retire `/api/check-availability`.

Reason:

- One customer alert should have one true engine.

### 3. Catalog ingestion factory

Scope:

- Official/provider directory imports.
- Source URLs and raw payload evidence.
- Support status, availability mode, last verified date, and confidence.

Reason:

- This is how Alphacamper scales beyond hand-curated lists.

## What Not To Claim Yet

Do not claim:

- broad Canadian coverage
- 50,000 realtime-alertable campsites
- Manitoba/Nova Scotia/NB/Alberta/Saskatchewan alertability
- all search results are alertable
- Vercel cron-backed providers count toward the Canadian realtime target

Safe claim:

- Alphacamper has the foundation for Canada-first expansion.
- Alphacamper's expanded live catalog search is now working.
- The next work is proving provider alertability one system at a time.
