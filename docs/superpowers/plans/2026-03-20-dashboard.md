# Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an authenticated dashboard at `/dashboard` showing the user's active watches, recent alerts, and an upgrade CTA — gated by Supabase Auth magic link login.

**Architecture:** Client-side auth check via `supabase.auth.getUser()`. If unauthenticated, show email login form that sends a magic link. If authenticated, resolve the user's email to their `users.id` via `POST /api/register`, then fetch watches and alerts from existing API endpoints. All dashboard components are client-side (`'use client'`). The page route remains a server component for metadata only.

**Tech Stack:** Next.js 16, React 19, Supabase Auth (magic link), existing API routes, CSS from Phase 1 wizard tokens

**Spec:** `docs/superpowers/specs/2026-03-20-dashboard-design.md`

---

## File Structure

### New Files
```
alphacamper-site/
├── components/
│   └── dashboard/
│       ├── DashboardShell.tsx      # Auth orchestrator (loading/login/dashboard states)
│       ├── LoginPrompt.tsx         # Email form → magic link
│       ├── WatchList.tsx           # Fetches + renders watch cards
│       ├── WatchCard.tsx           # Single watch with status + delete
│       ├── AlertList.tsx           # Fetches + renders alert cards
│       ├── AlertCard.tsx           # Single alert with book/dismiss
│       └── UpgradeCTA.tsx          # Extension upgrade pitch
└── app/
    └── globals.css                 # Dashboard-specific CSS additions
```

### Modified Files
```
alphacamper-site/
├── app/
│   └── dashboard/
│       └── page.tsx                # Replace placeholder with DashboardShell
└── app/
    └── globals.css                 # Add dashboard card styles
```

---

## Task 1: Dashboard CSS Additions

**Files:**
- Modify: `alphacamper-site/app/globals.css`

Add dashboard-specific styles to the existing wizard CSS section. These extend the design system with card variants for watches, alerts, and the CTA.

- [ ] **Step 1: Add dashboard styles**

Append to `globals.css` (before the responsive media query block):

```css
/* ═══ Dashboard ═══ */

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.dashboard-header h1 {
  font-family: var(--font-fraunces, var(--font-display));
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.dashboard-section {
  margin-bottom: 32px;
}

.dashboard-section-title {
  font-family: var(--font-dm-sans, var(--font-body));
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--color-text);
  margin-bottom: 16px;
}

/* Watch card */
.watch-card {
  border: var(--border-bold) solid var(--color-border-bold);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  margin-bottom: 12px;
  background: var(--color-surface);
  transition: box-shadow 0.2s ease;
}

.watch-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.watch-card[data-past="true"] {
  opacity: 0.5;
  border-color: var(--color-border);
}

.watch-card-name {
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--color-text);
  margin-bottom: 4px;
}

.watch-card-details {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.watch-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.watch-card-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--bright-green);
  flex-shrink: 0;
}

.status-dot[data-inactive="true"] {
  background: var(--color-border);
}

.btn-text-danger {
  background: none;
  border: none;
  color: #cc3333;
  font-size: 0.82rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
}

.btn-text-danger:hover {
  background: #fff0f0;
}

/* Alert card */
.alert-card {
  border: var(--border-thin) solid var(--color-border);
  border-left: 4px solid var(--royal);
  border-radius: var(--radius-sm);
  padding: 16px 20px;
  margin-bottom: 12px;
  background: var(--color-surface);
}

.alert-card-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-text);
  margin-bottom: 4px;
}

.alert-card-time {
  font-size: 0.82rem;
  color: var(--color-text-muted);
  margin-bottom: 12px;
}

.alert-card-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-text-accent {
  background: none;
  border: none;
  color: var(--royal);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
  text-decoration: none;
}

.btn-text-accent:hover {
  background: rgba(0, 68, 170, 0.08);
}

.btn-text-muted {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 0.82rem;
  cursor: pointer;
  padding: 4px 8px;
}

/* Upgrade CTA card */
.upgrade-card {
  background: var(--forest);
  color: var(--color-text-inverse);
  border-radius: var(--radius-lg);
  padding: 32px;
  text-align: center;
}

.upgrade-card h3 {
  font-family: var(--font-fraunces, var(--font-display));
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.upgrade-card p {
  font-size: 0.95rem;
  opacity: 0.9;
  margin-bottom: 20px;
}

.btn-bold-inverse {
  background: var(--color-surface);
  color: var(--forest);
  border-color: var(--color-surface);
}

.btn-bold-inverse:hover {
  background: var(--gray-bg);
  border-color: var(--gray-bg);
  transform: translateY(-1px);
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 32px 16px;
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

/* Loading skeleton */
.skeleton {
  background: linear-gradient(90deg, var(--gray-bg) 25%, #e0e0e0 50%, var(--gray-bg) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

.skeleton-card {
  height: 100px;
  border-radius: var(--radius-lg);
  margin-bottom: 12px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

- [ ] **Step 2: Add responsive rules for dashboard inside the existing media query**

Find the existing `@media (max-width: 480px)` block and add dashboard rules inside it:

```css
.dashboard-header {
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.watch-card {
  padding: 16px;
}

.upgrade-card {
  padding: 24px;
}
```

- [ ] **Step 3: Verify build**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-site && npm run build`

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat: add dashboard card styles and loading skeleton CSS"
```

---

## Task 2: LoginPrompt Component

**Files:**
- Create: `alphacamper-site/components/dashboard/LoginPrompt.tsx`

Email form that sends a magic link for authentication. Shown when user is not logged in.

- [ ] **Step 1: Create LoginPrompt**

Create `components/dashboard/LoginPrompt.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { validateEmail } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase'

export function LoginPrompt() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [touched, setTouched] = useState(false)

  const isValid = validateEmail(email)

  const handleSubmit = async () => {
    if (!isValid || status === 'sending') return
    setStatus('sending')

    const supabase = getSupabase()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    })

    setStatus(error ? 'error' : 'sent')
  }

  if (status === 'sent') {
    return (
      <div className="step-card" style={{ padding: '40px 24px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '1.5rem', marginBottom: '12px' }}>
          Check your email
        </h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          We sent a login link to <strong>{email}</strong>.
          Click it to access your dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="step-card" style={{ padding: '32px 24px' }}>
      <h2 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '1.3rem', marginBottom: '8px' }}>
        Sign in to see your watches
      </h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
        Enter your email and we&apos;ll send you a login link.
      </p>

      <div className="field-group">
        <input
          className={`field-input ${touched && !isValid && email ? 'field-input-error' : ''}`}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
        />
        {touched && !isValid && email && (
          <p style={{ color: '#cc3333', fontSize: '0.85rem', marginTop: '4px' }}>
            Please enter a valid email address.
          </p>
        )}
      </div>

      {status === 'error' && (
        <p className="error-banner">Something went wrong. Please try again.</p>
      )}

      <button
        type="button"
        className="btn-bold btn-bold-primary btn-bold-full"
        onClick={handleSubmit}
        disabled={!isValid || status === 'sending'}
      >
        {status === 'sending' ? 'Sending...' : 'Send login link'}
      </button>

      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '12px' }}>
        Don&apos;t have an account? <a href="/watch/new" style={{ color: 'var(--color-accent)' }}>Create your first watch</a>
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/LoginPrompt.tsx
git commit -m "feat: add login prompt component with magic link auth"
```

---

## Task 3: WatchCard Component

**Files:**
- Create: `alphacamper-site/components/dashboard/WatchCard.tsx`

Single watch card with status indicator, details, and delete action.

- [ ] **Step 1: Create WatchCard**

Create `components/dashboard/WatchCard.tsx`:

```tsx
'use client'

interface Watch {
  id: string
  campground_name: string
  platform: string
  arrival_date: string
  departure_date: string
  site_number: string | null
  last_checked_at: string | null
  created_at: string
}

interface WatchCardProps {
  watch: Watch
  isPast: boolean
  onDelete: (id: string) => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function nightCount(arrival: string, departure: string): number {
  const a = new Date(arrival + 'T00:00:00')
  const d = new Date(departure + 'T00:00:00')
  return Math.round((d.getTime() - a.getTime()) / 86400000)
}

function platformLabel(platform: string): string {
  return platform === 'bc_parks' ? 'BC Parks' : 'Ontario Parks'
}

export function WatchCard({ watch, isPast, onDelete }: WatchCardProps) {
  const nights = nightCount(watch.arrival_date, watch.departure_date)
  const siteLabel = watch.site_number ? `Site #${watch.site_number}` : 'Any site'

  const handleDelete = () => {
    if (window.confirm(`Delete watch for ${watch.campground_name}?`)) {
      onDelete(watch.id)
    }
  }

  return (
    <div className="watch-card" data-past={isPast ? 'true' : 'false'}>
      <div className="watch-card-name">
        {watch.campground_name}
        <span style={{ fontWeight: 400, fontSize: '0.85rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>
          {platformLabel(watch.platform)}
        </span>
      </div>
      <div className="watch-card-details">
        {watch.arrival_date} → {watch.departure_date} ({nights} night{nights !== 1 ? 's' : ''}) · {siteLabel}
      </div>
      <div className="watch-card-footer">
        <div className="watch-card-status">
          <span className="status-dot" data-inactive={isPast ? 'true' : 'false'} />
          {isPast ? 'Expired' : 'Watching'}
          {!isPast && watch.last_checked_at && (
            <span> · Last checked {timeAgo(watch.last_checked_at)}</span>
          )}
        </div>
        {!isPast && (
          <button type="button" className="btn-text-danger" onClick={handleDelete}>
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

export type { Watch }
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/WatchCard.tsx
git commit -m "feat: add watch card component with status and delete"
```

---

## Task 4: WatchList Component

**Files:**
- Create: `alphacamper-site/components/dashboard/WatchList.tsx`

Fetches watches from API and renders WatchCards, splitting into current vs. past.

- [ ] **Step 1: Create WatchList**

Create `components/dashboard/WatchList.tsx`:

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { WatchCard, type Watch } from './WatchCard'
import Link from 'next/link'

interface WatchListProps {
  userId: string
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function WatchList({ userId }: WatchListProps) {
  const [watches, setWatches] = useState<Watch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPast, setShowPast] = useState(false)

  const fetchWatches = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(`/api/watch?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to load watches')
      const { watches } = await res.json()
      setWatches(watches || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load watches')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchWatches() }, [fetchWatches])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/watch?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setWatches((prev) => prev.filter((w) => w.id !== id))
    } catch {
      setError('Failed to delete watch. Please try again.')
    }
  }

  const today = todayStr()
  const current = watches.filter((w) => w.departure_date >= today)
  const past = watches.filter((w) => w.departure_date < today)

  if (loading) {
    return (
      <div className="dashboard-section">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-section">
        <p className="error-banner">{error}</p>
        <button type="button" className="btn-bold btn-bold-outline" onClick={fetchWatches}>
          Retry
        </button>
      </div>
    )
  }

  if (watches.length === 0) {
    return (
      <div className="dashboard-section">
        <div className="empty-state">
          <div className="illustration-placeholder" style={{ maxWidth: '200px', marginInline: 'auto', marginBottom: '16px', minHeight: '120px' }}>
            Alpha with an empty leash — waiting for a mission
          </div>
          <p style={{ marginBottom: '16px' }}>No watches yet. Create your first one.</p>
          <Link href="/watch/new" className="btn-bold btn-bold-primary" style={{ textDecoration: 'none' }}>
            Create a watch
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-section">
      {current.map((w) => (
        <WatchCard key={w.id} watch={w} isPast={false} onDelete={handleDelete} />
      ))}

      {past.length > 0 && (
        <>
          <button
            type="button"
            className="btn-text-muted"
            onClick={() => setShowPast(!showPast)}
            style={{ marginTop: '8px', display: 'block' }}
          >
            {showPast ? 'Hide' : 'Show'} past watches ({past.length})
          </button>
          {showPast && past.map((w) => (
            <WatchCard key={w.id} watch={w} isPast={true} onDelete={handleDelete} />
          ))}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/WatchList.tsx
git commit -m "feat: add watch list with current/past filtering and delete"
```

---

## Task 5: AlertCard Component

**Files:**
- Create: `alphacamper-site/components/dashboard/AlertCard.tsx`

Single alert card with site details, booking link, and dismiss action.

- [ ] **Step 1: Create AlertCard**

Create `components/dashboard/AlertCard.tsx`:

```tsx
'use client'

import { getPlatformDomain } from '@/lib/parks'

interface Alert {
  id: string
  site_details: { sites?: { siteId: string; siteName: string }[] } | null
  notified_at: string
  watched_targets: {
    campground_name: string
    campground_id: string
    platform: string
    arrival_date: string
    departure_date: string
  } | null
}

interface AlertCardProps {
  alert: Alert
  onDismiss: (id: string) => void
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function buildBookingLink(platform: string, campgroundId: string): string | null {
  const domain = getPlatformDomain(platform)
  if (!domain) return null
  return `https://${domain}/create-booking/results?resourceLocationId=${campgroundId}`
}

export function AlertCard({ alert, onDismiss }: AlertCardProps) {
  const target = alert.watched_targets
  const sites = alert.site_details?.sites ?? []
  const siteNames = sites.map((s) => s.siteName).join(', ') || 'a site'
  const campgroundName = target?.campground_name ?? 'Unknown campground'
  const bookingLink = target ? buildBookingLink(target.platform, target.campground_id) : null

  return (
    <div className="alert-card">
      <div className="alert-card-title">
        {campgroundName} — {siteNames} opened up!
      </div>
      <div className="alert-card-time">
        {formatTime(alert.notified_at)}
      </div>
      <div className="alert-card-actions">
        {bookingLink && (
          <a
            href={bookingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-text-accent"
          >
            Book now →
          </a>
        )}
        <button type="button" className="btn-text-muted" onClick={() => onDismiss(alert.id)}>
          Dismiss
        </button>
      </div>
    </div>
  )
}

export type { Alert }
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/AlertCard.tsx
git commit -m "feat: add alert card with booking link and dismiss"
```

---

## Task 6: AlertList Component

**Files:**
- Create: `alphacamper-site/components/dashboard/AlertList.tsx`

Fetches alerts from API and renders AlertCards.

- [ ] **Step 1: Create AlertList**

Create `components/dashboard/AlertList.tsx`:

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertCard, type Alert } from './AlertCard'

interface AlertListProps {
  userId: string
}

export function AlertList({ userId }: AlertListProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch(`/api/alerts?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to load alerts')
      const { alerts } = await res.json()
      setAlerts(alerts || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchAlerts() }, [fetchAlerts])

  const handleDismiss = async (id: string) => {
    const res = await fetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">Recent Alerts</h2>
        <div className="skeleton skeleton-card" style={{ height: '70px' }} />
      </div>
    )
  }

  return (
    <div className="dashboard-section">
      <h2 className="dashboard-section-title">Recent Alerts</h2>
      {error ? (
        <div>
          <p className="error-banner">{error}</p>
          <button type="button" className="btn-bold btn-bold-outline" onClick={fetchAlerts}>Retry</button>
        </div>
      ) : alerts.length === 0 ? (
        <div className="empty-state">
          <div className="illustration-placeholder" style={{ maxWidth: '180px', marginInline: 'auto', marginBottom: '12px', minHeight: '100px' }}>
            Alpha sleeping with one eye open
          </div>
          <p>No alerts yet. Alpha&apos;s watching — we&apos;ll email you when we find one.</p>
        </div>
      ) : (
        alerts.map((a) => (
          <AlertCard key={a.id} alert={a} onDismiss={handleDismiss} />
        ))
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/AlertList.tsx
git commit -m "feat: add alert list with fetch and dismiss"
```

---

## Task 7: UpgradeCTA Component

**Files:**
- Create: `alphacamper-site/components/dashboard/UpgradeCTA.tsx`

- [ ] **Step 1: Create UpgradeCTA**

Create `components/dashboard/UpgradeCTA.tsx`:

```tsx
export function UpgradeCTA() {
  return (
    <div className="upgrade-card">
      <div className="illustration-placeholder" style={{ maxWidth: '160px', marginInline: 'auto', marginBottom: '16px', minHeight: '100px', background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}>
        Alpha wearing sunglasses, pointing at a laptop
      </div>
      <h3>Want to book faster?</h3>
      <p>
        Get the Chrome extension — autofill forms, practice booking,
        and grab sites the moment they open.
      </p>
      <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '16px' }}>
        $3.99/mo or $19/yr
      </p>
      <a
        href="#"
        className="btn-bold btn-bold-inverse"
        style={{ textDecoration: 'none' }}
      >
        Get the Extension →
      </a>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/UpgradeCTA.tsx
git commit -m "feat: add extension upgrade CTA card"
```

---

## Task 8: DashboardShell + Page Wiring

**Files:**
- Create: `alphacamper-site/components/dashboard/DashboardShell.tsx`
- Modify: `alphacamper-site/app/dashboard/page.tsx`

The orchestrator that checks auth state and renders either LoginPrompt or the full dashboard.

- [ ] **Step 1: Create DashboardShell**

Create `components/dashboard/DashboardShell.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { LoginPrompt } from './LoginPrompt'
import { WatchList } from './WatchList'
import { AlertList } from './AlertList'
import { UpgradeCTA } from './UpgradeCTA'
import Link from 'next/link'

type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

export function DashboardShell() {
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user?.email) {
        setAuthState('unauthenticated')
        return
      }

      // Resolve Supabase Auth email → users table ID
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email }),
        })
        if (res.ok) {
          const { user: dbUser } = await res.json()
          setUserId(dbUser.id)
          setAuthState('authenticated')
        } else {
          setAuthState('unauthenticated')
        }
      } catch {
        setAuthState('unauthenticated')
      }
    }

    checkAuth()
  }, [])

  if (authState === 'loading') {
    return (
      <div>
        <div className="dashboard-header">
          <div className="skeleton" style={{ width: '200px', height: '32px' }} />
        </div>
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    )
  }

  if (authState === 'unauthenticated') {
    return <LoginPrompt />
  }

  return (
    <div>
      <div className="dashboard-header">
        <h1>Your Watches</h1>
        <Link href="/watch/new" className="btn-bold btn-bold-primary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '0.9rem' }}>
          + Create a watch
        </Link>
      </div>

      <WatchList userId={userId!} />
      <AlertList userId={userId!} />
      <UpgradeCTA />
    </div>
  )
}
```

- [ ] **Step 2: Update the dashboard page to use DashboardShell**

Replace the contents of `app/dashboard/page.tsx`:

```tsx
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export const metadata = {
  title: 'Dashboard — Alphacamper',
  description: 'Your campsite watches and alerts.',
}

export default function DashboardPage() {
  return (
    <main className="wizard-container" style={{ background: 'var(--gray-bg)', minHeight: '100vh', maxWidth: '100%', padding: 0 }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>
        <DashboardShell />
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

- [ ] **Step 4: Verify lint**

Run: `npm run lint`
Fix any unescaped entity or Link issues in new files.

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/DashboardShell.tsx app/dashboard/page.tsx
git commit -m "feat: add dashboard shell with auth, watch list, alerts, and upgrade CTA"
```

---

## Task 9: Integration Verification

**Files:** No new files.

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All existing tests pass.

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Clean build with `/dashboard` route.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: No new errors in dashboard files.

- [ ] **Step 4: Manual verification**

Start: `npm run dev -- -p 3001`

1. Visit `http://localhost:3001/dashboard` — should show LoginPrompt (not logged in)
2. Enter email → "Send login link" → should show "Check your email" state
3. After magic link click → dashboard loads with user data (requires Supabase env vars)
4. Responsive check at 480px — header stacks, cards reduce padding
5. Empty states render correctly when no watches/alerts

- [ ] **Step 5: Final commit if any fixes**

```bash
git add -A
git commit -m "fix: dashboard integration fixes"
```

---

## Post-Plan Notes

### What This Plan Does NOT Cover (Deferred)

- **Nav bar updates** — Adding Dashboard/Sign In links to the site nav
- **Real-time updates** — Watches and alerts don't auto-refresh
- **Payment gate** — UpgradeCTA links to `#` placeholder, not Stripe
- **Watch editing** — Only create and delete for now
- **Email notifications** — Alert emails via Resend (later phase)

### Deep Link Format

The "Book now" link in AlertCard uses: `https://{domain}/create-booking/results?resourceLocationId={campground_id}`

This matches the extension's `deepLinkTemplate` pattern for BC Parks and Ontario Parks (both use Camis-style booking URLs with `resourceLocationId`).
