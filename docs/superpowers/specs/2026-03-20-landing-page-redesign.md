# Landing Page Redesign — Design Spec

**Date:** 2026-03-20
**Branch:** `feat/watch-creation-flow`
**Scope:** Replace existing landing page with Gumroad/Paintly-style color-blocked design

---

## Brand & Voice

- **Mascot:** Alpha the bear — goofy, hand-drawn, Canadian grizzly
- **Visual style:** Bold color-blocked sections, thick borders, playful illustrations, chunky typography (Gumroad/Paintly energy)
- **Copy tone:** Confident coach with warmth. Punchy, action-oriented, 8th grade reading level. The illustrations provide playfulness; copy stays sharp and clear.
- **Differentiator:** "We find open campsites AND help you book them before anyone else." Neither Schnerp nor Campnab can say this.

## Color Palette (unified with wizard)

| Token | Hex | Usage |
|-------|-----|-------|
| `--navy` | #000066 | Nav background, dark sections |
| `--royal` | #0044AA | Accent, links, park cards section |
| `--forest` | #339922 | Hero background, footer, primary brand |
| `--bright-green` | #55BB22 | CTA section, action buttons |
| `--gray-bg` | #EEEEEE | Light sections, card backgrounds |
| `#FFFFFF` | white | Content sections |
| `#1a1a1a` | near-black | Text on light backgrounds |

Old landing palette (`--cream`, `--sand`, `--stone`, `--green-*`, `--bark`, `--amber`) is deleted.

## Typography

- **Display:** Fraunces (already loaded in layout.tsx)
- **Body:** DM Sans (already loaded in layout.tsx)
- No font changes needed.

## Sections

### 1. Nav (sticky)

- **Background:** `--navy`, white text
- **Left:** "Alphacamper" in Fraunces + bear icon placeholder
- **Center links:** How It Works | Parks | FAQ | Pricing
- **Right:** Sign In link + green CTA button "Watch a Campsite" → `/watch/new`
- **Mobile:** Hamburger menu, same links
- Auth-aware: shows "Dashboard" instead of "Sign In" when logged in

### 2. Hero — `[FOREST GREEN]`

- Full-width forest green block, white text
- **Headline (Fraunces, huge):** "Never lose a campsite again."
- **Subtitle (DM Sans):** "Alpha watches sold-out campgrounds 24/7. When someone cancels, we alert you instantly — and help you book it before anyone else."
- **Search bar:** White input, thick border, rounded. Live dropdown with park results as user types. Green "Watch this park →" button. Redirects to `/watch/new?park={id}` with step 1 pre-filled.
- **Below search:** "Your first watch is free. No card required."
- **Illustration placeholder (right side, below on mobile):** Alpha in camping chair with binoculars + laptop, campfire, night sky.
- **Trust strip:** ★★★★★ "Trusted by frustrated parents, weekend warriors, and last-minute planners everywhere"

### 3. How Alpha Works — `[WHITE]`

Three illustrated cards in a row, bold numbers with thick 3px borders.

1. **"Tell Alpha where you want to camp"** — Pick your park, dates, and preferred sites. Alpha starts watching immediately.
   - *Illustration: Alpha pointing at map pinned to tree*
2. **"Alpha watches around the clock"** — We check every few minutes, 24/7. When someone cancels, you'll know first.
   - *Illustration: Alpha in sleeping bag, one eye open, laptop on belly*
3. **"You book it before anyone else"** — Get an instant alert with a direct link. Our Chrome extension fills your forms in seconds.
   - *Illustration: Alpha celebrating, confetti, human hand tapping phone*

### 4. Capabilities — `[NAVY]`

White text on dark navy. Four stats in a row:

- **"Every 2–5 min"** — Scan frequency
- **"3 platforms"** — BC Parks, Ontario Parks, Recreation.gov
- **"Booking Assist™"** — Chrome extension autofills in seconds
- **"24/7/365"** — Alpha never sleeps

### 5. Two Products — `[LIGHT GRAY]`

Side-by-side cards with thick borders:

**Watch & Alert (Free)**
- "Know the second a spot opens."
- Monitor your campground, email alert on cancellation.
- Free forever, one active watch.
- CTA: "Start watching — it's free"

**Book Fast (Paid — $3/mo or $19/year, save 47%)**
- "Get the site before anyone else."
- Unlimited watches, push notifications, Chrome extension: auto-fill, practice mode, fallback sites, speed coaching.
- CTA: "Go Pro"
- "Save 47%" badge on annual option

Each card has an illustration placeholder.

### 6. Popular Parks — `[ROYAL BLUE]`

White text on royal blue. Grid of 8-12 park cards for the parks currently monitored (BC Parks, Ontario Parks campgrounds). Each card: park name, province badge, "Watch this park →" link to `/watch/new?park={id}`.

SEO section — links to future `/parks/[province]` pages (placeholder hrefs for now).

### 7. FAQ Accordion — `[WHITE]`

Thick-bordered accordion items. Questions:

1. What is Alphacamper?
2. How does it work?
3. Do you book campsites for me? (No — we alert, you book.)
4. How much does it cost?
5. What parks do you monitor?
6. How fast are the alerts?
7. What's the Chrome extension?
8. Is it really free?

### 8. CTA — `[BRIGHT GREEN]`

- **Headline:** "Start watching a campsite"
- Repeat search bar (same `ParkSearch` component as hero)
- Below: "Your first watch is free. Alpha's already awake."
- **Illustration placeholder:** Alpha thumbs up, huge grin, sunrise behind mountains

### 9. Footer — `[FOREST GREEN]`

Three columns:
- **Product:** How It Works, Pricing, Parks, FAQ
- **Company:** About, Blog, Reviews, Contact
- **Legal:** Privacy, Terms

Bottom line: "Built with love by West Vancouverites who kept losing their campsites." + © 2026 Alphacamper

---

## Component Architecture

### New Components (replace all existing landing components)

| Component | Type | Notes |
|-----------|------|-------|
| `LandingNav` | Client | Sticky, hamburger on mobile, auth-aware (sign in vs dashboard) |
| `LandingHero` | Client | Contains `ParkSearch` component |
| `HowAlphaWorks` | Server | Three step cards with illustration placeholders |
| `Capabilities` | Server | Four stat blocks |
| `TwoProducts` | Server | Free vs Paid cards |
| `PopularParks` | Server | Park card grid |
| `FAQ` | Client | Accordion expand/collapse |
| `LandingCTA` | Client | Contains `ParkSearch` component |
| `LandingFooter` | Server | Links + tagline |
| `ParkSearch` | Client | Shared live search with dropdown, used in hero + CTA |
| `IllustrationPlaceholder` | Server | Reusable dashed-border placeholder with description text |

### Deleted Components

All existing landing components: `Nav`, `Hero`, `StatsBar`, `Problem`, `ThreeClicks`, `HowItWorks`, `Features`, `Comparison`, `Trust`, `CTA`, `Footer`, `WaitlistForm`, `Countdown`

### Kept Components

- `ScrollReveal` — reused for scroll-triggered animations
- All wizard components (in `app/watch/`)
- All dashboard components (in `app/dashboard/`)

### ParkSearch Component

- Text input with debounced search (300ms)
- Hits existing park search API (same endpoint wizard uses)
- Dropdown shows matching parks with platform badge
- On select: redirects to `/watch/new?park={parkId}`
- Used in both `LandingHero` and `LandingCTA`

---

## CSS Architecture

### What's deleted
- All old landing page `:root` variables: `--white`, `--cream`, `--sand`, `--stone`, `--green-deep`, `--green`, `--green-mid`, `--green-light`, `--green-pale`, `--green-wash`, `--bark`, `--amber`
- All old landing page class styles: `.site-nav` through `.footer-links` (lines ~70-363 of current globals.css)
- All old responsive rules for landing components

### What's kept
- Wizard Nature Palette tokens (`--navy`, `--royal`, `--forest`, `--bright-green`, `--gray-bg`)
- All wizard semantic tokens and classes (`.wizard-container` through end of file)
- All dashboard classes
- Animation keyframes (`fadeUp`, `blink`, `pulse`, `shimmer`)
- `.reveal` / `.reveal.visible` classes
- `.container` utility

### CSS cleanup order
1. Remove old landing `:root` variables (lines 11-25 of globals.css: `--white` through `--amber`)
2. Remove old landing class styles (lines ~70-363: `.site-nav` through `.footer-links` and responsive rules)
3. Add new landing section styles using existing wizard palette tokens
4. Comment: `/* ═══ Landing Page ═══ */` to separate from wizard/dashboard styles

### New styles
- Color-block section pattern: full-width background + `.container` inner wrapper
- Section-specific background colors using palette tokens
- Bold card styles: 3px borders, 16px radius
- Park search input + dropdown styles
- FAQ accordion styles
- Illustration placeholders: reuse `.illustration-placeholder` base class, add size modifiers (`.illustration-hero` for large hero placement, default size for step cards)
- Nav: dark navy style replacing cream/blur style
- Footer: forest green multi-column style

### Interactive state colors per section background

| Background | Text | Link hover | Button |
|-----------|------|-----------|--------|
| Navy (`--navy`) | white | white at 70% opacity | `--bright-green` bg, white text |
| Forest green (`--forest`) | white | white at 70% opacity | white bg, `--forest` text |
| Royal blue (`--royal`) | white | white at 70% opacity | white bg, `--royal` text |
| Bright green (`--bright-green`) | white | white at 70% opacity | white bg, `--bright-green` text |
| White / Light gray | `#1a1a1a` | `--royal` | `--forest` bg, white text |

### Responsive Breakpoints

| Breakpoint | Behavior |
|-----------|----------|
| >900px | Full desktop layout |
| 480–900px | Nav hamburger, How Alpha Works 1-col, Two Products 1-col, Popular Parks 2-col, Hero search stays inline |
| <480px | Single column everything, search button stacks below input, Popular Parks 1-col |

### Responsive detail per section

- **Nav:** Hamburger at <900px (same as current)
- **Hero:** Search bar input + button inline at >480px, stacked at <480px. Illustration placeholder moves below text on mobile.
- **How Alpha Works:** 3 columns at desktop, 1 column at <900px
- **Capabilities:** 4-col at desktop, 2x2 grid at <900px, stacked at <480px
- **Two Products:** Side-by-side at >900px, stacked at <900px
- **Popular Parks:** 4-col at desktop, 2-col at <900px, 1-col at <480px
- **FAQ:** Full-width at all sizes
- **CTA:** Same as hero search responsive behavior

---

## Data & API

- **Park search:** Reuses `searchCampgrounds()` from `lib/parks.ts` (client-side, no API call — the CAMPGROUNDS array is imported directly). Same function the wizard's StepSearch uses.
- **Auth state:** Check Supabase session for nav. Unauthenticated → "Sign In" link to `/dashboard` (which shows login form). Authenticated → "Dashboard" link. The green CTA button ("Watch a Campsite" → `/watch/new`) shows for all users regardless of auth state.
- **Popular Parks:** Curated subset of 8 parks from `CAMPGROUNDS` array in `lib/parks.ts` (4 BC Parks + 4 Ontario Parks, chosen for name recognition: Alice Lake, Rathtrevor Beach, Golden Ears, Joffre Lakes, Algonquin - Canisbay Lake, Killarney, Sandbanks, Pinery). Hardcoded array in the component. Recreation.gov parks excluded (stub only, not functional).
- **FAQ content:** Static array of Q&A objects in the FAQ component.
- **No new API routes needed.**

### Query param integration with wizard

The landing page `ParkSearch` component redirects to `/watch/new?park={parkId}`. This requires a small change to the wizard:

- `app/watch/new/page.tsx` reads the `park` search param
- If present, auto-selects the matching campground from `CAMPGROUNDS` and pre-fills step 1 (campground name, platform, province)
- Step 1 shows as completed with the selected park, step 2 (dates) opens automatically
- This is a minor addition to the existing wizard, not a rewrite

---

## Out of Scope

- `/parks`, `/parks/[province]` directory pages
- `/pricing` standalone page
- `/faq` standalone page
- `/reviews`, `/about`, `/blog` pages
- Actual bear illustrations (placeholder boxes only)
- Payment integration (pricing is informational)
- Email notification setup
- Analytics/tracking
