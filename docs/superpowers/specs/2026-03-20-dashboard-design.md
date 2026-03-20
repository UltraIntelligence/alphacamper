# Phase 2: Dashboard — Design Spec

**Goal:** Build an authenticated dashboard at `/dashboard` where users see their active campsite watches, recent availability alerts, and an upgrade CTA for the Chrome extension.

**Auth:** Supabase Auth (magic link). Already half-wired from Phase 1. Free tier, no extra cost.

---

## Auth Flow

1. User visits `/dashboard`
2. Client-side check: `supabase.auth.getUser()`
3. **Logged in** → show dashboard with their data
4. **Not logged in** → show inline email login form:
   - "Enter your email to see your watches"
   - Sends magic link via `supabase.auth.signInWithOtp()`
   - After clicking link → `/auth/confirm` (already exists) → redirects to `/dashboard`
   - User is now authenticated, dashboard loads their data
5. No middleware needed — auth check is client-side in the dashboard component
6. User ID comes from `supabase.auth.getUser()` → `user.id`

**Linking watch-creation to auth:** The Phase 1 wizard registers users via `POST /api/register` (creates a `users` table row). The magic link creates a Supabase Auth user. These are currently separate — the `users.id` (UUID from our table) is different from `auth.users.id` (Supabase Auth UUID). For Phase 2, we need to bridge this: when an authenticated user visits the dashboard, look up their `users` row by email match, then use that `users.id` to query watches/alerts.

---

## Dashboard Layout

### Sections (top to bottom)

**1. Header**
- "Your Watches" heading (Fraunces display font)
- "+ Create a watch" button (links to `/watch/new`)

**2. Watch List**
- Cards for each active watch
- Each card shows:
  - Campground name + platform label (BC Parks / Ontario Parks)
  - Date range + number of nights
  - Site preference (specific site or "Any site")
  - Status: green dot + "Watching" + "Last checked X ago" (from `last_checked_at`, if available — hide if null)
  - Delete button (soft-delete via `DELETE /api/watch?id=`)
- **Past watches:** Client-side filter on `departure_date < today` from the same API response. Shown grayed out at bottom, collapsed by default. The worker does NOT auto-deactivate expired watches — the client handles the visual distinction.
- Empty state: illustration placeholder + "No watches yet. Create your first one."

**3. Alerts Feed**
- "Recent Alerts" heading
- Cards for recent unclaimed alerts
- Each card shows:
  - Campground name + which sites opened (from `site_details` JSONB)
  - Timestamp (from `notified_at`)
  - "Book now" link (deep link to platform booking page)
  - "Dismiss" button (PATCH `/api/alerts` → sets `claimed=true`)
- Empty state: "No alerts yet. Alpha's watching — we'll email you when we find one."

**4. Upgrade CTA**
- Card with extension pitch
- "Want to book faster? Get the Chrome extension"
- Features: autofill, rehearsal mode, instant booking
- Price: $3.99/mo or $19/yr
- "Get Extension" button (links to Chrome Web Store or placeholder)
- Only shown to free-tier users (for now, always shown since we have no payment system yet)

---

## Data Fetching

- Client-side with `useEffect` + `useState` (no SWR for MVP)
- `GET /api/watch?userId={userId}` → active watches
- `GET /api/alerts?userId={userId}` → unclaimed alerts (max 20)
- Refetch after delete/dismiss actions
- Loading states with skeleton placeholders
- Error state with retry button

---

## Component Structure

```
app/
  dashboard/
    page.tsx                  # Server component shell (metadata only)

components/
  dashboard/
    DashboardShell.tsx        # Client component — auth check orchestrator
    LoginPrompt.tsx           # Email form for unauthenticated users
    WatchList.tsx             # Fetches and renders watch cards
    WatchCard.tsx             # Single watch with status + delete
    AlertList.tsx             # Fetches and renders alert cards
    AlertCard.tsx             # Single alert with book/dismiss actions
    UpgradeCTA.tsx            # Extension upgrade pitch card
```

### DashboardShell (orchestrator)
- `'use client'`
- States: `loading`, `authenticated`, `unauthenticated`
- On mount: calls `supabase.auth.getUser()`
- If authenticated: looks up user by email via `POST /api/register` (returns existing user), renders WatchList + AlertList + UpgradeCTA
- If not: renders LoginPrompt
- Passes `userId` down to child components

### LoginPrompt
- Email input + "Send login link" button
- Uses `validateEmail` from `lib/auth.ts`
- Calls `supabase.auth.signInWithOtp()` with redirect to `/auth/confirm` (which then bounces to `/dashboard`)
- Success state: "Check your email for a login link"
- Same bold card styling as wizard steps

### WatchCard
- Bordered card (`.step-card` style with thick borders)
- Green dot status indicator for active watches
- "Last checked X ago" computed from `last_checked_at` (relative time) — hidden if `last_checked_at` is null (watch not yet polled)
- Delete button with confirmation (simple `window.confirm` for MVP)
- Grayed styling for past watches (departure_date < today)

### AlertCard
- Bordered card with accent color for urgency
- Site details extracted from `site_details` JSONB — expected shape `{ sites: [{ siteId, siteName }] }` (set by the worker in `createAlert()`, not schema-enforced; render gracefully if shape differs)
- "Book now" generates deep link: `https://{domain}/create-booking/results?resourceLocationId={campground_id}`
- Dismiss calls `PATCH /api/alerts` with alert ID

---

## Visual Design

**Aesthetic:** Same bold Gumroad/nature style as the watch wizard — thick 3px borders, chunky 16px border-radius, forest green accents, white cards on light gray background.

**Color usage:**
- Page background: `var(--gray-bg)` (#EEEEEE)
- Cards: `var(--color-surface)` (white) with `var(--color-border-bold)` borders
- Status dot: `var(--bright-green)` for active, `var(--color-border)` for inactive
- Alert accent: `var(--royal)` left border stripe
- CTA card: `var(--forest)` background with white text
- Delete/dismiss: subtle, text-only buttons (not primary style)

**Typography:**
- Heading: Fraunces (display font, already loaded)
- Body/labels: DM Sans (body font, already loaded)

**Responsive:** Single column layout (max-width 640px, matching wizard). At 480px, reduce padding.

**Illustrations:** Placeholder containers for:
- Empty watches state: "Alpha with an empty leash — waiting for a mission"
- Empty alerts state: "Alpha sleeping with one eye open"
- Upgrade CTA: "Alpha wearing sunglasses, pointing at a laptop"

---

## API Notes

**Existing endpoints (no changes needed):**
- `GET /api/watch?userId=` — returns active watches, ordered by created_at DESC
- `DELETE /api/watch?id=` — soft-deletes (sets active=false)
- `GET /api/alerts?userId=` — returns unclaimed alerts (max 20), joined with watched_targets
- `PATCH /api/alerts` — marks alert as claimed

**User lookup:** The `POST /api/register` endpoint already handles "find or create by email" — we reuse this to resolve the Supabase Auth email to our `users.id`.

---

## Known Tech Debt

- **RLS policies are MVP placeholders** (`WITH CHECK (true)`). API routes use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for all operations. When RLS is hardened, server-side routes will need `SUPABASE_SERVICE_ROLE_KEY`. Not a blocker for Phase 2, but must be addressed before public launch.
- **`last_checked_at` column** may not exist in all environments. The column is added by migration `20260320000001_worker_support.sql` and updated by the worker. UI must handle null gracefully.

---

## What This Spec Does NOT Cover

- Payment/billing (Stripe integration — later phase)
- Push notifications (Web Push API — later phase)
- Watch editing (only create and delete for now)
- Real-time updates (polling/websockets — later phase)
- Nav bar updates (adding Dashboard/Sign In links — later phase)
