# Post-Migration Launch Pack

Last updated: 2026-05-09

Use this only after the live catalog migration is applied and verified.

Status:

- Gate cleared on 2026-05-09.
- These windows reported back and were integrated on 2026-05-09.
- This pack is now historical context for the first post-migration goal windows, not the current launch queue.
- Current next work should focus on Railway worker smoke and Stripe billing truth in parallel, then customer notification proof, provider health/admin truth, get-you-the-site proof, and future Alberta/Saskatchewan live implementation.

## Gate Before Launching

Do not launch these windows until:

- `campgrounds.support_status` exists in live Supabase.
- `provider_key`, `source_url`, and `last_verified_at` exist in live Supabase.
- `/api/campgrounds` returns live rows without schema errors.
- The control tower has updated Epic 1 from red to at least yellow.

## Launch 1: Canada Provider Proof

Reasoning level: extra-high.

Current state:

- Reported back and intaken.
- New Brunswick is alertable after provider proof.
- Alberta/Saskatchewan discovery is closed; live implementation waits for #9 Railway heartbeat and #13 customer notification proof.

Goal:

> Historical goal: verify New Brunswick GoingToCamp alertability and run Alberta/Saskatchewan adapter discovery against official reservation pages. Future follow-up: build Alberta/Saskatchewan live polling only after Railway heartbeat and notification proof are green.

Why this is next:

- New Brunswick may be the fastest Canada parity win.
- Alberta and Saskatchewan are the largest visible Canadian gaps.
- This directly advances the 50,000 verified realtime-alertable Canadian campsite target.

Scope:

- New Brunswick GoingToCamp proof.
- Alberta reservation-system discovery.
- Saskatchewan reservation-system discovery.
- Clear decision on whether Alberta/Saskatchewan share an adapter.

Must prove:

- Directory source.
- Availability source.
- Whether worker can poll site-level availability.
- Whether notification path can fire.
- Whether provider should be `alertable`, `search_only`, `coming_soon`, or `unsupported`.

Report back:

```text
Epic: Canada Provider Proof
Status: green / yellow / red

Providers checked:
- New Brunswick:
- Alberta:
- Saskatchewan:

Verified evidence:
- ...

Customer truth:
- Searchable:
- Alertable:
- Realtime-alertable campsite estimate:
- Search-only / coming soon:

Risks:
- ...

Recommended control-tower update:
- ...
```

## Launch 2: Alert Engine Cleanup

Reasoning level: extra-high.

Current state:

- Code moved Recreation.gov into the Railway worker.
- The live site now returns the retired Railway-worker message from `/api/check-availability`.
- This remains yellow until Railway itself proves the worker deploy/runtime and `worker_status` heartbeat.

Goal:

> Move Recreation.gov into the Railway worker or explicitly mark it as Vercel-cron-only/search-limited until moved. Then narrow or retire `/api/check-availability` so customer alerts have one true engine.

Why this is next:

- Railway worker should be the Canadian alert-engine owner.
- Vercel cron is weaker and should not count toward the 50,000 Canadian realtime target.
- Recreation.gov was the blocker for retiring the older Vercel cron path; follow-up cleanup moved it into Railway in code.

Scope:

- Recreation.gov alert path.
- `/api/check-availability`.
- `vercel.json` cron schedule.
- Worker support feasibility for Recreation.gov.
- Customer-facing labels while transition is incomplete.

Must prove:

- Which engine handles each platform.
- Whether any platform is double-polled.
- Whether any alert path creates silent alerts without email/SMS.
- What can safely be retired now versus later.

Report back:

```text
Epic: Alert Engine Cleanup
Status: green / yellow / red

What changed or was verified:
- ...

Platform ownership:
- Railway worker:
- Vercel cron:
- Search-only:

Customer truth:
- ...

Risks:
- ...

Recommended control-tower update:
- ...
```

## Launch 3: Catalog Ingestion Factory

Reasoning level: extra-high.

Goal:

> Build Alphacamper's catalog ingestion factory from official/provider data, with source evidence, support status, availability mode, last verified date, confidence, and dedupe rules.

Why this waits until after provider proof:

- The factory should encode real provider patterns, not guess.
- New Brunswick/Alberta/Saskatchewan proof will teach the next ingestion shape.

Scope:

- Official/provider directory imports.
- Raw payload/source evidence.
- Support status.
- Availability mode.
- Last verified date.
- Confidence.
- Failed/stale provider reporting.

Report back:

```text
Epic: Catalog Ingestion Factory
Status: green / yellow / red

Ingestion jobs:
- ...

Counts:
- Searchable:
- Alertable:
- Realtime-alertable campsite estimate:
- Search-only:
- Coming soon:

Failed/stale providers:
- ...

Recommended control-tower update:
- ...
```

## Control-Tower Note

The first provider-proof and ingestion pass normalized the default labels:

- BC, Ontario, Parks Canada, and New Brunswick are live alertable campground rows.
- Manitoba and Nova Scotia are repo-ready as alertable/live-polling profiles, but live label sync waits until Railway reliability is green.
- Three stale rows are unsupported.

Do not treat the 396 live alertable campground rows as the 50,000 campsite success metric. Current provider-inventory proof is 51,997 campsite IDs, but reliability remains yellow until Railway heartbeat, active-watch polling, alert creation, and notification delivery are green.
