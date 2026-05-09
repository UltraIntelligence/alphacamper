# Alphacamper Research Control Tower

Last updated: 2026-05-09

Start here for the North America campsite-alert expansion work.

Current external blocker milestone: https://github.com/UltraIntelligence/alphacamper/milestone/1

Current next-epic milestone: https://github.com/UltraIntelligence/alphacamper/milestone/2

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

Use extra-high reasoning for the broadest windows: Live Catalog Fix, Alert Engine Truth Audit, Provider Roadmap, Catalog Ingestion Factory, and Alberta/Saskatchewan Adapter Sprint. Use high reasoning for Production Worker Smoke, Customer Watch And Notification Smoke, Billing Truth And Revenue Reporting, Canada Coverage Sprint, Parks Canada Enrichment, Provider Health/Admin Truth, and Demand Capture.

## Open First

1. `north-america-control-tower.md`
   - The main strategy board.
   - Use this to understand the big arc and current recommended order.

2. `north-star-success-metrics.md`
   - Defines the major goal and the campsite-count thresholds for success.
   - Use this when deciding whether the program is actually winning.

3. `summer-revenue-scoreboard.md`
   - Defines the $10k summer revenue scoreboard.
   - Use this when deciding whether coverage is turning into paid camper outcomes.

4. `control-tower-status-board.md`
   - The live status board.
   - Use this when another goal window reports back.

5. `control-tower-operator-unblock-pack.md`
   - The short operator-facing unblock guide for Railway, Stripe, notification proof, and Manitoba/Nova Scotia label sync.
   - Use this when the work is blocked on external service access or production configuration.

6. `control-tower-snapshot-2026-05-09.md`
   - The current executive snapshot after the first three goal windows reported.
   - Use this for the fastest read of where things stand now.

7. `epic-launch-prompts.md`
   - Copy-paste prompts for the separate long-running goal windows.
   - Use this to launch the next workstreams.

8. `live-catalog-migration-runbook.md`
   - The approval-gated runbook for applying and verifying the live Supabase catalog migration.
   - Use this before any customer-facing coverage expansion.

9. `live-catalog-verification.sql`
   - Read-only SQL checks for the live catalog before and after the migration.
   - Use this inside the Supabase SQL Editor alongside the runbook.

10. `current-action-queue.md`
   - The immediate operating queue.
   - Use this to see what to launch now, what is held, and why.

11. `post-migration-launch-pack.md`
   - The next huge goal windows to launch after the live catalog migration is verified.
   - Use this immediately after Epic 1 is no longer red.

12. `competitor-data-pipeline-playbook.md`
   - Explains how competitors likely built high-quality campground data.
   - Use this when planning catalog ingestion and enrichment.

13. `provider-scoring-rubric.md`
   - Gives the roadmap window a consistent way to rank the next providers.
   - Use this for Alberta, Saskatchewan, PEI, Quebec/SEPAQ, and US expansion decisions.

14. `report-intake-procedure.md`
    - Explains how to process reports from long-running goal windows.
    - Use this when a window comes back green/yellow/red.

15. `control-tower-artifact-audit.md`
    - Maps the control-tower request to the actual docs, commands, evidence, and remaining gaps.
    - Use this to audit whether the operating system still covers the brief before calling anything complete.

16. `railway-worker-smoke-runbook.md`
    - The current production worker blocker.
    - Use this to verify Railway deploy/runtime, `worker_status`, and alert-engine ownership.

17. `revenue-readiness-runbook.md`
    - The Stripe and first-paid-customer proof path.
    - Use this for #10 before calling the $10k scoreboard measurable.

18. `customer-watch-notification-smoke-runbook.md`
    - The next proof after Railway heartbeat is green.
    - Use this to verify real watch creation, guardrails, alert rows, notification delivery, and cleanup.

19. `get-the-site-moat-plan.md`
    - The product moat plan for helping campers get the site after an alert.
    - Use this when #15 is ready to move from strategy into paid-loop proof.

## Current Control-Tower Read

Do not claim broad Canada alertable coverage yet.

The live catalog schema gate is now cleared:

- Phase 1 code is pushed.
- The live Supabase support-status and catalog-evidence migrations were applied and verified on 2026-05-09.
- Customer search now returns live-only rows such as Bamberton and New Brunswick Sugarloaf.
- Live catalog refresh from official/provider directories now has 461 safe searchable rows.
- Verified alertable campground rows: 396 live; 461 repo-ready after Manitoba and Nova Scotia sync.
- Search-only campground rows: 65 live; 0 after Manitoba and Nova Scotia sync.
- Watch creation guardrails pass local tests, but production watch creation still needs a customer-path smoke test after deploy.
- Site deploy is live: `/api/check-availability` returns 410 retired.
- Production provider-quality is live: `/api/admin/provider-quality` reads live Supabase, reports 5 active watches, and flags `railway_worker` as degraded with `missing_worker_heartbeat`.
- Railway worker heartbeat is not yet proven; live `worker_status` currently has no rows.
- Campsite-level inventory proof is now at 51,997 verified campsite IDs from provider availability responses across BC Parks, Ontario Parks, Parks Canada, New Brunswick, Manitoba, and Nova Scotia. This crosses the first 50,000 Canada inventory line by 1,997 IDs.
- Thread heartbeat automation `alphacamper-worker-heartbeat-watch` is active every 30 minutes to re-run worker reliability smoke and billing readiness smoke, then report back here. It should comment on #9 or #10 only when a gate changes, turns green, or reveals a new blocker.
- Operator unblock order is documented in `docs/research/control-tower-operator-unblock-pack.md`: Railway heartbeat, Stripe revenue proof, customer notification proof, then Manitoba/Nova Scotia live-label sync.

Major success line:

- 50,000 verified realtime-alertable Canadian campsites.

Longer-term category leadership line:

- 250,000 to 350,000+ realtime-alertable North American campsites, plus a better customer experience for finding realistic openings.

Business line:

- $10k net collected revenue by the end of summer.
- The current revenue scoreboard is not green yet: checkout now uses one-time payment mode in code and the live billing/conversion tables exist, but production Vercel is missing Stripe env vars and operator revenue reporting is not complete.

## Current Window Status

Already reported back and intaken:

1. Phase 2 Live Catalog Fix: yellow after migration and search verification.
2. Alert Engine Truth Audit: yellow.
3. North America Provider Roadmap: yellow.
4. Canada Provider Proof: yellow; New Brunswick is alertable, Manitoba/Nova Scotia are repo-ready, Alberta/Saskatchewan discovery is closed with live implementation waiting for reliability gates.
5. Alert Engine Cleanup: yellow until Railway worker runtime proof.
6. Catalog Ingestion Factory: yellow until recurring ops/admin health are proven.
7. 50k Canada Gap Sprint: green for provider-inventory proof; reliability still yellow.
8. Billing Truth And Revenue Reporting: yellow until Stripe production envs, webhook proof, and net/refund truth are green.
9. Get You The Site Moat: yellow product proof; strategy integrated, full paid loop unproven.

Do not relaunch those same windows just because this conversation was forked.

Next high-leverage runs:

1. Production Worker Smoke. High reasoning. Launch/continue now; likely blocked on Railway access.
2. Billing Truth And Revenue Reporting. High reasoning. Continue after the correct Alphacamper Stripe account and production Vercel env vars are configured.
3. Customer Watch And Notification Smoke. High reasoning. Hold until worker heartbeat is green.
4. Provider Health/Admin Truth UI and recurring ops. High reasoning. Continue once live worker heartbeat creates real provider health data.
5. Get You The Site Moat Proof. Extra-high reasoning. Hold until Railway heartbeat, Stripe revenue proof, and customer notification proof are green.
6. Alberta/Saskatchewan Adapter Sprint. Extra-high reasoning. Future live implementation only after Railway heartbeat and notification proof are green.
7. Demand Capture And Conversion. High reasoning. Use only as a revenue path, not a reliability claim.

Closed unless the scope changes:

1. Parks Canada Enrichment.

## Rule Of Thumb

Searchable is not the same as alertable.

Alphacamper should show customers exactly what we can alert now, what we know about but cannot alert yet, and what they can request next.
