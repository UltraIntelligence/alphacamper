# Competitor Data Pipeline Playbook

Last updated: 2026-05-09

## Short Answer

Competitors with large campground databases almost certainly did not hand-enter the data.

They likely built a repeatable pipeline:

1. Pull official campground directories.
2. Pull or poll campsite availability from reservation systems.
3. Enrich rows with official open data, maps, photos, notices, and rules.
4. Normalize every provider into one app model.
5. Use operators and customer demand to clean up the last mile.

Alphacamper can do the same. The current repo already has several of these pieces, but they are split between the beta site, worker, and undeployed Python API.

## What The Evidence Suggests

### Campnab-style coverage

Campnab says it monitors many booking systems, that those systems change, and that it only actively scans parks customers sign up to monitor. That points to a provider-adapter model, not a static spreadsheet.

Likely model:

- Keep a directory of supported providers.
- Pull campground and campsite IDs from each provider.
- Poll only active customer scans to avoid unnecessary load.
- Store provider-specific booking URLs.
- Add manual cleanup where the provider does not expose clean links or names.

Sources:

- https://campnab.com/faq
- https://campnab.com/parks

### Campflare-style data richness

Campflare says its outdoor data is public and lists campground data, campsite-level availability, amenities, official notices, photos, precise locations, campsite characteristics, vehicle specs, cell coverage, map layers, and webhook alerts.

Likely model:

- Use public federal data for campground metadata.
- Poll availability separately.
- Enrich with official notices, photos, map layers, and third-party data.
- Require attribution where outside data is used.

Sources:

- https://campflare.com/api
- https://campflare.com/info

### Open-source proof

Camply proves this is technically possible. It supports provider adapters for Recreation.gov, GoingToCamp, ReserveCalifornia, several state park systems, and tickets/timed entry. It exposes commands for recreation areas, campgrounds, campsites, equipment types, and continuous availability checks.

Why this matters:

- It shows the winning architecture is provider adapters plus a normalized search layer.
- It shows GoingToCamp can expose many Canadian and US white-label systems.
- It shows equipment filters and campsite-level searches are not fantasy features.

Sources:

- https://juftin.com/camply/providers/
- https://juftin.com/camply/cli/

## Source Classes Alphacamper Should Use

### 1. Reservation System Directories

Purpose:

- Get the official provider IDs that make alerts possible.

Examples:

- Camis / GoingToCamp `resourceLocation`.
- Recreation.gov / RIDB.
- ReserveAmerica / UseDirect-style systems.
- State and provincial reservation portals.

Customer value:

- The camper can search real campgrounds, not a hand-picked list.
- Alerts can link back to the right booking page.

Alphacamper status:

- Worker already uses Camis `resourceLocation`.
- Site has static fallback plus Supabase `campgrounds`.
- Python API has richer provider/catalog models, but is not deployed in beta.

### 2. Availability APIs

Purpose:

- Know what is actually bookable for the camper's dates.

Examples:

- Camis `/api/availability/map`.
- Recreation.gov availability endpoints.
- Provider-specific state park availability endpoints.

Customer value:

- Alerts only fire when a real matching campsite opens.
- We can eventually support campsite, vehicle, hookup, and accessibility filters.

Alphacamper status:

- Worker already polls Camis-style systems.
- Vercel cron path is narrower and should be audited.

### 3. Official Metadata APIs

Purpose:

- Make campground pages feel complete and trustworthy.

Examples:

- Recreation.gov / RIDB.
- NPS Data API.
- Parks Canada open data.
- Provincial open-data portals.

Customer value:

- Good descriptions, locations, amenities, fees, official links, and park context.
- Province/state pages can be useful even before every provider is alertable.

Alphacamper status:

- Python API already has RIDB and NPS hooks.
- Open-data enrichment exists, but this is not yet the main beta product path.

### 4. Government/Open Geospatial Data

Purpose:

- Add coordinates, boundaries, province/state metadata, nearby logic, and maps.

Examples:

- Parks Canada accommodation datasets.
- BC Parks geospatial/open data.
- Ontario regulated park CSV/open data.
- StatsCan ODRSF-style datasets.
- US public land layers.

Customer value:

- Search by province works.
- Nearby alertable campground suggestions become possible.
- Coverage maps become honest and useful.

Alphacamper status:

- Python API has open-data enrichment and boundary enrichment support.

### 5. Notices, Rules, And Booking Windows

Purpose:

- Help campers understand whether they realistically have a shot.

Examples:

- Official park notices.
- NPS alerts.
- Weather/NWS-style alerts.
- Reservation rules pages.
- Booking-window release schedules.

Customer value:

- "Where can I realistically get in?"
- "When should I try?"
- "Why is this not bookable?"

Alphacamper status:

- Some content pages already discuss booking pressure.
- Notices and booking windows are not yet a complete product layer.

### 6. Photos And Rich Media

Purpose:

- Make campground pages feel premium.

Examples:

- Official provider photos where licensing allows.
- NPS API photos.
- Attributed public-domain or properly licensed images.
- User-submitted photos later, if product wants that.

Customer value:

- The camper can judge a campground quickly.
- Pages become more SEO-worthy.

Alphacamper status:

- Not a core beta path yet.

### 7. Customer Demand

Purpose:

- Decide what to add next.

Inputs:

- Searches with no result.
- Unsupported park requests.
- Watch creation attempts on coming-soon providers.
- Province page visits.
- Customer support messages.

Customer value:

- Alphacamper adds the parks real campers actually want.

Alphacamper status:

- Funnel events exist.
- We need a specific unsupported-park/request loop.

## The Database Shape We Need

Best practice is one normalized catalog with source evidence.

Minimum product catalog:

- provider
- provider_key
- provider_domain
- park
- campground
- campsite
- province/state
- country
- booking_url
- source_url
- support_status
- availability_mode
- last_verified_at
- verification_confidence
- raw_provider_payload

Richer catalog:

- amenities
- equipment_types
- max_vehicle_length
- hookups
- accessibility
- campsite_type
- fees
- rules
- booking_window
- coordinates
- boundary geometry
- photos
- official notices
- nearby campgrounds

## Recommended Alphacamper Build Order

### Step 1: Make the live catalog safe

Do first:

- Apply/verify the Phase 1 Supabase migration.
- Confirm live `/api/campgrounds` works.
- Confirm watch creation respects `support_status`.

Why:

- No ingestion work matters if customers cannot safely search the live catalog.

### Step 2: Turn provider directory sync into the main growth engine

Do next:

- Run full directory sync for BC, Ontario, Parks Canada.
- Then Manitoba and Nova Scotia.
- Then NL and Ontario regional systems.
- Then New Brunswick, Algonquin Highlands, Saugeen.

Why:

- This is the fastest route to Canadian parity because the repo already knows many GoingToCamp-style systems.

### Step 3: Add enrichment jobs

Do next:

- Parks Canada province/source enrichment.
- BC and Ontario official metadata enrichment.
- RIDB/NPS metadata for Recreation.gov.

Why:

- This turns a raw alert tool into a trusted planning product.

### Step 4: Add demand capture

Do next:

- Unsupported search logging.
- "Request this campground."
- Admin queue ranked by search volume and province.

Why:

- Competitor-scale coverage requires prioritization. Demand data tells us what to add.

### Step 5: Build provider research factory

Do next:

- Alberta Parks.
- Saskatchewan Parks.
- PEI Parks.
- Quebec / SEPAQ.
- High-demand US state systems.

Each provider gets:

- Directory source.
- Availability source.
- Terms/risk notes.
- Required auth/cookie/WAF behavior.
- Expected campground count.
- Customer value score.
- Build difficulty score.

## New Epic: Catalog Ingestion Factory

Prompt:

> Build Alphacamper's catalog ingestion factory. Start from official/provider data, not competitor data. Create or verify jobs that import provider directories, normalize park/campground/campsite rows, store source URLs and raw payloads, dedupe names, attach province/state, and mark `support_status`, `availability_mode`, `last_verified_at`, and confidence. Start with BC, Ontario, Parks Canada, Manitoba, and Nova Scotia. Report exact counts, failed providers, stale rows, and what is safe to expose to customers.

Success means:

- The database grows from official/provider sources, not hand-curated static lists.
- Each row has source evidence.
- Admins can see which rows are alertable, search-only, coming soon, or unsupported.
- Customer search is broader but still honest.

## Plain-English Takeaway

This is absolutely doable.

The hard part is not "finding a list of campgrounds." The hard part is keeping that list clean, current, correctly linked to booking systems, and honest about which alerts actually work.

That is the product moat: not just data volume, but trusted campground truth.
