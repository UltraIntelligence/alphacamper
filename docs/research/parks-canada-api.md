# Parks Canada Reservation System — API Research

**Date:** 2026-03-21
**Domain:** `reservation.pc.gc.ca`
**Status:** Research complete — Parks Canada uses the same Camis/GoingToCamp platform as BC Parks and Ontario Parks.

---

## 1. Platform Identification

Parks Canada uses **Camis Inc.** — the same reservation platform that powers BC Parks (`camping.bcparks.ca`) and Ontario Parks (`reservations.ontarioparks.ca`).

- Camis was awarded the Parks Canada contract after the US eDirect contract was terminated before delivery.
- The current system launched for the 2023 season (two months late) as an upgraded version of Camis software.
- Camis has provided reservation and park management solutions for government-operated parks for 45+ years.
- The `reservation.pc.gc.ca` domain is listed in camply's GoingToCamp provider as **Recreation Area ID 14**.

**Key implication:** Our existing Alphacamper worker already speaks this API. Adding Parks Canada support is primarily a configuration change (new domain) plus WAF cookie management.

## 2. Azure WAF Protection

**Confirmed: reservation.pc.gc.ca is behind Azure WAF with CAPTCHA challenge.**

Evidence from a direct `curl` request:

```
HTTP/2 403
x-azure-ref: 20260320T182947Z-...
x-cache: CONFIG_NOCACHE
```

The response body is an Azure WAF CAPTCHA page (title: "Azure WAF"), identical in structure to BC Parks and Ontario Parks. The WAF uses:

- JavaScript-based challenge (primary)
- CAPTCHA fallback (via `/.azwaf/captcha/` endpoints)
- Azure Front Door CDN (`x-azure-ref` header)

**This means Playwright-based cookie harvesting is required**, same as our existing BC/Ontario Parks approach. We will need to add `reservation.pc.gc.ca` to the worker's Playwright session manager with its own cookie TTL (likely 20-25 minutes, same ballpark as the other Camis sites).

## 3. API Endpoints (Same as BC/Ontario Parks)

Since Parks Canada runs the same Camis platform, all endpoints follow the identical pattern. Base URL: `https://reservation.pc.gc.ca/api/...`

### Core Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cart` | GET | Get cart session (cartUid, createTransactionUid) |
| `/api/resourceLocation` | GET | List all campgrounds (resourceLocationId, rootMapId, names) |
| `/api/availability/map` | GET | Check availability for a mapId (main polling endpoint) |
| `/api/resource/details` | GET | Individual site details (param: resourceId) |
| `/api/maps` | GET | Camp/map details |
| `/api/equipment` | GET | Equipment categories |
| `/api/resourcecategory` | GET | Resource categories |
| `/api/availability/resourcestatus` | GET | Resource status list |
| `/api/availability/resourcedailyavailability` | GET | Daily availability detail |
| `/api/attribute/filterable` | GET | Filterable attributes |

### Headers Required

```
Accept: application/json, text/plain, */*
Content-Type: application/json
app-language: en-CA
app-version: 5.106.226       (may need updating — check periodically)
Cookie: <WAF session cookies>
User-Agent: <Chrome user-agent>
```

### Availability Map Query Parameters

Same as BC/Ontario Parks (see `alphacamper-worker/API_CONTRACTS.md` for full spec):

```
mapId, bookingCategoryId, equipmentCategoryId, subEquipmentCategoryId,
cartUid, cartTransactionUid, bookingUid, startDate, endDate,
getDailyAvailability, isReserving, filterData, numEquipment, seed, ...
```

### Response Format

Identical to BC/Ontario Parks:

- **Root map level:** `mapLinkAvailabilities` (sub-map IDs with per-night codes)
- **Sub-map level:** `resourceAvailabilities` (site IDs with per-night availability)
- **Availability codes:** `0` = available, `1` = reserved, `4` = filtered, `6` = closed

Our existing recursive `checkCampground()` in `poller.ts` will work unmodified.

## 4. Campground IDs

Parks Canada uses the same large negative 32-bit integer IDs as BC/Ontario Parks. IDs can be discovered via:

1. **API:** `GET /api/resourceLocation` returns all campgrounds with `resourceLocationId` and `rootMapId`
2. **URL scraping:** Booking URLs contain `resourceLocationId` and `mapId` parameters

### Known Campground IDs (from indexed URLs)

| Park | Campground | resourceLocationId | mapId |
|------|-----------|-------------------|-------|
| Banff | Two Jack Lakeside | -2147483643 | -2147483606 |
| Banff | Two Jack Main | -2147483645 | -2147483602 |
| Banff | Lake Louise | -2147483642 | -2147483634 |
| Jasper | Wapiti | -2147483593 | -2147483455 |
| (Backcountry example) | Unknown | -2147483638 | -2147483589 |

**Full ID discovery:** Once we have WAF cookies, a single call to `GET https://reservation.pc.gc.ca/api/resourceLocation` will return the complete campground list with all IDs. This is exactly how our `id-resolver.ts` already works.

### Store/Department Structure

The store listing URL is: `https://reservation.pc.gc.ca/store/all?departmentId=-32761&locale=en-CA`

This returns all bookable products across Parks Canada, including:
- Campsites (frontcountry and backcountry)
- Group campsites
- Accommodations (oTENTik, cabins, etc.)
- Day use shuttles (Lake Louise, Moraine Lake)
- Guided events, fishing, trail permits (West Coast Trail, Chilkoot Trail)

## 5. Scale — How Many Campgrounds?

- **40 Parks Canada destinations** offer reservations through the system
- **37 national parks + 11 national park reserves** exist in total (48 protected areas)
- Not all parks have reservable campgrounds; some are remote/backcountry only
- Estimated **80-120 individual campgrounds** across the system (frontcountry + backcountry zones)
- The exact count will be confirmed by the `/api/resourceLocation` response

## 6. Most Popular Campgrounds (Priority for Launch)

These sell out within minutes of opening and represent the highest-demand targets:

### Tier 1 — Sell out instantly (add first)

| Park | Campground | Province | Notes |
|------|-----------|----------|-------|
| Banff | Tunnel Mountain Village I/II/III | AB | Closest to Banff townsite, 1,000+ sites combined |
| Banff | Two Jack Lakeside | AB | Waterfront, highly scenic |
| Banff | Two Jack Main | AB | Adjacent to lakeside |
| Banff | Lake Louise | AB | Iconic location |
| Banff | Johnston Canyon | AB | Popular trailhead |
| Jasper | Whistlers | AB | Largest in Jasper, 781 sites, full hookups |
| Jasper | Wapiti | AB | 362 summer sites, year-round |
| Pacific Rim | Green Point | BC | Only campground in Long Beach unit, 100% reservable |

### Tier 2 — High demand

| Park | Campground | Province | Notes |
|------|-----------|----------|-------|
| Yoho | Kicking Horse | BC | Near Lake O'Hara |
| Kootenay | Redstreak | BC | Full-service |
| Bruce Peninsula | Cyprus Lake | ON | Near the Grotto |
| Fundy | Headquarters | NB | Main campground |
| PEI National Park | Cavendish | PE | Beach camping |
| Kejimkujik | Jeremy's Bay | NS | Popular lakeside |
| Riding Mountain | Wasagaming | MB | Townsite area |
| Waterton Lakes | Townsite | AB | Mountain setting |

### 2026 Reservation Launch Dates (for reference)

Parks Canada uses a rolling launch — reservations open on different dates per park:

- **Pacific Rim (Green Point):** Jan 16, 2026 at 8 AM PT
- **Jasper (Whistlers, Wapiti):** Jan 21, 2026 at 8 AM MT
- **Banff:** Jan 23, 2026 at 8 AM MT
- **Riding Mountain:** Jan 30, 2026

Peak demand is July-August weekends and long weekends.

## 7. Open Data & Public Directory

- **Parks Canada Accommodation dataset** on open.canada.ca (weekly updates, GeoJSON/CSV/SHP formats)
- No official public API documentation from Camis or Parks Canada
- The API is undocumented/internal — same situation as BC/Ontario Parks

## 8. Open-Source Scrapers (Prior Art)

| Project | URL | Notes |
|---------|-----|-------|
| **camply** | [github.com/juftin/camply](https://github.com/juftin/camply) | Python, most comprehensive. Has GoingToCamp provider supporting Parks Canada (rec area ID 14). Supports notifications. |
| **parks-scraper** | [github.com/hazzelnut/parks-scraper](https://github.com/hazzelnut/parks-scraper) | Python, scrapes parks.canada.ca info pages (not reservation API). WIP. |
| **ParksReservation_WebScraper** | [github.com/abdqeb/ParksReservation_WebScraper](https://github.com/abdqeb/ParksReservation_WebScraper) | JavaScript, bare-bones availability checker. GPL-3.0. |
| **gocamp** | [github.com/peckjon/gocamp](https://github.com/peckjon/gocamp) | Python, unofficial GoingToCamp API wrapper (targets Washington but same API). Documents endpoint patterns. |

**camply** is the most mature reference. Its GoingToCamp provider at `camply/providers/going_to_camp/` implements the full flow and lists Parks Canada as recreation area ID 14 with domain `reservation.pc.gc.ca`.

## 9. Implementation Plan for Alphacamper

### What needs to change

Since Parks Canada uses the same Camis API as BC/Ontario Parks, the implementation is straightforward:

1. **`config.ts`** — Add `parks_canada: "reservation.pc.gc.ca"` to `DOMAINS` and a cookie TTL entry
2. **Playwright session manager** — Add `reservation.pc.gc.ca` to WAF cookie harvesting targets
3. **`id-resolver.ts`** — No changes needed (already generic per-domain)
4. **`poller.ts`** — No changes needed (already generic per-domain)
5. **Extension `platforms.js`** — Add Parks Canada platform with booking window info
6. **Site `lib/parks.ts`** — Add Parks Canada park data

### What to watch for

- **Cookie TTL:** Needs testing — likely 20-25 minutes like the other Camis sites
- **`app-version` header:** Parks Canada may run a different Camis version than BC/Ontario Parks. Verify by inspecting network requests.
- **Rate limiting:** Separate rate limit budget from BC/Ontario Parks (different domain)
- **Booking categories:** `bookingCategoryId=0` for frontcountry campsites, `7` for backcountry, `9` for day use. May differ slightly.
- **Equipment categories:** Likely identical (`-32768` for standard camping equipment)

### Estimated effort

- **Backend (worker):** 1-2 hours — config + cookie harvesting for new domain
- **Frontend (site + extension):** 2-3 hours — park data, platform registry
- **Testing:** 2-3 hours — verify API responses, cookie TTL, availability parsing
- **Total:** ~1 day of work

---

## Sources

- [CBC: Parks Canada reservation system, from the same makers](https://www.cbc.ca/news/canada/calgary/parks-canada-reservation-system-camis-update-new-rfp-1.6749833)
- [CBC: Bear with us — Parks Canada updating booking system](https://www.cbc.ca/news/canada/new-parks-canada-booking-system-1.6740273)
- [Camis Inc.](https://www.camis.com/)
- [camply - campsite finder (GitHub)](https://github.com/juftin/camply)
- [camply providers documentation](https://juftin.com/camply/providers/)
- [gocamp - GoingToCamp API wrapper (GitHub)](https://github.com/peckjon/gocamp)
- [Parks Canada 2026 Reservations: Rolling Launch Dates](https://www.ecoflow.com/ca/blog/parks-canada-reservations)
- [Parks Canada Reservations](https://reservation.pc.gc.ca/)
- [Parks Canada — Camping and Accommodations](https://parks.canada.ca/voyage-travel/hebergement-accommodation)
- [Vancouver Trails: 2026 Parks Canada Reservation Dates](https://www.vancouvertrails.com/blog/2026-parks-canada-camping-reservations-dates/)
