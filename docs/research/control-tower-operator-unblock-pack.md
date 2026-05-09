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

## Order Of Operations

Do these in this order.

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
