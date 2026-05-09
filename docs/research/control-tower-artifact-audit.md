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
| Epic runs are defined | `epic-launch-prompts.md` | Six copy-paste goal-window prompts | Covered |
| Epics are framed as huge independent goals | `README.md`, `north-america-control-tower.md`, `epic-launch-prompts.md` | Operating model says each separate window owns a large goal, deep work, verification, and report-back | Covered |
| Major success metric is clear | `north-star-success-metrics.md`, `README.md`, `north-america-control-tower.md`, `control-tower-status-board.md` | First success line is 50,000 verified realtime-alertable Canadian campsites; leadership line is 250,000 to 350,000+ North American campsites | Covered |
| Reasoning level guidance is clear | `README.md`, `epic-launch-prompts.md` | Extra-high for broad strategic/evidence-heavy windows; high for bounded coverage/enrichment windows | Covered |
| Report-back process exists | `report-intake-procedure.md` | Intake steps, escalation rules, output format | Covered |
| Competitor data strategy is explained | `competitor-data-pipeline-playbook.md` | Source classes, database shape, ingestion factory epic | Covered |
| Provider roadmap can be ranked consistently | `provider-scoring-rubric.md` | Scorecard, weights, provider hypotheses | Covered |
| Future readers know where to start | `README.md` | Research folder index and recommended next runs | Covered |
| Existing research is preserved | `canadian-database-parity-plan.md`, `parks-canada-api.md` | Prior research remains in place | Covered |
| Completed windows will not be relaunched by accident | `README.md`, `epic-launch-prompts.md`, `current-action-queue.md`, `control-tower-status-board.md`, `report-intake-procedure.md` | First three reports are marked as intaken/reported, with the live migration approval called out as the current gate | Covered |

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
| "What is blocking us now?" | `control-tower-snapshot-2026-05-09.md`, `live-catalog-migration-runbook.md` |
| "What do we launch after migration?" | `post-migration-launch-pack.md`, `current-action-queue.md` |
| "Do not overclaim coverage" | `control-tower-status-board.md`, `report-intake-procedure.md` |
| "Do we need to relaunch the forked windows?" | `README.md`, `epic-launch-prompts.md`, `control-tower-status-board.md` |

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

Existing supporting docs:

- `docs/research/canadian-database-parity-plan.md`
- `docs/research/parks-canada-api.md`

## Remaining Open Work

The control-tower artifacts are ready.

The first three long-running windows have reported:

1. Phase 2 Live Catalog Fix: red.
2. Alert Engine Truth Audit: yellow.
3. North America Provider Roadmap: yellow.

The operational program is not done because the live catalog migration still needs approval and verification before the next provider proof windows should launch.

Next control-tower action:

- Get approval to apply the live Supabase catalog migration.
- Use `live-catalog-migration-runbook.md`.
- After Epic 1 is no longer red, use `post-migration-launch-pack.md`.

## Completion Read

The documentation/control-tower setup is complete enough to operate.

The overall control-tower goal should remain active because its purpose is ongoing coordination of long-running epic reports.

Do not mark the operational program complete while:

- the live catalog migration is still awaiting approval
- Epic 1 remains red
- provider expansion windows are still blocked behind the catalog gate
