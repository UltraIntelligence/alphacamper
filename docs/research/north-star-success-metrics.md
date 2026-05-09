# North Star Success Metrics

Last updated: 2026-05-09

## Major Goal

Alphacamper should become the most trusted Canada-first campsite alert and planning product, then expand into North America from that position.

The product should help campers answer:

> Where can I realistically get in, and can Alphacamper alert me fast enough when a spot opens?

The product distinction should become:

> Not just finding the site, but helping the camper get the site.

Business target:

- $10k revenue by the end of summer.

## What Counts As Success

Success is not only having a big campground list.

Success means:

- customers can search the parks they expect
- the product clearly says what is alertable now
- active alerts are checked fast enough to matter
- paid customers believe Alphacamper improves their odds of getting the trip
- provider health is visible internally
- coverage pages tell the truth
- missing parks become demand signals

## Searchable vs Realtime Alertable

These are different.

Searchable:

- Alphacamper knows the park/campground.
- We can show it in search or on a coverage page.
- It may be alertable, search-only, coming soon, or request-only.

Realtime alertable:

- Alphacamper can check availability from the official/provider system.
- A customer can create a watch.
- The alert engine can poll it repeatedly.
- Notifications can fire when a matching site opens.

Control-tower rule:

- Only realtime alertable inventory counts toward the main success number.

## Recommended Success Targets

### Phase A: Canada-first credible

Target:

- 50,000 realtime-alertable Canadian campsites.
- 500 to 700 searchable Canadian parks/campgrounds.
- All major expected Canadian systems visible in search.

This is the first point where Alphacamper can credibly feel like a Canada-first product.

Required systems:

- BC Parks.
- Ontario Parks.
- Parks Canada frontcountry.
- Manitoba Parks.
- Nova Scotia Parks.
- Newfoundland and Labrador Parks.
- New Brunswick Parks.
- Alberta Parks.
- Saskatchewan Parks.
- PEI Parks.

### Phase B: Canada parity contender

Target:

- 100,000 realtime-alertable Canadian campsites.
- 1,000+ searchable Canadian parks/campgrounds/permit products.
- Core frontcountry plus meaningful backcountry/permit coverage.

This is the point where Alphacamper can compete seriously on Canadian breadth, not just UX.

### Phase C: North America contender

Target:

- 250,000 realtime-alertable North American campsites.
- 5,000+ searchable campgrounds.
- Canada plus high-demand US public systems beyond Recreation.gov.

This is the point where Alphacamper starts to compete with the broadest campsite-alert products overall.

### Phase D: Category leader

Target:

- 350,000+ realtime-alertable campsites or a clearly better customer outcome than raw coverage.
- Strong provider health.
- Flexible scans.
- Nearby suggestions.
- Booking-window reminders.
- Rich campground data.

This is the true "beat everyone" bar.

## Realtime Definition

Realtime should not mean wastefully polling every campsite every second.

Best-practice definition:

- Active customer watches are checked often enough to matter.
- Hot/high-demand scans should target 1 to 5 minute freshness where provider limits allow.
- Standard active scans should target 5 to 15 minute freshness.
- Search-only catalog data can refresh more slowly.
- Provider health must show when polling is stale, blocked, or degraded.

Competitor note:

- Public competitors also distinguish between directories and active scans. A large directory does not mean every campsite is checked every second forever.

## Recommended North Star

For the next three weeks, aim for:

> 50,000 realtime-alertable Canadian campsites, backed by verified provider health and honest searchable-vs-alertable labels.

That is the first success line.

Current 2026-05-09 baseline:

- 461 live customer-searchable Canadian campground rows.
- 396 verified alertable Canadian campground rows.
- 65 verified search-only Canadian campground rows.
- 44,817 verified realtime-alertable campsite IDs counted toward the 50,000 target so far, from BC Parks, Ontario Parks, Parks Canada, and New Brunswick.

The campground-row count is progress, but the success metric is campsite inventory with polling and notification proof. The 44,817 number proves provider inventory enumeration, not Railway heartbeat or customer notification delivery. Alphacamper is 5,183 verified campsite IDs short of the first 50,000 success line.

For the business, aim for:

> $10k revenue by the end of summer from campers who trust Alphacamper enough to pay for better odds.

Use `docs/research/summer-revenue-scoreboard.md` to measure this. Net collected revenue after refunds is the real success number; gross revenue is only an early signal.

Longer term, the category-winning number is:

> 250,000 to 350,000+ realtime-alertable North American campsites, plus a better customer experience for finding realistic openings.

## What We Should Not Count

Do not count these as realtime success:

- static fallback rows
- unverified seed rows
- coming-soon providers
- search-only campgrounds
- raw open-data points with no alert path
- copied or inferred competitor coverage

These can count as searchable coverage, but not realtime alertable coverage.

## Control-Tower Decision

The first major goal is:

> Become the best Canada-first campsite-alert product by reaching 50,000 verified realtime-alertable Canadian campsites, then use the ingestion factory to scale toward 250,000+ North American campsites.

The first business goal is:

> Reach $10k revenue by the end of summer by converting the coverage advantage into a paid, high-trust camper outcome.
