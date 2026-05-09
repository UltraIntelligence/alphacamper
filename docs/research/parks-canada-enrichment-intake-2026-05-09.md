# Parks Canada Enrichment Intake

Date: 2026-05-09

Tracker: https://github.com/UltraIntelligence/alphacamper/issues/14

Goal window: Ampere

Status: Yellow

## Control-Tower Read

Parks Canada inventory is strong, but customer province clarity is weak.

Live Supabase has 115 Parks Canada rows:

- 113 `alertable` / `live_polling` rows.
- 2 `unsupported` / `directory_only` rows.
- 115 rows with `province = null`.

This means the campsite inventory can count toward the provider proof, but customer searches like `Alberta` do not surface the live Parks Canada rows yet.

## Verified Evidence

- `https://alphacamper.com/api/campgrounds?q=Alberta` returns 0 rows.
- `https://alphacamper.com/api/campgrounds?q=Banff` returns Parks Canada rows, but the live Supabase rows have `province: null`.
- `https://alphacamper.com/api/campgrounds?q=Fundy` returns Parks Canada rows, but the live Supabase rows have `province: null`.
- Direct Supabase read confirms 115 Parks Canada rows and 115 null provinces.
- Parks Canada official reservation page is province-organized and includes province anchors such as Alberta, British Columbia, New Brunswick, Prince Edward Island, and Saskatchewan.

## Safe Province Derivation

The live Parks Canada `raw_payload.localizedValues[].website` URLs carry source-backed province clues.

Derived province counts from URL paths:

| Province | Rows |
|---|---:|
| AB | 22 |
| BC | 24 |
| MB | 2 |
| NB | 9 |
| NL | 10 |
| NS | 9 |
| NT | 1 |
| ON | 13 |
| PE | 2 |
| QC | 15 |
| SK | 4 |
| YT | 2 |

Uncertain rows:

- `Grand-Pré` - unsupported.
- `Internet` - unsupported.

## Recommendation

Add a Parks Canada province enrichment step in catalog ingestion. Derive province from official Parks Canada URL paths such as:

- `/pn-np/{province}/...`
- `/lhn-nhs/{province}/...`
- `/amnc-nmca/{province}/...`

Then add tests proving province searches like `Alberta`, `British Columbia`, `New Brunswick`, and `Prince Edward Island` return Parks Canada rows.

Do not change reliability claims yet. Railway heartbeat and notification proof remain yellow.

## Implementation Follow-Up

Completed in repo:

- `alphacamper-worker/src/catalog-ingestion.ts` now derives Parks Canada province from official URL paths.
- `alphacamper-site/app/api/campgrounds/route.ts` now expands full province names like `Alberta` to stored province codes like `AB`.
- Worker tests cover `/pn-np/{province}/`, `/lhn-nhs/{province}/`, and `/amnc-nmca/{province}/` URL path shapes.
- Site route tests cover full province name search expansion.

Live catalog sync:

- `npm run sync:parks-canada -- --dry-run` returned 113 facilities.
- `npm run sync:parks-canada` upserted 113 Parks Canada facilities and marked 2 stale rows unsupported.
- Direct Supabase read after sync: 115 Parks Canada rows, 113 with province, 2 null province unsupported rows.
- Province buckets after sync: AB 22, BC 24, MB 2, NB 9, NL 10, NS 9, NT 1, ON 13, PE 2, QC 15, SK 4, YT 2.

Live customer search verification after deploy:

- `q=Alberta` returns Parks Canada rows for Banff, Jasper, Waterton Lakes, Lake Louise, and Icefields Parkway with `province: AB`.
- `q=Prince Edward Island` returns Parks Canada rows for Cavendish and Stanhope with `province: PE`.
- `q=Saskatchewan` returns Parks Canada rows for Grasslands and Prince Albert with `province: SK`.
- `q=New Brunswick` returns Parks Canada rows for Fundy and Kouchibouguac plus New Brunswick provincial rows.
