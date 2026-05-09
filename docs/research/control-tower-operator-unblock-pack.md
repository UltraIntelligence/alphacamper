# Control Tower Operator Unblock Pack

Last updated: 2026-05-09

## Current Truth

Alphacamper has crossed the first Canada inventory line:

- Verified provider-inventory campsite IDs: 51,997.
- First target: 50,000.
- Margin: 1,997.

This is not yet a customer reliability claim.

Still yellow:

- Railway worker heartbeat.
- Active watch polling.
- Alert creation.
- Customer notification delivery.
- Stripe production checkout/revenue proof.
- Production catalog sync for Manitoba and Nova Scotia alertable labels.

GitHub blocker trackers:

- Milestone: https://github.com/UltraIntelligence/alphacamper/milestone/1
- Railway reliability: https://github.com/UltraIntelligence/alphacamper/issues/9
- Stripe revenue readiness: https://github.com/UltraIntelligence/alphacamper/issues/10

## Order Of Operations

Do these in this order.

## Copy-Paste Operator Requests

Use these when the blocker is access to Railway, Vercel, or Stripe. Do not send secret values back into this thread. Only confirm that the values exist, point to production, and the smoke command result.

### Railway Request

```text
Please verify the Alphacamper Railway worker production service.

Repo: UltraIntelligence/alphacamper
Service root directory: /alphacamper-worker
Config file path: /alphacamper-worker/railway.json if Railway does not auto-detect it
Healthcheck path: /health
Expected live Supabase project: tbdrmcdrfgunbcevslqf

Please confirm:
- The service is deployed from current main.
- The service has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set for production.
- Email/SMS variables exist if we expect notifications to send.
- Logs do not show worker_status heartbeat write failed.
- The worker writes a recent worker_status heartbeat.

Do not paste any secret values. Just confirm present/missing and paste the smoke result.
```

### Vercel/Stripe Request

```text
Please configure Alphacamper production checkout so the $10k net revenue scoreboard can become measurable.

In Vercel Production, add or verify:
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_SUMMER
- STRIPE_PRICE_YEAR
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

The summer and year prices should be one-time Stripe prices, not recurring subscriptions.

If the live Alphacamper Stripe objects do not exist yet, create:
- Alphacamper Summer Pass 2026: one-time USD $29.00
- Alphacamper Year Pass 2026: one-time USD $49.00
- Webhook endpoint: https://alphacamper.com/api/stripe/webhook

Webhook events:
- Required for current one-time pass checkout: checkout.session.completed
- Optional legacy compatibility if Stripe asks for them: customer.subscription.updated and customer.subscription.deleted

After production is redeployed, do not paste secret values. Just confirm the variables are present and paste the billing smoke result.
```

### 1. Fix Railway Worker Heartbeat

This is the first unblock because alerts cannot be trusted until the worker is alive.

```bash
cd /Users/ryan/Code/Alphacamper/alphacamper-worker
railway login
railway link
railway service link alphacamper-worker

npm run smoke:railway -- --service alphacamper-worker --environment production --allow-blocked

railway redeploy --service alphacamper-worker --yes

npm run smoke:railway -- --service alphacamper-worker --environment production
npm run smoke:production
```

Green proof:

- `worker_status` has a recent heartbeat.
- Worker platforms include BC, Ontario, Parks Canada, New Brunswick, and Recreation.gov.
- No `worker_status heartbeat write failed` log.
- Production smoke is green.

### 2. Prove One Customer Watch And Notification

Only do this after Railway heartbeat is green.

Use:

- `docs/research/customer-watch-notification-smoke-runbook.md`
- `cd alphacamper-site && npm run smoke:customer-watch -- --allow-yellow`

Green proof:

- A controlled test customer can create a watch.
- Railway polls it.
- An alert row is created when availability is found or safely simulated.
- Email/SMS/push delivery is proven for the controlled test.

### 3. Configure Stripe Production Revenue Path

Only call revenue green after the env vars, webhook, and at least one real paid proof exist.

Current access finding:

- Vercel CLI is authenticated and confirms these variables are missing.
- Local Stripe CLI can read live Stripe objects but cannot create live Alphacamper products/prices/webhooks with its restricted key.
- The available Stripe connector points at a different Stripe account and should not be used for Alphacamper.
- A durable live Stripe secret key must come from Stripe key management, not from the local Stripe CLI session.

Required Vercel Production env vars:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_SUMMER`
- `STRIPE_PRICE_YEAR`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

After env vars are added and production is redeployed:

```bash
cd /Users/ryan/Code/Alphacamper/alphacamper-site
npm run smoke:billing -- --allow-yellow
```

Green proof:

- Production Stripe env vars are present.
- Prices are one-time prices.
- A real checkout creates `subscriptions` and `stripe_webhook_events` rows.
- Operator revenue view shows paid passes and gross revenue.
- Net/refund reporting is tied to Stripe before calling the $10k scoreboard fully green.

### 4. Sync Manitoba And Nova Scotia Labels

Only do this after Railway heartbeat is green, because live customer labels should not invite unsupported confidence.

Repo-side proof is ready:

- Manitoba: 5,480 campsite IDs.
- Nova Scotia: 1,700 campsite IDs.
- Combined total after sync: 51,997 provider-inventory IDs.

Run the catalog sync/deploy path only after the worker is alive, then verify live search labels.

Green proof:

- Live catalog labels Manitoba and Nova Scotia as alertable/live-polling.
- Watch creation allows supported Manitoba/Nova Scotia rows.
- Provider health/admin view makes stale or degraded state visible.

## Plain-English Status

Coverage inventory is green.

Reliability is yellow.

Revenue is yellow.

The next true product unlock is Railway heartbeat, because that turns the 51,997-site inventory proof into something customers can actually trust.
