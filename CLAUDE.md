# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Claude-Specific

- Working directory: `/Users/ryan/Code/Alphacamper`
- Worker source also mounted at `/Users/ryan/Code/Alphacamper/alphacamper-worker/src`
- Always run commands from the relevant app directory, not the monorepo root
- Never open PRs unless explicitly asked — just commit and push

## Running a Single Test

```bash
# Site
cd alphacamper-site && npx vitest run __tests__/foo.test.ts
cd alphacamper-site && npx vitest run -t "test name pattern"

# Worker
cd alphacamper-worker && npx vitest run __tests__/foo.test.ts
cd alphacamper-worker && npx vitest run -t "test name pattern"
```

## Site Pages

- `/` — landing page (`app/page.tsx`)
- `/watch/new` — watch creation wizard (`components/watch/WatchWizard.tsx`)
- `/dashboard` — user's watches + alerts (`components/dashboard/`)
- `/auth/confirm` — Supabase magic link callback

## Undocumented API Routes

- `GET /api/campgrounds` — campground directory search (used by StepSearch in the wizard)
- `GET /api/geo` — IP-based geolocation (used by the landing hero map)
- `GET /api/extension-auth/start` + `GET /api/extension-auth/session` — HMAC-signed token exchange for Chrome extension auth

## Site Component Structure

- `components/landing/` — all landing page sections (hero, how it works, FAQ, etc.)
- `components/watch/` — multi-step watch creation wizard (StepSearch → StepDates → StepSiteNumber → StepEmail → StepSummary)
- `components/dashboard/` — authenticated user view (watches list, alerts list, upgrade CTA)
- `app/globals.css` — all custom CSS; Tailwind 4 used for utilities, custom classes for complex components

## Worker Cycle Architecture

The worker runs a continuous `loop()` → `runCycle()` → `setTimeout(loop)` pattern. Key behaviours to know:

- **Confirm-before-alert**: when availability is detected, the worker waits 2s and re-checks before creating an alert — prevents false positives from transient API responses
- **Cookie manager is a singleton** across cycles — cookies are refreshed lazily when expired, not proactively
- **Directory sync** runs once at startup in the background (non-blocking) — syncs campground name→ID maps to Supabase for each platform
- **403 handling**: forces cookie expiry + clears cart cache + clears ID cache; 3+ consecutive triggers a Slack alert; 5+ marks the platform unhealthy in the `/health` response
- **Health check returns 503** if any platform has 5+ consecutive 403s, or if `last_cycle_at` is >30 min stale
