# Campflare Reference Notes

This file captures the useful parts of Campflare's public API docs that we are using as product reference, not as a copy target.

Sources:
- [Campflare API welcome](https://docs-v2.campflare.com/welcome)
- [Campflare coverage](https://docs-v2.campflare.com/campgrounds/coverage)
- [Campflare data model overview](https://docs-v2.campflare.com/campgrounds/data)
- [Campflare availability endpoint](https://docs-v2.campflare.com/api-reference/campgrounds/availability)
- [Campflare bulk availability endpoint](https://docs-v2.campflare.com/api-reference/campgrounds/bulk-availability)
- [Campflare create alert](https://docs-v2.campflare.com/api-reference/alerts/create)
- [Campflare webhook](https://docs-v2.campflare.com/api-reference/alerts/webhook)

## What We Should Match

- Strong campground metadata richness.
- Campsite-level availability by date.
- Bulk availability for multiple campgrounds in one call.
- Alert constraints that act like saved search filters.
- Webhook payloads that are easy for partners to consume.

## What We Should Do Better

- Canada-first coverage instead of Canada as a later add-on.
- Clear source attribution for official government/open-data enrichment.
- Cleaner provider separation for WAF-backed systems.
- A normalized model that works for both internal admin tools and partner API use.

## Concrete Product Choices

- Keep our base public API under `/v1`, but support Campflare-like request/response ideas where useful.
- Support richer availability states:
  - `available`
  - `reserved`
  - `closed`
  - `first-come-first-serve`
  - `not-yet-released`
  - `unknown`
  - `unavailable` for provider-specific fallback
- Include optional alert metadata so customers can round-trip their own IDs and labels.
- Keep webhook bodies nested under `data` with `alert_id` and `notification_id`, because that is easier for downstream systems to track.

## Still To Add

- Search endpoint closer to Campflare's campground search flow.
- Richer partner endpoints for provider health and polling state.
- Map layers, public-land boundaries, and cell coverage feeds.
- Broader official notices beyond NPS and state-level NWS ingestion.

## Progress Added In This Pass

- Signed webhook delivery headers with optional HMAC verification.
- Notification delivery history table plus `GET /v1/alerts/{id}/deliveries`.
- Alert update flow with `PATCH /v1/alerts/{id}`.
- Resend-backed email alert delivery when configured.
- Batch polling scheduler plus provider backoff state updates.
- Official NWS weather-alert ingestion path for richer notices.
