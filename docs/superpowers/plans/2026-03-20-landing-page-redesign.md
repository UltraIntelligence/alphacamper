# Landing Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing earthy-green landing page with a bold, Gumroad/Paintly-style color-blocked design featuring Alpha the bear, hero search bar, and conversion-focused copy.

**Architecture:** Delete all old landing page components and CSS. Build 9 new section components using the existing wizard color palette tokens. A shared `ParkSearch` client component (with live dropdown) is used in hero and CTA sections. The wizard gets a minor update to accept `?park=` query params from the landing page search.

**Tech Stack:** Next.js 16, React 19, Tailwind 4 (via `@import "tailwindcss"`), vanilla CSS custom properties, Supabase Auth (session check for nav), Vitest

**Spec:** `docs/superpowers/specs/2026-03-20-landing-page-redesign.md`

---

## File Map

### New files (create)
- `components/landing/LandingNav.tsx` — sticky dark navy nav, auth-aware
- `components/landing/LandingHero.tsx` — forest green hero with search + trust strip
- `components/landing/ParkSearch.tsx` — shared live search dropdown (client component)
- `components/landing/HowAlphaWorks.tsx` — 3-step illustrated cards on white
- `components/landing/Capabilities.tsx` — 4 stat blocks on navy
- `components/landing/TwoProducts.tsx` — free vs paid cards on light gray
- `components/landing/PopularParks.tsx` — 8 park cards on royal blue
- `components/landing/FAQ.tsx` — accordion on white
- `components/landing/LandingCTA.tsx` — bright green CTA with search repeat
- `components/landing/LandingFooter.tsx` — forest green footer with columns
- `components/landing/IllustrationPlaceholder.tsx` — reusable placeholder box
- `__tests__/park-search.test.ts` — tests for ParkSearch query param integration

### Modified files
- `app/page.tsx` — replace all imports with new landing components
- `app/globals.css` — delete old landing styles, add new color-block styles
- `app/watch/new/page.tsx` — read `?park=` search param, pass to wizard
- `components/watch/WatchWizard.tsx` — accept `initialParkId` prop, auto-select park

### Deleted files
- `components/Nav.tsx`
- `components/Hero.tsx`
- `components/StatsBar.tsx`
- `components/Problem.tsx`
- `components/ThreeClicks.tsx`
- `components/HowItWorks.tsx`
- `components/Features.tsx`
- `components/Comparison.tsx`
- `components/Trust.tsx`
- `components/CTA.tsx`
- `components/Footer.tsx`
- `components/WaitlistForm.tsx`
- `components/Countdown.tsx`

### Kept (no changes)
- `components/ScrollReveal.tsx`
- `lib/parks.ts`
- `lib/auth.ts`
- All `components/watch/*.tsx` (except WatchWizard minor prop addition)
- All `app/dashboard/**`
- All `app/auth/**`
- All `__tests__/parks.test.ts`, `__tests__/auth.test.ts`

---

## Task 1: Clean up CSS — delete old landing styles

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Delete old landing `:root` variables**

In globals.css, inside the `:root` block, remove the old landing palette variables (lines 11-26): `--white`, `--cream`, `--sand`, `--stone`, `--text`, `--text-mid`, `--text-light`, `--green-deep`, `--green`, `--green-mid`, `--green-light`, `--green-pale`, `--green-wash`, `--bark`, `--amber`. Also remove the duplicate `--font-display` and `--font-body` declarations on lines 26-27 (these are already set in `@theme inline` above).

Keep everything from `/* ── Wizard Nature Palette */` (line 29) onward inside `:root`.

After this, `:root` should start with the wizard palette comment and contain only `--navy`, `--royal`, `--bright-green`, `--forest`, `--gray-bg`, and the semantic tokens.

- [ ] **Step 2: Update body styles**

Change the `body` rule to use hardcoded values instead of old palette vars:
```css
body {
  font-family: var(--font-body);
  background: #ffffff;
  color: #1a1a1a;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 3: Delete old landing class styles**

Remove everything from the `/* NAV */` comment (line ~71) through the end of the last `@media (max-width: 600px)` responsive block (line ~363) — everything BEFORE the `/* ═══ Watch Wizard ═══ */` comment. This includes: `.site-nav`, `.nav-logo`, `.nav-links`, `.nav-cta`, `.hero`, `.hero-badge`, `.proof-bar`, `.problem-section`, `.what-we-do`, `.outcome-grid`, `.how-section`, `.steps`, `.features-section`, `.feat-grid`, `.compare-section`, `.compare-table`, `.trust-section`, `.cta-section`, `.cta-form`, `.site-footer`, `.waitlist-success`, `.nav-hamburger`, `.hamburger-line`, `.mobile-menu`, `.mobile-cta`, and ALL their responsive variants in both `@media` blocks.

Keep: `a` reset, `.container`, `.reveal`/`.reveal.visible`, all `@keyframes` (`fadeUp`, `blink`, `pulse`), and everything from `/* ═══ Watch Wizard ═══ */` onward.

- [ ] **Step 4: Add new landing page section comment marker**

Add this comment above the wizard section:

```css
/* ═══ Landing Page ═══ */

/* (new landing styles will be added in subsequent tasks) */

/* ═══ Watch Wizard ═══ */
```

- [ ] **Step 5: Verify build still works**

Run: `cd alphacamper-site && npm run build`
Expected: Build succeeds (landing page will be broken visually but no compile errors)

- [ ] **Step 6: Commit**

```bash
git add app/globals.css
git commit -m "refactor: remove old landing page styles from globals.css"
```

---

## Task 2: Delete old landing components

**Files:**
- Delete: `components/Nav.tsx`, `components/Hero.tsx`, `components/StatsBar.tsx`, `components/Problem.tsx`, `components/ThreeClicks.tsx`, `components/HowItWorks.tsx`, `components/Features.tsx`, `components/Comparison.tsx`, `components/Trust.tsx`, `components/CTA.tsx`, `components/Footer.tsx`, `components/WaitlistForm.tsx`, `components/Countdown.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace page.tsx with minimal placeholder**

```tsx
export default function Home() {
  return (
    <main style={{ padding: '80px 24px', textAlign: 'center' }}>
      <h1>Alphacamper — Landing page redesign in progress</h1>
    </main>
  )
}
```

- [ ] **Step 2: Delete old components**

```bash
cd alphacamper-site
rm components/Nav.tsx components/Hero.tsx components/StatsBar.tsx components/Problem.tsx components/ThreeClicks.tsx components/HowItWorks.tsx components/Features.tsx components/Comparison.tsx components/Trust.tsx components/CTA.tsx components/Footer.tsx components/WaitlistForm.tsx components/Countdown.tsx
```

- [ ] **Step 3: Verify build**

Run: `cd alphacamper-site && npm run build`
Expected: Build succeeds, no import errors

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: delete old landing page components"
```

---

## Task 3: Add landing page CSS foundation

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add color-block section base styles**

Insert below the `/* ═══ Landing Page ═══ */` comment:

```css
/* ═══ Landing Page ═══ */

/* ── Section blocks ── */

.section-forest { background: var(--forest); color: #ffffff; }
.section-navy { background: var(--navy); color: #ffffff; }
.section-royal { background: var(--royal); color: #ffffff; }
.section-green { background: var(--bright-green); color: #ffffff; }
.section-white { background: #ffffff; color: #1a1a1a; }
.section-gray { background: var(--gray-bg); color: #1a1a1a; }

.landing-section { width: 100%; padding: 80px 0; }
.landing-section .container { max-width: 1120px; margin: 0 auto; padding: 0 24px; }

/* ── Landing typography ── */

.landing-heading {
  font-family: var(--font-fraunces, var(--font-display));
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.025em;
}

.landing-body {
  font-family: var(--font-dm-sans, var(--font-body));
  line-height: 1.7;
}

/* ── Bold card (reusable) ── */

.bold-card {
  border: 3px solid #1a1a1a;
  border-radius: 16px;
  background: #ffffff;
  padding: 32px 28px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.bold-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.bold-card-light {
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}

.bold-card-light:hover {
  background: rgba(255, 255, 255, 0.14);
}
```

- [ ] **Step 2: Add illustration placeholder styles**

```css
/* ── Illustration placeholders ── */

.illust-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.06);
  border: 2px dashed rgba(0, 0, 0, 0.15);
  border-radius: 16px;
  padding: 32px;
  color: rgba(0, 0, 0, 0.4);
  font-size: 0.9rem;
  text-align: center;
  min-height: 200px;
}

.illust-placeholder-dark {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.4);
}

.illust-hero {
  min-height: 320px;
}
```

- [ ] **Step 3: Add nav styles**

```css
/* ── Landing nav ── */

.landing-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--navy);
  padding: 0;
}

.landing-nav .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
}

.landing-nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-fraunces, var(--font-display));
  font-weight: 700;
  font-size: 1.15rem;
  color: #ffffff;
}

.landing-nav-links {
  display: flex;
  gap: 32px;
  align-items: center;
}

.landing-nav-links a {
  font-size: 0.88rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  transition: color 0.2s;
}

.landing-nav-links a:hover { color: #ffffff; }

.landing-nav-cta {
  font-family: var(--font-dm-sans, var(--font-body));
  font-size: 0.85rem;
  font-weight: 600;
  padding: 10px 24px;
  background: var(--bright-green);
  color: #ffffff;
  border: none;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.landing-nav-cta:hover {
  background: var(--forest);
  transform: translateY(-1px);
}

.landing-nav-signin {
  font-size: 0.88rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  transition: color 0.2s;
  margin-right: 16px;
}

.landing-nav-signin:hover { color: #ffffff; }

.landing-nav-right {
  display: flex;
  align-items: center;
}
```

- [ ] **Step 4: Add hero styles**

```css
/* ── Hero ── */

.hero-section {
  padding: 140px 24px 80px;
  background: var(--forest);
  color: #ffffff;
}

.hero-section .container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
}

.hero-content h1 {
  font-family: var(--font-fraunces, var(--font-display));
  font-size: clamp(2.6rem, 5.5vw, 4rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.025em;
  margin-bottom: 20px;
}

.hero-content p {
  font-size: 1.1rem;
  line-height: 1.7;
  opacity: 0.9;
  max-width: 520px;
  margin-bottom: 32px;
}

.hero-trust {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  opacity: 0.8;
  margin-top: 24px;
}

.hero-stars { color: #fbbf24; letter-spacing: 2px; }
```

- [ ] **Step 5: Add park search styles**

```css
/* ── Park search ── */

.park-search {
  position: relative;
  max-width: 520px;
}

.park-search-input-wrap {
  display: flex;
  gap: 0;
  border-radius: 12px;
  overflow: hidden;
  border: 3px solid #ffffff;
  background: #ffffff;
}

.park-search-input {
  flex: 1;
  padding: 16px 20px;
  font-size: 1rem;
  border: none;
  outline: none;
  font-family: var(--font-dm-sans, var(--font-body));
  color: #1a1a1a;
  background: transparent;
}

.park-search-input::placeholder { color: #999999; }

.park-search-btn {
  padding: 16px 28px;
  font-family: var(--font-dm-sans, var(--font-body));
  font-size: 0.95rem;
  font-weight: 600;
  background: var(--bright-green);
  color: #ffffff;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.park-search-btn:hover { background: var(--forest); }

.park-search-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #ffffff;
  border: 3px solid #1a1a1a;
  border-radius: 12px;
  max-height: 320px;
  overflow-y: auto;
  z-index: 50;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.park-search-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #f0f0f0;
  color: #1a1a1a;
}

.park-search-item:last-child { border-bottom: none; }
.park-search-item:hover { background: #f5f5f5; }

.park-search-item-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.park-search-item-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 100px;
  background: var(--gray-bg);
  color: #666666;
}

.park-search-free {
  font-size: 0.88rem;
  opacity: 0.8;
  margin-top: 12px;
}
```

- [ ] **Step 6: Add how-alpha-works styles**

```css
/* ── How Alpha Works ── */

.how-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.how-card-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 3px solid #1a1a1a;
  font-family: var(--font-fraunces, var(--font-display));
  font-weight: 800;
  font-size: 1.1rem;
  margin-bottom: 20px;
}

.how-card h3 {
  font-family: var(--font-fraunces, var(--font-display));
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 10px;
  color: #1a1a1a;
}

.how-card p {
  font-size: 0.92rem;
  color: #666666;
  line-height: 1.65;
  margin-bottom: 20px;
}
```

- [ ] **Step 7: Add capabilities styles**

```css
/* ── Capabilities ── */

.cap-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  text-align: center;
}

.cap-value {
  font-family: var(--font-fraunces, var(--font-display));
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 4px;
}

.cap-label {
  font-size: 0.82rem;
  opacity: 0.6;
  line-height: 1.4;
}
```

- [ ] **Step 8: Add two-products styles**

```css
/* ── Two Products ── */

.products-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.product-card {
  border: 3px solid #1a1a1a;
  border-radius: 16px;
  padding: 40px 32px;
  background: #ffffff;
  position: relative;
}

.product-card-featured {
  border-color: var(--forest);
  box-shadow: 0 0 0 3px var(--forest);
}

.product-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 100px;
  background: var(--bright-green);
  color: #ffffff;
  margin-bottom: 16px;
}

.product-name {
  font-family: var(--font-fraunces, var(--font-display));
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.product-tagline {
  font-size: 1rem;
  color: #666666;
  margin-bottom: 16px;
  line-height: 1.6;
}

.product-price {
  font-family: var(--font-fraunces, var(--font-display));
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 4px;
}

.product-price-note {
  font-size: 0.82rem;
  color: #666666;
  margin-bottom: 24px;
}

.product-features {
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
}

.product-features li {
  padding: 8px 0;
  font-size: 0.92rem;
  border-bottom: 1px solid #f0f0f0;
}

.product-features li:last-child { border-bottom: none; }

.product-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 14px 28px;
  font-family: var(--font-dm-sans, var(--font-body));
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  border: 3px solid #1a1a1a;
  cursor: pointer;
  transition: all 0.15s;
}

.product-cta-primary {
  background: var(--forest);
  color: #ffffff;
  border-color: var(--forest);
}

.product-cta-primary:hover {
  background: var(--bright-green);
  border-color: var(--bright-green);
}

.product-cta-outline {
  background: transparent;
  color: #1a1a1a;
}

.product-cta-outline:hover {
  background: var(--gray-bg);
}
```

- [ ] **Step 9: Add popular parks styles**

```css
/* ── Popular parks ── */

.parks-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.park-card {
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 24px 20px;
  background: rgba(255, 255, 255, 0.08);
  transition: all 0.2s;
  text-decoration: none;
  color: #ffffff;
  display: block;
}

.park-card:hover {
  background: rgba(255, 255, 255, 0.14);
  transform: translateY(-2px);
}

.park-card-name {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 6px;
}

.park-card-province {
  font-size: 0.75rem;
  opacity: 0.6;
}

.park-card-arrow {
  font-size: 0.82rem;
  opacity: 0.5;
  margin-top: 12px;
}
```

- [ ] **Step 10: Add FAQ styles**

```css
/* ── FAQ ── */

.faq-list {
  max-width: 720px;
  margin: 0 auto;
}

.faq-item {
  border: 3px solid #1a1a1a;
  border-radius: 12px;
  margin-bottom: 8px;
  overflow: hidden;
}

.faq-question {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  font-family: var(--font-dm-sans, var(--font-body));
  color: #1a1a1a;
}

.faq-question:hover { background: #fafafa; }

.faq-chevron {
  font-size: 1.2rem;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.faq-chevron[data-open="true"] { transform: rotate(180deg); }

.faq-answer {
  padding: 0 24px 20px;
  font-size: 0.92rem;
  color: #666666;
  line-height: 1.7;
}
```

- [ ] **Step 11: Add CTA and footer styles**

```css
/* ── Landing CTA ── */

.cta-section .park-search { margin: 0 auto; }

.cta-sub {
  font-size: 1rem;
  opacity: 0.85;
  margin-top: 12px;
}

/* ── Landing footer ── */

.landing-footer {
  background: var(--forest);
  color: #ffffff;
  padding: 64px 0 32px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 48px;
  margin-bottom: 48px;
}

.footer-brand {
  font-family: var(--font-fraunces, var(--font-display));
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.footer-tagline {
  font-size: 0.88rem;
  opacity: 0.7;
  line-height: 1.6;
}

.footer-col h4 {
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.5;
  margin-bottom: 16px;
}

.footer-col a {
  display: block;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.7);
  padding: 4px 0;
  transition: color 0.2s;
}

.footer-col a:hover { color: #ffffff; }

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  padding-top: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
  opacity: 0.5;
}
```

- [ ] **Step 12: Add responsive styles**

```css
/* ── Landing responsive ── */

.landing-nav-hamburger {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  flex-direction: column;
  gap: 5px;
}

.landing-hamburger-line {
  display: block;
  width: 22px;
  height: 2px;
  background: #ffffff;
  border-radius: 2px;
  transition: all 0.3s;
}

.landing-mobile-menu {
  display: flex;
  flex-direction: column;
  padding: 16px 24px 24px;
  background: var(--navy);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.landing-mobile-menu a {
  font-size: 1rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.landing-mobile-menu a:hover { color: #ffffff; }

@media (max-width: 900px) {
  .landing-nav-links { display: none; }
  .landing-nav-hamburger { display: flex; }

  .hero-section .container { grid-template-columns: 1fr; text-align: center; }
  .hero-content p { margin-left: auto; margin-right: auto; }
  .park-search { margin: 0 auto; }

  .how-grid { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto; }
  .cap-grid { grid-template-columns: 1fr 1fr; }
  .products-grid { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto; }
  .parks-grid { grid-template-columns: 1fr 1fr; }
  .footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
}

@media (max-width: 480px) {
  .landing-section { padding: 60px 0; }
  .hero-section { padding: 100px 16px 60px; }

  .park-search-input-wrap { flex-direction: column; border-radius: 12px; }
  .park-search-btn { border-radius: 0 0 9px 9px; }

  .cap-grid { grid-template-columns: 1fr; }
  .parks-grid { grid-template-columns: 1fr; }
  .footer-grid { grid-template-columns: 1fr; }
  .footer-bottom { flex-direction: column; gap: 8px; text-align: center; }
}
```

- [ ] **Step 13: Verify build**

Run: `cd alphacamper-site && npm run build`
Expected: Build succeeds

- [ ] **Step 14: Commit**

```bash
git add app/globals.css
git commit -m "feat: add landing page color-block CSS foundation"
```

---

## Task 4: Build IllustrationPlaceholder and ParkSearch components

**Files:**
- Create: `components/landing/IllustrationPlaceholder.tsx`
- Create: `components/landing/ParkSearch.tsx`

- [ ] **Step 1: Create IllustrationPlaceholder**

```tsx
// components/landing/IllustrationPlaceholder.tsx

interface IllustrationPlaceholderProps {
  description: string
  dark?: boolean
  hero?: boolean
}

export function IllustrationPlaceholder({ description, dark, hero }: IllustrationPlaceholderProps) {
  const classes = [
    'illust-placeholder',
    dark && 'illust-placeholder-dark',
    hero && 'illust-hero',
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <p>{description}</p>
    </div>
  )
}
```

- [ ] **Step 2: Create ParkSearch**

```tsx
// components/landing/ParkSearch.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { searchCampgrounds, type Campground } from '@/lib/parks'

interface ParkSearchProps {
  dark?: boolean
}

export function ParkSearch({ dark }: ParkSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Campground[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  function handleChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const matches = searchCampgrounds(value)
      setResults(matches.slice(0, 8))
      setIsOpen(matches.length > 0 && value.length > 0)
    }, 200)
  }

  function handleSelect(park: Campground) {
    setQuery(park.name)
    setIsOpen(false)
    router.push(`/watch/new?park=${park.id}`)
  }

  function handleSubmit() {
    if (results.length > 0) {
      handleSelect(results[0])
    } else if (query.trim()) {
      router.push(`/watch/new?q=${encodeURIComponent(query.trim())}`)
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="park-search" ref={wrapRef}>
      <div className="park-search-input-wrap">
        <input
          className="park-search-input"
          type="text"
          placeholder="Search for a park or campground..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          aria-label="Search for a park or campground"
          autoComplete="off"
        />
        <button
          className="park-search-btn"
          onClick={handleSubmit}
          type="button"
        >
          Watch this park &rarr;
        </button>
      </div>

      {isOpen && results.length > 0 && (
        <div className="park-search-dropdown" role="listbox">
          {results.map((park) => (
            <div
              key={park.id}
              className="park-search-item"
              onClick={() => handleSelect(park)}
              role="option"
              aria-selected={false}
            >
              <span className="park-search-item-name">{park.name}</span>
              <span className="park-search-item-badge">{park.province}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `cd alphacamper-site && npm run build`
Expected: Build succeeds (components not imported yet, but no errors)

- [ ] **Step 4: Commit**

```bash
git add components/landing/
git commit -m "feat: add ParkSearch and IllustrationPlaceholder components"
```

---

## Task 5: Build LandingNav

**Files:**
- Create: `components/landing/LandingNav.tsx`

- [ ] **Step 1: Create LandingNav**

```tsx
// components/landing/LandingNav.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session)
    })
  }, [])

  const links = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Parks', href: '#parks' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Pricing', href: '#pricing' },
  ]

  return (
    <nav className="landing-nav">
      <div className="container">
        <Link href="/" className="landing-nav-logo">
          Alphacamper
        </Link>

        <div className="landing-nav-links">
          {links.map((link) => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
        </div>

        <div className="landing-nav-right">
          <Link
            href="/dashboard"
            className="landing-nav-signin"
          >
            {isLoggedIn ? 'Dashboard' : 'Sign In'}
          </Link>
          <Link href="/watch/new" className="landing-nav-cta">
            Watch a Campsite
          </Link>
        </div>

        <button
          className="landing-nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          <span className="landing-hamburger-line" />
          <span className="landing-hamburger-line" />
          <span className="landing-hamburger-line" />
        </button>
      </div>

      {menuOpen && (
        <div className="landing-mobile-menu">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
          <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
            {isLoggedIn ? 'Dashboard' : 'Sign In'}
          </Link>
          <Link
            href="/watch/new"
            className="landing-nav-cta"
            style={{ marginTop: 8, textAlign: 'center' }}
            onClick={() => setMenuOpen(false)}
          >
            Watch a Campsite
          </Link>
        </div>
      )}
    </nav>
  )
}
```

Note: This uses `getSupabase()` from `@/lib/supabase` — a lazy singleton that uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public env vars, safe for client-side). Same pattern used in `DashboardShell.tsx` and `LoginPrompt.tsx`.

- [ ] **Step 2: Verify build**

Run: `cd alphacamper-site && npm run build`

- [ ] **Step 3: Commit**

```bash
git add components/landing/LandingNav.tsx
git commit -m "feat: add LandingNav component with auth-aware sign in"
```

---

## Task 6: Build LandingHero

**Files:**
- Create: `components/landing/LandingHero.tsx`

- [ ] **Step 1: Create LandingHero**

```tsx
// components/landing/LandingHero.tsx
import { ParkSearch } from './ParkSearch'
import { IllustrationPlaceholder } from './IllustrationPlaceholder'

export function LandingHero() {
  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-content">
          <h1>Never lose a campsite again.</h1>
          <p>
            Alpha watches sold-out campgrounds 24/7. When someone cancels,
            we alert you instantly — and help you book it before anyone else.
          </p>
          <ParkSearch />
          <p className="park-search-free">
            Your first watch is free. No card required.
          </p>
          <div className="hero-trust">
            <span className="hero-stars">★★★★★</span>
            <span>Trusted by frustrated parents, weekend warriors, and last-minute planners everywhere</span>
          </div>
        </div>

        <IllustrationPlaceholder
          description="Alpha sitting in a camping chair with binoculars, staring at laptop. Tent + campfire behind. Night sky with stars."
          dark
          hero
        />
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/LandingHero.tsx
git commit -m "feat: add LandingHero with search bar and trust strip"
```

---

## Task 7: Build HowAlphaWorks, Capabilities, TwoProducts

**Files:**
- Create: `components/landing/HowAlphaWorks.tsx`
- Create: `components/landing/Capabilities.tsx`
- Create: `components/landing/TwoProducts.tsx`

- [ ] **Step 1: Create HowAlphaWorks**

```tsx
// components/landing/HowAlphaWorks.tsx
import { IllustrationPlaceholder } from './IllustrationPlaceholder'

const steps = [
  {
    number: 1,
    title: 'Tell Alpha where you want to camp',
    body: 'Pick your park, dates, and preferred sites. Alpha starts watching immediately.',
    illustration: 'Alpha pointing at a map pinned to a tree, tongue out, excited expression',
  },
  {
    number: 2,
    title: 'Alpha watches around the clock',
    body: 'We check every few minutes, 24/7. When someone cancels, you\'ll know first.',
    illustration: 'Alpha in sleeping bag, one eye open, laptop on belly, coffee mug nearby',
  },
  {
    number: 3,
    title: 'You book it before anyone else',
    body: 'Get an instant alert with a direct link. Our Chrome extension fills your forms in seconds.',
    illustration: 'Alpha celebrating with arms up, confetti, human hand tapping phone screen',
  },
]

export function HowAlphaWorks() {
  return (
    <section id="how-it-works" className="landing-section section-white">
      <div className="container">
        <h2 className="landing-heading" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', marginBottom: 48, textAlign: 'center' }}>
          How Alpha Works
        </h2>
        <div className="how-grid">
          {steps.map((step) => (
            <div key={step.number} className="bold-card how-card">
              <div className="how-card-number">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              <IllustrationPlaceholder description={step.illustration} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create Capabilities**

```tsx
// components/landing/Capabilities.tsx

const caps = [
  { value: 'Every 2–5 min', label: 'Scan frequency' },
  { value: '3 platforms', label: 'BC Parks, Ontario Parks, Recreation.gov' },
  { value: 'Booking Assist\u2122', label: 'Chrome extension autofills in seconds' },
  { value: '24/7/365', label: 'Alpha never sleeps' },
]

export function Capabilities() {
  return (
    <section className="landing-section section-navy">
      <div className="container">
        <div className="cap-grid">
          {caps.map((cap) => (
            <div key={cap.value}>
              <div className="cap-value">{cap.value}</div>
              <div className="cap-label">{cap.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Create TwoProducts**

```tsx
// components/landing/TwoProducts.tsx
import Link from 'next/link'

export function TwoProducts() {
  return (
    <section id="pricing" className="landing-section section-gray">
      <div className="container">
        <h2 className="landing-heading" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', marginBottom: 48, textAlign: 'center' }}>
          Two ways to camp smarter
        </h2>
        <div className="products-grid">
          {/* Free card */}
          <div className="product-card">
            <div className="product-name">Watch &amp; Alert</div>
            <div className="product-tagline">Know the second a spot opens.</div>
            <div className="product-price">Free</div>
            <div className="product-price-note">forever</div>
            <ul className="product-features">
              <li>1 active watch</li>
              <li>Email alerts</li>
              <li>Checks every few minutes</li>
              <li>No card required</li>
            </ul>
            <Link href="/watch/new" className="product-cta product-cta-outline">
              Start watching — it&apos;s free
            </Link>
          </div>

          {/* Paid card */}
          <div className="product-card product-card-featured">
            <span className="product-badge">Save 47%</span>
            <div className="product-name">Book Fast</div>
            <div className="product-tagline">Get the site before anyone else.</div>
            <div className="product-price">$3<span style={{ fontSize: '1rem', fontWeight: 400 }}>/mo</span></div>
            <div className="product-price-note">or $19/year</div>
            <ul className="product-features">
              <li>Unlimited watches</li>
              <li>Email + push alerts</li>
              <li>Chrome extension</li>
              <li>Auto-fill booking forms</li>
              <li>Practice mode</li>
              <li>Fallback sites</li>
              <li>Speed coaching</li>
            </ul>
            <Link href="/watch/new" className="product-cta product-cta-primary">
              Go Pro
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Verify build**

Run: `cd alphacamper-site && npm run build`

- [ ] **Step 5: Commit**

```bash
git add components/landing/HowAlphaWorks.tsx components/landing/Capabilities.tsx components/landing/TwoProducts.tsx
git commit -m "feat: add HowAlphaWorks, Capabilities, and TwoProducts sections"
```

---

## Task 8: Build PopularParks, FAQ, LandingCTA, LandingFooter

**Files:**
- Create: `components/landing/PopularParks.tsx`
- Create: `components/landing/FAQ.tsx`
- Create: `components/landing/LandingCTA.tsx`
- Create: `components/landing/LandingFooter.tsx`

- [ ] **Step 1: Create PopularParks**

```tsx
// components/landing/PopularParks.tsx
import Link from 'next/link'

const parks = [
  { id: '-2430', name: 'Alice Lake', province: 'BC' },
  { id: '-2504', name: 'Rathtrevor Beach', province: 'BC' },
  { id: '-2493', name: 'Golden Ears - Alouette', province: 'BC' },
  { id: '-2499', name: 'Joffre Lakes', province: 'BC' },
  { id: '-2740399', name: 'Algonquin - Canisbay Lake', province: 'ON' },
  { id: '-2740523', name: 'Killarney - George Lake', province: 'ON' },
  { id: '-2740285', name: 'Sandbanks - Outlet River', province: 'ON' },
  { id: '-2740575', name: 'Pinery - Burley', province: 'ON' },
]

export function PopularParks() {
  return (
    <section id="parks" className="landing-section section-royal">
      <div className="container">
        <h2 className="landing-heading" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', marginBottom: 48, textAlign: 'center' }}>
          Popular parks we monitor
        </h2>
        <div className="parks-grid">
          {parks.map((park) => (
            <Link
              key={park.id}
              href={`/watch/new?park=${park.id}`}
              className="park-card"
            >
              <div className="park-card-name">{park.name}</div>
              <div className="park-card-province">{park.province}</div>
              <div className="park-card-arrow">Watch this park &rarr;</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create FAQ**

```tsx
// components/landing/FAQ.tsx
'use client'

import { useState } from 'react'

const faqs = [
  {
    q: 'What is Alphacamper?',
    a: 'Alphacamper monitors sold-out campgrounds for cancellations and alerts you the moment a spot opens up. Our Chrome extension also helps you book faster with auto-fill and practice mode.',
  },
  {
    q: 'How does it work?',
    a: 'Tell us which park and dates you want. We check the reservation website every few minutes, around the clock. When someone cancels, you get an instant alert with a direct link to book.',
  },
  {
    q: 'Do you book campsites for me?',
    a: 'No. We alert you and help you book faster, but you always book directly through the park\'s official website. We never book on your behalf.',
  },
  {
    q: 'How much does it cost?',
    a: 'Your first watch is completely free — no credit card required. For unlimited watches and our Chrome extension, it\'s $3/month or $19/year.',
  },
  {
    q: 'What parks do you monitor?',
    a: 'We currently monitor BC Parks, Ontario Parks, and Recreation.gov campgrounds. We\'re adding more parks regularly.',
  },
  {
    q: 'How fast are the alerts?',
    a: 'We scan reservation sites every 2 to 5 minutes. When a cancellation appears, you\'ll get an alert within minutes.',
  },
  {
    q: 'What\'s the Chrome extension?',
    a: 'Our extension auto-fills booking forms in seconds, lets you practice the booking flow before the real thing, and sets up fallback sites in case your first choice gets taken.',
  },
  {
    q: 'Is it really free?',
    a: 'Yes. One active watch with email alerts is free forever. No credit card, no trial period, no catch.',
  },
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="landing-section section-white">
      <div className="container">
        <h2 className="landing-heading" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', marginBottom: 48, textAlign: 'center' }}>
          Questions? Answers.
        </h2>
        <div className="faq-list">
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item">
              <button
                className="faq-question"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
              >
                {faq.q}
                <span className="faq-chevron" data-open={openIndex === i}>&#9662;</span>
              </button>
              {openIndex === i && (
                <div className="faq-answer">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Create LandingCTA**

```tsx
// components/landing/LandingCTA.tsx
import { ParkSearch } from './ParkSearch'
import { IllustrationPlaceholder } from './IllustrationPlaceholder'

export function LandingCTA() {
  return (
    <section className="landing-section section-green cta-section">
      <div className="container" style={{ textAlign: 'center' }}>
        <h2 className="landing-heading" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: 24 }}>
          Start watching a campsite
        </h2>
        <ParkSearch />
        <p className="cta-sub">
          Your first watch is free. Alpha&apos;s already awake.
        </p>
        <div style={{ marginTop: 40, maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
          <IllustrationPlaceholder
            description="Alpha giving thumbs up with both paws, huge grin, backpack on, sunrise behind mountains"
            dark
          />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Create LandingFooter**

```tsx
// components/landing/LandingFooter.tsx
import Link from 'next/link'

export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">Alphacamper</div>
            <p className="footer-tagline">
              Built with love by West Vancouverites who kept losing their campsites.
            </p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
            <a href="#parks">Parks</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <Link href="/about">About</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/reviews">Reviews</Link>
            <Link href="mailto:hello@alphacamper.com">Contact</Link>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} Alphacamper</span>
          <span>Made in West Vancouver, BC</span>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 5: Verify build**

Run: `cd alphacamper-site && npm run build`

- [ ] **Step 6: Commit**

```bash
git add components/landing/
git commit -m "feat: add PopularParks, FAQ, LandingCTA, and LandingFooter"
```

---

## Task 9: Wire up page.tsx with all landing sections

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Rewrite page.tsx**

```tsx
// app/page.tsx
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingHero } from '@/components/landing/LandingHero'
import { HowAlphaWorks } from '@/components/landing/HowAlphaWorks'
import { Capabilities } from '@/components/landing/Capabilities'
import { TwoProducts } from '@/components/landing/TwoProducts'
import { PopularParks } from '@/components/landing/PopularParks'
import { FAQ } from '@/components/landing/FAQ'
import { LandingCTA } from '@/components/landing/LandingCTA'
import { LandingFooter } from '@/components/landing/LandingFooter'

export default function Home() {
  return (
    <>
      <LandingNav />
      <LandingHero />
      <HowAlphaWorks />
      <Capabilities />
      <TwoProducts />
      <PopularParks />
      <FAQ />
      <LandingCTA />
      <LandingFooter />
    </>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `cd alphacamper-site && npm run build`
Expected: Build succeeds with new landing page

- [ ] **Step 3: Verify dev server renders**

Run: `cd alphacamper-site && npm run dev`
Visit `http://localhost:3000` — should see all 9 sections with color blocks, search bars, and illustration placeholders.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wire up new color-blocked landing page"
```

---

## Task 10: Add ?park= query param support to wizard

**Files:**
- Modify: `app/watch/new/page.tsx`
- Modify: `components/watch/WatchWizard.tsx`
- Create: `__tests__/park-search.test.ts`

- [ ] **Step 1: Verify getCampground works for landing page parks**

`getCampground()` already exists in `lib/parks.ts` and is tested in `__tests__/parks.test.ts`. Run existing tests to confirm:

Run: `cd alphacamper-site && npx vitest run __tests__/parks.test.ts`
Expected: All tests PASS

- [ ] **Step 2: Add integration test for popular parks IDs**

This test validates that all 8 parks shown on the landing page actually exist in the CAMPGROUNDS array (catches stale IDs if parks.ts changes):

```ts
// __tests__/park-search.test.ts
import { describe, it, expect } from 'vitest'
import { getCampground } from '@/lib/parks'

const LANDING_PAGE_PARK_IDS = [
  '-2430',     // Alice Lake
  '-2504',     // Rathtrevor Beach
  '-2493',     // Golden Ears
  '-2499',     // Joffre Lakes
  '-2740399',  // Algonquin - Canisbay Lake
  '-2740523',  // Killarney - George Lake
  '-2740285',  // Sandbanks - Outlet River
  '-2740575',  // Pinery - Burley
]

describe('landing page park integration', () => {
  it.each(LANDING_PAGE_PARK_IDS)('park %s exists in CAMPGROUNDS', (id) => {
    const park = getCampground(id)
    expect(park).toBeDefined()
    expect(park!.id).toBe(id)
  })

  it('getCampground returns undefined for invalid id', () => {
    expect(getCampground('nonexistent')).toBeUndefined()
  })
})
```

Run: `cd alphacamper-site && npx vitest run __tests__/park-search.test.ts`
Expected: All 9 tests PASS

- [ ] **Step 3: Update page.tsx to read search params**

```tsx
// app/watch/new/page.tsx
import { WatchWizard } from '@/components/watch/WatchWizard'

export const metadata = {
  title: 'Watch a Campsite — Alphacamper',
  description: 'Set up a watch for campsite cancellations.',
}

export default async function WatchNewPage({
  searchParams,
}: {
  searchParams: Promise<{ park?: string; q?: string }>
}) {
  const params = await searchParams
  return (
    <div className="wizard-container">
      <WatchWizard initialParkId={params.park} initialQuery={params.q} />
    </div>
  )
}
```

- [ ] **Step 4: Update WatchWizard to accept initialParkId**

The current `WatchWizard` takes no props: `export function WatchWizard()`. Make these changes to `components/watch/WatchWizard.tsx`:

**4a. Add import at top of file:**
```tsx
import { getCampground } from '@/lib/parks'
```

**4b. Add props interface (above the component function):**
```tsx
interface WatchWizardProps {
  initialParkId?: string
  initialQuery?: string
}
```

**4c. Update function signature:**
```tsx
// BEFORE:
export function WatchWizard() {

// AFTER:
export function WatchWizard({ initialParkId, initialQuery }: WatchWizardProps) {
```

**4d. Add useEffect after the existing state declarations (after `const [isComplete, setIsComplete] = useState(false)` line) to handle pre-fill:**
```tsx
useEffect(() => {
  if (initialParkId) {
    const park = getCampground(initialParkId)
    if (park) {
      updateData({
        campgroundId: park.id,
        campgroundName: park.name,
        platform: park.platform,
        province: park.province,
      })
      completeStep('search')
      setActiveStep('dates')
    }
  }
}, []) // eslint-disable-line react-hooks/exhaustive-deps
```

This hooks into the existing `updateData()`, `completeStep()`, and `setActiveStep()` functions already defined in the component.

- [ ] **Step 5: Verify build + tests**

Run: `cd alphacamper-site && npm run build && npx vitest run`
Expected: Build succeeds, all tests pass

- [ ] **Step 6: Commit**

```bash
git add app/watch/new/page.tsx components/watch/WatchWizard.tsx __tests__/park-search.test.ts
git commit -m "feat: wizard accepts ?park= param from landing page search"
```

---

## Task 11: Visual QA and polish

**Files:**
- May modify: `app/globals.css` (tweaks)
- May modify: any landing component (spacing, copy fixes)

- [ ] **Step 1: Run dev server and walk through all sections**

Run: `cd alphacamper-site && npm run dev`

Check each section at desktop (>900px):
- Nav: sticky, dark navy, links visible, CTA green button
- Hero: forest green, headline + subtitle + search + trust strip + illustration placeholder
- How Alpha Works: 3 white cards in a row
- Capabilities: 4 stats on navy
- Two Products: 2 cards side by side on gray
- Popular Parks: 8 cards on royal blue
- FAQ: accordion works (click to expand/collapse)
- CTA: bright green with search bar
- Footer: 3-column forest green

- [ ] **Step 2: Test mobile responsive (<480px)**

Resize to mobile width. Verify:
- Nav collapses to hamburger
- Hero text centers, search stacks
- Cards stack to single column
- Footer stacks

- [ ] **Step 3: Test park search flow**

Type "Alice" in hero search → dropdown appears → click "Alice Lake" → redirected to `/watch/new?park=-2430` → wizard opens at step 2 (dates) with Alice Lake pre-filled.

- [ ] **Step 4: Fix any spacing/alignment issues found**

Make targeted CSS adjustments. No major structural changes.

- [ ] **Step 5: Run full test suite**

Run: `cd alphacamper-site && npx vitest run`
Expected: All tests pass

- [ ] **Step 6: Run build**

Run: `cd alphacamper-site && npm run build`
Expected: Build succeeds with no warnings

- [ ] **Step 7: Commit polish fixes (if any)**

```bash
git add -A
git commit -m "fix: landing page visual polish and spacing tweaks"
```

---

## Task 12: Final verification

- [ ] **Step 1: Verify existing wizard still works**

Visit `/watch/new` directly (no query params) → wizard should work identically to before.

- [ ] **Step 2: Verify dashboard still works**

Visit `/dashboard` → login flow + watch list + alerts should work.

- [ ] **Step 3: Run full test suite one more time**

Run: `cd alphacamper-site && npx vitest run`
Expected: All tests pass

- [ ] **Step 4: Run lint**

Run: `cd alphacamper-site && npm run lint`
Expected: No errors

- [ ] **Step 5: Clean build**

Run: `cd alphacamper-site && npm run build`
Expected: Build succeeds
