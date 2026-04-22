# Alphacamper Design System

Source of truth for typography, color, spacing, motion, and voice. Read this before writing any UI code. If a surface doesn't match this doc, the surface is wrong.

**Last updated:** 2026-04-22
**Owner:** Ryan Alldridge
**Established by:** `/design-consultation` during the post-strip UI sprint

---

## The memorable thing

**"We get you the site."**

Six syllables. Specific verb. Implied promise. Every surface — landing, wizard, dashboard, extension overlay, booking success, content pages — reinforces this sentence or it gets cut. "Alerts," "notifications," "tracking," "scanning" are mechanisms, not promises. Never lead with them.

If a design decision doesn't clearly serve the sentence above, choose the simpler option.

---

## Product context

- **What this is:** a campsite-booking concierge. The user states an intent ("Algonquin site #47 for Aug 15-18"). Alphacamper watches inventory, texts the moment it opens, and autofills the booking form in the user's browser so they finish in ~10 seconds, not ~4 minutes.
- **Who it's for:** families with an annual-trip ritual at a specific park + specific site. Emotional stakes are "Dad failed the kids for the first time in 15 years." Willingness to pay is $29-49, not $5.
- **Space:** campground reservations (Canada: BC/Ontario/Parks Canada; US: Recreation.gov). Incumbents: Campnab, Campflare, Schnerp, Hipcamp-alerts.
- **Project type:** hybrid. Marketing site (landing, 12 content pages, pricing) + web app (wizard, dashboard) + Chrome extension UI.
- **Positioning:** "Campnab tells you. Alphacamper gets you."

---

## Aesthetic direction

**Name:** Editorial-Precise.

**What it is:** Linear/Stripe engineering precision + editorial-magazine confidence in the typography. Cool palette (blue, white, green). High contrast. Generous whitespace where it earns attention, tight density where data needs to breathe less. No decorative blobs, no stock outdoor photography, no three-column icon grids, no mascot.

**Mood:** calm, capable, specific. Like a concierge that already knows your site number. The visual posture matches the product posture — we're the service you trust because we're the only one who actually finishes the job.

**Decoration level:** intentional. Three decoration moves allowed:
1. The existing full-bleed MapLibre hero map (critical keeper)
2. The existing body `::after` 4%-opacity fractal-noise texture
3. One thin hairline (1px, `--ink` at 8% opacity) for editorial dividers

No other decorative flourishes. No gradients other than the dark hero vignette. No illustrated characters.

**Reference products:** Linear (precision), Stripe (trust through specificity), The Browser Company (editorial typography on cool palette), Figma pricing page (confident layout), Are.na (editorial restraint).

---

## Typography

Fonts live in `app/layout.tsx` via `next/font/google`. Self-hosted post-deploy — no runtime Google Fonts requests.

| Role | Font | Loading | Variable |
|---|---|---|---|
| Display / editorial headlines | **Instrument Serif** | `next/font/google` | `--font-display` |
| Body / UI | **Inter** | `next/font/google` | `--font-body` |
| Data / site numbers / dates / mono | **JetBrains Mono** | `next/font/google` | `--font-mono` |

### Why these

- **Instrument Serif** is a contemporary transitional serif. Free, variable, readable over photography and map tiles, carries editorial confidence without the Gumroad-style warmth of Fraunces. Works at `5rem+` for the hero headline and at `2.25rem` for content-page h1s. Use at weight 400 only — the serif structure does the work, not weight.
- **Inter** stays. It's the right body face for dense UI, ships with Tailwind ergonomics, renders cleanly at small sizes, and doesn't fight the serif. Keep weights: 400, 500, 600, 700.
- **JetBrains Mono** gives data surfaces (site numbers, last-check timestamps, status readouts, funnel stats) a product-is-a-real-system feel. Use sparingly — only where the number is the point. Weight: 500.

### Outlaw list

Never ship in any primary role:

- Outfit, Space Grotesk, Poppins, Montserrat, Lato, Open Sans, Roboto, Arial, Helvetica, system-ui, -apple-system as display or body
- Playfair Display, Lobster, Papyrus, Comic Sans, Impact, Raleway, Clash Display
- Any script, handwriting, or "friendly" rounded sans

The current codebase uses **Outfit** as `--font-display` under the alias `--font-momo`. That gets replaced with Instrument Serif under the same variable name during Phase 3 P1. Legacy alias `--font-momo` is kept as `var(--font-display)` fallback during migration.

### Scale

```
--text-xs:    12px / 16 line
--text-sm:    14px / 20 line
--text-base:  16px / 24 line   (body default)
--text-md:    18px / 28 line   (lede / emphasized body)
--text-lg:    20px / 30 line
--text-xl:    24px / 32 line
--text-2xl:   32px / 40 line
--text-3xl:   40px / 48 line   (section h2)
--text-4xl:   56px / 60 line   (content-page h1)
--text-5xl:   80px / 84 line   (landing hero h1 min)
--text-hero:  clamp(5rem, 10vw, 9rem) / 0.92  (landing hero h1 fluid)
```

Display sizes (md+) use Instrument Serif with `letter-spacing: -0.02em`. Body stays at `0` tracking. Mono at `-0.01em`.

### Rules

- Display serif only for h1, section h2, editorial pull quotes, and the site-number in the booking success card. Never for body.
- Body sans for everything else, including buttons.
- Mono only where the content IS data: site numbers (`#47`), dates (`Aug 15-18`), timestamps (`2m ago`), status lines (`SCANNING`), prices (`$29`).
- No ALL-CAPS except: section eyebrows (tracking `0.16em`, weight 600, text-xs) and status pills (tracking `0.08em`, text-xs, weight 700).
- No text-shadows except the existing hero title (needs legibility over map tiles).

---

## Color

**Approach:** restrained-balanced. Cool only — blue / white / green — no warm neutrals, no sunset accent, no orange. The product is about water, sky, and forest; the palette reinforces that without being on-the-nose.

### Tokens

```css
/* Primary brand */
--paradiso:     #2F847C;   /* brand teal — existing */
--paradiso-ink: #1F5952;   /* darker teal — hover, pressed, text on pale */

/* Deep structural */
--forest:       #0E2A2A;   /* near-black forest green — primary text + dark surfaces */
--night:        #14303A;   /* deep cool navy — hero scrim, nav backgrounds */

/* Cool blues */
--horizon:      #3B6B88;   /* deeper than old #5588A6 — secondary brand */
--horizon-pale: #E8F0F6;   /* tint — info surfaces, subtle callouts */

/* Greens */
--sea:          #6FAE75;   /* darker sea-green — success, "we got you" */
--sprig:        #D4E8DC;   /* pale green — watch-is-running surface */

/* Neutrals (cool-whites and cool-grays) */
--paper:        #FFFFFF;   /* card surfaces */
--cloud:        #F4F7F6;   /* page background */
--mist:         #E6EBEA;   /* hairline borders, table row dividers */
--ink:          #0E2A2A;   /* primary text (same as --forest) */
--ink-muted:    #4B5F5F;   /* body text muted */
--ink-subtle:   #8BA39E;   /* tertiary / timestamps / captions */

/* Semantic (cool) */
--success:      #6FAE75;   /* sea */
--info:         #3B6B88;   /* horizon */
--warn:         #8B7E3A;   /* muted ochre-olive — cool, NOT amber */
--danger:       #8B3A3A;   /* muted clay — used minimally, never fire-engine */

/* Legacy aliases (keep during migration — remove after Phase 3 P7) */
--color-primary:       var(--paradiso);
--color-primary-hover: var(--paradiso-ink);
--color-accent:        var(--horizon);
--color-text:          var(--ink);
--color-text-muted:    var(--ink-muted);
--color-surface:       var(--paper);
--color-surface-muted: var(--cloud);
--color-border:        var(--mist);
```

### Rules

- Primary CTAs use `--forest` background, `--paper` text. Not teal. Teal is the brand *hue*, not the buttonest button. Reserving teal for brand accents makes the CTA the unmistakable action on the page.
- Secondary CTAs use `--paper` background, `--forest` text, `--mist` border.
- Ghost buttons use `--ink-muted` text, no border, underline on hover.
- Links use `--paradiso` with 1.5px underline at 3px offset. Hover: `--forest`.
- Never use `--danger` or `--warn` larger than 24px. They exist for status badges, not design features.
- Dark surfaces (hero scrim, night mode sections) use `--night`, never `--forest`. Forest is for text and CTA; night is for backgrounds.
- Maintain WCAG AA on every text pair. Spot-check the risky pairs: `--ink-subtle` on `--cloud` (passes at 14px+), `--paradiso` on `--paper` (passes AA at 16px+).

### Dark mode

Deferred. The product is primarily a daytime experience (booking during working hours / at night-with-ritual-timing), and the landing hero already runs a dark scrim over the map. A proper dark mode ships after beta validation. If a surface needs to look dark now, use `--night` as background with `--paper` text and `--paradiso` accents.

---

## Spacing

**Base unit:** 4px. Comfortable density — not tight like Linear, not airy like Apple.

```
--space-0:  0
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-5:  24px
--space-6:  32px
--space-7:  48px
--space-8:  64px
--space-9:  96px
--space-10: 128px   (section separators only)
```

Marketing sections: vertical rhythm is `--space-9` (96px) between sections on desktop, `--space-7` (48px) on mobile.

App surfaces: vertical rhythm inside cards is `--space-4` (16px) between fields, `--space-5` (24px) between groups.

Max content width: `1120px` (existing `.container`). Editorial content column: `720px` inside `860px` max-width shell.

Border radius:
- `--radius-sm: 6px` — inputs, badges, small chips
- `--radius-md: 12px` — buttons, small cards
- `--radius-lg: 20px` — dashboard cards, watch cards, alert cards
- `--radius-xl: 28px` — content article shell, pricing cards
- `--radius-full: 9999px` — pill CTAs, status indicators, circular avatars

The current codebase has bubble-radius-on-everything (`24px`/`28px` across nav CTA, cards, and modals). Restore hierarchy — smaller things get smaller radii.

---

## Layout

**Approach:** hybrid.

- **Marketing surfaces** (landing, content pages, pricing): editorial. Asymmetry earns personality — oversized hero type over map, floating content card with generous column, asymmetric testimonial placement when we eventually have testimonials (not yet).
- **App surfaces** (wizard, dashboard, booking success): grid-disciplined. Predictable alignment, single-column cards at `max-width: 680px`, clear vertical flow. This is where the user finishes a job — no creative surprises.
- **Extension UI**: app-grid rules apply, adjusted for sidepanel 360-400px width.

Grid: `CSS Grid` with `minmax(0, 1fr)` columns. No Bootstrap 12-col math. Gutters are `--space-5` (24px) at desktop, `--space-4` (16px) at mobile.

The landing hero composition — full-bleed MapLibre map + dark vignette scrim + centered hero text + bottom-bar specs — is the one composition that stays. Everything else aligns under it.

---

## Motion

**Approach:** intentional. Motion reinforces speed (the product's core promise) or it doesn't ship.

```
--ease-instant:   0ms
--ease-swift:     120ms cubic-bezier(0.2, 0, 0, 1)     (buttons, hovers, small state)
--ease-confident: 280ms cubic-bezier(0.16, 1, 0.3, 1)  (card reveals, section transitions)
--ease-arrive:    480ms cubic-bezier(0.16, 1, 0.3, 1)  (success moments, booking confirm)
```

### Rules

- Hover transitions: 120ms `--ease-swift` on color + transform only.
- Page transitions: none. We do instant route changes (the product is about speed).
- Scroll reveals: removed. The legacy `.reveal { fade-up on scroll }` is fade-up-as-decoration — cut it. Content appears when it appears.
- The `.slow-zoom` 40s-breath animation on the hero map is a keeper — it reinforces "we scan parks 24/7."
- The booking-success and autofill-overlay are the two surfaces allowed full motion choreography (Phase 3 P2 and P8).
- `prefers-reduced-motion`: honor the existing reset. Every motion must degrade to instant.

---

## Voice

Sharp, specific, builder. Not camper-lifestyle-brand. The product is built for families with scar tissue from losing a site; it talks to them like someone who lost a site last year too.

### Rules

- Never say "adventure," "memories," "outdoor lifestyle," "explore," "discover."
- Always prefer specificity: "Algonquin site #47 for Aug 15-18" beats "your favorite site."
- Numbers over adjectives: "10-second booking" beats "fast booking."
- Active voice. "We watch" not "parks are watched."
- Admit what competitors are good at. We said it on `/campnab-alternative`; keep that tone everywhere.
- No feature-list speech ("24/7 monitoring, custom alerts, multi-park support"). Replace with what the user gets ("we text you the second a site opens").
- No exclamation marks. Period.

### Examples

✅ "We check Algonquin every 45 seconds. When your site opens, we text and autofill your form. You book in ten seconds."

❌ "Get instant SMS alerts for cancellations at your favorite park! Never miss an opening again with 24/7 monitoring!"

---

## Components

Keep the primitive set tight. No component library, no shadcn, no Radix. Hand-roll what we need.

- `Button` — primary, secondary, ghost. Three sizes: sm/md/lg. Pill radius for pricing/hero CTAs, md radius elsewhere.
- `Card` — surface container. Padding: `--space-5` on mobile, `--space-6` on desktop. Radius `--radius-lg`. `--mist` hairline border at 100% or none.
- `Eyebrow` — uppercase micro-label. Text-xs, weight 600, tracking `0.16em`, `--paradiso` color.
- `StatusPill` — small inline indicator. Text-xs, weight 700, uppercase, pill radius, semantic color background at 15% opacity + semantic color text at full.
- `DisplayText` — Instrument Serif wrapper for hero / editorial headlines.
- `DataNumber` — JetBrains Mono wrapper for site numbers, dates, prices.
- `ScanDot` — the teal-with-pulse dot that indicates an active watch.

Shared layout primitives: `Container` (existing `.container`), `Section` (vertical rhythm wrapper), `ReadingColumn` (860px article shell).

---

## Existing tokens that change

| Token | From | To | Why |
|---|---|---|---|
| `--font-display` / `--font-momo` | Outfit | Instrument Serif | Outfit reads generic-SaaS; Instrument Serif sells editorial confidence |
| (new) `--font-mono` | n/a | JetBrains Mono | Data surfaces need a mono face |
| `--horizon` | `#5588A6` | `#3B6B88` | Deeper, more trust, less baby-blue |
| `--dark` | `#1a2a2a` | `#0E2A2A` (→ `--forest`) | Slightly darker for more contrast |
| `--color-border-bold` | `#1a1a1a` | `var(--forest)` | Consistency with `--ink` |
| `--radius-sm` | `8px` | `6px` | Restore radius hierarchy |
| `--radius-md` | `12px` | `12px` | unchanged |
| `--radius-lg` | `16px` | `20px` | larger cards earn larger radius |
| (new) `--radius-xl` | n/a | `28px` | content article shell |
| `--color-text` | `#1a1a1a` | `var(--ink)` (`#0E2A2A`) | forest-not-graphite |

The legacy aliases (`--navy`, `--royal`, `--bright-green`, `--forest`, `--gray-bg`) stay during Phase 3 so the wizard doesn't break. They get removed in Phase 3 P7 after the wizard migrates to new tokens.

---

## What we are NOT doing

- No mascot. No Alpha the bear. No illustrated animal characters. Ever.
- No warm colors. No cream. No sand. No sunset orange. No amber.
- No stock outdoor photography.
- No testimonial walls from users who don't exist yet.
- No "Trusted by" logo rows from companies we don't have.
- No 3-column icon grids for "features."
- No purple gradients. No any-gradient except the existing hero vignette.
- No fancy cursor, no page loader, no scroll-triggered videos.
- No dark mode toggle until post-beta.
- No accessibility overlay widgets — ship native A11Y instead.
- No cookie banner unless legally required.

---

## Decisions log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-22 | Initial design system created by /design-consultation | Post-strip UI sprint; Ryan delegated font/accent decisions; constraints were blue/white/green, no mascot, conversions + clarity |
| 2026-04-22 | Instrument Serif over Fraunces for display | Fraunces carries warm character; rejected per cool-only palette constraint |
| 2026-04-22 | No dark mode in v1 | Product is daytime-first; dark mode ships post-beta if demand exists |
| 2026-04-22 | Keep MapLibre hero map as non-negotiable | Per Ryan's addendum + independent audit agreement; it's the single most distinctive visual element |
