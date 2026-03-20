# BC Parks (Camis) API Contract — Verified 2026-03-20

## Endpoint

```
GET https://camping.bcparks.ca/api/availability/map
```

## Required Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `mapId` | int | Campground's `rootMapId` or sub-loop `mapId` (NOT `resourceLocationId`) |
| `bookingCategoryId` | int | `0` for campsites |
| `equipmentCategoryId` | int | `-32768` (Equipment category) |
| `subEquipmentCategoryId` | int | `-32768` (1 Tent), `-32767` (2 Tents), `-32766` (3 Tents), `-32765` (Van/Camper), `-32764` (Trailer up to 18ft), `-32763` (Trailer/RV up to 32ft), `-32762` (Trailer/RV over 32ft) |
| `cartUid` | UUID | From `GET /api/cart` response |
| `cartTransactionUid` | UUID | From `GET /api/cart` response (`createTransactionUid`) |
| `bookingUid` | UUID | Random UUID (client-generated) |
| `groupHoldUid` | string | Empty string |
| `startDate` | string | `YYYY-MM-DD` format |
| `endDate` | string | `YYYY-MM-DD` format |
| `getDailyAvailability` | bool | `true` for per-night data |
| `isReserving` | bool | `true` |
| `filterData` | string | `[]` (empty array) |
| `boatLength` | int | `0` |
| `boatDraft` | int | `0` |
| `boatWidth` | int | `0` |
| `peopleCapacityCategoryCounts` | string | `[]` (empty array) |
| `numEquipment` | int | `0` |
| `seed` | string | ISO timestamp (cache buster) |

## Required Headers

```
Accept: application/json, text/plain, */*
Content-Type: application/json
app-language: en-CA
app-version: 5.106.226
Cookie: .AspNetCore.Antiforgery.3YREhQdkuHQ=<value>; XSRF-TOKEN=<value>
```

Note: No `X-XSRF-TOKEN` header needed for GET requests. The cookies are sufficient.

## Response Format

### Root map (campground overview)
```json
{
  "mapId": -2147483437,
  "mapAvailabilities": [0, 0, 0],
  "resourceAvailabilities": {},
  "mapLinkAvailabilities": {
    "-2147483436": [0, 0, 0],
    "-2147483435": [0, 0, 0]
  }
}
```

`mapLinkAvailabilities` = sub-maps (camping loops). Values are per-night availability codes.

### Sub-map (individual sites)
```json
{
  "mapId": -2147483436,
  "mapAvailabilities": [0, 0, 0],
  "resourceAvailabilities": {
    "-2147476501": [
      {"availability": 0, "remainingQuota": null},
      {"availability": 1, "remainingQuota": null},
      {"availability": 0, "remainingQuota": null}
    ],
    "-2147476498": [
      {"availability": 0, "remainingQuota": null},
      {"availability": 0, "remainingQuota": null},
      {"availability": 0, "remainingQuota": null}
    ]
  }
}
```

Each key in `resourceAvailabilities` is a site ID. The array has one entry per night (startDate to endDate). The last entry is the departure day.

## Availability Codes

| Code | Meaning | Bookable? |
|------|---------|-----------|
| `0` | Available | YES |
| `1` | Unavailable (reserved) | No |
| `4` | Filtered out (equipment mismatch) | No |
| `6` | Not Operating / Closed | No |

**A site is bookable for the full date range when ALL nights (excluding the last/departure entry) have `availability: 0`.**

## Important: ID Mapping

The IDs in `platforms.js` are WRONG. They use small negative numbers (e.g., `-2504` for Rathtrevor) but the real Camis IDs are large negative 32-bit integers.

To get the correct IDs, call `GET /api/resourceLocation` which returns all campgrounds with:
- `resourceLocationId` — the campground ID (e.g., `-2147483545` for Rathtrevor)
- `rootMapId` — the map ID to use in availability queries (e.g., `-2147483437`)
- `localizedValues[0].shortName` — display name

## Flow for Availability Checking

1. **Get cookies:** Playwright solves WAF on `camping.bcparks.ca`
2. **Get cart:** `GET /api/cart` → extract `cartUid` and `createTransactionUid`
3. **Get campground map IDs:** `GET /api/resourceLocation` → find `rootMapId` for target campground
4. **Get sub-map IDs:** `GET /api/availability/map?mapId={rootMapId}&...` → extract `mapLinkAvailabilities` keys
5. **Get site availability:** `GET /api/availability/map?mapId={subMapId}&...` → check `resourceAvailabilities`
6. **Check each site:** All nights `availability === 0` means bookable

## Ontario Parks

Same API, different domain: `reservations.ontarioparks.ca`. Same endpoint structure and response format (both run Camis platform).
