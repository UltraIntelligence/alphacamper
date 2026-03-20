# Railway Worker — Canadian Parks Availability Poller

## Goal

A lightweight Node.js worker deployed on Railway that polls Canadian campground booking sites (BC Parks, Ontario Parks, Parks Canada) for cancellation availability. These sites are behind Azure WAF with JavaScript challenges, so the worker uses Playwright to solve the WAF and extract session cookies, then makes plain HTTP requests for the actual availability checks.

## Context

- BC Parks (`camping.bcparks.ca`) and Ontario Parks (`reservations.ontarioparks.ca`) use the GoingToCamp/Camis platform behind Azure WAF
- Parks Canada (`reservation.pc.gc.ca`) is also behind Azure WAF but uses a **different backend** (not GoingToCamp — it has its own API at `/ResInfo.ashx`). The poller will need a separate parser for Parks Canada.
- Direct HTTP requests from servers get blocked (403 or CAPTCHA challenge)
- The WAF requires a real browser to solve a JS challenge before issuing valid session cookies
- Once cookies are obtained, plain HTTP availability API calls work
- Recreation.gov has a public API and is already handled by the Vercel cron — not in scope for this worker
- The existing `watched_targets` and `availability_alerts` Supabase tables are the shared interface between this worker and the Alphacamper extension
- Alberta Parks (`reserve.albertaparks.ca`) also uses GoingToCamp and is a candidate for future addition with minimal extra code

## Architecture

```
┌─────────────────────────────────────────────────┐
│ Railway Worker (runs continuously)              │
│                                                 │
│  Every 15 min (setTimeout-based, not interval): │
│  1. Read watched_targets from Supabase          │
│     (platform IN bc_parks, ontario_parks,       │
│      parks_canada)                              │
│     WHERE departure_date >= today               │
│     If none found → skip cycle, sleep           │
│  2. Dedup by platform:campground_id             │
│  3. For each platform domain (SERIALLY):        │
│     - If cookies expired → Playwright solve WAF │
│     - Extract + cache cookies                   │
│  4. For each campground:                        │
│     - HTTP GET/POST with cached cookies         │
│     - Parse availability per date               │
│  5. For watches with full-range availability:   │
│     - UPSERT availability_alert in Supabase     │
│                                                 │
│  Next cycle scheduled AFTER current completes   │
│  Extension picks up alerts via existing polling  │
└─────────────────────────────────────────────────┘
```

**Cycle scheduling:** Uses `setTimeout` after each cycle completes, NOT `setInterval`. This prevents overlapping cycles when a scan takes longer than 15 minutes (e.g., at 500+ campgrounds). If a cycle takes 17 minutes, the next one starts at minute 32, not minute 30.

## Cookie Management

The core technical challenge. Implemented as a `CookieManager` class.

**Per-domain cookie cache:**
- In-memory Map: `domain → { cookies: string[], expiresAt: number }`
- Three domains max: `camping.bcparks.ca`, `reservations.ontarioparks.ca`, `reservation.pc.gc.ca`
- Not persisted across restarts (acceptable for MVP — on restart, 3 fresh Playwright solves take ~30 seconds total)

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

**Critical constraint: Playwright launches must be SERIAL (one domain at a time, never parallel).** Each Chromium instance uses 200-400MB RAM. On Railway's 512MB-1GB tier, two concurrent instances would OOM.

**Cold start:** After deploy or restart, all 3 domain caches are empty. First cycle will do 3 sequential Playwright solves (~30 seconds total) before polling begins.

**Failure modes:**
- WAF adds CAPTCHA (not just JS challenge): log error, skip platform, alert operator
- Playwright crash: catch, log, continue — next cycle will retry
- Cookies work for some endpoints but not others: force-refresh on any 403

## Availability Polling

Once cookies are obtained, availability checks are plain HTTP — fast and cheap.

**Request pattern (GoingToCamp API — BC Parks, Ontario Parks):**
- The exact endpoint and parameters need validation against the real API (our earlier testing got 400 responses with session cookies — the correct endpoint path and parameter format must be determined during implementation by observing real browser network traffic with Playwright)
- Campground IDs are negative integers for BC Parks and Ontario Parks (already stored in `watched_targets.campground_id`)

**Parks Canada — different API:**
- Parks Canada uses a separate backend at `reservation.pc.gc.ca/ResInfo.ashx`, not the GoingToCamp REST API
- Parks Canada IDs in `platforms.js` are slug-based (`BrucePeninsula/CyprusLake`) — may not map directly to API parameters
- The poller needs a separate parser/request pattern for Parks Canada
- Consider making Parks Canada a phase 2 addition if the API is significantly different

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
ON CONFLICT DO NOTHING
```

Where `site_details` is `{ "sites": [{ "siteId": "-123", "siteName": "Site A1" }] }`.

**Dedup:** Use a database-level unique constraint on `(watched_target_id, claimed)` where `claimed = false` to prevent duplicate unclaimed alerts for the same watch. This is atomic — no race conditions even with multiple workers. Application-level check-then-insert is NOT sufficient.

## Supabase Query

```sql
SELECT * FROM watched_targets
WHERE active = true
  AND platform IN ('bc_parks', 'ontario_parks', 'parks_canada')
  AND departure_date >= CURRENT_DATE
ORDER BY created_at ASC
LIMIT 50
```

**`departure_date >= CURRENT_DATE`** prevents wasting requests on expired watches.
**`ORDER BY created_at ASC`** ensures oldest watches get checked first (deterministic, fair).

## File Structure

```
alphacamper-worker/
├── Dockerfile              — Multi-stage: build with tsc, run with production deps
├── package.json            — Dependencies: playwright, @supabase/supabase-js
├── tsconfig.json           — TypeScript config
├── railway.json            — Railway deployment config (optional, can use dashboard)
├── .env.example            — Required env vars template
├── src/
│   ├── index.ts            — Entry point: setTimeout-based loop, orchestrates each cycle
│   ├── cookie-manager.ts   — Playwright WAF solver, per-domain cookie cache (serial only)
│   ├── poller.ts           — HTTP availability checks using cached cookies
│   ├── supabase.ts         — Read watched_targets, write availability_alerts, dedup via upsert
│   ├── config.ts           — Domain mappings, timing constants, platform config
│   └── logger.ts           — Structured logging with timestamps and levels
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

Multi-stage build to avoid shipping devDependencies:

```dockerfile
# Build stage
FROM mcr.microsoft.com/playwright:v1.50.0-noble AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx tsc

# Production stage
FROM mcr.microsoft.com/playwright:v1.50.0-noble
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

Uses Microsoft's official Playwright Docker image which includes Chromium and all system dependencies (~1.3GB image).

## Health Check

Write a `last_cycle_at` timestamp to a Supabase row (e.g., a `worker_status` table or a simple key in an existing config table) at the end of each cycle. This allows monitoring for silent failures — if `last_cycle_at` is older than 30 minutes, the worker is stuck.

Optionally expose a minimal HTTP endpoint (`GET /health`) that Railway can ping for liveness checks.

## Logging

Every cycle logs:
```
[cycle] platforms: 3 | campgrounds: 12 | requests: 12 | alerts: 2 | cookies_refreshed: 1 | duration: 45s
```

On error:
```
[error] domain=camping.bcparks.ca type=waf_solve_failed reason="timeout waiting for page load"
[error] domain=reservations.ontarioparks.ca type=http_403 action=force_cookie_refresh
[error] type=supabase_error reason="connection refused" action=skip_cycle
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
- Main bottleneck: 2s delay between requests × 500 = ~17 min (exceeds 15-min cycle — setTimeout scheduling handles this gracefully, next cycle starts after completion)
- At 500+ campgrounds: add a second worker instance (coordinate via Supabase to avoid duplicate polling)

## Open Questions to Resolve During Implementation

1. **Exact API endpoint path and parameters** — our curl testing got 400s (bad params) and 403s (WAF). During implementation, use Playwright to observe the actual network requests the site makes when browsing availability, then replicate those exact requests with cached cookies.
2. **Cookie format** — need to determine if all cookies from the browser context are needed, or just specific ones (XSRF-TOKEN, .AspNetCore.Antiforgery, session cookies). GoingToCamp platforms typically need at minimum `__RequestVerificationToken` and the ASP.NET session cookie.
3. **Parks Canada API** — uses a different backend (`/ResInfo.ashx`) than GoingToCamp. May need a separate parser in `poller.ts`. Consider making Parks Canada a phase 2 addition if significantly different.
4. **Parks Canada ID format** — slug-based IDs in `platforms.js` may not match what the API expects. May need to discover numeric IDs via the browser.
5. **WAF challenge variability** — Azure WAF may serve different challenge types (JS-only vs CAPTCHA) depending on traffic. Need to handle both gracefully.
