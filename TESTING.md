# Alphacamper Testing Guide

This repo has 3 separate apps, so "green" means each app's own test suite passes.

## Commands

Run the full automated suites:

```bash
cd /Users/ryan/Code/Alphacamper/alphacamper-site && npm test
cd /Users/ryan/Code/Alphacamper/alphacamper-worker && npm test
cd /Users/ryan/Code/Alphacamper/alphacamper-extension && npm test
```

Run the small customer smoke check:

```bash
cd /Users/ryan/Code/Alphacamper/alphacamper-site && npm run test:smoke
```

## What The Tests Cover

`alphacamper-site`
- Customer watch setup with exact dates only
- Optional exact site number
- Magic-link send and confirm logic
- Customer account registration logic
- Watch create, list, and delete API behavior
- Alerts load and claim API behavior
- Upgrade CTA and shared payment-link fallback behavior

`alphacamper-worker`
- Polling behavior for campground availability
- Alert creation and dedup behavior
- Stale alert cleanup
- Worker status updates
- Email and Sent.dm notification logic

`alphacamper-extension`
- Mission storage
- Mission target creation
- Booking deep-link generation and caching
- Popup open flow for the side panel

## What Green Tests Mean

Green tests mean the product logic in this repo is behaving as expected for the main customer and admin paths we care about.

That is useful, but it is not the same thing as proving production works.

## What Green Tests Do Not Guarantee

Green tests do not fully prove:
- Real Supabase auth sessions in production
- Real magic-link email delivery through Resend
- Real Stripe checkout behavior once a payment link is live
- Real Chrome extension behavior across every browser state
- Real campground provider behavior, including WAF blocks, rate limits, or markup changes
- Real cron execution and background job timing in production

## Release Checklist

Before a real release, manually verify:
- A customer can request a magic link and receive it in a real inbox
- A customer can confirm sign-in and land in the dashboard
- A customer can create a watch with exact dates and optional exact site number
- A real alert record appears and can be claimed from the dashboard
- The configured Pro payment link opens correctly
- Extension auth still reconnects the browser extension
- Worker polling still succeeds against at least one live provider

## CI

GitHub Actions runs:
- All 3 app test suites on push and pull request
- A separate smoke check for the highest-value customer path on the site
