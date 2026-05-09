# Customer Watch And Notification Smoke Runbook

Last updated: 2026-05-09

Purpose: prove the real customer path after the Railway worker heartbeat is green.

This is the next gate after Production Worker Smoke. Do not use this to call the worker green by itself.

## Current Product Truth

- Customers create watches through `/watch/new`.
- The live flow supports:
  - exact arrival date
  - exact departure date
  - optional exact site number
  - "any site" for the selected campground and dates
- The route `POST /api/watch` requires auth.
- The route rejects searchable/search-only rows when alerts are not live.
- The route writes to `watched_targets`.
- Worker notifications write to `availability_alerts` and set `notified_at` when delivery succeeds.

## Run Only After

Do not run this as a green-path smoke until:

- `cd alphacamper-worker && npm run smoke:production` is green.
- `worker_status` has a recent heartbeat.
- Required worker platforms include:
  - `bc_parks`
  - `ontario_parks`
  - `parks_canada`
  - `gtc_new_brunswick`
  - `recreation_gov`

If the worker smoke is still yellow, stop here and keep this runbook queued.

Current expected result while Railway has no heartbeat: yellow. You can still
prove the customer setup path and the alert/event API surfaces, but you cannot
claim live notifications until the worker writes a recent `worker_status` row.

## Smoke Safety Rules

- Use a dedicated operator/test account, not a real customer account.
- Use a test email or controlled inbox.
- Do not paste Supabase service-role keys, Railway variables, Resend keys, or Sent.dm keys into reports.
- Do not create broad watches across many dates/providers during a smoke.
- Record active watch and alert counts before and after.
- Clean up the smoke watch by soft-deleting it through `DELETE /api/watch`.
- Do not mark the gate green unless both watch creation and notification proof are documented.

## What Green Means

Green means all of these are true:

- A signed-in test customer can create an alertable watch.
- The created watch appears in `/api/watch` and live `watched_targets`.
- The worker sees or updates the watch after heartbeat is green.
- At least one controlled alert path is proven:
  - email notification delivered through Resend, or
  - SMS/WhatsApp/RCS delivered through Sent.dm.
- The resulting `availability_alerts` row has:
  - the correct `watched_target_id`
  - the correct `user_id`
  - real `site_details`
  - `notified_at` set
- The smoke watch is cleaned up or intentionally kept with a clear reason.

Yellow means:

- Watch creation works, but no notification was triggered.
- Or notification delivery was attempted but not proven.
- Or the worker heartbeat is green but the specific provider was not checked.

Red means:

- Auth fails.
- Watch creation fails for an alertable campground.
- Search-only/unsupported rows can create watches.
- Notifications go to the wrong user or wrong contact.
- Alerts are created in a burst beyond the controlled smoke.

## UI Smoke Path

Use this when you want to verify the actual customer experience.

1. Open `https://alphacamper.com/watch/new`.
2. Choose a known alertable campground.
   - Example Canadian choices after current catalog refresh:
     - Bamberton, BC Parks
     - Sugarloaf, New Brunswick Parks
     - a known Ontario Parks row
     - a known Parks Canada row
3. Pick exact arrival and departure dates.
4. Leave site number blank for "any site", or enter one exact site number.
5. Enter the test email.
6. Complete the magic-link sign-in.
7. Confirm the app redirects to the dashboard and shows the watch.
8. Record the watch ID from the dashboard/API or from Supabase.

## API Smoke Path

Use this only with a real Supabase user access token for the test account.

Preferred helper:

```bash
cd alphacamper-site

# Read-only. Safe to run without creating watches, alerts, or events.
npm run smoke:customer-watch -- --allow-yellow

# Controlled write smoke. Use a dedicated test account token only.
# This creates a watch, writes one smoke-tagged funnel event, optionally inserts
# one smoke-tagged alert row without sending any notification, verifies the API
# can see them, then cleans up the simulated alert/event and soft-deletes the watch.
export ALPHACAMPER_ACCESS_TOKEN='paste-test-user-access-token'
npm run smoke:customer-watch -- --apply --simulate-alert --allow-yellow
```

What the helper proves:

- `POST /api/watch` can create an alertable watch for the signed-in test customer.
- `GET /api/watch` can show that watch back to the same customer.
- `POST /api/events` and `GET /api/events` can write/read a smoke-tagged funnel event.
- With `--simulate-alert`, `GET /api/alerts` can show a controlled smoke alert row.
- It does not send Resend, Sent.dm, SMS, WhatsApp, or RCS notifications.

What the helper does not prove while Railway is blocked:

- The worker actually checked the watch.
- A provider returned availability.
- A real notification was delivered.
- A real worker-created `availability_alerts` row was written.

```bash
export ALPHACAMPER_ACCESS_TOKEN='paste-test-user-access-token'

curl -sS https://alphacamper.com/api/watch \
  -H "Authorization: Bearer $ALPHACAMPER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "gtc_new_brunswick",
    "campgroundId": "-2147483638",
    "siteNumber": null,
    "arrivalDate": "2026-07-10",
    "departureDate": "2026-07-12"
  }' | jq
```

The example currently points at Sugarloaf Provincial Park. Re-check `/api/campgrounds?q=Sugarloaf` before running; do not assume IDs are permanent.

Fetch customer watches:

```bash
curl -sS https://alphacamper.com/api/watch \
  -H "Authorization: Bearer $ALPHACAMPER_ACCESS_TOKEN" | jq
```

Clean up the smoke watch:

```bash
export WATCH_ID='paste-created-watch-id'

curl -sS -X DELETE "https://alphacamper.com/api/watch?id=$WATCH_ID" \
  -H "Authorization: Bearer $ALPHACAMPER_ACCESS_TOKEN" | jq
```

## Live Supabase Checks

Before smoke:

```sql
SELECT COUNT(*)::int AS active_watches
FROM public.watched_targets
WHERE active = true;

SELECT COUNT(*)::int AS total_alerts
FROM public.availability_alerts;
```

Find candidate campgrounds:

```sql
SELECT
  id,
  platform,
  name,
  support_status,
  availability_mode,
  confidence
FROM public.campgrounds
WHERE support_status = 'alertable'
ORDER BY platform, name
LIMIT 25;
```

After creating the watch:

```sql
SELECT
  id,
  user_id,
  platform,
  campground_id,
  campground_name,
  site_number,
  arrival_date,
  departure_date,
  active,
  created_at,
  last_checked_at
FROM public.watched_targets
ORDER BY created_at DESC
LIMIT 10;
```

After the worker has had time to run:

```sql
SELECT
  id,
  watched_target_id,
  user_id,
  site_details,
  notified_at,
  claimed,
  created_at
FROM public.availability_alerts
ORDER BY created_at DESC
LIMIT 10;
```

Worker heartbeat:

```sql
SELECT
  id,
  last_cycle_at,
  last_successful_poll_at,
  platforms_healthy,
  cycle_stats
FROM public.worker_status
ORDER BY last_cycle_at DESC
LIMIT 1;
```

## Guardrail Smoke

Run one negative smoke before calling the path green:

- Search for a search-only row such as Manitoba or Nova Scotia.
- Confirm the UI does not let the customer create a misleading live alert.
- If testing through API, `POST /api/watch` should return:

```json
{ "error": "Alerts are not live for this campground yet" }
```

## Report Back

```text
Epic: Customer Watch And Notification Smoke
Status: green / yellow / red

Worker prerequisite:
- production smoke:
- worker_status:

Watch creation:
- test account:
- campground:
- dates:
- exact site or any site:
- watch id:

Notification proof:
- channel:
- availability_alert id:
- notified_at:
- site_details:

Guardrail proof:
- search-only/unsupported campground tested:
- result:

Cleanup:
- watch deleted or intentionally kept:
- active watches before:
- active watches after:
- alerts before:
- alerts after:

Risks:
- ...

Recommended control-tower update:
- ...
```
