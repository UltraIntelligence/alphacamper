# Alphacamper — AI Agent Reference

## Architecture

Three independent apps, one git repo. No shared package manager workspace.

| App | Path | Stack | Deploys To |
|-----|------|-------|------------|
| Site | `alphacamper-site/` | Next.js 16, React 19, Tailwind 4, Supabase | Vercel |
| Worker | `alphacamper-worker/` | Node.js, Playwright 1.50, Supabase | Railway (Docker) |
| Extension | `alphacamper-extension/` | Chrome MV3, vanilla JS | Chrome Web Store |

## Data Flow

Extension registers watches → Site API → Supabase → Worker polls park APIs → availability found → alert created in Supabase → user notified

## Commands

### Site (`cd alphacamper-site`)
- `npm run dev` — Next.js dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm test` — Vitest

### Worker (`cd alphacamper-worker`)
- `npm run dev` — run with tsx
- `npm run build` — tsc compile to dist/
- `npm start` — run compiled dist/index.js
- `npm test` — Vitest
- `npm run test:watch` — Vitest watch mode

### Extension
- No build step — load `alphacamper-extension/` as unpacked extension in Chrome

## Database (Supabase PostgreSQL)

Three tables:
- `users` — email, push_subscription (JSONB)
- `watched_targets` — user_id FK, platform, campground_id/name, dates, active, last_checked_at
- `availability_alerts` — watched_target_id FK, user_id FK, site_details (JSONB), notified_at, claimed

Schema: `alphacamper-site/supabase/schema-v1.1.sql`
RLS: **DEV/TEST ONLY** — all policies currently set to `true` (permissive).
This is a development shortcut and must **never** reach production.
- Must be gated behind a `NEXT_PUBLIC_RLS_DEV_OVERRIDE=true` env var (dev/preview only)
- Before any production release: search for `NEXT_PUBLIC_RLS_DEV_OVERRIDE` and remove it, then replace all `true` RLS policies with real auth-based rules (user_id checks, service-role guards, etc.)

## Environment Variables

### Site (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — client
- `SUPABASE_SERVICE_ROLE_KEY` — server-side admin
- `OPENROUTER_API_KEY` — AI trip planning
- `EXTENSION_AUTH_SECRET` — server-only HMAC secret for signing extension auth tokens (required)
- `NEXT_PUBLIC_SITE_URL` — canonical site URL used in extension auth redirects; falls back to `VERCEL_URL` then `http://localhost:3000`
- `NEXT_PUBLIC_ALLOWED_EXTENSION_IDS` — comma-separated Chrome extension IDs permitted to complete the extension auth flow
- `NEXT_PUBLIC_MAPTILER_KEY` — MapTiler API key for the landing hero map

### Worker
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
- `CAMPFLARE_API_KEY` — Campflare API access for Campflare platform integration
- `SLACK_WEBHOOK_URL` — operator alerts
- `RESEND_API_KEY` — Resend email service (alert notifications)
- `RESEND_FROM_EMAIL` — verified sender address (e.g. `alerts@alphacamper.com`); falls back to Resend sandbox domain if unset (dev only)
- `SENTDM_API_KEY` — Sent.dm API key for SMS/WhatsApp/RCS alert notifications
- `SENTDM_TEMPLATE_NAME` — Sent.dm message template name (default: `campsite_alert`)
- `DISABLED_PLATFORMS` — kill switch (comma-separated)
- `POLL_INTERVAL_MS` / `SLOW_POLL_INTERVAL_MS` / `CYCLE_TIMEOUT_MS`

## Supported Platforms

| Platform | Domain | API Style |
|----------|--------|-----------|
| BC Parks | `camping.bcparks.ca` | Camis recursive map API |
| Ontario Parks | `reservations.ontarioparks.ca` | Camis API |
| Parks Canada | `reservation.pc.gc.ca` | Camis API (same as BC/Ontario) |
| Recreation.gov | `recreation.gov` | REST API |

## Worker Gotchas

- BC Parks & Ontario Parks are behind Azure WAF — Playwright manages session cookies
- Cookie TTLs: BC Parks 25min, Ontario Parks 20min
- 403s trigger adaptive TTL reduction; 3+ consecutive = platform unhealthy
- 429 rate limits skip remaining campgrounds in that group
- Round-robin ordering by `last_checked_at` for fairness
- Alert dedup: no duplicate unclaimed alerts per watch
- Health check: `GET :8080/health` returns JSON with uptime and platform status
- Request delay: 2000ms between domain checks
- Max per cycle: 500 campgrounds
- Cycle timeout: 20min (force restart if hung)

## Site API Routes

- `POST/GET/DELETE /api/watch` — CRUD watched_targets
- `GET /api/check-availability` — cron endpoint (every 15 min via vercel.json)
- `GET/PATCH /api/alerts` — alert management
- `POST /api/plan-trip` — AI trip planning (OpenRouter)
- `POST /api/register` — user registration
- `POST /api/waitlist` — waitlist signups

## Extension Structure

- `background.js` — service worker
- `sidepanel/` — main UI
- `popup/` — quick actions
- `rehearsal/` — practice dry-run
- `content/autofill.js` + `content/overlay.js` — page interaction
- `lib/platforms.js` — platform registry with booking windows
- `lib/missions.js` — mission CRUD
- Keyboard: `Ctrl+Shift+F` fill forms, `Ctrl+Shift+Space` next fallback

## Testing

Vitest 4.1.0 for both site and worker. No extension tests.
- `alphacamper-site/__tests__/`
- `alphacamper-worker/__tests__/`

## Conventions

- TypeScript for site and worker; vanilla JS for extension
- No monorepo workspace manager — each app has independent node_modules
- Docker multi-stage build for worker (Playwright base image)
- Cron job: `vercel.json` schedules `/api/check-availability` every 15 min
