# Railway Worker — Canadian Parks Availability Poller

## Goal

A lightweight Node.js worker deployed on Railway that polls Canadian campground booking sites (BC Parks, Ontario Parks, Parks Canada) for cancellation availability. These sites are behind Azure WAF with JavaScript challenges, so the worker uses Playwright to solve the WAF and extract session cookies, then makes plain HTTP requests for the actual availability checks.

## Context

- BC Parks (`camping.bcparks.ca`), Ontario Parks (`reservations.ontarioparks.ca`), and Parks Canada (`reservation.pc.gc.ca`) all use the GoingToCamp/Camis platform behind Azure WAF
- Direct HTTP requests from servers get blocked (403 or CAPTCHA challenge)
- The WAF requires a real browser to solve a JS challenge before issuing valid session cookies
- Once cookies are obtained, plain HTTP availability API calls work
- Recreation.gov has a public API and is already handled by the Vercel cron — not in scope for this worker
- The existing `watched_targets` and `availability_alerts` Supabase tables are the shared interface between this worker and the Alphacamper extension

## Architecture

```
┌─────────────────────────────────────────────────┐
│ Railway Worker (runs continuously)              │
│                                                 │
│  Every 15 min:                                  │
│  1. Read watched_targets from Supabase          │
│     (platform IN bc_parks, ontario_parks,       │
│      parks_canada)                              │
│  2. Dedup by platform:campground_id             │
│  3. For each platform domain:                   │
│     - If cookies expired → Playwright solve WAF │
│     - Extract + cache cookies                   │
│  4. For each campground:                        │
│     - HTTP GET/POST with cached cookies         │
│     - Parse availability per date               │
│  5. For watches with full-range availability:   │
│     - INSERT availability_alert in Supabase     │
│                                                 │
│  Extension picks up alerts via existing polling  │
└─────────────────────────────────────────────────┘
```

## Cookie Management

The core technical challenge. Implemented as a `CookieManager` class.

**Per-domain cookie cache:**
- In-memory Map: `domain → { cookies: string[], expiresAt: number }`
- Three domains max: `camping.bcparks.ca`, `reservations.ontarioparks.ca`, `reservation.pc.gc.ca`

**Refresh strategy:**
- Cookies assumed valid for 25 minutes (conservative; actual expiry may be ~30 min)
- On 403 response during polling: force-refresh cookies for that domain immediately
- On WAF solve failure: skip that platform this cycle, retry next cycle

**Playwright WAF solve flow:**
1. Launch headless Chromium (`playwright.chromium.launch({ headless: true })`)
2. Create new page with realistic viewport + user agent
3. Navigate to homepage (e.g., `https://camping.bcparks.ca/`)
4. Wait for WAF JS challenge to auto-solve (typically 2-5 seconds)
5. Wait for a known element or URL change indicating the real page loaded
6. Extract all cookies from the browser context
7. Close browser
8. Cache cookies with 25-minute expiry

**Failure modes:**
- WAF adds CAPTCHA (not just JS challenge): log error, skip platform, alert operator
- Playwright crash: catch, log, continue — next cycle will retry
- Cookies work for some endpoints but not others: force-refresh on any 403

## Availability Polling

Once cookies are obtained, availability checks are plain HTTP — fast and cheap.

**Request pattern (GoingToCamp API):**
- The exact endpoint and parameters need validation against the real API (our earlier testing got 400 responses with session cookies — the correct endpoint path and parameter format must be determined during implementation by observing real browser network traffic with Playwright)
- Campground IDs are negative integers for BC Parks and Ontario Parks (already stored in `watched_targets.campground_id`)
- Parks Canada IDs are slug-based (`BrucePeninsula/CyprusLake`) — may need different handling

**Request headers:**
```
Cookie: <cached cookies from Playwright>
Accept: application/json
Accept-Language: en-US
User-Agent: <same UA used during Playwright solve>
Referer: https://{domain}/
```

**Rate limiting:**
- 2-second delay between requests to same domain
- Max 30 campground requests per cycle (same as Vercel cron)
- If rate-limited (429): back off, reduce frequency for that domain

**Response parsing:**
- Extract per-site, per-date availability from response
- Check every night in the watch's arrival→departure range
- Status must be "AVAILABLE" (or equivalent) for all nights
- Filter by `site_number` if the watch specifies one

## Alert Creation

When availability is found, insert into `availability_alerts`:

```sql
INSERT INTO availability_alerts (watched_target_id, user_id, site_details)
VALUES ($1, $2, $3)
```

Where `site_details` is `{ "sites": [{ "siteId": "-123", "siteName": "Site A1" }] }`.

**Dedup:** Before inserting, check if an unclaimed alert already exists for the same `watched_target_id` with the same sites. Skip if duplicate. This prevents spamming the user with repeated alerts for the same opening.

## File Structure

```
alphacamper-worker/
├── Dockerfile              — Playwright + Node.js image
├── package.json            — Dependencies: playwright, @supabase/supabase-js
├── tsconfig.json           — TypeScript config
├── railway.json            — Railway deployment config (optional, can use dashboard)
├── .env.example            — Required env vars template
├── src/
│   ├── index.ts            — Entry point: cron loop, orchestrates each cycle
│   ├── cookie-manager.ts   — Playwright WAF solver, per-domain cookie cache
│   ├── poller.ts           — HTTP availability checks using cached cookies
│   ├── supabase.ts         — Read watched_targets, write availability_alerts, dedup check
│   └── config.ts           — Domain mappings, timing constants, platform config
└── __tests__/
    ├── poller.test.ts      — Unit tests for availability parsing (mocked HTTP)
    └── supabase.test.ts    — Unit tests for query building and dedup logic
```

## Environment Variables

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Service role, not anon key — worker is trusted
POLL_INTERVAL_MS=900000             # 15 minutes
COOKIE_TTL_MS=1500000               # 25 minutes
LOG_LEVEL=info
```

Note: Uses `SUPABASE_SERVICE_ROLE_KEY` (not anon key) because the worker needs to read all users' watches and write alerts without RLS restrictions.

## Dockerfile

```dockerfile
FROM mcr.microsoft.com/playwright:v1.50.0-noble
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npx tsc
CMD ["node", "dist/index.js"]
```

Uses Microsoft's official Playwright Docker image which includes Chromium and all system dependencies (~400MB).

## Logging

Every cycle logs:
```
[cycle] platforms: 3 | campgrounds: 12 | requests: 12 | alerts: 2 | cookies_refreshed: 1 | duration: 45s
```

On error:
```
[error] domain=camping.bcparks.ca type=waf_solve_failed reason="timeout waiting for page load"
[error] domain=reservations.ontarioparks.ca type=http_403 action=force_cookie_refresh
```

## What This Does NOT Do

- No user authentication — all checks are anonymous (public availability data)
- No cart manipulation, no booking, no login to user accounts
- No Recreation.gov — that stays on the Vercel cron (public API, no WAF)
- No email/SMS/push notifications — the worker only writes to Supabase; the extension handles delivery
- No web UI — this is a headless background process

## Scaling

At current design:
- 1 Railway instance ($5/month) handles ~500 unique campgrounds per cycle
- Cookie refresh is per-domain (3 domains), not per-campground
- Main bottleneck: 2s delay between requests × 500 = ~17 min (just over the 15-min cycle)
- At 500+ campgrounds: either increase cycle to 30 min or add a second worker instance

## Open Questions to Resolve During Implementation

1. **Exact API endpoint path and parameters** — our curl testing got 400s (bad params) and 403s (WAF). During implementation, use Playwright to observe the actual network requests the site makes when browsing availability, then replicate those exact requests with cached cookies.
2. **Cookie format** — need to determine if all cookies from the browser context are needed, or just specific ones (XSRF-TOKEN, .AspNetCore.Antiforgery, session cookies).
3. **Parks Canada ID format** — slug-based IDs in `platforms.js` may not match what the API expects. May need to discover numeric IDs via the browser.
4. **WAF challenge variability** — Azure WAF may serve different challenge types (JS-only vs CAPTCHA) depending on traffic. Need to handle both gracefully.
