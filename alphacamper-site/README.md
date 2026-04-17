## Alphacamper Site

This is the customer-facing Next.js app for Alphacamper.

It handles:

- watch setup
- alert viewing
- extension sign-in and handoff
- billing links
- the operator network summary on the dashboard

## Local Setup

Create your local environment file:

```bash
cp .env.local.example .env.local
```

Important variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`
- `ALPHACAMPER_API_URL`
- `ALPHACAMPER_API_ADMIN_KEY`
- `OPERATOR_EMAIL_ALLOWLIST`

`ALPHACAMPER_API_URL` should point at the separate campsite-availability backend. The dashboard uses it for the operator provider-quality panel.

`ALPHACAMPER_API_ADMIN_KEY` is the shared server-to-server key the site uses to queue backend catalog refresh jobs.

`OPERATOR_EMAIL_ALLOWLIST` is a comma-separated list of email addresses allowed to use the refresh controls from the dashboard.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful pages:

- `/` landing page
- `/watch/new` watch setup
- `/dashboard` watches, alerts, and operator network summary

## Checks

```bash
npm run build
npm test
```
