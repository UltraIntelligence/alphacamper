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

The first three reports have already been intaken:

- Epic 1: Phase 2 Live Catalog Fix returned red.
- Epic 3: Alert Engine Truth Audit returned yellow.
- Epic 5: North America Provider Roadmap returned yellow.

Reason:

- The live catalog migration has now been applied and verified.
- The control tower is now waiting for the post-migration windows to report back.
- Do not relaunch the same three initial windows unless their scope changes.
