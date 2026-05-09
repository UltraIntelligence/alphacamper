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
| Current status is visible | `control-tower-status-board.md` | Master gates, epic board, count ledger, decision log | Covered |
| Current executive snapshot exists | `control-tower-snapshot-2026-05-09.md` | Summarizes the three completed goal windows and current blocker | Covered |
| Immediate next actions are clear | `current-action-queue.md` | Launch-now, hold, and later queues | Covered |
| Live migration gate has a runbook | `live-catalog-migration-runbook.md` | Approval prompt, preflight SQL, apply step, verification, and board updates | Covered |
| Live migration has reusable verification SQL | `live-catalog-verification.sql` | Read-only provider counts, column checks, index check, support-status distribution, and sample row lookups | Covered |
| Post-migration launches are pre-scoped | `post-migration-launch-pack.md` | Canada provider proof, alert-engine cleanup, and catalog ingestion factory prompts | Covered |
| Epic runs are defined | `epic-launch-prompts.md` | Ten copy-paste goal-window prompts, including Production Worker Smoke and revenue/demand capture | Covered |
| Epics are framed as huge independent goals | `README.md`, `north-america-control-tower.md`, `epic-launch-prompts.md` | Operating model says each separate window owns a large goal, deep work, verification, and report-back | Covered |
| Major success metric is clear | `north-star-success-metrics.md`, `README.md`, `north-america-control-tower.md`, `control-tower-status-board.md` | First success line is 50,000 verified realtime-alertable Canadian campsites; leadership line is 250,000 to 350,000+ North American campsites | Covered |
| Reasoning level guidance is clear | `README.md`, `epic-launch-prompts.md` | Extra-high for broad strategic/evidence-heavy windows; high for bounded coverage/enrichment windows | Covered |
| Report-back process exists | `report-intake-procedure.md` | Intake steps, escalation rules, output format | Covered |
| Competitor data strategy is explained | `competitor-data-pipeline-playbook.md` | Source classes, database shape, ingestion factory epic | Covered |
| Provider roadmap can be ranked consistently | `provider-scoring-rubric.md` | Scorecard, weights, provider hypotheses | Covered |
| Production worker blocker has an executable proof path | `railway-worker-smoke-runbook.md`, `alphacamper-worker/scripts/smoke-production.ts`, `alphacamper-worker/scripts/railway-diagnostics.ts`, `alphacamper-worker/package.json` | `npm run smoke:production` reads production provider-quality and live Supabase heartbeat state; `npm run smoke:railway` checks Railway auth/service/env/logs without printing secrets | Covered |
| Customer watch and notification proof is pre-scoped | `customer-watch-notification-smoke-runbook.md`, `epic-launch-prompts.md`, `current-action-queue.md` | Runbook separates watch creation, worker polling, notification delivery, guardrail proof, and cleanup | Covered |
| Operator truth is surfaced from production | `alphacamper-site/app/api/admin/provider-quality/route.ts`, `control-tower-status-board.md`, `current-action-queue.md` | Production route reports live Supabase, 5 active watches, and `missing_worker_heartbeat` | Covered |
| Current blocker is watched automatically | Thread automation `alphacamper-worker-heartbeat-watch`, `current-action-queue.md`, `README.md` | Heartbeat automation reruns production smoke every 30 minutes and reports back to this thread | Covered |
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
- `alphacamper-worker/scripts/smoke-production.ts`
- `alphacamper-worker/scripts/railway-diagnostics.ts`
- `alphacamper-worker/package.json`

Existing supporting docs:

- `docs/research/canadian-database-parity-plan.md`
- `docs/research/parks-canada-api.md`

## Completion Audit

Audit timestamp: 2026-05-09T09:45:46Z.

Objective restated as concrete deliverables:

- Keep the North America campsite-alert expansion organized around a clear strategy, success metric, and current state.
- Define the next large goal windows with copy-paste prompts and evidence requirements.
- Coordinate reports back into a single status board without overclaiming customer coverage.
- Keep the live customer/admin truth separate from local code or test confidence.

Evidence inspected:

- `docs/research/README.md` lists the control-tower operating model and where to start.
- `docs/research/control-tower-status-board.md` lists the master gates, count ledger, decision log, epic board, and current blockers.
- `docs/research/current-action-queue.md` says the current gate is Production Worker Smoke.
- `docs/research/epic-launch-prompts.md` includes ten large goal-window prompts.
- `docs/research/report-intake-procedure.md` defines how reports are classified and folded back into the board.
- `docs/research/railway-worker-smoke-runbook.md` defines the worker runtime proof path.
- `docs/research/customer-watch-notification-smoke-runbook.md` defines the next proof after worker heartbeat is green.
- `npm run smoke:production -- --allow-yellow` from `alphacamper-worker` returned yellow against `https://alphacamper.com`.
- `npm run smoke:railway -- --allow-blocked` from `alphacamper-worker` returned blocked because this shell is not Railway-authenticated.
- Thread heartbeat automation `alphacamper-worker-heartbeat-watch` was created to rerun production smoke every 30 minutes.

Live smoke evidence:

- Provider-quality source: `live_supabase`.
- Active watches: 5.
- Total alerts: 0.
- Delivered alerts: 0.
- Worker status: degraded.
- Worker error: `missing_worker_heartbeat`.
- Supabase heartbeat: none.
- Missing required worker platforms: `bc_parks`, `ontario_parks`, `parks_canada`, `gtc_new_brunswick`, `recreation_gov`.

## Remaining Open Work

The control-tower operating system is usable, but the overall control-tower goal remains active because this is an ongoing coordination role and the current production gate is still yellow.

Reported windows now reflected in the board:

1. Phase 2 Live Catalog Fix: yellow after live migration and search verification.
2. Alert Engine Truth Audit: yellow.
3. North America Provider Roadmap: yellow.
4. Canada Provider Proof: yellow; New Brunswick is alertable, Alberta/Saskatchewan need adapter work.
5. Alert Engine Cleanup: yellow until Railway worker runtime proof.
6. Catalog Ingestion Factory: yellow until recurring ops/admin health are proven.

Next control-tower action:

- Launch or continue Production Worker Smoke with Railway access.
- Verify the Railway service deployment, env vars, logs, `/health`, and live `worker_status`.
- After heartbeat proof, smoke-test authenticated watch creation and notification delivery.
- Use `docs/research/customer-watch-notification-smoke-runbook.md` for that next customer-path proof.
- Then resume Alberta/Saskatchewan adapter work and Provider Health/Admin Truth UI/ops.

## Completion Read

The documentation/control-tower setup is complete enough to operate.

The overall control-tower goal should remain active because its purpose is ongoing coordination of long-running epic reports and the current production gate is not green.

Do not mark the operational program complete while:

- Railway worker runtime has no live heartbeat.
- Active watches exist but polling/notification delivery is not proven.
- Realtime-alertable campsite counts are still unverified.
- Provider health/admin truth is route-level, not a completed operator workflow.
