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
RLS: MVP placeholder (all `true`) — real auth TBD

## Environment Variables

### Site (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — client
- `SUPABASE_SERVICE_ROLE_KEY` — server-side admin
- `OPENROUTER_API_KEY` — AI trip planning

### Worker
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
- `SLACK_WEBHOOK_URL` — operator alerts
- `DISABLED_PLATFORMS` — kill switch (comma-separated)
- `POLL_INTERVAL_MS` / `SLOW_POLL_INTERVAL_MS` / `CYCLE_TIMEOUT_MS`

## Supported Platforms

| Platform | Domain | API Style |
|----------|--------|-----------|
| BC Parks | `camping.bcparks.ca` | Camis recursive map API |
| Ontario Parks | `reservations.ontarioparks.ca` | Camis API |
| Recreation.gov | `recreation.gov` | Stub only |

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
- `GET /api/check-availability` — cron endpoint (every 15min via vercel.json)
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
- Cron job: `vercel.json` schedules `/api/check-availability` every 15min
