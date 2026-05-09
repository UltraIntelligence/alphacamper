# Alphacamper Control Tower Status Board

Last updated: 2026-05-09

## How To Use This Board

This is the report-back board for long-running goal windows.

When a separate window finishes an epic, paste its report into this thread. The control tower should then update:

- status
- verified evidence
- customer-facing truth
- blocker
- next action

Do not mark an epic green because code was written. Mark it green only when the customer path is verified.

## Active Windows Ledger

Current epic windows launched from this control-tower thread on 2026-05-09:

| Window | Reasoning | Scope | Status |
|---|---|---|---|
| Jason | Extra high | 50k Canada gap sprint: find/prove the missing 5,183 campsite IDs | Reported green inventory proof; repo-side patch complete |
| Ohm | Extra high | 50k verified campsite coverage proof | Reported green inventory proof; verified and integrated |
| Pauli | High | Revenue readiness toward $10k summer target | Reported yellow; verified and integrated |
| Tesla | High | Production ops reliability and Railway heartbeat clarity | Reported yellow/blocked; verified and integrated |
| Curie | Extra high | "Get you the site" product moat plan | Reported yellow product proof; strategy integrated |
| Russell | Extra high | Alberta/Saskatchewan adapter discovery follow-up | Reported yellow; verified and integrated |
| Ampere | High | Parks Canada province and customer coverage enrichment | Reported yellow; verified and integrated |

Previous windows launched from this control-tower thread on 2026-05-09:

| Window | Reasoning | Scope | Status |
|---|---|---|---|
| Maxwell | Extra high | Alberta/Saskatchewan adapter proof | Reported yellow; parser proof under intake |
| Feynman | Extra high | Verified campsite-level inventory counts | Superseded by Ohm/Jason's verified 51,997 count |
| Noether | High | Railway worker heartbeat recovery | Reported yellow; heartbeat hardening landed |
| Nash | High | Customer watch and notification smoke | Reported yellow; smoke helper under intake |
| Descartes | High | Demand capture for search-only/unsupported parks | Reported green for scoped change; under intake |

Control-tower intake rule:

- Treat reports as proposals until their evidence is checked.
- Preserve searchable vs realtime-alertable separation.
- Keep the revenue and notification gates yellow until live Stripe and Railway proof are green.

## GitHub Tracker Ledger

Blocker lane: https://github.com/UltraIntelligence/alphacamper/milestone/1

Next-epic lane: https://github.com/UltraIntelligence/alphacamper/milestone/2

| Order | Tracker | Lane | Status |
|---:|---|---|---|
| 1 | [#9 Railway worker heartbeat](https://github.com/UltraIntelligence/alphacamper/issues/9) | Blocker | Active external blocker |
| 2 | [#13 Customer watch and notification delivery](https://github.com/UltraIntelligence/alphacamper/issues/13) | Next epic | Hold until #9 is green |
| 3 | [#10 Stripe production checkout and revenue proof](https://github.com/UltraIntelligence/alphacamper/issues/10) | Blocker | Active external blocker |
| 4 | [#11 Provider health/admin truth loop](https://github.com/UltraIntelligence/alphacamper/issues/11) | Next epic | Hold until #9 has live data |
| 5 | [#15 Get-you-the-site paid assist loop](https://github.com/UltraIntelligence/alphacamper/issues/15) | Next epic | Hold until #9, #10, and #13 are green |
| 6 | [#12 Alberta/Saskatchewan adapter discovery](https://github.com/UltraIntelligence/alphacamper/issues/12) | Next epic | Reported yellow; feasible after reliability gates |
| 7 | [#14 Parks Canada enrichment](https://github.com/UltraIntelligence/alphacamper/issues/14) | Next epic | Closed; live province search and six province pages verified |

## Status Key

- Green: verified end to end and safe to use in the customer story.
- Yellow: useful progress, but some customer-facing claim is still unsafe.
- Red: blocked, broken, or not verified.
- Not started: no current evidence.

## Master Gates

These gates protect the product from over-promising.

| Gate | Status | What Must Be True | Current Read |
|---|---|---|---|
| Live catalog schema | Green | Live Supabase has support labels, provider evidence, and sync tracking | Support-status and catalog-evidence migrations applied and verified 2026-05-09 |
| Customer campground search | Green | `/api/campgrounds` works against live Supabase and labels support clearly | Live-only Bamberton and New Brunswick Sugarloaf rows now return from `alphacamper.com/api/campgrounds` |
| Watch creation guardrails | Yellow | Customers cannot create misleading alerts for unsupported rows | Local guardrail tests pass; live authenticated watch creation still needs a customer-path smoke test |
| Alert engine source of truth | Yellow | Railway worker vs Vercel cron ownership is decided | Vercel cron route is retired live; worker heartbeat fix is pushed, but Railway runtime is not writing `worker_status` yet |
| Provider health/admin truth | Yellow | Admin can see alertable/search-only/stale/broken providers | Live `/api/admin/provider-quality` now reads Supabase and shows the missing worker heartbeat; admin UI/recurring ops still need completion |
| Revenue measurement | Yellow | Stripe, checkout copy, and operator reporting agree on paid pass revenue | Billing smoke is secret-safe and reports 0 paid active passes, 0 gross app revenue, missing production Stripe env vars, and missing net/refund truth |
| Demand capture | Green | Unsupported searches become a prioritization queue | Campground-interest capture is built, deployed, live-proven with a synthetic row, and cleaned up after proof |
| Get-the-site moat | Yellow | A paid camper can move from alert to official review step faster | Product plan is defined; extension pieces exist, but one paid alert-to-assist loop still needs proof |

## Current Count Ledger

These numbers should be treated differently depending on their evidence level.

| Count | Value | Evidence Level | Product Meaning | Next Verification Needed |
|---|---:|---|---|---|
| Static fallback campgrounds | 174 | Verified by Avicenna report | Safest current customer-facing searchable fallback | Recount from `alphacamper-site/lib/parks.ts` when needed |
| Live known catalog rows | 464 | Verified live read after catalog refresh | Official/provider directory rows are now in live Supabase, including stale rows marked unsupported | Keep refreshing from official sources |
| Live customer-searchable rows | 461 | Verified live read after catalog refresh | Safe searchable inventory excluding unsupported stale rows | Deploy updated UI/API evidence fields |
| Verified alertable campground rows | 396 live; 461 repo-ready | Live read has BC, Ontario, Parks Canada, and New Brunswick alertable; Manitoba and Nova Scotia now have repo-side live-polling proof | Production catalog sync/deploy still needs to update live labels |
| Verified realtime-alertable campsite IDs | 51,997 | Clean provider availability proof across BC Parks, Ontario Parks, Parks Canada, New Brunswick, Manitoba, and Nova Scotia | First 50,000 Canada inventory line is crossed by 1,997 campsite IDs | Pair with worker heartbeat and notification proof before marketing reliability |
| Search-only campground rows | 65 live; 0 after Manitoba/Nova Scotia sync | Live read still shows Manitoba and Nova Scotia as search-only until production catalog sync runs | Sync production catalog after deploy if the control tower wants live labels updated |
| Unsupported stale rows | 3 | Verified live read after refresh | Carmanah Walbran, Grand-Pre, and Internet are not treated as alert inventory | Keep stale rows out of customer claims |
| BC Parks campsite IDs | 10,410 | Clean provider availability proof, 145/145 countable rows checked | Verified campsite-level inventory | Pair with Railway heartbeat and notifications before marketing reliability |
| Ontario Parks campsite IDs | 21,640 | Clean provider availability proof, 127/127 countable rows checked, 2 non-countable admin rows excluded | Biggest verified jump toward the Canada target | Pair with Railway heartbeat and notifications before marketing reliability |
| Parks Canada campsite IDs | 11,336 | Clean provider availability proof, 107/107 countable rows checked, 6 non-countable rows excluded | National coverage inventory is now counted and province-searchable | Pair with Railway heartbeat and notification proof before marketing reliability |
| New Brunswick campsite IDs | 1,431 | Clean provider availability proof, 9/9 countable rows checked | First Atlantic realtime-alertable province slice at campsite level | Pair with Railway heartbeat and notifications before marketing reliability |
| Manitoba campsite IDs | 5,480 | Clean provider availability proof, 45/45 countable rows checked | Smallest verified path across the 50,000 campsite line by itself | Production catalog sync/deploy needed before live labels change |
| Nova Scotia campsite IDs | 1,700 | Clean provider availability proof, 20/20 countable rows checked | Safe same-provider Atlantic expansion after Manitoba | Production catalog sync/deploy needed before live labels change |
| BC Parks alertable rows | 145 | Verified live provider refresh | Strong BC catalog base with source evidence | Keep refreshed from provider source |
| Ontario Parks alertable rows | 129 | Verified live provider refresh | Strong Ontario catalog base with source evidence | Keep refreshed from provider source |
| Parks Canada alertable rows | 113 | Verified live provider refresh plus province sync | Useful Parks Canada base with province search and six live coverage pages | Expand page pattern only when it helps demand capture; reliability still waits on #9/#13 |
| New Brunswick alertable rows | 9 | Verified provider proof and live refresh | First Atlantic realtime-alertable province slice | Keep refreshed from provider source |
| Manitoba rows | 45 | Verified live provider refresh plus 2026-05-09 live availability proof | Repo profile is now alertable/live-polling; live catalog label still needs sync | Pair with Railway heartbeat and notifications before marketing reliability |
| Nova Scotia rows | 20 | Verified live provider refresh plus 2026-05-09 live availability proof | Repo profile is now alertable/live-polling; live catalog label still needs sync | Pair with Railway heartbeat and notifications before marketing reliability |
| Active live watches | 5 | Verified production provider-quality route | Real customers/admin tests have active watches waiting on worker polling | Prove Railway heartbeat and notification delivery |

Control-tower rule:

- Reported counts are useful for planning.
- Verified counts are the only numbers safe for customer-facing claims.

## Business Ledger

| Count | Value | Evidence Level | Product Meaning | Next Verification Needed |
|---|---:|---|---|---|
| Summer revenue target | $10k | Ryan's business target | The summer work needs to turn into paid camper trust | Track gross and net Stripe revenue weekly |
| Summer-pass path to $10k | 345 passes | Calculated from $29 checkout copy | Shows the size of the short-term sales target | Verify price/mode in Stripe |
| Year-pass path to $10k | 205 passes | Calculated from $49 checkout copy | Shows the size of the higher-trust sales target | Verify price/mode in Stripe |
| Verified paid-pass count from app DB | 0 | Live read from `subscriptions` after one-time pass migration | No paid passes recorded in the app DB yet | Configure Stripe env vars and prove checkout webhook |
| Verified funnel-event count from app DB | 0 | Live read from `funnel_events` after one-time pass migration | No conversion events recorded yet | Prove event writes through a customer-path smoke test |
| Operator revenue-quality view | Built, yellow | Code path reads `subscriptions`, `stripe_webhook_events`, `funnel_events`, `watched_targets`, and `availability_alerts` | Operator dashboard can show gross app-side revenue and blockers without secret values | Configure production Stripe env vars and wire net/refund truth from Stripe |

## Decision Log

| Date | Decision | Reason | Status |
|---|---|---|---|
| 2026-05-09 | Keep Canada-first as the immediate wedge | Campnab is the Canadian parity target and Alphacamper already has Canadian provider bones | Active |
| 2026-05-09 | Treat searchable and alertable as separate product states | Prevents misleading customers while allowing broader discovery | Active |
| 2026-05-09 | Make live catalog trust the first gate | More coverage is risky until Supabase schema/search/watch behavior are verified | Active |
| 2026-05-09 | Prefer Railway worker as likely alert-engine owner | Epic 3 found Railway worker is the right Canadian alert-engine owner; Recreation.gov has now been moved into the worker in code | Active |
| 2026-05-09 | Build a catalog ingestion factory, not a hand-curated list | Competitor-scale coverage requires repeatable official/provider data pipelines | Planned |
| 2026-05-09 | Do not count Vercel cron toward the 50,000 Canadian north-star target | Pasteur found Vercel cron is a weaker legacy path; cleanup code retires it once deployed | Active |
| 2026-05-09 | Operate autonomously unless a move is unusually destructive or risky | Ryan wants the control tower to move like an owner, not wait on normal execution approvals | Active |
| 2026-05-09 | Product moat is "not just find the site, help the camper get the site" | Alphacamper should become a more useful camper assistant than a plain alert tool | Active |
| 2026-05-09 | Add business north star: $10k revenue by end of summer | Coverage work should ladder into paid camper outcomes, not only infrastructure | Active |
| 2026-05-09 | Treat net collected revenue as the real $10k target | The 30-day guarantee means gross sales alone can overstate success | Active |
| 2026-05-09 | Aim for tier-one Campnab/Campflare competitor status | The product should combine broad alert coverage with guided actions that help regular campers become Alphacampers | Active |
| 2026-05-09 | Use one-time payments for 2026 passes | Matches pass copy, lowers customer confusion, and makes summer revenue reporting clearer | Active |
| 2026-05-09 | Treat New Brunswick as alertable after provider proof | The New Brunswick CAMIS/GoingToCamp path returned directory and site-level availability evidence | Active |
| 2026-05-09 | Upgrade Manitoba and Nova Scotia to repo-ready live-polling profiles | Official/provider availability responses returned clean campsite-level proof: Manitoba 5,480 and Nova Scotia 1,700 IDs | Active; production catalog sync/deploy pending |
| 2026-05-09 | Move all alert polling toward Railway worker | Recreation.gov worker support now exists in code, and the old Vercel cron is retired live; Railway heartbeat still needs proof | Active |

## Epic Board

### Epic 1: Phase 2 Live Catalog Fix

Status: Green for province/customer coverage; reliability still gated by #9/#13

Owner window: launched 2026-05-09 as Avicenna

Customer promise affected:

- Whether customers can safely search the bigger campground database.

Must prove:

- Live Supabase schema has the Phase 1 columns.
- `/api/campgrounds` returns live rows without falling back because of schema errors.
- Search results show clear support status.
- Watch creation respects support status.
- Exact counts by provider and support status are reported.

Current result:

- Migration applied to live Supabase project `tbdrmcdrfgunbcevslqf` on 2026-05-09.
- Verified columns now exist: `support_status`, `provider_key`, `source_url`, and `last_verified_at`.
- Verified index exists: `idx_campgrounds_support_status`.
- Live base catalog was refreshed from official/provider sources on 2026-05-09.
- Live known catalog now has 464 rows.
- Live customer-searchable rows excluding unsupported stale rows: 461.
- Verified alertable campground rows: 396 live; 461 repo-ready after Manitoba and Nova Scotia sync.
- Search-only campground rows: 65 live; 0 after the Manitoba and Nova Scotia catalog sync.
- Unsupported stale rows: 3.
- Live API returns Bamberton and New Brunswick Sugarloaf from Supabase with alertable labels and source evidence.
- Live `/api/check-availability` now returns 410 retired with `engine: railway-worker`.
- Worker heartbeat hardening was pushed before the latest docs/ops commits: quiet cycles now write `worker_status`, heartbeat write failures degrade health, and Railway diagnostics look for the heartbeat-write failure marker.
- Latest main CI is green in GitHub Actions after the control-tower docs/ops updates.
- Live `/api/admin/provider-quality` now reads live Supabase and reports `railway_worker` as degraded with `missing_worker_heartbeat`.
- The same production route reports 5 active watches.
- Live `worker_status` still returns no rows after the fix, so Railway runtime health remains unverified.
- GitHub deployment metadata for the fix points to Vercel site deployment, not Railway worker deployment.
- Worker deploy hardening now exists in code: `alphacamper-worker/railway.json`, Railway `PORT` support, and a clearer `/health` starting/degraded response.
- Realtime-alertable campsite inventory proof is now verified for the current Canada core: 51,997 campsite IDs from BC Parks, Ontario Parks, Parks Canada, New Brunswick, Manitoba, and Nova Scotia provider availability responses.
- The first 50,000 provider-inventory line is crossed by 1,997 campsite IDs.
- This proves provider inventory enumeration, not Railway heartbeat, active-watch polling, or customer notification delivery.

Next prompt:

> Deploy/sync the Manitoba and Nova Scotia catalog-label update, then smoke-test live watch creation, Railway worker health, and notification delivery before claiming reliability.

Operator unblock pack:

- `docs/research/control-tower-operator-unblock-pack.md`

### Epic 2: Canada Coverage Sprint

Status: Yellow

Customer promise affected:

- Whether Alphacamper feels Canada-first instead of BC/Ontario-first.

Must prove:

- Manitoba and Nova Scotia are visible in search.
- Support statuses are correct.
- Worker can poll the provider or the product labels it honestly as not alertable yet.
- No unsupported provider is marketed as working.

Current result:

- New Brunswick provider proof is green enough to mark 9 campground rows alertable.
- Manitoba and Nova Scotia are live in search as verified search-only rows today, but repo-side profiles now mark them alertable/live-polling after clean availability proof.
- Manitoba adds 5,480 verified campsite IDs from 45/45 countable rows.
- Nova Scotia adds 1,700 verified campsite IDs from 20/20 countable rows.
- Alberta and Saskatchewan now have a worker-side Aspira/ReserveAmerica parser proof for official directory and calendar pages, but remain 0 alertable rows.
- Tests explicitly keep them out of `SUPPORTED_PLATFORMS`, so they cannot be polled for customer alerts yet.

Next prompt:

> Wire live worker polling for the Aspira calendar path only after Railway heartbeat is green, then prove watch -> poll -> alert -> notification before upgrading Alberta or Saskatchewan from search-only.

### Epic 3: Alert Engine Truth Audit

Status: Yellow

Owner window: launched 2026-05-09 as Pasteur

Customer promise affected:

- Whether an alert customers create is actually watched by the strongest available engine.

Must prove:

- Railway worker coverage.
- Vercel cron coverage.
- Overlap, gaps, or duplicate behavior.
- Recommended ownership model.
- Cleanup/routing plan.

Current result:

- Code now moves Recreation.gov into the Railway worker.
- Code retires `/api/check-availability` and removes the Vercel cron schedule.
- Live `/api/check-availability` now returns the retired Railway-worker message.
- Local worker/site tests and builds pass.
- Live Supabase `worker_status` currently has no heartbeat row, so worker runtime health still needs Railway-side verification.
- Railway CLI in this shell is not authenticated, so the worker service status could not be checked directly.

Next prompt:

> Verify Railway worker deployment/health and confirm the heartbeat includes Recreation.gov.

### Epic 4: Parks Canada Enrichment

Status: Yellow

Customer promise affected:

- Whether Parks Canada rows can support province pages and province search.

Must prove:

- Parks Canada rows have province/source metadata.
- Uncertain rows are not guessed.
- Before/after counts are reported.

Current blocker:

- Ampere reported back and the control tower verified the core finding.
- Live Supabase has 115 Parks Canada rows: 113 `alertable` / `live_polling`, 2 `unsupported` / `directory_only`.
- All 115 live Parks Canada rows have `province = null`.
- Live search for `Alberta` returns 0 campgrounds, while direct name searches like `Banff` and `Fundy` return Parks Canada rows with blank live province values.
- Raw Parks Canada payload URLs can safely derive province for the 113 alertable rows. The only uncertain rows are the two unsupported rows: `Grand-Pré` and `Internet`.
- Province derivation from source-backed URL paths gives: AB 22, BC 24, MB 2, NB 9, NL 10, NS 9, NT 1, ON 13, PE 2, QC 15, SK 4, YT 2.
- Repo-side province enrichment is now implemented in `alphacamper-worker/src/catalog-ingestion.ts`.
- The live Parks Canada catalog was synced with 113 province-enriched rows; 2 stale rows remain unsupported with null province.
- The live site API now expands full province-name searches to province codes.
- Verified live searches: `Alberta`, `Prince Edward Island`, `Saskatchewan`, and `New Brunswick` return province-matched Parks Canada rows.
- Six production coverage pages are live and in the sitemap: Alberta, British Columbia, Ontario, New Brunswick, Prince Edward Island, and Saskatchewan.
- The Alberta page returns 200 on production and keeps the honest "not a blanket claim" copy before sending campers to `/watch/new?q=Alberta`.

Next prompt:

> Hold further Parks Canada marketing expansion until Railway heartbeat and notification proof are green, then decide whether more province pages are worth adding for demand capture.

### Epic 5: North America Provider Roadmap

Status: Yellow

Owner window: relaunched 2026-05-09 as Euler after Kepler was not found in this fork

Customer promise affected:

- Which providers Alphacamper should chase after core Canada parity.

Must prove:

- Ranked provider backlog.
- Build-vs-research recommendation per provider.
- Demand/value score.
- Difficulty/risk score.
- First five next bets.

Current blocker:

- Euler completed the ranking, but all new providers remain research/searchable-only until adapter proof and live worker polling are verified.
- Broad US rollout should wait until Canada core is stable.

Next prompt:

> Launch the next proof window after Epic 1 is unblocked: verify New Brunswick GoingToCamp alertability, then run Alberta/Saskatchewan adapter discovery against official reservation pages. Keep every new provider searchable-only until site-level availability polling is proven.

Top roadmap bets:

- Alberta Parks: biggest Canadian gap, likely feasible through the Aspira/ReserveAmerica-style `ABPP` path, but not realtime-alertable yet.
- Saskatchewan Parks: similar parity value through the same Aspira/ReserveAmerica-style `SKPP` path, best after Alberta.
- New Brunswick, then PEI: Atlantic quick win; NB may fit GoingToCamp, PEI is small but trust-building.
- US GoingToCamp cluster: Washington, Wisconsin, Michigan, Maryland.
- ReserveCalifornia: huge marketing value, but build after Canada core because it needs a new UseDirect-style adapter.

Alberta/Saskatchewan adapter intake:

- Russell reported back and the control tower verified the repo/provider evidence.
- Live Alberta directory fetch returned `resultTotal = 109` for contract `ABPP`.
- Live Saskatchewan directory fetch returned `resultTotal = 24` for contract `SKPP`.
- `alphacamper-worker/src/aspira.ts` keeps both provider profiles `search_only`.
- `alphacamper-worker/src/config.ts` excludes both from active worker polling.
- `npm test -- aspira.test.ts` passes with 6 tests.
- Intake artifact: `docs/research/alberta-saskatchewan-adapter-intake-2026-05-09.md`.

### Epic 6: Catalog Ingestion Factory

Status: Not started

Customer promise affected:

- Whether Alphacamper can grow like a serious coverage product instead of a hand-curated list.

Must prove:

- Provider directory imports use official/provider data.
- Rows keep source evidence.
- Rows are deduped and normalized.
- Rows include support status, availability mode, last verified date, and confidence.
- Exact counts, failed providers, stale rows, and safe customer exposure are reported.

Current result:

- Catalog ingestion factory exists in code for BC, Ontario, Parks Canada, Manitoba, Nova Scotia, and New Brunswick.
- Live refresh completed from official/provider directories on 2026-05-09.
- Provider sync records show six succeeded refreshes.
- Stale rows were marked unsupported instead of counted as alertable.
- Not green yet because the recurring deploy/ops path is not proven.

Next prompt:

> Turn the importer into an operational job with provider health surfaced to admins, then extend it to Newfoundland/Labrador and the Ontario regional systems.

### Epic 7: Billing Truth And Revenue Reporting

Status: Yellow

Customer promise affected:

- Whether campers understand what they are buying and whether Alphacamper can honestly track progress toward $10k by summer end.

Must prove:

- Checkout copy matches Stripe mode.
- The live database has the billing/conversion tables the app expects, or reporting intentionally uses Stripe as the source of truth.
- Operators can see gross revenue, net revenue, paid pass counts, refunds, active watches, delivered alerts, and booking outcome events.

Current result:

- Checkout UI says the summer and year passes are one-time.
- `/api/checkout` now creates Stripe sessions with `mode: "payment"` in code.
- `/api/stripe/webhook` now stores one-time pass purchases in the existing access table.
- Legacy subscription webhook handling remains for any older subscription-mode sessions.
- Live Supabase now has `subscriptions`, `stripe_webhook_events`, and `funnel_events`; current counts are 0 rows for paid passes and funnel events.
- Production Vercel is missing `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_SUMMER`, `STRIPE_PRICE_YEAR`, and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, so live checkout is not green yet.
- `npm run smoke:billing -- --allow-yellow` now gives a repeatable secret-safe billing proof with paid active passes, summer/year split, payment-mode pass count, and gross app-recorded revenue.
- Latest verified smoke result: 0 subscriptions, 0 paid active passes, 0 funnel events, 0 webhook events, and no gross app revenue.
- `/api/admin/revenue-quality` and the dashboard operator panel now provide a protected revenue-quality view for allowlisted operator accounts.
- `docs/research/summer-revenue-scoreboard.md` now defines the $10k scoreboard and the recommended decision.
- `docs/research/revenue-readiness-runbook.md` now defines the path from zero live revenue proof to first paid customer proof without doing a fake live charge.

Next prompt:

> Configure production Stripe env vars, prove one checkout/webhook path, then wire net/refund reporting from Stripe into the operator revenue view.

### Epic 8: Get You The Site Moat

Status: Yellow

Customer promise affected:

- Whether Alphacamper feels more powerful than a normal campsite-alert app.

Must prove:

- A paid camper can create a watch for a supported park.
- The extension is connected before the alert.
- Booking details are saved before the race starts.
- The camper receives an alert, taps it, and Alphacamper opens the official booking page.
- Alphacamper fills safe details and gets the camper to a review-ready state.
- Final confirmation stays with the camper.

Current result:

- `docs/research/get-the-site-moat-plan.md` defines the moat as alert-to-booking handoff, not more passive alert features.
- The recommended summer promise is: set a watch, save details once, tap the alert, let Alphacamper open the official booking page, fill the boring parts, and leave final confirm to the camper.
- Launch-critical roadmap: alert-to-assist handoff, saved booking details, safe review-step handoff, rehearsal, honest coverage, outcome tracking, and paid-pass confidence.
- Product proof is still yellow because no paid loop has been verified end to end.

Next prompt:

> Prove one full paid loop on BC Parks or Ontario Parks: paid watch, extension connected, details saved, alert received, tap alert, booking page opens, assist starts, and review-ready state reached.

## Current Recommended Next Runs

Already reported:

1. Phase 2 Live Catalog Fix: yellow after migration and customer-search verification.
2. Alert Engine Truth Audit: yellow.
3. North America Provider Roadmap: yellow.

Do not relaunch those same windows unless the scope changes.

Reported back and integrated:

1. Canada Provider Proof: New Brunswick alertable; Alberta/Saskatchewan need adapter work.
2. Alert Engine Cleanup: Recreation.gov moved into Railway in code; Vercel cron retired in code.
3. Catalog Ingestion Factory: official/provider refresh ran live for six providers.
4. Revenue Readiness: repo-side billing diagnostics are stronger; production Stripe env vars and first paid checkout proof remain yellow.
5. Production Ops Reliability: Railway diagnostics now check live heartbeat proof first; Railway auth/deploy proof remains blocked from this shell.
6. Get You The Site Moat: product strategy is defined around alert-to-official-review handoff; end-to-end paid loop proof remains yellow.

Next recommended runs:

1. Production Worker Smoke: verify Railway worker deploy/health and heartbeat.
2. Customer Watch And Notification Smoke: once heartbeat is green, prove one real watch, notification, guardrail, and cleanup path.
3. Billing Truth And Revenue Reporting: configure Stripe env vars, prove checkout/webhook, and finish the operator revenue view.
4. Production Catalog Label Sync: deploy/sync the Manitoba and Nova Scotia alertable/live-polling profile update after the worker is alive.
5. Paid Alert-To-Assist Loop: after heartbeat and billing are green, prove the first BC/Ontario "get you the site" loop.
6. Alberta/Saskatchewan Adapter Sprint: build live polling only after Railway heartbeat is green.
7. Provider Health/Admin Truth: turn sync records and worker health into an admin-facing operator view.

Keep research-only for now:

1. SEPAQ, until Cloudflare and French-first UX risk are solved.
2. Broad US rollout, until Canada core is stable and verified alertable.

## Report Intake Template

```text
Epic:
Status: green / yellow / red

Verified evidence:
- ...

Counts:
- Searchable:
- Alertable:
- Search only:
- Coming soon:
- Unsupported:

Customer-facing truth:
- ...

Blockers:
- ...

Recommended control-tower update:
- ...
```

## Current Product Truth

Short version:

- We have the foundation for Canadian expansion.
- Live Supabase now powers 461 safe searchable rows from official/provider directories.
- We have 396 live alertable campground rows and 461 repo-ready alertable rows after the Manitoba/Nova Scotia sync.
- We have 51,997 verified campsite IDs from provider availability proof, which crosses the first 50,000 inventory line.
- We should not claim broad reliable alert coverage until worker heartbeat and notification smoke are proven.
- We should not claim the $10k goal is measurable from the app database until billing mode and live revenue reporting are fixed.
- The next real unlock is Railway worker proof, then customer watch/notification smoke, then billing truth, then Alberta/Saskatchewan adapter work.

## North Star

Major success line:

- 50,000 verified realtime-alertable Canadian campsites.
- Current board-safe provider-inventory count: 51,997 verified campsite IDs from BC Parks, Ontario Parks, Parks Canada, New Brunswick, Manitoba, and Nova Scotia.
- The 50k inventory line is crossed, but reliability remains yellow until Railway heartbeat and notification proof are green.

Longer-term category leadership line:

- 250,000 to 350,000+ realtime-alertable North American campsites, plus a better customer experience for finding realistic openings.

Business line:

- $10k revenue by the end of summer.
- Count net collected revenue as the real success number; use gross revenue as an early warning signal.

Product moat:

- Alphacamper should not only tell a camper a site exists.
- It should help the camper move fast enough and confidently enough to actually get the site.

Only count realtime-alertable inventory when measuring this goal. Search-only rows, static fallback rows, unverified seeds, and coming-soon providers are useful, but they do not count toward the realtime success number.
