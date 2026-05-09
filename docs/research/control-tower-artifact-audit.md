# Control Tower Artifact Audit

Last updated: 2026-05-09

This maps the control-tower objective to the actual artifacts now in the repo.

## Objective

Act as the control tower for Alphacamper's North America campsite-alert expansion:

- keep the big arc organized
- define the next epic runs
- coordinate reports back from long-running goal windows

## Requirement Checklist

| Requirement | Covered By | Evidence | Status |
|---|---|---|---|
| Big arc is organized | `north-america-control-tower.md` | Mission, current truth, competitor bar, three-week operating plan | Covered |
| Current status is visible | `control-tower-status-board.md` | Master gates, epic board, tracker ledger, count ledger, decision log | Covered |
| Current executive snapshot exists | `control-tower-snapshot-2026-05-09.md` | Summarizes the intaken goal windows, tracker lanes, current blockers, and safe claims | Covered |
| Immediate next actions are clear | `current-action-queue.md` | Launch-now, hold, and later queues | Covered |
| Live migration gate has a runbook | `live-catalog-migration-runbook.md` | Approval prompt, preflight SQL, apply step, verification, and board updates | Covered |
| Live migration has reusable verification SQL | `live-catalog-verification.sql` | Read-only provider counts, column checks, index check, support-status distribution, and sample row lookups | Covered |
| Post-migration launches are pre-scoped | `post-migration-launch-pack.md` | Canada provider proof, alert-engine cleanup, and catalog ingestion factory prompts | Covered |
| Epic runs are defined | `epic-launch-prompts.md` | Sixteen copy-paste goal-window prompts, including Production Worker Smoke, customer notification smoke, billing truth, first paid cohort, Manitoba/Nova Scotia label sync, paid alert-to-assist moat proof, and Canada parity expansion | Covered |
| Epics are framed as huge independent goals | `README.md`, `north-america-control-tower.md`, `epic-launch-prompts.md` | Operating model says each separate window owns a large goal, deep work, verification, and report-back | Covered |
| Major success metric is clear | `north-star-success-metrics.md`, `README.md`, `north-america-control-tower.md`, `control-tower-status-board.md` | First success line is 50,000 verified realtime-alertable Canadian campsites; leadership line is 250,000 to 350,000+ North American campsites | Covered |
| Revenue success metric is clear | `summer-revenue-scoreboard.md`, `control-tower-status-board.md`, `current-action-queue.md` | $10k net summer revenue target, pass-count math, net-vs-gross rule, and billing/source-of-truth blocker are documented | Covered |
| Tier-one competitor ambition is captured | `north-star-success-metrics.md`, `north-america-control-tower.md`, `control-tower-status-board.md` | Strategy names Campnab/Campflare as the tier-one bar and frames Alphacamper as a Canada-first alert and planning product moving toward a broader North American camper assistant | Covered |
| Product distinction is captured | `north-star-success-metrics.md`, `north-america-control-tower.md`, `get-the-site-moat-plan.md`, `control-tower-status-board.md` | Docs say the moat is not just finding the site, but helping the camper get the site, with the paid alert-to-official-review loop held until reliability and billing gates are green | Covered |
| Autonomy rule is captured | `north-america-control-tower.md`, `control-tower-status-board.md` | Control tower is expected to move autonomously unless a change is unusually destructive, risky, or legally sensitive | Covered |
| Billing blocker has an executable proof path | `alphacamper-site/scripts/smoke-billing.ts`, `alphacamper-site/package.json`, `summer-revenue-scoreboard.md` | `npm run smoke:billing` checks live billing tables, Vercel Stripe env names, one-time Stripe price shape when local Stripe env is available, paid checkout/webhook proof, and net/refund reporting state | Covered |
| Reasoning level guidance is clear | `README.md`, `epic-launch-prompts.md` | Extra-high for broad strategic/evidence-heavy windows; high for bounded coverage/enrichment windows | Covered |
| Report-back process exists | `report-intake-procedure.md` | Intake steps, tracker mapping, GitHub comment rule, escalation rules, output format | Covered |
| Competitor data strategy is explained | `competitor-data-pipeline-playbook.md` | Source classes, database shape, ingestion factory epic | Covered |
| Provider roadmap can be ranked consistently | `provider-scoring-rubric.md` | Scorecard, weights, provider hypotheses | Covered |
| Production worker blocker has an executable proof path | `railway-worker-smoke-runbook.md`, `alphacamper-worker/scripts/smoke-production.ts`, `alphacamper-worker/scripts/railway-diagnostics.ts`, `alphacamper-worker/package.json` | `npm run smoke:production` reads production provider-quality and live Supabase heartbeat state; `npm run smoke:railway` checks Railway auth/service/env/logs without printing secrets | Covered |
| External blockers and next epic runs have GitHub tracker issues | GitHub milestone #1, GitHub milestone #2, issues #9 through #19, `current-action-queue.md`, `control-tower-status-board.md`, `control-tower-operator-unblock-pack.md` | Railway heartbeat, Stripe revenue readiness, demand capture/conversion, first paid cohort, customer notification proof, Manitoba/Nova Scotia label sync, provider health, get-you-the-site proof, and Canada parity expansion remain tracked; Alberta/Saskatchewan discovery and Parks Canada enrichment are closed with evidence | Covered |
| Railway worker deploy settings are explicit | `alphacamper-worker/railway.json`, `alphacamper-worker/src/index.ts`, `railway-worker-smoke-runbook.md` | Worker has Railway build/deploy config, honors Railway `PORT`, and documents the root-directory/config-file setup checklist | Covered |
| Customer watch and notification proof is pre-scoped | `customer-watch-notification-smoke-runbook.md`, `epic-launch-prompts.md`, `current-action-queue.md` | Runbook separates watch creation, worker polling, notification delivery, guardrail proof, and cleanup | Covered |
| Operator truth is surfaced from production | `alphacamper-site/app/api/admin/provider-quality/route.ts`, `control-tower-status-board.md`, `current-action-queue.md` | Production route reports live Supabase, 5 active watches, and `missing_worker_heartbeat` | Covered |
| Current blocker is watched automatically | Thread automation `alphacamper-worker-heartbeat-watch`, `current-action-queue.md`, `README.md` | Heartbeat automation reruns worker reliability smoke and billing readiness smoke every 30 minutes, reports back to this thread, comments on #9/#10 only when a gate changes, turns green, or reveals a new blocker, and preserves the warning not to use the Superpress Stripe account for Alphacamper without confirmation | Covered |
| Future readers know where to start | `README.md` | Research folder index and recommended next runs | Covered |
| Existing research is preserved | `canadian-database-parity-plan.md`, `parks-canada-api.md` | Prior research remains in place | Covered |
| Completed windows will not be relaunched by accident | `README.md`, `epic-launch-prompts.md`, `current-action-queue.md`, `control-tower-status-board.md`, `report-intake-procedure.md` | Completed reports are marked as intaken/reported; current gate is Production Worker Smoke | Covered |

## Prompt-To-Artifact Map

| User Need | Artifact |
|---|---|
| "Act as a control tower" | `README.md`, `north-america-control-tower.md`, `control-tower-status-board.md` |
| "Think bigger, dominate North America" | `north-america-control-tower.md`, `provider-scoring-rubric.md` |
| "Define goal-style epic runs" | `epic-launch-prompts.md`, `current-action-queue.md` |
| "Coordinate reports back from long-running windows" | `report-intake-procedure.md`, `control-tower-status-board.md` |
| "Find how competitors populated high-quality data" | `competitor-data-pipeline-playbook.md` |
| "Be clear on the big goal and success count" | `north-star-success-metrics.md`, `control-tower-status-board.md` |
| "Make $10k revenue by the end of summer" | `summer-revenue-scoreboard.md`, `current-action-queue.md`, `epic-launch-prompts.md` |
| "Build a tier-one Campnab/Campflare competitor" | `north-star-success-metrics.md`, `north-america-control-tower.md`, `control-tower-status-board.md` |
| "Not just finding the site, but getting you the site" | `north-star-success-metrics.md`, `north-america-control-tower.md`, `get-the-site-moat-plan.md` |
| "Help regular campers become Alphacampers" | `north-star-success-metrics.md`, `north-america-control-tower.md` |
| "Operate autonomously" | `north-america-control-tower.md`, `control-tower-status-board.md` |
| "Use huge tasks with their own goals" | `README.md`, `north-america-control-tower.md`, `epic-launch-prompts.md` |
| "What is blocking us now?" | `control-tower-snapshot-2026-05-09.md`, `railway-worker-smoke-runbook.md`, `current-action-queue.md` |
| "What do we launch after migration?" | `post-migration-launch-pack.md`, `current-action-queue.md` |
| "Do not overclaim coverage" | `control-tower-status-board.md`, `report-intake-procedure.md` |
| "Do we need to relaunch the forked windows?" | `README.md`, `epic-launch-prompts.md`, `control-tower-status-board.md` |
| "Prove the worker is live" | `railway-worker-smoke-runbook.md`, `alphacamper-worker/scripts/smoke-production.ts`, `alphacamper-worker/scripts/railway-diagnostics.ts` |
| "Prove the customer alert path is real" | `customer-watch-notification-smoke-runbook.md`, `epic-launch-prompts.md` |

## Current Evidence

Created/updated docs:

- `docs/research/README.md`
- `docs/research/north-america-control-tower.md`
- `docs/research/control-tower-status-board.md`
- `docs/research/control-tower-snapshot-2026-05-09.md`
- `docs/research/current-action-queue.md`
- `docs/research/epic-launch-prompts.md`
- `docs/research/competitor-data-pipeline-playbook.md`
- `docs/research/north-star-success-metrics.md`
- `docs/research/live-catalog-migration-runbook.md`
- `docs/research/live-catalog-verification.sql`
- `docs/research/post-migration-launch-pack.md`
- `docs/research/provider-scoring-rubric.md`
- `docs/research/report-intake-procedure.md`
- `docs/research/railway-worker-smoke-runbook.md`
- `docs/research/customer-watch-notification-smoke-runbook.md`
- `docs/research/summer-revenue-scoreboard.md`
- `docs/research/control-tower-operator-unblock-pack.md`
- `docs/research/revenue-readiness-runbook.md`
- `alphacamper-site/scripts/smoke-billing.ts`
- `alphacamper-worker/railway.json`
- `alphacamper-worker/scripts/smoke-production.ts`
- `alphacamper-worker/scripts/railway-diagnostics.ts`
- `alphacamper-worker/package.json`

Existing supporting docs:

- `docs/research/canadian-database-parity-plan.md`
- `docs/research/parks-canada-api.md`

## Completion Audit

Audit timestamp: 2026-05-09T15:36:51Z.

Objective restated as concrete deliverables:

- Keep the North America campsite-alert expansion organized around a clear strategy, success metric, and current state.
- Define the next large goal windows with copy-paste prompts and evidence requirements.
- Coordinate reports back into a single status board without overclaiming customer coverage.
- Keep the live customer/admin truth separate from local code or test confidence.

Evidence inspected:

- `docs/research/README.md` lists the control-tower operating model and where to start.
- `docs/research/control-tower-status-board.md` lists the master gates, count ledger, decision log, epic board, tracker ledger, and current blockers.
- `docs/research/current-action-queue.md` says the current active gates are Production Worker Smoke and Stripe revenue setup in parallel, then customer notification proof after Railway is green; #12 and #14 are closed, not active launch windows.
- `docs/research/epic-launch-prompts.md` includes large goal-window prompts, links the active/held next windows to their GitHub trackers, and marks closed/future-only scopes separately.
- `docs/research/report-intake-procedure.md` defines how reports are matched to trackers, classified, commented back to GitHub, and folded back into the board.
- `docs/research/railway-worker-smoke-runbook.md` defines the worker runtime proof path.
- `docs/research/customer-watch-notification-smoke-runbook.md` defines the next proof after worker heartbeat is green.
- `docs/research/summer-revenue-scoreboard.md` defines the $10k net revenue scoreboard and flags the billing/source-of-truth blocker.
- `docs/research/north-star-success-metrics.md` and `docs/research/north-america-control-tower.md` capture the tier-one competitor ambition, get-you-the-site distinction, regular-camper-to-Alphacamper framing, and $10k net revenue target.
- `npm run smoke:production -- --allow-yellow` from `alphacamper-worker` returned yellow against `https://alphacamper.com` at 2026-05-09T15:36:51Z.
- `npm run smoke:billing -- --allow-yellow` from `alphacamper-site` returned yellow at 2026-05-09T15:36:51Z because production Stripe env vars are missing, no paid rows/webhook proof exists yet, and net/refund reporting is not verified.
- `npm run smoke:railway -- --allow-blocked` from `alphacamper-worker` returned blocked at 2026-05-09T15:36Z because this shell is not Railway-authenticated.
- `npm run smoke:customer-watch -- --allow-yellow` from `alphacamper-site` returned yellow/read-only at 2026-05-09T14:10Z, with live provider-quality, 5 active watches, 0 delivered alerts, and `missing_worker_heartbeat`.
- GitHub Actions is supporting evidence only, not Railway proof or revenue proof; verify the current `main` run with `/Users/ryan/.codex/bin/gh-no-proxy run list --limit 3` before relying on it.
- GitHub commit status and deployment metadata for latest `main` show Vercel site deployments only, and the committed GitHub workflow only runs tests plus the site smoke check. Railway deploy proof must come from Railway itself.
- `vercel env ls production` from `alphacamper-site` confirmed Vercel is authenticated and the five required Stripe production env vars are absent.
- Local Alphacamper env files do not expose the missing Stripe billing variable names, so there is no safe local source to push into Vercel.
- Local Stripe CLI can read live Stripe objects but is restricted from creating live Alphacamper products/prices/webhooks.
- Stripe connector account check returned a different account (`Superpress`), so it is not the Alphacamper billing source.
- GitHub issue #9 tracks Railway heartbeat and live alert reliability; its body was refreshed with the latest smoke evidence and the rule that notification/Manitoba/Nova Scotia label proof waits on Railway.
- GitHub issue #10 tracks Stripe production checkout and revenue proof; its body was refreshed with the latest billing evidence and the rule that Stripe can move in parallel with Railway.
- GitHub milestone #1 groups the current reliability and revenue gates.
- GitHub milestone #2 groups the next epic goal-window trackers.
- GitHub trackers #9, #10, #11, #13, #15, #16, #17, #18, and #19 remain open in the expected two milestones; #12 and #14 are closed with intake proof and should not be relaunched unless the scope changes.
- Thread heartbeat automation `alphacamper-worker-heartbeat-watch` now reruns worker reliability smoke and billing readiness smoke every 30 minutes, only comments on GitHub issues when blocker status changes, and warns that the available Stripe connector is Superpress, not confirmed Alphacamper.

Live smoke evidence:

- Provider-quality source: `live_supabase`.
- Active watches: 5.
- Total alerts: 0.
- Delivered alerts: 0.
- Worker status: degraded.
- Worker error: `missing_worker_heartbeat`.
- Supabase heartbeat: none.
- Missing required worker platforms: `bc_parks`, `ontario_parks`, `parks_canada`, `gtc_new_brunswick`, `recreation_gov`.
- Billing smoke: 0 subscriptions, 0 paid active passes, 0 summer passes, 0 year passes, 0 payment-mode passes, no gross app revenue, 0 funnel events, 0 webhook events, 0 checkout-completed webhooks, no checkout/webhook proof, net/refund reporting not verified, Vercel env readable, and the five production Stripe env vars still missing.

## Remaining Open Work

The control-tower operating system is usable, but the overall control-tower goal remains active because this is an ongoing coordination role and the current production gate is still yellow.

Reported windows now reflected in the board:

1. Phase 2 Live Catalog Fix: yellow after live migration and search verification.
2. Alert Engine Truth Audit: yellow.
3. North America Provider Roadmap: yellow.
4. Canada Provider Proof: yellow; New Brunswick is alertable, Manitoba/Nova Scotia are repo-ready, and Alberta/Saskatchewan discovery is closed with live implementation waiting for reliability gates.
5. Alert Engine Cleanup: yellow until Railway worker runtime proof.
6. Catalog Ingestion Factory: yellow until recurring ops/admin health are proven.
7. 50k Canada Gap Sprint: green for provider-inventory proof; reliability still yellow.
8. Billing Truth And Revenue Reporting: yellow after one-time checkout code and live table migration; production Stripe env vars and operator reporting remain.
9. Get You The Site Moat: yellow product proof; full paid alert-to-official-review loop remains.
10. Alberta/Saskatchewan Adapter Discovery: closed as discovery; live implementation waits for #9/#13.
11. Parks Canada Province Enrichment: closed after live province search and six production province pages were verified.
12. Manitoba/Nova Scotia Label Sync: open as a held sync window; live catalog labels wait for #9, and reliability claims still wait for #13.
13. Demand Capture And Conversion: open as a safe parallel revenue-intent lane; public request -> live aggregate -> cleanup proof is green, production has `OPERATOR_EMAIL_ALLOWLIST`, and the protected operator API/dashboard proof waits on an approved operator token/session. Campground interest is a lead signal, not paid revenue or realtime reliability.

Next control-tower action:

- Continue #9 Production Worker Smoke with Railway access.
- Verify the Railway service deployment, env vars, logs, `/health`, and live `worker_status`.
- Continue #10 by configuring production Stripe env vars, verifying one-time price IDs, and proving webhook/revenue truth.
- Continue #19 by running `ALPHACAMPER_ACCESS_TOKEN=<approved-operator-token> npm run smoke:demand` or verifying the protected dashboard manually with an approved operator session.
- After #10 is green, run #16 first paid cohort.
- After #9 is green, run #13 customer watch and notification proof, #18 Manitoba/Nova Scotia label sync, and #11 provider health/admin truth.
- Then run #15 paid alert-to-assist loop and #17 Canada parity expansion in the documented order.
- Do not relaunch #12 or #14 unless the scope changes; #12 is future implementation, and #14 is closed.

## Completion Read

The documentation/control-tower setup is complete enough to operate.

The overall control-tower goal should remain active because its purpose is ongoing coordination of long-running epic reports and the current production gate is not green.

Do not mark the operational program complete while:

- Railway worker runtime has no live heartbeat.
- Active watches exist but polling/notification delivery is not proven.
- The 51,997 campsite inventory proof is not yet backed by live customer reliability proof.
- $10k net revenue reporting is not yet measurable from a verified billing source.
- Provider health/admin truth is route-level, not a completed operator workflow.
