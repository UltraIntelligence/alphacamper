# Report Intake Procedure

Last updated: 2026-05-09

Use this when a long-running goal window reports back to the control tower.

## Intake Goal

Turn a report into a clear operating decision:

- what changed
- what is verified
- what is still unsafe to claim
- what the next window should do
- whether the public/customer story can change

## Step 1: Classify The Report

First match the report to its GitHub tracker:

| Tracker | Report type |
|---|---|
| [#9 Railway worker heartbeat](https://github.com/UltraIntelligence/alphacamper/issues/9) | Production worker reliability |
| [#10 Stripe production checkout](https://github.com/UltraIntelligence/alphacamper/issues/10) | Billing and revenue proof |
| [#11 Provider health/admin truth](https://github.com/UltraIntelligence/alphacamper/issues/11) | Operator/admin visibility |
| [#12 Alberta/Saskatchewan discovery](https://github.com/UltraIntelligence/alphacamper/issues/12) | Coverage adapter discovery |
| [#13 Customer watch and notification](https://github.com/UltraIntelligence/alphacamper/issues/13) | End-to-end alert delivery |
| [#14 Parks Canada enrichment](https://github.com/UltraIntelligence/alphacamper/issues/14) | Coverage enrichment |
| [#15 Get-you-the-site assist loop](https://github.com/UltraIntelligence/alphacamper/issues/15) | Product moat proof |
| [#16 First paid cohort sprint](https://github.com/UltraIntelligence/alphacamper/issues/16) | First paid customer/cohort proof |
| [#17 Canada parity expansion](https://github.com/UltraIntelligence/alphacamper/issues/17) | Future Canadian provider implementation |
| [#18 Manitoba/Nova Scotia label sync](https://github.com/UltraIntelligence/alphacamper/issues/18) | Live catalog label sync after worker proof |
| [#19 Demand capture and conversion](https://github.com/UltraIntelligence/alphacamper/issues/19) | Lead-intent capture and operator demand proof |

Choose one:

- Green: verified end to end and safe for customer-facing truth.
- Yellow: useful progress, but some verification or production gate remains.
- Red: blocked, failed, risky, or not enough evidence.

Do not mark green just because:

- code was written
- tests passed
- a migration exists locally
- a script finished
- counts increased

Green requires evidence that the relevant customer/admin path works.

After classifying a new goal-window report, add a short comment to the matching GitHub tracker with:

- status
- evidence inspected
- remaining blocker
- next action

Exception: for the recurring heartbeat smoke, comment on #9 or #10 only when a gate changes, turns green, or reveals a new blocker. Do not comment on unchanged yellow results.

## Step 2: Update The Status Board

Update `docs/research/control-tower-status-board.md`.

For the matching epic, update:

- Status
- Verified evidence
- Current blocker
- Customer-facing truth
- Next prompt/action

If counts changed, update the Current Count Ledger.

Important:

- Mark counts as "verified" only if the report includes live query/API evidence.
- Mark counts as "reported" if they came from a pasted summary without raw evidence.
- Mark counts as "code-reported" if they came from local repo files.

## Step 3: Decide If Strategy Changed

Update `docs/research/north-america-control-tower.md` only if the report changes:

- the recommended launch order
- the customer promise
- the three-week operating plan
- which epic should run next
- a major risk or blocker

Do not update the main strategy doc for small count changes.

## Step 4: Capture New Data-Source Learning

Update `docs/research/competitor-data-pipeline-playbook.md` only if the report teaches us something reusable about:

- a provider API
- an official data source
- enrichment data
- photos/notices/map layers
- source licensing or attribution
- a repeatable ingestion pattern

## Step 5: Update Provider Ranking

Update `docs/research/provider-scoring-rubric.md` only if the report changes:

- a provider's difficulty
- a provider's feasibility
- a provider's priority
- a scoring rule
- the first-provider hypotheses

## Step 6: Prepare The Next Prompt

If the next action is a new long-running window, use `docs/research/epic-launch-prompts.md`.

If the prompt needs a tighter scope after the report, add a short override:

```text
Use the standard [Epic Name] prompt, but focus only on:
- ...

Known new evidence:
- ...

Do not redo:
- ...
```

## Escalation Rules

Escalate to Ryan before continuing if:

- production data or production env vars need to change
- a provider may violate terms or create heavy load
- we would expose a new provider as alertable without end-to-end proof
- customer-facing copy would claim broader coverage than verified
- a migration could affect existing users or watch records
- a paid third-party data source is required

Use simple language:

> Say yes and I will apply the migration, then verify the live customer search path before changing any public copy.

## Output Back To Ryan

Keep the control-tower update short:

```text
Epic [name] came back [green/yellow/red].

Customer truth:
- ...

What changed on the board:
- ...

Next best move:
- ...
```

## Current Intake Priority

The control tower is currently organized into two GitHub lanes:

- Current external blockers: `Control Tower: Reliability + Revenue Gates`
  https://github.com/UltraIntelligence/alphacamper/milestone/1
- Next epic runs: `Control Tower: Next Epic Runs`
  https://github.com/UltraIntelligence/alphacamper/milestone/2

Active blocker intake order:

1. #9 Railway worker heartbeat.
2. #10 Stripe production checkout and revenue proof.

Next epic intake order and gates:

1. #19 Demand capture and conversion path can run in parallel as lead intent; do not call it revenue or reliability green.
2. #16 First paid cohort waits until #10 is green enough to take payment safely.
3. #13 Customer watch and notification delivery waits until #9 is green.
4. #18 Manitoba/Nova Scotia label sync waits until #9 is green; do not market reliability until #13 is green.
5. #11 Provider health/admin truth waits until #9 has live worker data.
6. #15 Get-you-the-site paid assist loop waits until #9, #10, and #13 are green.
7. #17 Canada parity expansion waits until #9 and #13 are green.

Closed or future-only:

- #12 Alberta/Saskatchewan adapter discovery is closed; relaunch only as live implementation after #9/#13 are green.
- #14 Parks Canada enrichment is closed; relaunch only if the scope changes.

Do not relaunch old windows just because the conversation was forked. Relaunch only when the scope changes or the tracker explicitly needs a new proof pass.
