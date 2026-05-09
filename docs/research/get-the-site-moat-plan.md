# Get You The Site Moat Plan

Last updated: 2026-05-09

## Plain-English Thesis

Alphacamper should not try to win by being "another campsite alert app."

Campnab and Campflare already make that promise well:

- Campnab: paid cancellation alerts, filters, SMS/email, direct booking links where possible, and clear disclaimers that they do not book for the camper.
- Campflare: free alerts, maps, permit alerts, iOS app, and a strong "no paywalls" position.

Alphacamper's moat should be:

> We help a regular camper move from "a site opened" to "I am at the official review step" faster and with less panic.

The final confirmation still belongs to the camper. Alphacamper should not auto-pay, bypass captchas, or pretend to own the camper's government booking account.

## Current Flow Read

What already exists in the product:

- Site homepage already promises "We get you the campsite," SMS alerts, and Chrome autofill.
- Watch wizard lets a camper choose a park, exact dates, and optional exact site number.
- Search labels whether alerts are live or not live yet.
- Checkout sells a $29 summer pass and $49 year pass.
- Dashboard shows watches, alerts, upgrade CTA, and basic outcome metrics.
- Extension has saved booking details, alert polling, desktop notifications, sidepanel alerts, booking-assist tabs, form fill, safe next-step assist, fallback tabs, and rehearsal.
- Funnel events already exist for alert taps, autofill started, booking submitted, booking confirmed, and booking failed.

Important current constraint:

- Some "all powerful" extension ideas exist in code but are hidden for beta, especially booking plans, launch mode, and trip planner surfaces.

## Product Positioning

Best customer promise for this summer:

> Set a watch. Save your booking details once. When a site opens, Alphacamper opens the official booking page, fills the boring parts, helps you get to review, and leaves final confirm to you.

This is stronger than "we text you."

This is also safer than "we book it for you."

## Ranked Moat Roadmap

### 1. Immediate Launch-Critical Features

These are the features that must feel real before we ask enough campers to pay toward $10k.

| Rank | Feature | Camper Experience | Why It Matters | Current Status | Must Be True Before Marketing It Hard |
|---:|---|---|---|---|---|
| 1 | Alert-to-assist handoff | Camper taps the alert and Alphacamper opens the right official booking page with the right park, dates, and site context. | This is the actual moat. The camper should feel "it is taking me there," not "good luck." | Pieces exist in extension notifications, sidepanel alerts, deep links, and assist plans. | Prove one end-to-end flow from alert row to extension assist on the top supported platforms. |
| 2 | Saved booking details checklist | Camper saves name, phone, address, vehicle, party size, and equipment once before the real alert. | The race is lost when the camper is still typing. This makes the paid promise believable. | Profile exists in extension and is stored locally. | Add a clear readiness state: "Booking details saved" / "missing details" / "ready for alert." |
| 3 | Official-review handoff | Alphacamper fills safe fields and stops before final payment/confirm. | This keeps trust high and avoids the risky "bot bought a campsite" feeling. | Assist already stops around cart/review language in code. | The UI must say clearly: "Review and final confirm stay with you." |
| 4 | Rehearsal before the alert | Camper practices once and sees whether they can get through the flow quickly. | Paid campers need confidence before a high-stakes cancellation hits. | Rehearsal exists. It is not yet central to purchase/onboarding. | Make rehearsal part of the "ready to win" setup, not a hidden tool. |
| 5 | Honest coverage and alertability | Camper can see which parks Alphacamper can actually alert today. | Nothing kills trust faster than paying for an unsupported campground. | Search labels alertable/search-only and blocks unsupported watch creation. | Keep marketing tied to verified alertable providers only. |
| 6 | Outcome measurement | Admin can see watch created, alert sent, alert tapped, autofill started, booking submitted, confirmed, or failed. | The $10k goal depends on proving people are not just buying, but getting closer to booked. | Funnel event storage and event names exist. | Operator view should make this easy to read weekly. |
| 7 | Paid pass confidence | Camper understands what the $29/$49 pass buys and when refund applies. | The promise is outcome-heavy, so pricing and refund language must be simple. | Checkout says one-time pass and 30-day refund if Alphacamper does not book a site. | Billing, webhook, and refund reporting must be production-proven. |

### 2. Next Paid-Upgrade Features

These are strong paid reasons after the core "alert to review" flow works.

| Rank | Feature | Camper Experience | Why It Matters | Recommendation |
|---:|---|---|---|---|
| 1 | Any Opening mode | Camper says "I can go anytime this season" instead of choosing exact dates. | This creates more wins and feels much more powerful than narrow alerts. | Build after exact-date alert delivery is proven. |
| 2 | Backup campground stack | Camper ranks first choice, second choice, third choice, and Alphacamper helps with the best available path. | Real campers usually have fallback parks. This turns panic into a plan. | Use the existing mission/launch-mode ideas, but simplify for paid users. |
| 3 | Family alert sharing | One watch can notify two people or one backup booker. | Campnab publicly says it does not associate two phones with one account, so this is a useful wedge. | Keep it simple: extra email/SMS contact, not full team accounts. |
| 4 | Readiness score | Camper sees "Extension connected, profile saved, rehearsal done, official account logged in." | Makes the product feel like a launch system, not a passive alert list. | This is likely high conversion because it reduces fear before paying. |
| 5 | Requirement filters | Camper adds vehicle length, equipment, hookups, accessible needs, pet rules, or site type where the provider supports it. | Better matches mean fewer useless alerts. | Only expose filters that are reliable for the specific provider. |
| 6 | Alert quality feedback | Camper can mark "I got it," "someone beat me," "wrong match," or "site not bookable." | Helps improve provider quality and makes support easier. | Add this before scaling too many providers. |
| 7 | Booking-window mode | Camper gets countdowns and guided tabs for fixed release days, not only cancellations. | This extends the moat from cancellations into launch-day booking battles. | Good paid feature, but only after cancellation flow is stable. |

### 3. Later "All Powerful App" Features

These are compelling, but should wait until after the product has revenue proof and a working core loop.

| Rank | Feature | Camper Experience | Why It Could Matter Later | Why Not Now |
|---:|---|---|---|---|
| 1 | Full trip planner | Camper says "lakefront near Toronto, kid-friendly, July weekend" and gets a plan. | Could make Alphacamper useful before the camper knows the exact park. | It is broad and can distract from the paid summer promise. |
| 2 | Rich campground data | Photos, amenities, cell service, rules, nearby alternates, weather, closures. | Campflare sets a high bar here. | It helps discovery, but the paid moat is winning the booking race. |
| 3 | Broad North America coverage | Camper expects nearly every major public campground. | Needed for category leadership. | Coverage should expand from verified demand and alert proof, not vanity counts. |
| 4 | Smart odds engine | Camper sees "best chance dates" and "cancellations likely this week." | Could make alerts smarter and increase wins. | Needs enough historical data first. |
| 5 | Post-booking trip manager | Packing list, weather alerts, route notes, campsite reminders. | Nice retention feature. | It does not help the first $10k as directly as getting the site. |
| 6 | Mobile app | Camper manages alerts and taps push notifications from iOS/Android. | Useful long term. | Chrome extension is the moat right now; mobile cannot fill desktop booking forms as well. |

## What We Should Not Build Yet

Do not build these before $10k revenue:

- Auto-confirm or auto-pay booking.
- Captcha bypassing or anything that looks like a hidden booking bot.
- A giant AI trip planner as the main product.
- Full social/team planning.
- Marketplace-style resale, transfer, or booking exchange.
- A huge campground media database.
- Full mobile app parity.
- Every possible provider filter before the top providers are proven.
- Broad unsupported coverage pages that make customers think alerts work everywhere.
- Complex admin tooling unless it directly helps prove paid users, delivered alerts, and booking outcomes.

## Best Practice Guardrails

- Always leave final confirm to the camper.
- Be honest about supported parks.
- Market "helps you get to review faster," not "guaranteed automated booking."
- Prioritize provider reliability over big numbers.
- Tie paid features to the customer outcome: fewer missed alerts, faster booking flow, better odds.
- Measure the actual outcome, not just signups.

## Best Next Implementation Task

Build and verify the first paid moat loop:

> Paid camper creates a watch for a supported park, connects the extension, saves booking details, receives an alert, taps it, Alphacamper opens the official booking page, starts assist, fills safe fields, and reaches the official review step with final confirm left to the camper.

Acceptance proof:

- Works on one top Canadian provider first, preferably BC Parks or Ontario Parks.
- Records these events: alert delivered, alert tapped, autofill started, booking submitted or handoff ready, booking confirmed/failed when known.
- Sidepanel shows a simple status: "Opening booking page," "Filling details," "Review ready," or "Take over manually."
- If something fails, the camper gets a clear next step instead of silence.

This is the best next task because it turns Alphacamper from an alert tool into a "get me there" product.

## Sources Checked

- Campflare homepage and info pages: https://campflare.com/ and https://campflare.com/info
- Campnab FAQ and pricing pages: https://campnab.com/faq and https://campnab.com/pricing
- Current Alphacamper site, dashboard, checkout, watch wizard, extension sidepanel, notifications, rehearsal, and autofill code in this repo.
