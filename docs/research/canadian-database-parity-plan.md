# Canadian Campground Database Parity Plan

Last reviewed: 2026-05-09

## Goal

Make Alphacamper feel extremely useful for Canadian campers by closing the coverage gap with Campnab and using Campflare as the benchmark for richer campground data.

This is a product and data plan, not a recommendation to copy competitor data. The right path is to build our own catalog from official reservation systems, official open data, and our own verification.

## Short Answer

Campnab is the Canadian coverage benchmark. Campflare is the data richness benchmark.

Alphacamper already has useful pieces: BC Parks, Ontario Parks, Parks Canada, Recreation.gov, several GoingToCamp white-label domains, a worker that can sync campground directories, and a richer Python API model. The problem is that these pieces are split across the beta site, worker, and a Python API that is not deployed during beta.

The highest-leverage move is to make one campground catalog the source of truth for search, alert creation, worker polling, admin health, and public coverage pages.

## Competitor Snapshot

### Campnab

What they publicly claim:

- Canada and United States support.
- Canadian monitoring for BC, Alberta, Saskatchewan, Nova Scotia, Ontario, Manitoba, PEI, and Canada National Parks.
- Overall directory claim: 3,133 parks, 14,877 campgrounds, 350,252+ campsites, plus permits.
- Public province pages show broad Canadian coverage. A rough link count from those pages shows about 500 Canadian park pages across provinces and territories, with the biggest public pages being BC, Ontario, Alberta, and Manitoba.

Sources:

- https://campnab.com/faq
- https://campnab.com/parks
- https://campnab.com/parks/british-columbia
- https://campnab.com/parks/ontario
- https://campnab.com/parks/alberta

Product read:

Campnab wins on breadth and trust. A Canadian camper can type a park and usually find it. That is the parity bar.

### Campflare

What they publicly claim:

- Nearly all public campgrounds in the United States.
- Free campsite alerts.
- Campground data, campsite-level availability, amenities, official notices, photos, locations, directions, campsite characteristics, vehicle specs, cell coverage, and map layers.
- Their public FAQ says they check each campground roughly every 45 seconds, depending on campground popularity.
- Their API is invite-only for now, with commercial licensing requirements.

Sources:

- https://campflare.com/
- https://campflare.com/info
- https://campflare.com/api

Product read:

Campflare is not the main Canadian parity target. It is the benchmark for the richer data layer we should eventually have: campsite details, notices, map context, cell service, and partner-style API surfaces.

## Alphacamper Current State

### Live beta architecture

The repo has three independent apps:

- Site: Next.js, Vercel
- Worker: Node, Playwright, Railway
- Extension: Chrome MV3

The Python `alphacamper-api` exists in the repo but is not deployed during beta.

Evidence:

- `AGENTS.md`
- `alphacamper-site/`
- `alphacamper-worker/`
- `alphacamper-extension/`
- `alphacamper-api/`

### Customer-facing campground search

The site has a static fallback list of 174 campgrounds:

- BC Parks: 54
- Ontario Parks: 46
- Parks Canada: 16
- Recreation.gov: 58

The site also searches the Supabase `campgrounds` table when available, then merges static fallback results.

Evidence:

- `alphacamper-site/lib/parks.ts`
- `alphacamper-site/app/api/campgrounds/route.ts`
- `alphacamper-site/supabase/migrations/20260321000000_campground_directory.sql`

### Worker/platform support

The worker already knows these Canadian platforms:

- BC Parks
- Ontario Parks
- Parks Canada
- Manitoba Parks
- Nova Scotia Parks
- Long Point Region
- Maitland Valley
- St. Clair Region
- Newfoundland and Labrador Parks

Evidence:

- `alphacamper-worker/src/config.ts`
- `alphacamper-worker/src/directory-sync.ts`

But the worker package script named `sync:canada` currently syncs only:

- BC Parks
- Ontario Parks
- Parks Canada

Evidence:

- `alphacamper-worker/package.json`

### Site poller mismatch

The site-side GoingToCamp poller currently maps only:

- BC Parks
- Ontario Parks

Evidence:

- `alphacamper-site/lib/platforms/going-to-camp.ts`

This means we should be careful about what we promise customers. Some systems appear in labels or worker code but are not fully exposed end-to-end in the customer alert path.

### Richer future database

The Python API has a much richer Campflare-style model:

- providers
- parks
- campgrounds
- campsites
- availability snapshots
- alert subscriptions
- notices
- provider health

Evidence:

- `alphacamper-api/app/models/entities.py`
- `alphacamper-api/app/repositories/coverage.py`
- `alphacamper-api/app/ingestion/jobs/`

Product read:

This is closer to the right long-term database shape, but because it is not deployed during beta, it is not yet helping customers.

## Gap Analysis

### Biggest customer gap

Campnab feels like it covers Canada. Alphacamper currently feels like it covers a strong starter set.

To feel truly useful in Canada, we need customers to search for most familiar Canadian camping destinations and get one of three honest answers:

- Alertable now
- Searchable but alerts not live yet
- Not supported yet, request it

Right now the product mostly behaves like a smaller curated list.

### Biggest system gap

We have multiple sources of truth:

- static `lib/parks.ts`
- Supabase `campgrounds`
- worker `DOMAINS`
- extension platform labels
- Python API provider catalog
- curated GoingToCamp seed JSON files

Best practice is one catalog with a visible support status per park/campground.

### Biggest data gap

Missing or incomplete Canadian coverage:

- Alberta Parks
- Saskatchewan Parks
- PEI provincial parks
- fuller Parks Canada catalog
- fuller BC/Ontario catalog in the public product
- New Brunswick provincial parks
- Quebec/SEPAQ, likely lower priority unless we want bilingual Quebec-first support
- backcountry/permit inventory
- municipal and conservation-authority systems beyond the few already listed

## Recommended Product Positioning

Do not position Alphacamper as "we monitor everything" until the database proves it.

Recommended promise:

> Canada-first campsite alerts that show exactly what we can monitor, what we are adding next, and where you have the best chance of getting in.

This lets us be honest while still feeling ambitious.

## Practical Shipping Plan

### Phase 1: Make the catalog trustworthy

Goal: One source of truth for Canadian coverage.

Build:

- Add a `support_status` concept for each campground:
  - `alertable`
  - `search_only`
  - `coming_soon`
  - `unsupported`
- Add `last_verified_at`, `source_url`, and `provider_key`.
- Make the watch wizard and campground search use the same catalog.
- Add an admin coverage page that shows counts by province and provider.

Customer outcome:

Customers can search more broadly without being misled. If we cannot alert a park yet, we say so clearly.

### Phase 2: Canada core parity

Goal: Cover the Canadian systems a normal camper expects first.

Ship order:

1. Full BC Parks directory and alerts
2. Full Ontario Parks directory and alerts
3. Full Parks Canada frontcountry directory and alerts
4. Manitoba Parks / GoingToCamp white-label
5. Nova Scotia Parks / GoingToCamp white-label
6. Newfoundland and Labrador / GoingToCamp white-label
7. New Brunswick provincial parks / GoingToCamp white-label or official booking source
8. Alberta Parks
9. Saskatchewan Parks
10. PEI provincial parks

Why this order:

- BC, Ontario, and Parks Canada already match the existing beta promise.
- Manitoba, Nova Scotia, NL, and New Brunswick already have partial GoingToCamp research/seeds.
- Alberta and Saskatchewan are high-value, but likely need fresh provider research.
- PEI is smaller but helps parity because Campnab explicitly supports it.

Customer outcome:

Alphacamper starts to feel like a Canadian product rather than a BC/Ontario product.

### Phase 3: Near-parity search experience

Goal: Even when alerts are not live everywhere, search should feel comprehensive.

Build:

- Province pages like `/camping/british-columbia`, `/camping/ontario`, `/camping/alberta`.
- Public coverage page with filters:
  - province
  - provider
  - alertable now
  - coming soon
- "Request this park" for unsupported parks.
- "Nearby alertable campgrounds" suggestions when a desired park is not supported yet.

Customer outcome:

Even gaps become useful. A customer searching for an unsupported campground gets a next step instead of a dead end.

### Phase 4: Campnab-level alert filters

Goal: Match the features campers actually use when trying to win a cancellation.

Build:

- Flexible arrival dates
- Minimum stay length
- Multiple campgrounds in one scan
- Specific campsite filter
- Vehicle length filter where provider data supports it
- Hookups / accessible / walk-in / group site filters where provider data supports it
- Email plus SMS/WhatsApp alerts

Customer outcome:

The customer can express the trip they actually want instead of creating many narrow alerts manually.

### Phase 5: Campflare-style data richness

Goal: Move beyond "alert me" into "help me choose where to camp."

Build:

- Official notices
- Photos with attribution
- campground amenities
- campsite attributes
- booking windows
- cell service coverage
- map layers
- provider health
- partner/API output later

Customer outcome:

Alphacamper becomes useful before the alert, not only when a cancellation appears.

## Suggested Targets

### 30-day target

- One catalog source for search and alert creation.
- Public coverage page.
- Full BC/Ontario/Parks Canada directory sync visible to customers.
- Support statuses exposed clearly.
- No unsupported platform shown as if alerts work.

### 60-day target

- Add Manitoba, Nova Scotia, Newfoundland and Labrador, New Brunswick, and the Ontario regional GoingToCamp systems end-to-end where technically verified.
- Add request-a-park loop.
- Add basic coverage admin view.

### 90-day target

- Add Alberta and Saskatchewan after provider research.
- Add PEI.
- Add flexible dates and multi-campground scans.
- Start adding campsite-level filters where data supports it.

## What Not To Do

- Do not scrape or copy competitor directories.
- Do not claim "all Canada" until alert paths are actually verified.
- Do not add dozens of static parks without support status.
- Do not hide unsupported results; use them as demand capture.
- Do not prioritize US parity before Canadian parity.
- Do not auto-book campsites.

## Product Decision

Best practice: separate "discoverable" from "alertable."

Recommendation: show both, but label them clearly.

Example customer language:

- "We can alert this campground now."
- "We know this campground, but alerts are not live yet."
- "We do not support this campground yet. Request it and we will prioritize it."

This is safer than pretending everything works, and more useful than hiding everything unfinished.

## Immediate Backlog

1. Create a single coverage/catalog definition that the site, worker, extension, and admin surfaces can share.
2. Add `support_status`, `last_verified_at`, `source_url`, and `provider_key`.
3. Update campground search to return support status.
4. Update watch creation so customers cannot create a live alert for unsupported campgrounds by accident.
5. Update marketing copy from "we monitor X" to "alertable now: X; coming soon: Y."
6. Run full directory sync for BC, Ontario, and Parks Canada and verify counts.
7. Wire the already-known GoingToCamp white-label systems into the site search and worker sync with explicit verification.
8. Research Alberta, Saskatchewan, and PEI reservation APIs.
9. Add public coverage pages by province.
10. Add admin coverage health by provider.

## Completion Definition

We are near database parity for Canadian campers when:

- A camper can search most major Canadian public camping systems.
- Every result clearly says whether Alphacamper can alert it today.
- BC, Ontario, Parks Canada, Alberta, Saskatchewan, Manitoba, Nova Scotia, PEI, Newfoundland and Labrador, and New Brunswick are either alertable or visibly on the roadmap.
- The product has a feedback loop for missing parks.
- Admins can see which providers are healthy, stale, broken, or search-only.
- Public pages explain coverage honestly.

