# Railway Worker — Canadian Parks Availability Poller

## Goal

A Node.js worker deployed on Railway that polls Canadian campground booking sites (BC Parks, Ontario Parks, Parks Canada) for cancellation availability. These sites are behind Azure WAF with JavaScript challenges, so the worker uses Playwright to solve the WAF and extract session cookies, then makes plain HTTP requests for the actual availability checks. Must compete with Schnerp on speed (5-min polling for imminent dates) and notification quality (SMS).

## Competitive Context

- **Schnerp:** "Tens of thousands of scans per request," SMS/push alerts, $3.50+/request or $29/month Pro. Dominates Canadian parks.
- **Campnab:** Email alerts only, $10-40 per scan. Weak on Canadian parks.
- **Official Notify Me:** Free but slow, email-only, limited to 3-5 alerts.
- **Our edge:** Faster alerts (5-min polling) + SMS + auto-open + autofill in the extension. We don't just tell you it's available — we get you 90% to booked.

## Technical Context

- BC Parks (`camping.bcparks.ca`) and Ontario Parks (`reservations.ontarioparks.ca`) use the GoingToCamp/Camis platform behind Azure WAF
- Parks Canada (`reservation.pc.gc.ca`) is also behind Azure WAF but uses a **different backend** (not GoingToCamp — it has its own API at `/ResInfo.ashx`). Parks Canada is phase 2.
- Direct HTTP requests from servers get blocked (403 or CAPTCHA challenge)
- The WAF requires a real browser to solve a JS challenge before issuing valid session cookies
- Once cookies are obtained, plain HTTP availability API calls work
- Recreation.gov has a public API and is already handled by the Vercel cron — not in scope for this worker
- The existing `watched_targets` and `availability_alerts` Supabase tables are the shared interface between this worker and the Alphacamper extension
- Alberta Parks (`reserve.albertaparks.ca`) also uses GoingToCamp — candidate for future addition

## Pre-Implementation Requirement: API Reconnaissance

**Before writing any worker code**, manually observe the real API:

1. Open `camping.bcparks.ca` in Chrome with DevTools Network tab
2. Navigate to a campground → search for availability
3. Record the exact: request URL, method, headers, body, and response format
4. Do the same for `reservations.ontarioparks.ca`
5. Document the verified API contract in this spec
6. Update the poller implementation to match reality, not assumptions

This is step zero. The GoingToCamp endpoint format, date keys, and response shape are currently unvalidated assumptions.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│ Railway Worker (runs continuously)                  │
│                                                     │
│  setTimeout-based loop (no overlapping cycles):     │
│  1. Read watched_targets from Supabase              │
│     WHERE platform IN (bc_parks, ontario_parks)     │
│     AND departure_date >= today                     │
│     AND last_checked_at oldest first (round-robin)  │
│     If none → skip cycle, sleep                     │
│  2. Dedup by platform:campground_id                 │
│  3. For each platform domain (SERIALLY):            │
│     - If cookies expired → Playwright solve WAF     │
│     - Extract + cache cookies                       │
│  4. For each campground:                            │
│     - HTTP availability check with cached cookies   │
│     - Parse per-date availability                   │
│  5. For watches with full-range availability:       │
│     - Confirm still available (re-check)            │
│     - UPSERT availability_alert in Supabase         │
│  6. Update last_checked_at on processed watches     │
│  7. Update worker_status with health metrics        │
│                                                     │
│  Poll interval:                                     │
│   - 5 min for watches arriving within 30 days       │
│   - 15 min for watches further out                  │
│                                                     │
│  Extension picks up alerts via existing polling      │
│  (SMS notification is a future add-on)              │
└─────────────────────────────────────────────────────┘
```

**Cycle scheduling:** Uses `setTimeout` after each cycle completes, NOT `setInterval`. Prevents overlapping cycles. Hard cycle timeout of 20 minutes — if exceeded, `process.exit(1)` and Railway auto-restarts.

## Cookie Management

The core technical challenge. Implemented as a `CookieManager` class.

**Per-domain cookie cache:**
- In-memory Map: `domain → { cookies: string[], expiresAt: number, ttlMs: number }`
- Two domains for phase 1: `camping.bcparks.ca`, `reservations.ontarioparks.ca`
- Not persisted across restarts (acceptable — on restart, 2 fresh Playwright solves take ~20 seconds total)

**Per-domain adaptive TTL:**
```typescript
const DEFAULT_TTLS: Record<string, number> = {
  'camping.bcparks.ca': 25 * 60 * 1000,
  'reservations.ontarioparks.ca': 20 * 60 * 1000,
};
```
If a domain's cookies cause a 403 before TTL expires, reduce that domain's TTL by 5 minutes for subsequent refreshes.

**Refresh strategy:**
- Cookies refreshed when TTL expires
- On 403 response during polling: force-refresh cookies for that domain immediately
- On WAF solve failure: skip that platform this cycle, retry next cycle

**Playwright WAF solve flow:**
1. Launch headless Chromium (`playwright.chromium.launch({ headless: true })`)
2. Create new page with realistic viewport + user agent
3. Navigate to homepage (e.g., `https://camping.bcparks.ca/`)
4. Wait for WAF JS challenge to auto-solve (typically 2-5 seconds)
5. Wait for a known element or URL change indicating the real page loaded
6. **Validation step:** Make one test availability request to confirm cookies work before caching
7. Extract all cookies from the browser context
8. Close browser
9. Cache cookies with domain-specific TTL

**Critical constraint: Playwright launches must be SERIAL (one domain at a time, never parallel).** Each Chromium instance uses 200-400MB RAM. Two concurrent instances would OOM on Railway's 512MB-1GB tier.

**Cold start:** After deploy or restart, all caches are empty. First cycle does 2 sequential Playwright solves (~20 seconds total) before polling begins.

**Failure modes:**
- WAF JS challenge: normal flow, auto-solved
- WAF CAPTCHA detected (`iframe[src*="captcha"]`, `div.g-recaptcha`): log critical error, fire Slack webhook, skip platform
- Playwright crash/hang: catch, log, continue — next cycle retries
- Cookies work for some endpoints but not others: force-refresh on any 403
- All requests 403 for 3 consecutive cycles: fire Slack webhook alert

## Watch Query and Fairness

```sql
SELECT DISTINCT ON (platform, campground_id) *
FROM watched_targets
WHERE active = true
  AND platform IN ('bc_parks', 'ontario_parks')
  AND departure_date >= CURRENT_DATE
ORDER BY platform, campground_id, last_checked_at ASC NULLS FIRST
LIMIT 500
```

Then fetch ALL watches for those campground groups:
```sql
SELECT * FROM watched_targets
WHERE active = true
  AND platform = $1
  AND campground_id = $2
  AND departure_date >= CURRENT_DATE
```

**Round-robin fairness:** `last_checked_at ASC NULLS FIRST` ensures new watches get checked first, and all watches get equal service regardless of when the user signed up.

**Requires new column:**
```sql
ALTER TABLE watched_targets ADD COLUMN last_checked_at TIMESTAMPTZ;
```

## Availability Polling

Once cookies are obtained, availability checks are plain HTTP — fast and cheap.

**Request pattern (GoingToCamp API — BC Parks, Ontario Parks):**
- Exact endpoint and parameters to be determined during API reconnaissance (see Pre-Implementation Requirement above)
- Campground IDs are negative integers for BC Parks and Ontario Parks (already stored in `watched_targets.campground_id`)

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
- If rate-limited (429): respect `Retry-After` header, back off for that domain
- Max 500 campground groups per cycle

**Response parsing:**
- Extract per-site, per-date availability from response
- Check every night in the watch's arrival→departure range
- Status must be "AVAILABLE" (or equivalent) for all nights
- Filter by `site_number` if the watch specifies one

**Confirm-before-alert:** After finding availability, wait 2 seconds and re-check the same campground. Only create an alert if the site is still available on the second check. This reduces stale alerts from sites that are taken between detection and notification.

## Alert Creation

When availability is confirmed (double-checked), upsert into `availability_alerts`:

```sql
INSERT INTO availability_alerts (watched_target_id, user_id, site_details)
VALUES ($1, $2, $3)
ON CONFLICT ON CONSTRAINT idx_one_unclaimed_alert_per_watch DO NOTHING
```

**Database migration required:**
```sql
-- Partial unique index: only one unclaimed alert per watch at a time
CREATE UNIQUE INDEX idx_one_unclaimed_alert_per_watch
  ON availability_alerts (watched_target_id)
  WHERE claimed = false;

-- Round-robin tracking
ALTER TABLE watched_targets ADD COLUMN last_checked_at TIMESTAMPTZ;

-- Worker health tracking
CREATE TABLE worker_status (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  last_cycle_at TIMESTAMPTZ,
  last_successful_poll_at TIMESTAMPTZ,
  consecutive_403_count INT DEFAULT 0,
  platforms_healthy JSONB DEFAULT '{}',
  cycle_stats JSONB DEFAULT '{}'
);
```

**Re-availability handling:** When a watch already has an unclaimed alert (from a previous opening that was taken), and the site becomes available again, the `ON CONFLICT DO NOTHING` prevents a new alert. To handle this: at the start of each cycle, auto-expire unclaimed alerts older than 1 hour by marking them `claimed = true` with a `claimed_reason = 'expired'`. This allows new alerts for re-openings.

## Health Monitoring and Operator Alerting

**Worker status table:** Updated at the end of each cycle with:
- `last_cycle_at` — timestamp
- `last_successful_poll_at` — last time at least 1 request got 200
- `consecutive_403_count` — per domain, resets on success
- `platforms_healthy` — `{"bc_parks": true, "ontario_parks": false}`
- `cycle_stats` — `{"checked": 12, "alerts": 2, "duration_ms": 45000}`

**Slack/Discord webhook:** Fire immediately when:
- Any domain returns 403 on every request for 3 consecutive cycles
- CAPTCHA detected during Playwright solve
- Cycle timeout hit (20 min)
- Supabase connection failure

**Health endpoint:** `GET /health` returns:
```json
{
  "healthy": true,
  "last_cycle": "2026-07-10T14:30:00Z",
  "platforms": { "bc_parks": "ok", "ontario_parks": "ok" },
  "uptime_seconds": 86400
}
```
Returns `healthy: false` when `consecutive_403_count > 5` for any domain or `last_cycle_at` is older than 30 minutes.

**Kill switch:** Environment variable `DISABLED_PLATFORMS=bc_parks` instantly disables polling for a platform without a deploy. Checked at the start of each cycle.

## API Authentication (Required Before Launch)

**Current state:** All API routes (`/api/alerts`, `/api/watch`, `/api/register`) have ZERO authentication. Anyone can read, write, or delete any user's data.

**MVP fix:** HMAC-signed tokens.
1. On `/api/register`, generate a signed token: `HMAC-SHA256(userId, SECRET_KEY)`
2. Return token to extension, stored in `chrome.storage.local`
3. All subsequent requests include `Authorization: Bearer <token>`
4. API routes verify the HMAC before processing

This is a separate task from the worker but is a prerequisite for charging users $19.

## File Structure

```
alphacamper-worker/
├── Dockerfile              — Multi-stage: build with tsc, run with production deps
├── package.json            — Dependencies: playwright, @supabase/supabase-js
├── tsconfig.json           — TypeScript config
├── .env.example            — Required env vars template
├── src/
│   ├── index.ts            — Entry: setTimeout loop, cycle timeout, health endpoint
│   ├── cookie-manager.ts   — Playwright WAF solver, per-domain adaptive TTL cache
│   ├── poller.ts           — HTTP availability checks, confirm-before-alert
│   ├── supabase.ts         — Read watches (round-robin), write alerts (upsert), health status
│   ├── config.ts           — Domain mappings, timing constants, kill switch
│   ├── alerter.ts          — Slack webhook for operator alerts
│   └── logger.ts           — Structured logging with timestamps and levels
└── __tests__/
    ├── poller.test.ts      — Unit tests for availability parsing (mocked HTTP)
    ├── supabase.test.ts    — Unit tests for query building and dedup logic
    └── cookie-manager.test.ts — Tests for adaptive TTL and cache behavior
```

## Environment Variables

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...     # Service role key (see security note below)
POLL_INTERVAL_FAST_MS=300000          # 5 minutes (imminent watches)
POLL_INTERVAL_SLOW_MS=900000          # 15 minutes (future watches)
CYCLE_TIMEOUT_MS=1200000              # 20 minutes max per cycle
SLACK_WEBHOOK_URL=https://hooks...    # Operator alerts
DISABLED_PLATFORMS=                    # Kill switch, comma-separated
LOG_LEVEL=info
```

**Security note on service role key:** Ideally, create a dedicated Supabase database role with minimal permissions (`SELECT` on `watched_targets`, `INSERT/UPDATE` on `availability_alerts`, `INSERT/UPDATE` on `worker_status`). For MVP, the service role key is acceptable but should be rotated quarterly. Never log environment variables.

## Dockerfile

Multi-stage build:

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
EXPOSE 8080
CMD ["node", "dist/index.js"]
```

Image size: ~1.3GB (Playwright + Chromium + system deps). Railway handles this fine.

**Playwright version maintenance:** Set up Dependabot or Renovate to auto-PR Playwright version bumps. Azure WAF may start rejecting old browser fingerprints after 3-6 months.

## Logging

Every cycle:
```
[cycle] platforms: 2 | campgrounds: 12 | requests: 12 | successful: 11 | failed: 1 | alerts: 2 | cookies_refreshed: 1 | duration: 45s
```

On error:
```
[error] domain=camping.bcparks.ca type=waf_solve_failed reason="timeout waiting for page load"
[error] domain=reservations.ontarioparks.ca type=http_403 action=force_cookie_refresh consecutive=3
[critical] domain=camping.bcparks.ca type=captcha_detected action=slack_alert_sent
```

## What This Does NOT Do

- No user authentication — all availability checks are anonymous (public data)
- No cart manipulation, no booking, no login to user accounts
- No Recreation.gov — that stays on the Vercel cron (public API, no WAF)
- No email/SMS/push notifications in v1 — the worker only writes to Supabase; the extension handles delivery. SMS is a planned follow-up.
- No web UI — headless background process
- No Parks Canada in phase 1 (different backend, separate effort)

## Scaling

- 1 Railway instance ($5/month) handles ~500 unique campgrounds per cycle
- Cookie refresh is per-domain (2 domains in phase 1), not per-campground
- At 500 campgrounds with 2s spacing: ~17 min per scan. setTimeout scheduling handles gracefully.
- At 500+ campgrounds: add second worker, coordinate via `last_checked_at` round-robin (both workers read from the same queue)
- **IP reputation:** Railway shared IPs could get flagged. Fallback: Railway Pro static IP ($20/month) or residential proxy for Playwright-only requests ($5-10/month).

## Legal Considerations

- All data accessed is public (no login required)
- No cart manipulation or automated booking
- Respectful rate limiting (2s between requests)
- `Retry-After` header respected
- Kill switch per platform for immediate compliance
- **Recommend:** 1-hour consultation with Canadian lawyer ($300-500 CAD) before launch

## Open Questions to Resolve During Implementation

1. **Exact API endpoint path and parameters** — MUST be resolved via browser DevTools reconnaissance before writing poller code. See Pre-Implementation Requirement section.
2. **Cookie format** — which specific cookies are needed? GoingToCamp platforms typically need `__RequestVerificationToken` and ASP.NET session cookies at minimum.
3. **WAF challenge variability** — Azure WAF may serve different challenge types (JS-only vs CAPTCHA) depending on traffic volume and time of day.
4. **Parks Canada (phase 2)** — uses `/ResInfo.ashx`, needs separate investigation and parser.
5. **SMS delivery** — provider selection (Twilio vs alternatives), cost per message, user phone number collection UX.
