# Watch Creation Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the web app watch-creation flow — a Schnerp-style accordion where users search a campground, pick dates, optionally specify a site number, and enter their email to create a campsite availability watch.

**Architecture:** Single `/watch/new` route with a client-side accordion wizard. Each step collapses when completed, showing a summary line. Park/campground data sourced from a static registry using real Camis IDs from the extension's platform data. Existing `/api/watch` POST and `/api/register` POST endpoints handle watch creation. No component library — custom CSS with bold Gumroad/nature aesthetic.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Supabase (existing client), Supabase Auth (magic link, fire-and-forget for Phase 1)

---

## Design Context

**Palette (new tokens, separate from existing landing page palette):**
| Token | Hex | Usage |
|-------|-----|-------|
| `--navy` | `#000066` | Dark sections, deep accents |
| `--royal` | `#0044AA` | Links, interactive elements, focus rings |
| `--bright-green` | `#55BB22` | CTAs, success states |
| `--forest` | `#339922` | Primary brand color |
| `--gray-bg` | `#EEEEEE` | Subtle section backgrounds |

**Note:** The landing page uses a separate palette (`--green`, `--cream`, `--sand`, etc.). These new tokens are for the wizard flow and will eventually replace the landing page palette in Phase 4.

**Style:** Bold color-blocked sections, thick borders (2-3px), chunky rounded corners (12-16px), confident typography. Hand-drawn Alpha bear illustrations will be added later (leave placeholder containers with descriptions).

**Fonts:** Keep existing Fraunces (display) + DM Sans (body).

---

## File Structure

### New Files
```
alphacamper-site/
├── app/
│   ├── watch/
│   │   └── new/
│   │       └── page.tsx                    # Watch creation page (server component wrapper)
│   ├── auth/
│   │   └── confirm/
│   │       └── page.tsx                    # Magic link callback (CLIENT page, not route)
│   └── dashboard/
│       └── page.tsx                        # Minimal dashboard placeholder
├── components/
│   └── watch/
│       ├── WatchWizard.tsx                 # Main accordion orchestrator (client component)
│       ├── StepSearch.tsx                  # Step 1: Campground search
│       ├── StepDates.tsx                   # Step 2: Arrival date + number of nights
│       ├── StepSiteNumber.tsx              # Step 3: Optional specific site number
│       ├── StepEmail.tsx                   # Step 4: Email entry
│       ├── WatchConfirmation.tsx           # Success state after creation
│       └── StepSummary.tsx                 # Collapsed step summary line
├── lib/
│   ├── parks.ts                            # Campground registry (real Camis IDs)
│   └── auth.ts                             # Email validation + magic link helpers
└── __tests__/
    ├── parks.test.ts                       # Campground search/filter tests
    └── auth.test.ts                        # Email validation tests
```

### Modified Files
```
alphacamper-site/
└── app/
    └── globals.css                         # Add new design tokens + wizard styles
```

---

## Task 1: Design Tokens & CSS Foundation

**Files:**
- Modify: `alphacamper-site/app/globals.css`

Adds the new color palette and wizard-specific CSS. All existing landing page styles remain untouched.

- [ ] **Step 1: Add new CSS custom properties**

Add to the `:root` block in `globals.css` (after existing variables):

```css
/* ── Wizard Nature Palette (separate from landing page palette) ── */
--navy: #000066;
--royal: #0044AA;
--bright-green: #55BB22;
--forest: #339922;
--gray-bg: #EEEEEE;

/* Semantic tokens for wizard */
--color-primary: var(--forest);
--color-primary-hover: var(--bright-green);
--color-accent: var(--royal);
--color-accent-hover: var(--navy);
--color-surface: #ffffff;
--color-surface-muted: var(--gray-bg);
--color-text: #1a1a1a;
--color-text-muted: #666666;
--color-text-inverse: #ffffff;
--color-border: #d0d0d0;
--color-border-bold: #1a1a1a;

/* Spacing */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--border-thin: 1.5px;
--border-bold: 3px;
```

- [ ] **Step 2: Add wizard layout and component styles**

Append to `globals.css`:

```css
/* ═══ Watch Wizard ═══ */

.wizard-container {
  max-width: 640px;
  margin: 0 auto;
  padding: 32px 24px;
}

.wizard-header {
  text-align: center;
  margin-bottom: 40px;
}

.wizard-header h1 {
  font-family: var(--font-fraunces, var(--font-display));
  font-size: 2rem;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

.wizard-header p {
  color: var(--color-text-muted);
  font-size: 1.05rem;
}

/* ── Bold buttons ── */

.btn-bold {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 28px;
  font-family: var(--font-dm-sans, var(--font-body));
  font-size: 1rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  border: var(--border-bold) solid var(--color-border-bold);
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-bold-primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}

.btn-bold-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
  transform: translateY(-1px);
}

.btn-bold-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-bold-outline {
  background: transparent;
  color: var(--color-text);
  border-color: var(--color-border-bold);
}

.btn-bold-outline:hover:not(:disabled) {
  background: var(--color-surface-muted);
}

.btn-bold-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-bold-full {
  width: 100%;
}

/* ── Step cards (accordion) ── */

.step-card {
  border: var(--border-bold) solid var(--color-border-bold);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 16px;
  background: var(--color-surface);
  transition: box-shadow 0.2s ease;
}

.step-card[data-state="open"] {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.step-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  cursor: pointer;
  user-select: none;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: var(--border-bold) solid var(--color-border-bold);
  font-weight: 700;
  font-size: 0.95rem;
  flex-shrink: 0;
}

.step-number[data-completed="true"] {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}

.step-title {
  font-family: var(--font-dm-sans, var(--font-body));
  font-weight: 600;
  font-size: 1.05rem;
  color: var(--color-text);
}

.step-summary {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.step-content {
  padding: 0 24px 24px;
}

/* ── Form elements ── */

.field-group {
  margin-bottom: 20px;
}

.field-label {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 6px;
  color: var(--color-text);
}

.field-hint {
  display: block;
  font-size: 0.82rem;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.field-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 1rem;
  border: var(--border-thin) solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  transition: border-color 0.15s ease;
}

.field-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(0, 68, 170, 0.12);
}

.field-input-error {
  border-color: #cc3333;
}

/* ── Selectable list items ── */

.selectable-item {
  width: 100%;
  text-align: left;
  padding: 12px 16px;
  border: var(--border-thin) solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.selectable-item:hover {
  border-color: var(--color-accent);
}

.selectable-item[data-selected="true"] {
  border: var(--border-bold) solid var(--color-primary);
  background: #f0f8f0;
  font-weight: 600;
}

.selectable-item-label {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  margin-left: 8px;
}

/* ── Nights counter ── */

.nights-counter {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nights-value {
  font-size: 1.5rem;
  font-weight: 700;
  min-width: 60px;
  text-align: center;
}

/* ── Illustration placeholder ── */

.illustration-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-surface-muted);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: 32px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  text-align: center;
  min-height: 200px;
}

/* ── Error banner ── */

.error-banner {
  color: #cc3333;
  font-size: 0.9rem;
  padding: 12px 16px;
  background: #fff0f0;
  border-radius: var(--radius-sm);
  margin-bottom: 16px;
}

/* ── Confirmation card ── */

.confirm-card {
  background: var(--color-surface-muted);
  border-radius: var(--radius-md);
  padding: 20px;
  margin-bottom: 24px;
  border: var(--border-thin) solid var(--color-border);
}

/* ── Responsive ── */

@media (max-width: 480px) {
  .wizard-container {
    padding: 24px 16px;
  }

  .wizard-header h1 {
    font-size: 1.6rem;
  }

  .step-card-header {
    padding: 16px;
  }

  .step-content {
    padding: 0 16px 16px;
  }
}
```

- [ ] **Step 3: Verify existing landing page still renders correctly**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-site && npm run build`
Expected: Build succeeds with no errors. Existing styles unaffected.

- [ ] **Step 4: Commit**

```bash
cd /Users/ryan/Code/Alphacamper/alphacamper-site
git add app/globals.css
git commit -m "feat: add nature palette design tokens and wizard CSS foundation"
```

---

## Task 2: Campground Data Module

**Files:**
- Create: `alphacamper-site/lib/parks.ts`
- Create: `alphacamper-site/__tests__/parks.test.ts`

Static registry of campgrounds using **real Camis IDs** from the extension's `lib/platforms.js`. The data is flat — each entry is a campground (not a park→campground hierarchy). For UX, we group by park name in the search results. Worker supports `bc_parks` and `ontario_parks` only.

- [ ] **Step 1: Write the failing tests**

Create `__tests__/parks.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  searchCampgrounds,
  getCampground,
  getPlatformDomain,
  CAMPGROUNDS,
} from '@/lib/parks'

describe('searchCampgrounds', () => {
  it('returns campgrounds matching a query (case-insensitive)', () => {
    const results = searchCampgrounds('alice')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name.toLowerCase()).toContain('alice')
  })

  it('returns empty array for no match', () => {
    const results = searchCampgrounds('xyznonexistent')
    expect(results).toEqual([])
  })

  it('returns all campgrounds when query is empty', () => {
    const results = searchCampgrounds('')
    expect(results.length).toBe(CAMPGROUNDS.length)
  })

  it('matches by park name', () => {
    const results = searchCampgrounds('algonquin')
    expect(results.length).toBeGreaterThan(0)
    results.forEach(r => expect(r.park?.toLowerCase()).toContain('algonquin'))
  })

  it('matches by province', () => {
    const results = searchCampgrounds('ontario')
    expect(results.length).toBeGreaterThan(0)
    results.forEach(r => expect(r.province).toBe('ON'))
  })
})

describe('getCampground', () => {
  it('returns campground by id', () => {
    const cg = getCampground('-2430')
    expect(cg).toBeDefined()
    expect(cg!.name).toBe('Alice Lake')
  })

  it('returns undefined for unknown id', () => {
    expect(getCampground('unknown')).toBeUndefined()
  })
})

describe('getPlatformDomain', () => {
  it('returns domain for bc_parks', () => {
    expect(getPlatformDomain('bc_parks')).toBe('camping.bcparks.ca')
  })

  it('returns domain for ontario_parks', () => {
    expect(getPlatformDomain('ontario_parks')).toBe('reservations.ontarioparks.ca')
  })

  it('returns null for unsupported platform', () => {
    expect(getPlatformDomain('unknown')).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-site && npx vitest run __tests__/parks.test.ts`
Expected: FAIL — module `@/lib/parks` does not exist.

- [ ] **Step 3: Implement the campgrounds module**

Create `lib/parks.ts` with real IDs from the extension's `lib/platforms.js`:

```typescript
export interface Campground {
  id: string        // Real Camis resourceLocationId (e.g., "-2430")
  name: string      // Campground name (used as fallback by worker's id-resolver)
  platform: 'bc_parks' | 'ontario_parks'
  province: string  // 2-letter code: "BC" or "ON"
  park?: string     // Parent park name (for grouping in search results)
}

const PLATFORM_DOMAINS: Record<string, string> = {
  bc_parks: 'camping.bcparks.ca',
  ontario_parks: 'reservations.ontarioparks.ca',
}

// Real Camis IDs from alphacamper-extension/lib/platforms.js
// These IDs are what the worker's id-resolver uses to poll the Camis API.
export const CAMPGROUNDS: Campground[] = [
  // ── BC Parks ──
  { id: '-2504', name: 'Rathtrevor Beach', platform: 'bc_parks', province: 'BC' },
  { id: '-2493', name: 'Golden Ears - Alouette', platform: 'bc_parks', province: 'BC' },
  { id: '-2471', name: 'Cultus Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2443', name: 'Birkenhead Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2532', name: 'Shuswap Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2457', name: 'Englishman River Falls', platform: 'bc_parks', province: 'BC' },
  { id: '-2499', name: 'Joffre Lakes', platform: 'bc_parks', province: 'BC' },
  { id: '-2472', name: 'Cypress Provincial Park', platform: 'bc_parks', province: 'BC' },
  { id: '-2503', name: 'Porteau Cove', platform: 'bc_parks', province: 'BC' },
  { id: '-2430', name: 'Alice Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2521', name: 'Okanagan Lake South', platform: 'bc_parks', province: 'BC' },
  { id: '-2497', name: 'Haynes Point', platform: 'bc_parks', province: 'BC' },

  // ── Ontario Parks ──
  { id: '-2740399', name: 'Algonquin - Canisbay Lake', platform: 'ontario_parks', province: 'ON', park: 'Algonquin' },
  { id: '-2740407', name: 'Algonquin - Pog Lake', platform: 'ontario_parks', province: 'ON', park: 'Algonquin' },
  { id: '-2740393', name: 'Algonquin - Lake of Two Rivers', platform: 'ontario_parks', province: 'ON', park: 'Algonquin' },
  { id: '-2740523', name: 'Killarney - George Lake', platform: 'ontario_parks', province: 'ON', park: 'Killarney' },
  { id: '-2740285', name: 'Sandbanks - Outlet River', platform: 'ontario_parks', province: 'ON', park: 'Sandbanks' },
  { id: '-2740575', name: 'Pinery - Burley', platform: 'ontario_parks', province: 'ON', park: 'Pinery' },
  { id: '-2740387', name: 'Bon Echo - Mazinaw Lake', platform: 'ontario_parks', province: 'ON', park: 'Bon Echo' },
  { id: '-2740451', name: 'Grundy Lake', platform: 'ontario_parks', province: 'ON', park: 'Grundy Lake' },
  { id: '-2740611', name: 'Silent Lake', platform: 'ontario_parks', province: 'ON', park: 'Silent Lake' },
  { id: '-2740303', name: 'Arrowhead', platform: 'ontario_parks', province: 'ON', park: 'Arrowhead' },
]

export function searchCampgrounds(query: string): Campground[] {
  if (!query.trim()) return CAMPGROUNDS
  const q = query.toLowerCase().trim()
  return CAMPGROUNDS.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.province.toLowerCase().includes(q) ||
      (c.park && c.park.toLowerCase().includes(q)) ||
      (c.platform === 'bc_parks' && 'british columbia'.includes(q)) ||
      (c.platform === 'ontario_parks' && 'ontario'.includes(q))
  )
}

export function getCampground(id: string): Campground | undefined {
  return CAMPGROUNDS.find((c) => c.id === id)
}

export function getPlatformDomain(platform: string): string | null {
  return PLATFORM_DOMAINS[platform] ?? null
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/parks.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/parks.ts __tests__/parks.test.ts
git commit -m "feat: add campground search registry with real Camis IDs"
```

---

## Task 3: Auth Helpers

**Files:**
- Create: `alphacamper-site/lib/auth.ts`
- Create: `alphacamper-site/__tests__/auth.test.ts`

Email validation and magic link sending. Uses the existing `lib/supabase.ts` client (no duplicate).

**Prerequisites:** Supabase project must have email auth with magic link (OTP) enabled. This is the default.

- [ ] **Step 1: Write failing tests**

Create `__tests__/auth.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { validateEmail, getRedirectUrl } from '@/lib/auth'

describe('validateEmail', () => {
  it('accepts valid emails', () => {
    expect(validateEmail('user@example.com')).toBe(true)
    expect(validateEmail('a@b.co')).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(validateEmail('')).toBe(false)
    expect(validateEmail('not-an-email')).toBe(false)
    expect(validateEmail('@no-local.com')).toBe(false)
  })
})

describe('getRedirectUrl', () => {
  it('returns auth confirm path', () => {
    const url = getRedirectUrl('http://localhost:3000')
    expect(url).toBe('http://localhost:3000/auth/confirm')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run __tests__/auth.test.ts`
Expected: FAIL — module `@/lib/auth` does not exist.

- [ ] **Step 3: Create auth helpers**

Create `lib/auth.ts`:

```typescript
import { getSupabase } from './supabase'

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function getRedirectUrl(origin: string): string {
  return `${origin}/auth/confirm`
}

/**
 * Send magic link email for account activation.
 * Fire-and-forget in Phase 1 — watch creation doesn't depend on auth.
 */
export async function sendMagicLink(email: string): Promise<{ error: string | null }> {
  const supabase = getSupabase()
  const redirectTo = getRedirectUrl(window.location.origin)
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  })
  return { error: error?.message ?? null }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run __tests__/auth.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts __tests__/auth.test.ts
git commit -m "feat: add email validation and magic link auth helpers"
```

---

## Task 4: Auth Confirm Page

**Files:**
- Create: `alphacamper-site/app/auth/confirm/page.tsx`

**Client-side page** (not a route handler) that exchanges the magic link token for a session. Using a client page ensures the Supabase browser client gets the session cookie, so `getSession()` works in future visits.

- [ ] **Step 1: Create the auth confirm page**

Create `app/auth/confirm/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export default function AuthConfirmPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type')

    if (!tokenHash || !type) {
      setStatus('error')
      return
    }

    const supabase = getSupabase()
    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: type as 'email' })
      .then(({ error }) => {
        if (error) {
          setStatus('error')
        } else {
          setStatus('success')
          setTimeout(() => router.push('/dashboard'), 1500)
        }
      })
  }, [searchParams, router])

  return (
    <main className="wizard-container" style={{ textAlign: 'center', paddingTop: '80px' }}>
      {status === 'verifying' && (
        <>
          <h1 className="wizard-header" style={{ marginBottom: '16px' }}>Verifying your email...</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Hang tight, Alpha's checking your credentials.</p>
        </>
      )}
      {status === 'success' && (
        <>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '2rem', marginBottom: '16px' }}>You're in!</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Redirecting to your dashboard...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '2rem', marginBottom: '16px' }}>Link expired</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
            This magic link has expired or was already used.
          </p>
          <a href="/watch/new" className="btn-bold btn-bold-primary" style={{ textDecoration: 'none' }}>
            Create a new watch
          </a>
        </>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Verify build succeeds**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/auth/confirm/page.tsx
git commit -m "feat: add client-side magic link auth confirm page"
```

---

## Task 5: Watch Wizard Skeleton

**Files:**
- Create: `alphacamper-site/app/watch/new/page.tsx`
- Create: `alphacamper-site/components/watch/WatchWizard.tsx`
- Create: `alphacamper-site/components/watch/StepSummary.tsx`

Page shell and accordion skeleton with 4 steps. Only the active step is open. Completed steps show a summary line.

- [ ] **Step 1: Create the page route**

Create `app/watch/new/page.tsx`:

```tsx
import { WatchWizard } from '@/components/watch/WatchWizard'

export const metadata = {
  title: 'Create a Watch — Alphacamper',
  description: 'Tell Alpha where you want to camp. We\'ll watch 24/7 and alert you when a site opens up.',
}

export default function WatchNewPage() {
  return (
    <main className="wizard-container">
      <div className="wizard-header">
        <h1>Set up your campsite watch</h1>
        <p>Tell Alpha where you want to camp. We'll watch 24/7 and alert you when a site opens.</p>
      </div>
      <div className="illustration-placeholder" style={{ marginBottom: '32px', maxWidth: '240px', marginInline: 'auto', minHeight: '120px' }}>
        Alpha with binoculars — eager to help
      </div>
      <WatchWizard />
    </main>
  )
}
```

- [ ] **Step 2: Create the StepSummary component**

Create `components/watch/StepSummary.tsx`:

```tsx
export function StepSummary({ text }: { text: string }) {
  return <p className="step-summary">{text}</p>
}
```

- [ ] **Step 3: Create the WatchWizard component**

Create `components/watch/WatchWizard.tsx`:

```tsx
'use client'

import { useState, useCallback } from 'react'
import { StepSummary } from './StepSummary'

export type WizardStep = 'search' | 'dates' | 'site' | 'email'

export interface WatchData {
  // Step 1: Search
  campgroundId: string
  campgroundName: string
  platform: 'bc_parks' | 'ontario_parks' | ''
  province: string
  // Step 2: Dates
  arrivalDate: string
  departureDate: string
  nights: number
  // Step 3: Site number
  siteNumber: string
  // Step 4: Email
  email: string
}

const INITIAL_DATA: WatchData = {
  campgroundId: '',
  campgroundName: '',
  platform: '',
  province: '',
  arrivalDate: '',
  departureDate: '',
  nights: 1,
  siteNumber: '',
  email: '',
}

const STEPS: { key: WizardStep; number: number; title: string }[] = [
  { key: 'search', number: 1, title: 'Find your campground' },
  { key: 'dates', number: 2, title: 'Pick your dates' },
  { key: 'site', number: 3, title: 'Preferred site (optional)' },
  { key: 'email', number: 4, title: 'Get notified' },
]

function getStepSummary(step: WizardStep, data: WatchData): string | null {
  switch (step) {
    case 'search':
      if (!data.campgroundName) return null
      return `${data.campgroundName} — ${data.platform === 'bc_parks' ? 'BC Parks' : 'Ontario Parks'}`
    case 'dates':
      if (!data.arrivalDate || !data.departureDate) return null
      return `${data.arrivalDate} → ${data.departureDate} (${data.nights} night${data.nights !== 1 ? 's' : ''})`
    case 'site':
      return data.siteNumber ? `Site #${data.siteNumber}` : 'Any available site'
    case 'email':
      return data.email || null
    default:
      return null
  }
}

export function WatchWizard() {
  const [activeStep, setActiveStep] = useState<WizardStep>('search')
  const [data, setData] = useState<WatchData>(INITIAL_DATA)
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)

  const updateData = useCallback((partial: Partial<WatchData>) => {
    setData((prev) => ({ ...prev, ...partial }))
  }, [])

  const completeStep = useCallback((step: WizardStep, nextStep: WizardStep) => {
    setCompletedSteps((prev) => new Set([...prev, step]))
    setActiveStep(nextStep)
  }, [])

  const handleCreateWatch = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // 1. Register user (creates or returns existing)
      const registerRes = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })

      if (!registerRes.ok) throw new Error('Failed to create account')
      const { user } = await registerRes.json()

      // 2. Create the watch
      const watchRes = await fetch('/api/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          platform: data.platform,
          campgroundId: data.campgroundId,
          campgroundName: data.campgroundName,
          siteNumber: data.siteNumber || null,
          arrivalDate: data.arrivalDate,
          departureDate: data.departureDate,
        }),
      })

      if (!watchRes.ok) throw new Error('Failed to create watch')

      // 3. Send magic link (fire-and-forget — watch already created)
      import('@/lib/auth').then(({ sendMagicLink }) => {
        sendMagicLink(data.email).catch(() => {})
      })

      setIsComplete(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isComplete) {
    // Lazy-import to code-split the confirmation component
    const WatchConfirmation = require('./WatchConfirmation').WatchConfirmation
    return (
      <WatchConfirmation
        campgroundName={data.campgroundName}
        platform={data.platform}
        arrivalDate={data.arrivalDate}
        departureDate={data.departureDate}
        email={data.email}
      />
    )
  }

  return (
    <div>
      {STEPS.map(({ key, number, title }) => {
        const isActive = activeStep === key
        const isCompleted = completedSteps.has(key)
        const summary = getStepSummary(key, data)

        return (
          <div key={key} className="step-card" data-state={isActive ? 'open' : 'closed'}>
            <div
              className="step-card-header"
              onClick={() => {
                if (isCompleted || isActive) setActiveStep(key)
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (isCompleted || isActive) setActiveStep(key)
                }
              }}
            >
              <div className="step-number" data-completed={isCompleted ? 'true' : 'false'}>
                {isCompleted ? '✓' : number}
              </div>
              <div>
                <div className="step-title">{title}</div>
                {!isActive && summary && <StepSummary text={summary} />}
              </div>
            </div>
            {isActive && (
              <div className="step-content">
                <p style={{ color: 'var(--color-text-muted)' }}>
                  Step {number} content — coming in next task
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

**Note for implementer:** The `require()` for WatchConfirmation is a placeholder pattern. When wiring up Step 4 in Task 8, replace this with a proper import at the top of the file and render conditionally.

- [ ] **Step 4: Verify the page renders**

Run: `npm run dev` → navigate to `http://localhost:3000/watch/new`
Expected: Page renders with heading, illustration placeholder, and 4 accordion step cards. Step 1 is open.

- [ ] **Step 5: Verify build succeeds**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add app/watch/new/page.tsx components/watch/WatchWizard.tsx components/watch/StepSummary.tsx
git commit -m "feat: add watch wizard page skeleton with 4-step accordion"
```

---

## Task 6: Step 1 — Campground Search

**Files:**
- Create: `alphacamper-site/components/watch/StepSearch.tsx`
- Modify: `alphacamper-site/components/watch/WatchWizard.tsx`

Real-time search that filters the flat campground list. User selects a campground directly (no park→campground two-step since the data is flat).

- [ ] **Step 1: Create StepSearch component**

Create `components/watch/StepSearch.tsx`:

```tsx
'use client'

import { useState, useMemo } from 'react'
import { searchCampgrounds } from '@/lib/parks'
import type { WatchData } from './WatchWizard'

interface StepSearchProps {
  data: WatchData
  onUpdate: (partial: Partial<WatchData>) => void
  onComplete: () => void
}

export function StepSearch({ data, onUpdate, onComplete }: StepSearchProps) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return []
    return searchCampgrounds(query)
  }, [query])

  const handleSelect = (cg: { id: string; name: string; platform: 'bc_parks' | 'ontario_parks'; province: string }) => {
    setQuery(cg.name)
    onUpdate({
      campgroundId: cg.id,
      campgroundName: cg.name,
      platform: cg.platform,
      province: cg.province,
    })
  }

  const handleClear = () => {
    setQuery('')
    onUpdate({ campgroundId: '', campgroundName: '', platform: '', province: '' })
  }

  const isSelected = !!data.campgroundId

  return (
    <div>
      <div className="field-group">
        <label className="field-label" htmlFor="campground-search">
          Search for a park or campground
        </label>
        <span className="field-hint">
          Start typing — we'll search BC Parks and Ontario Parks
        </span>
        <input
          id="campground-search"
          className="field-input"
          type="text"
          placeholder="e.g. Alice Lake, Algonquin, Rathtrevor..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (isSelected) {
              onUpdate({ campgroundId: '', campgroundName: '', platform: '', province: '' })
            }
          }}
          autoFocus
        />
      </div>

      {/* Search results */}
      {!isSelected && query.trim().length > 0 && (
        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {results.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              No campgrounds found matching &ldquo;{query}&rdquo;.
            </p>
          ) : (
            results.slice(0, 10).map((cg) => (
              <button
                key={cg.id}
                type="button"
                className="selectable-item"
                onClick={() => handleSelect(cg)}
              >
                <strong>{cg.name}</strong>
                <span className="selectable-item-label">
                  {cg.province === 'BC' ? 'BC Parks' : 'Ontario Parks'}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Selected campground */}
      {isSelected && (
        <div style={{ marginBottom: '20px' }}>
          <div className="selectable-item" data-selected="true" style={{ cursor: 'default' }}>
            <strong>{data.campgroundName}</strong>
            <span className="selectable-item-label">
              {data.platform === 'bc_parks' ? 'BC Parks' : 'Ontario Parks'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            style={{
              marginTop: '8px',
              background: 'none',
              border: 'none',
              color: 'var(--color-accent)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              padding: 0,
            }}
          >
            Change campground
          </button>
        </div>
      )}

      {isSelected && (
        <button
          type="button"
          className="btn-bold btn-bold-primary btn-bold-full"
          onClick={onComplete}
        >
          Continue
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire StepSearch into WatchWizard**

In `WatchWizard.tsx`, add import:
```tsx
import { StepSearch } from './StepSearch'
```

Replace the step content placeholder block with step-specific rendering:
```tsx
{isActive && (
  <div className="step-content">
    {key === 'search' && (
      <StepSearch
        data={data}
        onUpdate={updateData}
        onComplete={() => completeStep('search', 'dates')}
      />
    )}
    {key === 'dates' && <p style={{ color: 'var(--color-text-muted)' }}>Step 2 — coming next</p>}
    {key === 'site' && <p style={{ color: 'var(--color-text-muted)' }}>Step 3 — coming next</p>}
    {key === 'email' && <p style={{ color: 'var(--color-text-muted)' }}>Step 4 — coming next</p>}
  </div>
)}
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev` → `/watch/new`
Expected: Typing filters campgrounds. Selecting one shows it as selected with "Change campground" link. "Continue" advances to step 2.

- [ ] **Step 4: Commit**

```bash
git add components/watch/StepSearch.tsx components/watch/WatchWizard.tsx
git commit -m "feat: add campground search step with real-time filtering"
```

---

## Task 7: Step 2 — Date Selection

**Files:**
- Create: `alphacamper-site/components/watch/StepDates.tsx`
- Modify: `alphacamper-site/components/watch/WatchWizard.tsx`

- [ ] **Step 1: Create StepDates component**

Create `components/watch/StepDates.tsx`:

```tsx
'use client'

import type { WatchData } from './WatchWizard'

interface StepDatesProps {
  data: WatchData
  onUpdate: (partial: Partial<WatchData>) => void
  onComplete: () => void
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function StepDates({ data, onUpdate, onComplete }: StepDatesProps) {
  const handleArrivalChange = (arrivalDate: string) => {
    onUpdate({ arrivalDate, departureDate: addDays(arrivalDate, data.nights) })
  }

  const handleNightsChange = (nights: number) => {
    if (nights < 1 || nights > 14) return
    const departureDate = data.arrivalDate ? addDays(data.arrivalDate, nights) : ''
    onUpdate({ nights, departureDate })
  }

  const canContinue = data.arrivalDate && data.departureDate && data.nights >= 1

  return (
    <div>
      <div className="field-group">
        <label className="field-label" htmlFor="arrival-date">
          What day do you want to arrive?
        </label>
        <span className="field-hint">
          This is the day you want to START your stay.
        </span>
        <input
          id="arrival-date"
          className="field-input"
          type="date"
          min={todayStr()}
          value={data.arrivalDate}
          onChange={(e) => handleArrivalChange(e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="field-label">How many nights?</label>
        <span className="field-hint">Fewer nights means more possible openings.</span>
        <div className="nights-counter">
          <button
            type="button"
            className="btn-bold btn-bold-outline"
            style={{ padding: '8px 16px', fontSize: '1.2rem' }}
            onClick={() => handleNightsChange(data.nights - 1)}
            disabled={data.nights <= 1}
          >
            −
          </button>
          <span className="nights-value">{data.nights}</span>
          <button
            type="button"
            className="btn-bold btn-bold-outline"
            style={{ padding: '8px 16px', fontSize: '1.2rem' }}
            onClick={() => handleNightsChange(data.nights + 1)}
            disabled={data.nights >= 14}
          >
            +
          </button>
          <span style={{ color: 'var(--color-text-muted)' }}>
            night{data.nights !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {data.arrivalDate && data.departureDate && (
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
          Watching for: <strong>{data.arrivalDate}</strong> to <strong>{data.departureDate}</strong>
        </p>
      )}

      {canContinue && (
        <button type="button" className="btn-bold btn-bold-primary btn-bold-full" onClick={onComplete}>
          Continue
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire into WatchWizard**

Add import and replace step 2 placeholder:
```tsx
import { StepDates } from './StepDates'
```
```tsx
{key === 'dates' && (
  <StepDates data={data} onUpdate={updateData} onComplete={() => completeStep('dates', 'site')} />
)}
```

- [ ] **Step 3: Verify in browser**

Expected: Date picker + nights counter. Summary shows date range when collapsed.

- [ ] **Step 4: Commit**

```bash
git add components/watch/StepDates.tsx components/watch/WatchWizard.tsx
git commit -m "feat: add date selection step with arrival date and nights counter"
```

---

## Task 8: Step 3 — Site Number (Optional)

**Files:**
- Create: `alphacamper-site/components/watch/StepSiteNumber.tsx`
- Modify: `alphacamper-site/components/watch/WatchWizard.tsx`

Optional specific site number. The `watched_targets` table has a `site_number` column. The worker doesn't currently filter by it, but we collect it for future use. This step auto-completes if the user clicks "Continue" without entering anything.

- [ ] **Step 1: Create StepSiteNumber component**

Create `components/watch/StepSiteNumber.tsx`:

```tsx
'use client'

import type { WatchData } from './WatchWizard'

interface StepSiteNumberProps {
  data: WatchData
  onUpdate: (partial: Partial<WatchData>) => void
  onComplete: () => void
}

export function StepSiteNumber({ data, onUpdate, onComplete }: StepSiteNumberProps) {
  return (
    <div>
      <div className="field-group">
        <label className="field-label" htmlFor="site-number">
          Want a specific site?
        </label>
        <span className="field-hint">
          Leave blank to watch all sites at this campground. Enter a site number if you have a favourite.
        </span>
        <input
          id="site-number"
          className="field-input"
          type="text"
          placeholder="e.g. 42"
          value={data.siteNumber}
          onChange={(e) => onUpdate({ siteNumber: e.target.value })}
          style={{ maxWidth: '200px' }}
        />
      </div>

      <button type="button" className="btn-bold btn-bold-primary btn-bold-full" onClick={onComplete}>
        {data.siteNumber ? 'Continue' : 'Skip — watch all sites'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Wire into WatchWizard**

Add import and replace step 3 placeholder:
```tsx
import { StepSiteNumber } from './StepSiteNumber'
```
```tsx
{key === 'site' && (
  <StepSiteNumber data={data} onUpdate={updateData} onComplete={() => completeStep('site', 'email')} />
)}
```

- [ ] **Step 3: Verify in browser**

Expected: Optional site number field with "Skip — watch all sites" button. Summary shows "Any available site" or "Site #42".

- [ ] **Step 4: Commit**

```bash
git add components/watch/StepSiteNumber.tsx components/watch/WatchWizard.tsx
git commit -m "feat: add optional site number step"
```

---

## Task 9: Step 4 — Email & Watch Creation

**Files:**
- Create: `alphacamper-site/components/watch/StepEmail.tsx`
- Create: `alphacamper-site/components/watch/WatchConfirmation.tsx`
- Modify: `alphacamper-site/components/watch/WatchWizard.tsx`

Final step. User enters email → register user → create watch → send magic link (fire-and-forget) → show confirmation.

- [ ] **Step 1: Create StepEmail component**

Create `components/watch/StepEmail.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { validateEmail } from '@/lib/auth'
import type { WatchData } from './WatchWizard'

interface StepEmailProps {
  data: WatchData
  onUpdate: (partial: Partial<WatchData>) => void
  onSubmit: () => Promise<void>
  isSubmitting: boolean
  error: string | null
}

export function StepEmail({ data, onUpdate, onSubmit, isSubmitting, error }: StepEmailProps) {
  const [touched, setTouched] = useState(false)
  const isValid = validateEmail(data.email)

  return (
    <div>
      <div className="field-group">
        <label className="field-label" htmlFor="email">
          Where should we send alerts?
        </label>
        <span className="field-hint">
          We'll email you when a site opens up. We'll also create your free account.
        </span>
        <input
          id="email"
          className={`field-input ${touched && !isValid && data.email ? 'field-input-error' : ''}`}
          type="email"
          placeholder="you@example.com"
          value={data.email}
          onChange={(e) => onUpdate({ email: e.target.value })}
          onBlur={() => setTouched(true)}
        />
        {touched && !isValid && data.email && (
          <p style={{ color: '#cc3333', fontSize: '0.85rem', marginTop: '4px' }}>
            Please enter a valid email address.
          </p>
        )}
      </div>

      {error && <p className="error-banner">{error}</p>}

      <button
        type="button"
        className="btn-bold btn-bold-primary btn-bold-full"
        onClick={onSubmit}
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? 'Setting up your watch...' : 'Start watching'}
      </button>

      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '12px' }}>
        Free for your first watch. No credit card required.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Create WatchConfirmation component**

Create `components/watch/WatchConfirmation.tsx`:

```tsx
export function WatchConfirmation({
  campgroundName,
  platform,
  arrivalDate,
  departureDate,
  email,
}: {
  campgroundName: string
  platform: string
  arrivalDate: string
  departureDate: string
  email: string
}) {
  const platformLabel = platform === 'bc_parks' ? 'BC Parks' : 'Ontario Parks'

  return (
    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div
        className="illustration-placeholder"
        style={{ maxWidth: '200px', marginInline: 'auto', marginBottom: '24px', minHeight: '140px' }}
      >
        Alpha celebrating — thumbs up!
      </div>

      <h2 style={{ fontFamily: 'var(--font-fraunces, var(--font-display))', fontSize: '1.75rem', fontWeight: 600, marginBottom: '12px' }}>
        Alpha's on it!
      </h2>

      <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', marginBottom: '24px' }}>
        Watching <strong>{campgroundName}</strong> ({platformLabel}) for openings
        from <strong>{arrivalDate}</strong> to <strong>{departureDate}</strong>.
      </p>

      <div className="confirm-card">
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          Alerts will go to <strong>{email}</strong>.
          Check your inbox for a link to activate your account.
        </p>
      </div>

      <a href="/" className="btn-bold btn-bold-outline" style={{ textDecoration: 'none' }}>
        Back to home
      </a>
    </div>
  )
}
```

- [ ] **Step 3: Wire everything into WatchWizard**

In `WatchWizard.tsx`:

Add imports at top:
```tsx
import { StepEmail } from './StepEmail'
import { WatchConfirmation } from './WatchConfirmation'
```

Replace the `require()` placeholder with the proper import, and replace the step 4 placeholder:
```tsx
{key === 'email' && (
  <StepEmail
    data={data}
    onUpdate={updateData}
    onSubmit={handleCreateWatch}
    isSubmitting={isSubmitting}
    error={submitError}
  />
)}
```

Replace the `if (isComplete)` block with:
```tsx
if (isComplete) {
  return (
    <WatchConfirmation
      campgroundName={data.campgroundName}
      platform={data.platform}
      arrivalDate={data.arrivalDate}
      departureDate={data.departureDate}
      email={data.email}
    />
  )
}
```

- [ ] **Step 4: Verify end-to-end in browser**

Run: `npm run dev` → `/watch/new` → walk through all 4 steps.
Expected: Full flow works. Confirmation shows "Alpha's on it!" with watch details.

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add components/watch/StepEmail.tsx components/watch/WatchConfirmation.tsx components/watch/WatchWizard.tsx
git commit -m "feat: add email step with watch creation and confirmation page"
```

---

## Task 10: Minimal Dashboard Page

**Files:**
- Create: `alphacamper-site/app/dashboard/page.tsx`

Placeholder that the auth confirm page redirects to.

- [ ] **Step 1: Create dashboard page**

Create `app/dashboard/page.tsx`:

```tsx
import Link from 'next/link'

export const metadata = {
  title: 'Dashboard — Alphacamper',
  description: 'Your campsite watches and alerts.',
}

export default function DashboardPage() {
  return (
    <main className="wizard-container">
      <div className="wizard-header">
        <h1>Your Dashboard</h1>
        <p>Alpha's watching your campsites. We'll email you when something opens up.</p>
      </div>

      <div className="illustration-placeholder" style={{ marginBottom: '32px', maxWidth: '280px', marginInline: 'auto' }}>
        Alpha sleeping with one eye open — watching your campsites
      </div>

      <div className="confirm-card" style={{ textAlign: 'center', padding: '32px' }}>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>
          Your active watches will appear here. Full dashboard coming soon.
        </p>
        <Link href="/watch/new" className="btn-bold btn-bold-primary" style={{ textDecoration: 'none' }}>
          Create a watch
        </Link>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: add minimal dashboard placeholder page"
```

---

## Task 11: Integration Verification

**Files:** No new files.

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 4: Manual verification checklist**

Start: `npm run dev`

1. **Landing page** (`/`) — no visual regression
2. **Watch creation** (`/watch/new`) — all 4 steps work:
   - Search → select campground → Continue
   - Date picker → nights counter → Continue
   - Optional site number → Continue/Skip
   - Email → "Start watching" (Supabase calls may fail without env vars — UI flow should still work)
3. **Dashboard** (`/dashboard`) — renders placeholder
4. **Responsive** (`/watch/new` at < 480px) — steps stack, buttons full-width
5. **Keyboard** — Tab through wizard, Enter/Space to select

- [ ] **Step 5: Final commit with any fixes**

```bash
git add -A
git commit -m "fix: address integration issues from end-to-end verification"
```

---

## Post-Plan Notes

### Deferred to Later Phases

- **Landing page redesign** — Gumroad-style color blocks (Phase 4)
- **Full dashboard** — watch listing, alert history (Phase 2)
- **Extension UX overhaul** — kill "mission" language (Phase 3)
- **Alpha bear illustrations** — placeholders in place; Ryan generating art
- **Email alert notifications** — via Resend (Phase 4)
- **Stripe payments** — paid tier billing (later)
- **Nav updates** — Sign In / Dashboard links
- **SEO pages** — `/parks`, `/faq`, `/reviews`, `/blog`

### Notes on Campground IDs

The IDs in `lib/parks.ts` are the real Camis `resourceLocationId` values from the extension's `lib/platforms.js`. The worker's `id-resolver.ts` resolves these via `GET /api/resourceLocation` on the Camis API. If an ID doesn't resolve, the worker falls back to matching by `campground_name`.

To add more campgrounds later, check the extension's `lib/platforms.js` for IDs, or query the Camis API directly.
