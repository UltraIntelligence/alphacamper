# Post-Migration Launch Pack

Last updated: 2026-05-09

Use this only after the live catalog migration is applied and verified.

## Gate Before Launching

Do not launch these windows until:

- `campgrounds.support_status` exists in live Supabase.
- `provider_key`, `source_url`, and `last_verified_at` exist in live Supabase.
- `/api/campgrounds` returns live rows without schema errors.
- The control tower has updated Epic 1 from red to at least yellow.

## Launch 1: Canada Provider Proof

Reasoning level: extra-high.

Goal:

> Verify New Brunswick GoingToCamp alertability, then run Alberta/Saskatchewan adapter discovery against official reservation pages. Keep every new provider searchable-only until site-level availability polling is proven.

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

Goal:

> Move Recreation.gov into the Railway worker or explicitly mark it as Vercel-cron-only/search-limited until moved. Then narrow or retire `/api/check-availability` so customer alerts have one true engine.

Why this is next:

- Railway worker should be the Canadian alert-engine owner.
- Vercel cron is weaker and should not count toward the 50,000 Canadian realtime target.
- Recreation.gov currently blocks retiring the older Vercel cron path.

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

If migration verification shows all existing live rows default to `alertable`, do not treat that as customer truth automatically. The next provider proof must decide which providers are truly alertable.
