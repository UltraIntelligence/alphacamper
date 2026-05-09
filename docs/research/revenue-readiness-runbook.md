# Revenue Readiness Runbook

Last updated: 2026-05-09

## Goal

Get from zero live revenue proof to the first paid customer proof without doing a fake real-money charge.

Business target:

- $10k net collected revenue by the end of summer.
- Treat net collected revenue after refunds as the real finish line.
- Use gross collected revenue as the fast early signal.

## Current Status

Yellow.

What is already green:

- Checkout code uses Stripe Checkout in one-time payment mode for the summer and year passes.
- Webhook code verifies Stripe signatures before processing.
- Webhook code records successful checkout into the `subscriptions` access table.
- Live billing tables exist: `subscriptions`, `stripe_webhook_events`, and `funnel_events`.
- Operator revenue-quality view reads live Supabase and reports paid passes, gross app-recorded revenue, funnel events, watches, alerts, and blockers.
- Billing smoke command can read live Supabase and Vercel production env names without printing secret values.

What is still yellow/red:

- Vercel production is missing these Stripe env vars:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_SUMMER`
  - `STRIPE_PRICE_YEAR`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Live `subscriptions` has 0 rows.
- Live `stripe_webhook_events` has 0 rows.
- Live `funnel_events` has 0 rows.
- Net revenue after refunds is not wired from Stripe yet.

## First Paid Customer Proof

1. Add the missing Stripe env vars to Vercel Production.

Use live-mode Stripe values only. Keep test-mode values in Preview/local only.

2. Verify the two Stripe prices.

Both pass prices should be one-time prices, not recurring subscription prices.

3. Redeploy production after the env vars are present.

This makes the runtime actually see the new Stripe config.

4. Run the billing smoke check.

```bash
cd alphacamper-site
npm run smoke:billing -- --allow-yellow
```

Expected next result:

- Stripe env vars: present.
- Local Stripe price check: green only if local env has matching Stripe values.
- Live DB rows: still 0 until a real customer pays.
- Overall status: still yellow if no paid customer exists or net/refund reporting is not wired.

5. Do one real customer checkout only when ready.

Do not create a fake live charge just to satisfy the dashboard. The first proof should be a real buyer, or a clearly approved internal live purchase that can be refunded and documented.

6. Confirm the Stripe webhook landed.

After checkout succeeds, the operator should see:

- `subscriptions` row count above 0.
- `stripe_webhook_events` row count above 0.
- Paid active passes above 0.
- Gross app revenue above 0.

7. Confirm the customer can use the product.

The customer should be able to:

- Sign in.
- See paid access.
- Create a watch.
- Receive an alert when availability is found.

8. Add net/refund reporting.

Do not call revenue reporting fully green until refunds are checked against Stripe, not just app-side gross revenue.

## Green / Yellow / Red Rules

Green:

- Production Stripe env vars are present.
- Stripe price ids are verified as one-time prices.
- At least one real paid checkout created a DB pass row through the webhook.
- Operator view shows paid passes and gross revenue.
- Refund/net reporting is verified from Stripe.

Yellow:

- Code and tables are ready, but production env vars, first payment proof, or net/refund reporting are missing.

Red:

- Checkout cannot start.
- Webhook signature verification fails for real Stripe events.
- A customer pays in Stripe but the app does not grant access.
- Revenue numbers are guessed instead of tied to Stripe and the app database.

## Smallest Next Action

Add the five missing Stripe env vars to Vercel Production, redeploy, then rerun:

```bash
cd alphacamper-site
npm run smoke:billing -- --allow-yellow
```
