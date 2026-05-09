# Control Tower Snapshot — 2026-05-09

## North Star

First success line:

- 50,000 verified realtime-alertable Canadian campsites.

Longer-term category leadership line:

- 250,000 to 350,000+ realtime-alertable North American campsites, plus a better customer experience for finding realistic openings.

## Current Verdict

We have the right strategy and the right workstreams.

We are not yet ready to claim expanded Canadian coverage.

The blocker is live catalog trust:

- Live Supabase has 387 campground rows.
- Live Supabase is missing the new support-status columns.
- The customer-safe searchable count remains the 174-row static fallback.
- Zero campsites should be counted toward the 50,000 realtime-alertable north-star target from this pass.

## Completed Goal Windows

### Epic 1: Phase 2 Live Catalog Fix

Status: red.

What we learned:

- Live Supabase project `tbdrmcdrfgunbcevslqf` is readable.
- Live `campgrounds.support_status` does not exist.
- Live DB rows:
  - BC Parks: 144.
  - Ontario Parks: 129.
  - Parks Canada: 114.
  - Total: 387.
- `/api/campgrounds` still protects customers by falling back to static rows.
- A live-only row did not appear through the customer API.

Decision:

- Do not start coverage expansion yet.
- Apply the Phase 1 migration, then re-run verification.

Approval prompt:

> Yes, apply the Phase 1 campground support-status migration to live Supabase project `tbdrmcdrfgunbcevslqf`, then re-run the read-only verification.

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

## Next Launch Order

### 1. Apply/verify live catalog migration

This is the gate.

Do not proceed to customer-facing expansion until this is green.

### 2. Launch Canada provider proof window

Scope:

- New Brunswick GoingToCamp alertability.
- Alberta/Saskatchewan adapter discovery.

Reason:

- New Brunswick may be a fast Canada parity win.
- Alberta and Saskatchewan are the biggest visible Canadian gaps.

### 3. Launch alert-engine cleanup window

Scope:

- Move Recreation.gov into Railway worker or explicitly label it as Vercel-cron-only/search-limited until moved.
- Narrow or retire `/api/check-availability`.

Reason:

- One customer alert should have one true engine.

### 4. Launch catalog ingestion factory

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
- The next work is making the live catalog trustworthy, then proving provider alertability one system at a time.
