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

- Awaiting Ryan approval to apply the live Supabase migration.

Launch status:

- Reported back 2026-05-09 as red.

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

- Live Supabase is missing the Phase 1 support-status columns.
- Live base catalog is verified at 387 rows, but customer-safe search remains the 174-row fallback.
- Do not start coverage expansion until the migration is approved, applied, and reverified.

Next action:

- Ask Ryan for approval: "Yes, apply the Phase 1 campground support-status migration to live Supabase project `tbdrmcdrfgunbcevslqf`, then re-run the read-only verification."
- Use `docs/research/live-catalog-migration-runbook.md` for preflight, apply, and verification.

Use runbook now:

- `docs/research/live-catalog-migration-runbook.md`.
- Use `docs/research/epic-launch-prompts.md` → Prompt 1 only if handing the approved migration verification to a separate goal window.

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

## Hold Until Catalog Is Verified

When Epic 1 is no longer red, use `docs/research/post-migration-launch-pack.md` to launch the next huge goal windows.

### 4. Canada Coverage Sprint

Goal objective:

- Turn verified Canadian provider support into visible, honest customer coverage.

Why it is held:

- New coverage should not go customer-facing until the catalog schema/search/watch path is safe.

Use prompt after Epic 1:

- `docs/research/epic-launch-prompts.md` → Prompt 4.

### 5. Catalog Ingestion Factory

Goal objective:

- Build the repeatable pipeline that lets Alphacamper grow from official/provider data instead of hand-curated lists.

Why it is held:

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
