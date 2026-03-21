# Alphacamper — Phase 3 & 4 Handoff Prompt

Paste this into a fresh Claude Code session at `/Users/ryan/Code/Alphacamper`.

---

## Context

I'm building Alphacamper — a campsite availability monitor. The project is a 3-app monorepo (Next.js site, Playwright worker, Chrome extension). Full project details are in CLAUDE.md and AGENTS.md at the repo root.

I've completed Phase 1 (watch creation wizard) and Phase 2 (authenticated dashboard) on the `feat/watch-creation-flow` branch. The branch has 21 commits, all tests pass, build is clean. It has NOT been merged to main yet and alphacamper.com still shows the old landing page.

### What exists now

**New routes (Phase 1 + 2):**
- `/watch/new` — 4-step accordion wizard: search campground → pick dates → optional site number → email → creates watch
- `/dashboard` — Supabase Auth login → watch list + alert feed + upgrade CTA
- `/auth/confirm` — Magic link callback page

**Design system (in globals.css):**
- Nature palette: `--navy` (#000066), `--royal` (#0044AA), `--forest` (#339922), `--bright-green` (#55BB22), `--gray-bg` (#EEEEEE)
- Bold Gumroad-style CSS: thick 3px borders, 16px border-radius, chunky buttons
- Wizard + dashboard component classes all defined
- Fonts: Fraunces (display) + DM Sans (body) — already loaded in layout.tsx

**Existing landing page (app/page.tsx):**
- Old design with different color palette (--green, --cream, --sand)
- Components: Nav, Hero, StatsBar, Problem, ThreeClicks, HowItWorks, Features, Comparison, Trust, CTA, Footer
- All in `components/` directory
- WaitlistForm that posts to /api/waitlist

### Design decisions (from brainstorm)

Read the full UX redesign memory at: `~/.claude/projects/-Users-ryan-Code-Alphacamper/memory/project_ux_redesign.md`

Key points:
- **Brand**: Alpha the bear mascot. Goofy, hand-drawn, Canadian grizzly. Family-friendly but bold.
- **Visual style**: Gumroad/Paintly inspired — bold color-blocked sections (each section a different solid color), thick borders, playful illustrations, chunky typography. NOT generic AI slop.
- **Color palette**: Navy, Royal Blue, White, Light Gray, Bright Green, Forest Green — mimicking mountains, sea, clouds.
- **Product model**: Free (1 watch, email alerts) + Paid ($3.99/mo or $19/yr — unlimited watches + Chrome extension)
- **Landing page narrative**: (1) "Campsites sell out in seconds" → (2) "We watch 24/7 for cancellations" → (3) "When one opens, we help you book it first" → search bar
- **Competitor references**: Campnab (SEO structure, FAQ, park directory, reviews), Schnerp (clean accordion UX), Gumroad (visual style)

### Landing page section plan (from brainstorm)

```
1. [FOREST GREEN]  Hero — tagline + search bar + Alpha bear illustration
2. [WHITE]         How Alpha Works — 3 illustrated step cards
3. [NAVY]          Social proof — stats + reviews (white on dark)
4. [LIGHT GRAY]    Two products — Watch & Alert + Book Fast (extension)
5. [ROYAL BLUE]    Popular parks — grid of park cards (SEO)
6. [WHITE]         FAQ accordion
7. [BRIGHT GREEN]  CTA — search bar repeat + Alpha thumbs up
8. [FOREST GREEN]  Footer — park directory links, about, legal
```

Hero search bar → redirects to `/watch/new?park={query}` (the existing wizard)

### Illustration placeholders

Illustration placeholder containers are already in the wizard and dashboard. Ryan will generate hand-drawn Alpha bear art. Each section needs a described placeholder. The illustrations needed are:

**Landing page:**
- Hero: Alpha sitting in a camping chair with binoculars, staring at laptop. Tent + campfire behind. Night sky.
- Card 1 "Tell Alpha where": Alpha pointing at a map pinned to a tree, tongue out
- Card 2 "Alpha watches": Alpha in sleeping bag, one eye open, laptop on belly, coffee mug
- Card 3 "You book it": Alpha celebrating, arms up, confetti, human hand tapping phone
- Social proof: Alpha wearing ranger hat, megaphone, speech bubbles with stars
- Watch & Alert product: Alpha in pine tree with binoculars, notification bell "DING!"
- Book Fast product: Alpha sprinting with laptop in mouth, dust clouds, stopwatch "0:03"
- Popular parks: Alpha as park ranger next to wooden entrance sign
- FAQ: Alpha cross-legged with tiny glasses, book "CAMPING QUESTIONS"
- CTA: Alpha thumbs up (both paws), huge grin, backpack, sunrise behind mountains
- Pricing (if on landing page): Alpha holding two camping signs "MONTHLY" and "YEARLY", cheeky wink

### Sitemap (planned)

```
/                          Landing page (hero + search + how it works + proof + FAQ)
/watch/new                 Accordion watch creation flow (DONE)
/dashboard                 Active watches, alert history (DONE)
/auth/confirm              Magic link callback (DONE)
/parks                     Park directory by province/state (SEO) — NOT YET BUILT
/parks/[province]          Parks in a province — NOT YET BUILT
/faq                       Standalone FAQ (SEO) — NOT YET BUILT
/reviews                   Customer testimonials — NOT YET BUILT
/pricing                   Plans page — NOT YET BUILT
/about                     The story + Alpha the bear — NOT YET BUILT
/blog                      Blog index — NOT YET BUILT
```

Nav: `[Logo + Alpha bear]  Parks  How It Works  Reviews  FAQ  Blog  [Sign In →]`

---

## What needs to happen

### Phase 3: Landing Page Redesign

Replace the current landing page with the Gumroad-style color-blocked design. This is the most visually impactful change.

**Approach:**
1. Replace existing landing page components with new ones matching the color-block design
2. Each section is a full-width color block with max-width content inside
3. Hero has a search bar that redirects to `/watch/new?park={query}`
4. Update Nav to include Dashboard/Sign In links
5. Update Footer with new structure
6. Add pricing section (2-card layout: $3.99/mo vs $19/yr with "Save 60%" badge)
7. Add FAQ accordion
8. All illustration containers are placeholders (described text, dashed border)
9. Responsive design matching existing 480px breakpoint pattern
10. Keep the existing wizard palette tokens — the landing page adopts them (replacing the old --green, --cream palette)

**Key constraint:** The `/frontend-design` skill should be loaded for this work. The aesthetic must be bold, distinctive, nature-themed — NOT generic AI output. Think Gumroad's energy with forest/mountain palette.

**Files to modify/create:**
- `app/page.tsx` — complete rewrite
- `app/globals.css` — replace old landing page styles with new color-block styles, keep wizard + dashboard styles
- `components/` — new landing page components (or rewrite existing ones)
- `app/layout.tsx` — may need nav updates

### Phase 4: Extension UX Overhaul

Replace "mission" language in the Chrome extension sidebar with the simpler watch-creation pattern.

**This is vanilla JS** — completely different codebase at `alphacamper-extension/`.

Key changes:
- Kill "mission" terminology → "watches" or just the action verbs
- Simplify the sidebar to mirror the web app's clean flow
- Keep extension-unique features: autofill (Ctrl+Shift+F), rehearsal, fallback tabs
- Sync state with web app via Supabase (extension already has this partially)

This is lower priority than the landing page.

### Deployment

After Phase 3, merge `feat/watch-creation-flow` to main → Vercel auto-deploys → alphacamper.com gets the new landing page + wizard + dashboard.

---

## How to start

1. Read CLAUDE.md and AGENTS.md for full project context
2. Read the UX redesign memory: `~/.claude/projects/-Users-ryan-Code-Alphacamper/memory/project_ux_redesign.md`
3. Read the existing landing page: `alphacamper-site/app/page.tsx` and all components in `alphacamper-site/components/`
4. Read the existing globals.css to understand the current design system
5. Load the `/frontend-design` skill before writing any UI code
6. Brainstorm the landing page design with Ryan, then plan → implement

Start with: "I've read the handoff document. Let me explore the current state and we can start on the landing page redesign."
