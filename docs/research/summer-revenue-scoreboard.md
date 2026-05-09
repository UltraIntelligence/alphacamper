# Summer Revenue Scoreboard

Last updated: 2026-05-09

## Purpose

The coverage goal and the business goal are connected, but they are not the same.

Coverage goal:

- 50,000 verified realtime-alertable Canadian campsites.

Business goal:

- $10k revenue by the end of summer.

Control-tower rule:

- We should not call the expansion successful unless customers can pay, create watches, receive alerts, and see Alphacamper improve their odds of getting a site.

## Revenue Math

Current checkout copy shows:

| Pass | Price | Simple $10k path |
|---|---:|---:|
| Summer pass | $29 | 345 passes = $10,005 |
| Year pass | $49 | 205 passes = $10,045 |

Mixed paths:

| Summer passes | Year passes | Revenue |
|---:|---:|---:|
| 100 | 145 | $10,005 |
| 150 | 116 | $10,034 |
| 200 | 86 | $10,014 |

Recommended success definition:

- Primary: $10k net collected revenue after refunds and chargebacks.
- Leading indicator: $10k gross collected revenue before the 30-day guarantee settles.

Why:

- The product promises a refund if Alphacamper does not book the camper a site.
- Gross sales can look healthy while refunds reveal that the product did not deliver the customer outcome.

## Current Source-Of-Truth Read

Live aggregate read on 2026-05-09:

| Area | Current live read | Meaning |
|---|---:|---|
| Active watches | 5 | There are real active watches or admin test watches waiting on worker polling. |
| Availability alerts | 0 | No verified live alert delivery yet. |
| Delivered alerts | 0 | `notified_at` proof is still missing. |
| `subscriptions` table | Exists, 0 rows | Live billing storage exists after the one-time pass migration. |
| `funnel_events` table | Exists, 0 rows | Live conversion-event storage exists and is now included in the operator revenue-quality view. |
| Production Vercel Stripe env vars | Missing | Live checkout cannot work until Stripe production env vars are configured. |
| Operator revenue-quality view | Built, not green | `/api/admin/revenue-quality` and the dashboard operator panel read live Supabase, but production Stripe env vars and net Stripe reporting are still missing. |

Important wrinkle:

- The checkout UI calls both passes "one-time".
- `/api/checkout` now creates Stripe Checkout sessions with `mode: "payment"` in code.
- The webhook now stores one-time pass purchases in the existing `subscriptions` access table.
- Legacy subscription webhook handling remains for any older subscription-mode sessions.
- The live database now has `subscriptions`, `stripe_webhook_events`, and `funnel_events`.
- Production Vercel is still missing the Stripe env vars needed to actually start checkout.

Product recommendation:

- If these are fixed 2026 passes, use Stripe one-time payment mode and keep the current customer language.
- If this is meant to renew, keep subscription mode but rewrite the checkout page so customers clearly understand renewal and cancellation.
- Recommended for summer 2026: one-time payment. It matches the pass language, lowers customer confusion, and keeps the $10k scoreboard cleaner.

## Weekly Scoreboard

Track these every week.

| Metric | Source | Why it matters |
|---|---|---|
| Gross Stripe revenue | Stripe | Fastest signal that campers are willing to pay. |
| Net Stripe revenue | Stripe | The real $10k success number after refunds. |
| Paid summer passes | Stripe or verified DB billing table | Shows short-term summer conversion. |
| Paid year passes | Stripe or verified DB billing table | Shows higher-trust conversion. |
| Refund count and dollars | Stripe | Tells us whether the guarantee is being triggered too often. |
| Active watches | Supabase `watched_targets` | Shows customers are asking Alphacamper to work for them. |
| Alerts delivered | Supabase `availability_alerts.notified_at` | Proves the alert engine is creating customer value. |
| Alert taps | `funnel_events` after live table is verified | Shows whether campers act on alerts. |
| Booking submitted | `funnel_events` after live table is verified | Shows "not just finding, helping get the site." |
| Booking confirmed | `funnel_events` after live table is verified | Best customer outcome metric. |
| Unsupported/search-only requests | Demand capture queue | Tells us which providers to build next. |
| Verified realtime campsite inventory | Provider health and worker proof | Measures the coverage promise. |

## Revenue Gates

### Gate 1: Billing Truth

Green means:

- Checkout copy matches Stripe mode.
- Live database has the billing table the site expects, or reporting intentionally uses Stripe only.
- We can report paid pass counts without guessing.

Current status:

- Yellow. The one-time-vs-subscription decision is resolved in code, the live tables exist, and the operator revenue-quality view is built. Production Stripe env vars are still missing, and net revenue after refunds is not verified from Stripe yet.

Repeatable smoke command:

```bash
cd alphacamper-site
npm run smoke:billing
```

Expected current result:

- Yellow until production Vercel has the Stripe env vars and the configured price ids are verified as one-time prices.

### Gate 2: Worker And Notification Proof

Green means:

- Railway worker heartbeat is real.
- A controlled customer watch is created.
- The worker checks it.
- A real alert row is written with `notified_at`.
- Cleanup is complete.

Current status:

- Yellow. Production site is live, but Railway heartbeat and notification proof are not green yet.

### Gate 3: Conversion Measurement

Green means:

- Operator can see how many people pay, create watches, receive alerts, tap alerts, submit bookings, and confirm bookings.
- Unsupported/search-only interest becomes a ranked queue.

Current status:

- Yellow. Live funnel storage exists and the operator revenue-quality view now reads it, but there are still 0 funnel rows and 0 paid-pass rows in production.

## How This Ties To The Product Strategy

The competitor bar is not just "large campground list."

Alphacamper should win by doing three things together:

- Coverage: show the campground customers expect.
- Trust: label alertable vs search-only honestly.
- Outcome: help the camper actually get the site.

The business target should not be treated as separate from the product. $10k by end of summer is the proof that enough campers believe Alphacamper improves their odds.

## Next Work

Recommended next epic after the current worker gate:

- Billing Truth And Revenue Reporting.

Objective:

- Configure production Stripe env vars, prove one checkout/webhook path, and finish net/refund reporting against Stripe. The operator revenue-quality view already reports gross app-side revenue, paid passes, active watches, delivered alerts, and booking outcome events from live Supabase.

Do not mark the $10k goal as fully measurable until production Stripe checkout and net/refund reporting are both proven.
