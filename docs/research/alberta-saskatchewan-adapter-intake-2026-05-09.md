# Alberta And Saskatchewan Adapter Intake

Date: 2026-05-09

Tracker: https://github.com/UltraIntelligence/alphacamper/issues/12

Goal window: Russell

Status: Yellow

## Control-Tower Read

Alberta and Saskatchewan look technically feasible, but neither is realtime-alertable yet.

Both should stay search-only until the core reliability gates are green:

- Railway worker heartbeat.
- Watch polling.
- Alert creation.
- Notification delivery.

## Verified Evidence

- Alberta official reservations page points campers to `Shop.AlbertaParks.ca`.
- Live Alberta provider directory fetch returned `resultTotal = 109` for contract `ABPP`.
- Live Saskatchewan provider directory fetch returned `resultTotal = 24` for contract `SKPP`.
- `alphacamper-worker/src/aspira.ts` registers both providers as `search_only`.
- `alphacamper-worker/src/config.ts` does not include `alberta_parks` or `saskatchewan_parks` in `SUPPORTED_PLATFORMS`.
- `cd alphacamper-worker && npm test -- aspira.test.ts` passed: 1 file, 6 tests.

## Alberta Read

- Provider/system: Alberta Parks on `shop.albertaparks.ca`.
- Contract: `ABPP`.
- Current proof: Aspira/ReserveAmerica-style directory and calendar parsing exists in repo tests.
- Alert feasibility: likely feasible later, but not wired into worker polling.

Missing pieces:

- Full directory pagination.
- Session/Queue-it-safe fetch layer.
- Watch-to-parkId mapping.
- Worker poller.
- Alert-row creation proof.
- Notification proof.
- Provider health reporting.

## Saskatchewan Read

- Provider/system: Saskatchewan Parks on `parks.saskatchewan.ca`.
- Contract: `SKPP`.
- Current proof: same parser shape handles Saskatchewan fixture rows.
- Alert feasibility: likely feasible after Alberta, but not wired into worker polling.

Missing pieces:

- Shared Aspira fetch/session layer.
- Extra care around the `facilityDetails` to campsite search flow.
- Watch-to-parkId mapping.
- Worker poller.
- Alert-row creation proof.
- Notification proof.
- Provider health reporting.

## Recommendation

Implement the shared Aspira adapter after the reliability gates are green.

Recommended order:

1. Build shared Aspira fetch/session layer.
2. Implement Alberta first because it is the bigger visible Canada gap.
3. Implement Saskatchewan second using the same adapter.
4. Upgrade labels only after watch -> poll -> alert -> notification is proven.

Do not market either province as realtime-alertable yet.
