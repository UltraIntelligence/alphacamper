# Current Action Queue

Last updated: 2026-05-09

This is the short operational queue for the control tower.

Each item below should be launched as its own large goal in a separate window. Do not combine them unless the control tower explicitly decides to merge scopes.

Goal-window rule:

- One window = one big objective.
- The window keeps working until the objective is proven, or until it hits a real blocker.
- The report back must include evidence, counts where relevant, risks, and the recommended next action.

## Current Gate

### 1. Phase 2 Live Catalog Fix

Current status:

- Migration applied and verified; Epic 1 moved from red to yellow.

Launch status:

- Reported back 2026-05-09 as red, then unblocked by approved live migration.

Goal objective:

- Make the live catalog safe enough to trust for customer search and watch creation.

Why this is first:

- The live catalog schema is the gate for every customer-facing coverage claim.

Done means:

- Live Supabase has the Phase 1 columns.
- `/api/campgrounds` works against live Supabase.
- Watch creation respects support status.
- Counts by provider and support status are verified.

Current result:

- Live Supabase now has the Phase 1 support-status columns.
- Live base catalog is verified at 387 rows: BC Parks 144, Ontario Parks 129, Parks Canada 114.
- `/api/campgrounds?q=Bamberton` now returns the live-only Supabase row.
- All existing rows defaulted to `alertable`, so provider truth still needs normalization before marketing claims.

Next action:

- Normalize support labels and provider metadata.
- Verify worker polling and notification path before counting rows toward realtime-alertable success.

Use runbook for evidence:

- `docs/research/live-catalog-migration-runbook.md`.
- Use `docs/research/live-catalog-verification.sql` for repeat checks.

### 2. Alert Engine Truth Audit

Launch status:

- Reported back 2026-05-09 as yellow.

Goal objective:

- Decide which alert engine actually owns customer alerts and what should happen to weaker/older paths.

Why this result matters:

- It does not need the catalog migration to answer the ownership question.

Done means:

- We know whether Railway worker is the real alert engine.
- We know what the Vercel cron path still does.
- We know what should be kept, hidden, retired, or rerouted.

Current result:

- Railway worker should be the Canadian alert-engine source of truth.
- Vercel cron is a weaker legacy path and should not count toward the 50,000 realtime-alertable Canadian campsite target.
- Recreation.gov still depends on Vercel cron, so do not retire it until Recreation.gov moves into the worker or is deliberately marked differently.

Next action:

- Launch a follow-up goal after catalog migration: move Recreation.gov into Railway worker or narrow/retire Vercel cron safely.

Use prompt only if rerunning with changed scope:

- `docs/research/epic-launch-prompts.md` → Prompt 2.

### 3. North America Provider Roadmap

Launch status:

- Reported back 2026-05-09 as yellow.

Goal objective:

- Rank the next provider systems so Alphacamper knows where to spend the next three weeks.

Why this result matters:

- It is research and ranking, not production exposure.

Done means:

- Top five next provider bets are clear.
- The next 20 provider systems are ranked.
- Risks and build difficulty are documented.

Current result:

- Top five bets are Alberta, Saskatchewan, Atlantic quick win with New Brunswick then PEI, US GoingToCamp cluster, then ReserveCalifornia.
- New Brunswick + Alberta/Saskatchewan adapter proof is the recommended next workstream after the live catalog is unblocked.
- SEPAQ should stay research-only until Cloudflare and French-first UX risk are solved.
- Broad US rollout should wait until Canada parity providers are visibly searchable and verified alertable.

Use prompt only if rerunning with changed scope:

- `docs/research/epic-launch-prompts.md` → Prompt 3.
- Use scoring model: `docs/research/provider-scoring-rubric.md`.

## Running Now

Epic 1 is no longer red, so the next huge goal windows are running.

### 4. Canada Coverage Sprint

Goal objective:

- Turn verified Canadian provider support into visible, honest customer coverage.

Why it matters:

- New coverage should not go customer-facing until provider polling and notification truth are proven.

Use prompt after Epic 1:

- `docs/research/epic-launch-prompts.md` → Prompt 4.

### 5. Catalog Ingestion Factory

Goal objective:

- Build the repeatable pipeline that lets Alphacamper grow from official/provider data instead of hand-curated lists.

Why it matters:

- The factory should target the confirmed live catalog shape.

Use prompt after Epic 1:

- `docs/research/epic-launch-prompts.md` → Prompt 5.

## Run When Source Data Is Chosen

### 6. Parks Canada Enrichment

Goal objective:

- Make Parks Canada rows useful for province search and honest province coverage pages without guessing.

Why it waits:

- We should not guess province/source metadata.

Use prompt:

- `docs/research/epic-launch-prompts.md` → Prompt 6.

## Report-Back Rule

When a window finishes, paste the report into this thread and update:

- `docs/research/control-tower-status-board.md`
- `docs/research/current-action-queue.md`

Only update strategy docs if the report changes the recommended order or product truth.
