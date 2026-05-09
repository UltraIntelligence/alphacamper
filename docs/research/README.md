# Alphacamper Research Control Tower

Last updated: 2026-05-09

Start here for the North America campsite-alert expansion work.

## What This Folder Is Doing

This folder is now the control tower for the big coverage push:

- what we believe today
- what is blocked
- what epics should run next
- what each long-running window must prove
- how reports should come back

## Operating Model

This thread is the control tower.

Each separate window should be launched as its own large goal, not a small ticket. A goal window can research, code, verify, hit blockers, and report back with evidence.

The control tower does not redo the window's work. It decides what the report means, updates the board, and launches the next large goal.

Use extra-high reasoning for the broadest windows: Live Catalog Fix, Alert Engine Truth Audit, Provider Roadmap, and Catalog Ingestion Factory. Use high reasoning for Canada Coverage Sprint and Parks Canada Enrichment.

## Open First

1. `north-america-control-tower.md`
   - The main strategy board.
   - Use this to understand the big arc and current recommended order.

2. `north-star-success-metrics.md`
   - Defines the major goal and the campsite-count thresholds for success.
   - Use this when deciding whether the program is actually winning.

3. `control-tower-status-board.md`
   - The live status board.
   - Use this when another goal window reports back.

4. `control-tower-snapshot-2026-05-09.md`
   - The current executive snapshot after the first three goal windows reported.
   - Use this for the fastest read of where things stand now.

5. `epic-launch-prompts.md`
   - Copy-paste prompts for the separate long-running goal windows.
   - Use this to launch the next workstreams.

6. `live-catalog-migration-runbook.md`
   - The approval-gated runbook for applying and verifying the live Supabase catalog migration.
   - Use this before any customer-facing coverage expansion.

7. `live-catalog-verification.sql`
   - Read-only SQL checks for the live catalog before and after the migration.
   - Use this inside the Supabase SQL Editor alongside the runbook.

8. `current-action-queue.md`
   - The immediate operating queue.
   - Use this to see what to launch now, what is held, and why.

9. `post-migration-launch-pack.md`
   - The next huge goal windows to launch after the live catalog migration is verified.
   - Use this immediately after Epic 1 is no longer red.

10. `competitor-data-pipeline-playbook.md`
   - Explains how competitors likely built high-quality campground data.
   - Use this when planning catalog ingestion and enrichment.

11. `provider-scoring-rubric.md`
   - Gives the roadmap window a consistent way to rank the next providers.
   - Use this for Alberta, Saskatchewan, PEI, Quebec/SEPAQ, and US expansion decisions.

12. `report-intake-procedure.md`
    - Explains how to process reports from long-running goal windows.
    - Use this when a window comes back green/yellow/red.

13. `control-tower-artifact-audit.md`
    - Maps the original control-tower request to the actual docs in this folder.
    - Use this to check whether the operating system still covers the brief.

## Current Control-Tower Read

Do not claim broad Canada alertable coverage yet.

The live catalog schema gate is now cleared:

- Phase 1 code is pushed.
- The live Supabase support-status and catalog-evidence migrations were applied and verified on 2026-05-09.
- Customer search now returns live-only rows such as Bamberton and New Brunswick Sugarloaf.
- Live catalog refresh from official/provider directories now has 461 safe searchable rows.
- Verified alertable campground rows: 396.
- Search-only campground rows: 65.
- Watch creation guardrails pass local tests, but production watch creation still needs a customer-path smoke test after deploy.
- Site deploy is live: `/api/check-availability` returns 410 retired.
- Railway worker heartbeat is not yet proven; live `worker_status` currently has no rows.

Major success line:

- 50,000 verified realtime-alertable Canadian campsites.

Longer-term category leadership line:

- 250,000 to 350,000+ realtime-alertable North American campsites, plus a better customer experience for finding realistic openings.

Business line:

- $10k revenue by the end of summer.

## Current Window Status

Already reported back:

1. Phase 2 Live Catalog Fix: yellow after migration and search verification.
2. Alert Engine Truth Audit: yellow.
3. North America Provider Roadmap: yellow.
4. Canada Provider Proof: yellow; New Brunswick is alertable, Alberta/Saskatchewan need adapter work.
5. Alert Engine Cleanup: yellow until Railway worker runtime proof.
6. Catalog Ingestion Factory: yellow until recurring ops/admin health are proven.

Do not relaunch those same windows just because this conversation was forked.

Next high-leverage runs:

1. Production Worker Smoke.
2. Alberta/Saskatchewan Adapter Sprint.
3. Provider Health/Admin Truth.
4. Demand Capture And Conversion.

Run when official Parks Canada source data is selected:

1. Parks Canada Enrichment.

## Rule Of Thumb

Searchable is not the same as alertable.

Alphacamper should show customers exactly what we can alert now, what we know about but cannot alert yet, and what they can request next.
