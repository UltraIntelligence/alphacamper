## P1 — Post-Beta

### Extension autofill silent-failure telemetry
When a park (BC Parks, Ontario Parks, Parks Canada) updates their booking form HTML, the extension's field selectors break silently. User clicks submit, gets validation error, blames Alphacamper. Event `autofill_field_not_found` should fire (Task 5 wires this). Add a dashboard per-park health indicator showing last successful autofill and error rate per park. Auto-alert operator via Slack when error rate on any park >10% over 24h.

### Referral refund race condition
When the referral system ships (week 3-4), the 3-referral threshold check has a race: two simultaneous webhook events for the 3rd and 4th paid referral could both fire the refund. Use SQL `UPDATE referrals SET refunded_at = now() WHERE referrer_id = $1 AND refunded_at IS NULL` pattern to make the refund idempotent. Low likelihood at beta scale, high-impact if it happens.
