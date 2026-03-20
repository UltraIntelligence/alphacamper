# Canadian Campground Availability Poller + Alert Delivery

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add GoingToCamp availability polling (BC Parks, Parks Canada, Ontario Parks, Alberta Parks) to the existing cron-based checker, deliver alerts via Chrome notifications (alarm-based polling from background worker), and auto-open pre-filled booking pages when cancellations are detected.

**Architecture:** A new `GoingToCampClient` module handles all Camis-platform API calls behind a unified `PlatformPoller` interface. The existing `check-availability` route gains a platform dispatcher that routes watches to either the Recreation.gov poller or the new GoingToCamp poller. The extension's background service worker polls the alerts API on a `chrome.alarms` interval and shows native `chrome.notifications` when new alerts arrive. Clicking a notification opens the booking page and triggers autofill — the Campnab-killer differentiator.

**Tech Stack:** Next.js 16 API routes, Supabase (existing), GoingToCamp REST API (`POST /api/maps/mapdatabyid`), Chrome Extension MV3 (`chrome.alarms` + `chrome.notifications`)

**Important notes on GoingToCamp:**
- API endpoint: `POST https://{domain}/api/maps/mapdatabyid`
- Dates use `YY-Mon-DD` format (e.g., `26-Jul-10`)
- Campground IDs are negative integers (e.g., `-2504`)
- Response returns `resourceAvailabilities[]` where each resource has a per-date `availabilities` map. **Date key format is unconfirmed** — our implementation assumes ISO keys (`"2026-07-10T00:00:00Z"`) which matches Recreation.gov. If the real API uses `YY-Mon-DD` keys, the date key construction in `GoingToCampPoller` must be updated. Validate against real API response during first integration test.
- Platforms confirmed to use GoingToCamp with negative-int IDs: **BC Parks** (`camping.bcparks.ca`), **Ontario Parks** (`reservations.ontarioparks.ca`)
- Platforms that use GoingToCamp but have slug-based IDs in `platforms.js`: **Parks Canada** (`reservation.pc.gc.ca`), **Alberta Parks** (`reserve.albertaparks.ca`) — these need ID research/updates before they'll work
- **Manitoba Parks** (`prsp.gov.mb.ca`) does NOT use GoingToCamp — slug IDs, different API. Excluded from this plan.

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `alphacamper-site/lib/platforms/going-to-camp.ts` | GoingToCamp API client — session management, per-date availability checking, response parsing |
| `alphacamper-site/lib/platforms/recreation-gov.ts` | Extract existing Recreation.gov logic from route into reusable module |
| `alphacamper-site/lib/platforms/types.ts` | Shared types: `AvailabilityResult`, `PlatformPoller` interface |
| `alphacamper-site/lib/platforms/index.ts` | Platform dispatcher — routes `platform` string to correct poller |
| `alphacamper-site/__tests__/platforms/going-to-camp.test.ts` | Tests for GoingToCamp client |
| `alphacamper-site/__tests__/platforms/recreation-gov.test.ts` | Tests for extracted Recreation.gov poller |
| `alphacamper-site/__tests__/platforms/dispatcher.test.ts` | Tests for platform dispatch logic |

### Modified Files

| File | Changes |
|------|---------|
| `alphacamper-site/app/api/check-availability/route.ts` | Replace inline Recreation.gov logic with platform dispatcher; add GET handler for Vercel cron |
| `alphacamper-extension/lib/missions.js` | Expand `generateDeepLink` to handle all Canadian platforms |
| `alphacamper-extension/background.js` | Add alarm-based alert polling + `chrome.notifications` + notification click → open + autofill |
| `alphacamper-extension/sidepanel/sidepanel.js` | Upgrade "Book Now" to open page + trigger autofill |
| `alphacamper-extension/sidepanel/sidepanel.html` | Add Ontario Parks to all platform dropdowns (watch form, target form, planner) |
| `alphacamper-site/components/HowItWorks.tsx` | Update step 3 timing to "10-15 minutes before" |

---

## Task 1: Define shared platform types

**Files:**
- Create: `alphacamper-site/lib/platforms/types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// alphacamper-site/lib/platforms/types.ts

/** A single available site found by a poller */
export interface AvailableSite {
  siteId: string;
  siteName: string;
}

/** Result of checking one watch against a platform API */
export interface AvailabilityResult {
  watchId: string;
  userId: string;
  sites: AvailableSite[];
}

/** A watched target row from the database */
export interface WatchedTarget {
  id: string;
  user_id: string;
  platform: string;
  campground_id: string;
  campground_name: string;
  site_number: string | null;
  arrival_date: string;
  departure_date: string;
  active: boolean;
}

/** Every platform poller implements this interface */
export interface PlatformPoller {
  /**
   * Check availability for a group of watches that share the same campground.
   * Returns alerts for any watches where sites are available for the full date range.
   * @param watches — All watches for one campground (same platform + campground_id)
   * @param signal — AbortSignal for timeout
   */
  checkCampground(
    watches: WatchedTarget[],
    signal?: AbortSignal,
  ): Promise<AvailabilityResult[]>;
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-site && npx tsc --noEmit lib/platforms/types.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
cd /Users/ryan/Code/Alphacamper
git add alphacamper-site/lib/platforms/types.ts
git commit -m "feat: add shared platform poller types"
```

---

## Task 2: Extract Recreation.gov poller into module

**Files:**
- Create: `alphacamper-site/lib/platforms/recreation-gov.ts`
- Create: `alphacamper-site/__tests__/platforms/recreation-gov.test.ts`

- [ ] **Step 1: Install vitest**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-site && npm install -D vitest`

Create `alphacamper-site/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 2: Write the failing test**

Create `alphacamper-site/__tests__/platforms/recreation-gov.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RecreationGovPoller } from "@/lib/platforms/recreation-gov";
import type { WatchedTarget } from "@/lib/platforms/types";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const makeWatch = (overrides: Partial<WatchedTarget> = {}): WatchedTarget => ({
  id: "w1",
  user_id: "u1",
  platform: "recreation_gov",
  campground_id: "232447",
  campground_name: "Upper Pines",
  site_number: null,
  arrival_date: "2026-07-10",
  departure_date: "2026-07-12",
  active: true,
  ...overrides,
});

describe("RecreationGovPoller", () => {
  const poller = new RecreationGovPoller();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns available sites when all dates are Available", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        campsites: {
          "site-1": {
            site: "A1",
            availabilities: {
              "2026-07-10T00:00:00Z": "Available",
              "2026-07-11T00:00:00Z": "Available",
            },
          },
          "site-2": {
            site: "A2",
            availabilities: {
              "2026-07-10T00:00:00Z": "Available",
              "2026-07-11T00:00:00Z": "Reserved",
            },
          },
        },
      }),
    });

    const results = await poller.checkCampground([makeWatch()]);
    expect(results).toHaveLength(1);
    expect(results[0].sites).toEqual([{ siteId: "site-1", siteName: "A1" }]);
  });

  it("returns empty when no sites are fully available", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        campsites: {
          "site-1": {
            site: "A1",
            availabilities: {
              "2026-07-10T00:00:00Z": "Reserved",
              "2026-07-11T00:00:00Z": "Available",
            },
          },
        },
      }),
    });

    const results = await poller.checkCampground([makeWatch()]);
    expect(results).toHaveLength(0);
  });

  it("filters by site_number when specified", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        campsites: {
          "site-1": {
            site: "A1",
            availabilities: {
              "2026-07-10T00:00:00Z": "Available",
              "2026-07-11T00:00:00Z": "Available",
            },
          },
          "site-2": {
            site: "B5",
            availabilities: {
              "2026-07-10T00:00:00Z": "Available",
              "2026-07-11T00:00:00Z": "Available",
            },
          },
        },
      }),
    });

    const results = await poller.checkCampground([
      makeWatch({ site_number: "B5" }),
    ]);
    expect(results).toHaveLength(1);
    expect(results[0].sites).toEqual([{ siteId: "site-2", siteName: "B5" }]);
  });

  it("returns empty results on fetch failure", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const results = await poller.checkCampground([makeWatch()]);
    expect(results).toHaveLength(0);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-site && npx vitest run __tests__/platforms/recreation-gov.test.ts`
Expected: FAIL — `Cannot find module '@/lib/platforms/recreation-gov'`

- [ ] **Step 4: Implement RecreationGovPoller**

Extracted from the existing logic in `app/api/check-availability/route.ts`.

Create `alphacamper-site/lib/platforms/recreation-gov.ts`:

```typescript
import type {
  PlatformPoller,
  WatchedTarget,
  AvailabilityResult,
  AvailableSite,
} from "./types";

const REC_GOV_BASE =
  "https://www.recreation.gov/api/camps/availability/campground";

export class RecreationGovPoller implements PlatformPoller {
  async checkCampground(
    watches: WatchedTarget[],
    signal?: AbortSignal,
  ): Promise<AvailabilityResult[]> {
    const campgroundId = watches[0].campground_id;

    // Use earliest arrival date to determine which month to fetch
    const earliestArrival = watches.reduce(
      (earliest, w) =>
        w.arrival_date < earliest ? w.arrival_date : earliest,
      watches[0].arrival_date,
    );
    const startDate = new Date(earliestArrival);
    const monthStart = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      1,
    );
    const monthStr = monthStart.toISOString().split("T")[0] + "T00:00:00.000Z";

    let res: Response;
    try {
      res = await fetch(
        `${REC_GOV_BASE}/${campgroundId}/month?start_date=${monthStr}`,
        {
          headers: {
            "User-Agent": "Alphacamper/0.2.0",
            Accept: "application/json",
          },
          signal,
        },
      );
    } catch {
      return [];
    }

    if (!res.ok) return [];

    const data = await res.json();
    const campsites: Record<
      string,
      { site: string; availabilities: Record<string, string> }
    > = data?.campsites || {};

    const results: AvailabilityResult[] = [];

    for (const watch of watches) {
      const arrival = new Date(watch.arrival_date);
      const departure = new Date(watch.departure_date);
      const available: AvailableSite[] = [];

      for (const [siteId, siteData] of Object.entries(campsites)) {
        if (watch.site_number && siteData.site !== watch.site_number) continue;

        let allAvailable = true;
        const d = new Date(arrival);
        while (d < departure) {
          const dateKey = d.toISOString().split("T")[0] + "T00:00:00Z";
          if (siteData.availabilities?.[dateKey] !== "Available") {
            allAvailable = false;
            break;
          }
          d.setDate(d.getDate() + 1);
        }

        if (allAvailable) {
          available.push({ siteId, siteName: siteData.site || siteId });
        }
      }

      if (available.length > 0) {
        results.push({
          watchId: watch.id,
          userId: watch.user_id,
          sites: available,
        });
      }
    }

    return results;
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-site && npx vitest run __tests__/platforms/recreation-gov.test.ts`
Expected: 4 tests PASS

- [ ] **Step 6: Commit**

```bash
cd /Users/ryan/Code/Alphacamper
git add alphacamper-site/lib/platforms/recreation-gov.ts alphacamper-site/__tests__/platforms/recreation-gov.test.ts alphacamper-site/vitest.config.ts alphacamper-site/package.json alphacamper-site/package-lock.json
git commit -m "feat: extract Recreation.gov poller into reusable module with tests"
```

---

## Task 3: Build GoingToCamp client

**Files:**
- Create: `alphacamper-site/lib/platforms/going-to-camp.ts`
- Create: `alphacamper-site/__tests__/platforms/going-to-camp.test.ts`

**Context:** The GoingToCamp `POST /api/maps/mapdatabyid` endpoint returns `resourceAvailabilities[]` where each resource has a per-date `availabilities` map — similar to Recreation.gov. Each date key maps to a status string. We must check every night in the watch's date range to confirm full availability. Date format is `YY-Mon-DD`. IDs are negative integers. Use UTC date methods to avoid timezone-offset bugs when formatting dates.

- [ ] **Step 1: Write the failing test**

Create `alphacamper-site/__tests__/platforms/going-to-camp.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GoingToCampPoller,
  formatGtcDate,
  GOING_TO_CAMP_DOMAINS,
} from "@/lib/platforms/going-to-camp";
import type { WatchedTarget } from "@/lib/platforms/types";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const makeWatch = (overrides: Partial<WatchedTarget> = {}): WatchedTarget => ({
  id: "w1",
  user_id: "u1",
  platform: "bc_parks",
  campground_id: "-2504",
  campground_name: "Rathtrevor Beach",
  site_number: null,
  arrival_date: "2026-07-10",
  departure_date: "2026-07-12",
  active: true,
  ...overrides,
});

describe("formatGtcDate", () => {
  it("formats date to YY-Mon-DD using UTC to avoid timezone issues", () => {
    // These use new Date("YYYY-MM-DD") which parses as UTC midnight
    expect(formatGtcDate(new Date("2026-07-10"))).toBe("26-Jul-10");
    expect(formatGtcDate(new Date("2026-01-05"))).toBe("26-Jan-05");
    expect(formatGtcDate(new Date("2026-12-25"))).toBe("26-Dec-25");
    expect(formatGtcDate(new Date("2026-03-01"))).toBe("26-Mar-01");
  });
});

describe("GOING_TO_CAMP_DOMAINS", () => {
  it("maps platform keys to correct domains", () => {
    expect(GOING_TO_CAMP_DOMAINS.bc_parks).toBe("camping.bcparks.ca");
    expect(GOING_TO_CAMP_DOMAINS.ontario_parks).toBe(
      "reservations.ontarioparks.ca",
    );
  });

  it("does not include Manitoba (not a GoingToCamp platform)", () => {
    expect(GOING_TO_CAMP_DOMAINS.manitoba_parks).toBeUndefined();
  });
});

describe("GoingToCampPoller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the correct domain for bc_parks", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ resourceAvailabilities: [] }),
    });

    const poller = new GoingToCampPoller();
    await poller.checkCampground([makeWatch()]);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("camping.bcparks.ca");
    expect(url).toContain("/api/maps/mapdatabyid");
  });

  it("calls the correct domain for ontario_parks", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ resourceAvailabilities: [] }),
    });

    const poller = new GoingToCampPoller();
    await poller.checkCampground([
      makeWatch({ platform: "ontario_parks", campground_id: "-2740399" }),
    ]);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("reservations.ontarioparks.ca");
  });

  it("sends correct request body with negative IDs and GTC date format", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ resourceAvailabilities: [] }),
    });

    const poller = new GoingToCampPoller();
    await poller.checkCampground([makeWatch()]);

    const opts = mockFetch.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(opts.body as string);
    expect(body.mapId).toBe(-2504);
    expect(body.startDate).toBe("26-Jul-10");
    expect(body.endDate).toBe("26-Jul-12");
    expect(body.partySize).toBe(1);
  });

  it("returns available sites when all nights are AVAILABLE", async () => {
    // Resource has per-date availability — both nights available
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        resourceAvailabilities: [
          {
            resourceId: -100,
            site: { name: "Site A1", resource_id: -100 },
            availabilities: {
              "2026-07-10T00:00:00Z": "AVAILABLE",
              "2026-07-11T00:00:00Z": "AVAILABLE",
            },
          },
          {
            resourceId: -101,
            site: { name: "Site A2", resource_id: -101 },
            availabilities: {
              "2026-07-10T00:00:00Z": "AVAILABLE",
              "2026-07-11T00:00:00Z": "RESERVED",
            },
          },
        ],
      }),
    });

    const poller = new GoingToCampPoller();
    const results = await poller.checkCampground([makeWatch()]);

    expect(results).toHaveLength(1);
    expect(results[0].sites).toEqual([
      { siteId: "-100", siteName: "Site A1" },
    ]);
  });

  it("returns empty when no sites have all nights available", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        resourceAvailabilities: [
          {
            resourceId: -100,
            site: { name: "Site A1", resource_id: -100 },
            availabilities: {
              "2026-07-10T00:00:00Z": "RESERVED",
              "2026-07-11T00:00:00Z": "AVAILABLE",
            },
          },
        ],
      }),
    });

    const poller = new GoingToCampPoller();
    const results = await poller.checkCampground([makeWatch()]);
    expect(results).toHaveLength(0);
  });

  it("filters by site_number when specified", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        resourceAvailabilities: [
          {
            resourceId: -100,
            site: { name: "Site A1", resource_id: -100 },
            availabilities: {
              "2026-07-10T00:00:00Z": "AVAILABLE",
              "2026-07-11T00:00:00Z": "AVAILABLE",
            },
          },
          {
            resourceId: -101,
            site: { name: "Site B5", resource_id: -101 },
            availabilities: {
              "2026-07-10T00:00:00Z": "AVAILABLE",
              "2026-07-11T00:00:00Z": "AVAILABLE",
            },
          },
        ],
      }),
    });

    const poller = new GoingToCampPoller();
    const results = await poller.checkCampground([
      makeWatch({ site_number: "Site B5" }),
    ]);

    expect(results).toHaveLength(1);
    expect(results[0].sites).toEqual([
      { siteId: "-101", siteName: "Site B5" },
    ]);
  });

  it("returns empty on fetch failure", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const poller = new GoingToCampPoller();
    const results = await poller.checkCampground([makeWatch()]);
    expect(results).toHaveLength(0);
  });

  it("returns empty on network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const poller = new GoingToCampPoller();
    const results = await poller.checkCampground([makeWatch()]);
    expect(results).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-site && npx vitest run __tests__/platforms/going-to-camp.test.ts`
Expected: FAIL — `Cannot find module '@/lib/platforms/going-to-camp'`

- [ ] **Step 3: Implement GoingToCampPoller**

Create `alphacamper-site/lib/platforms/going-to-camp.ts`:

```typescript
import type {
  PlatformPoller,
  WatchedTarget,
  AvailabilityResult,
  AvailableSite,
} from "./types";

/**
 * Maps Alphacamper platform keys to GoingToCamp/Camis API domains.
 * Only includes platforms confirmed to use GoingToCamp with negative-int IDs.
 * Parks Canada and Alberta Parks use GoingToCamp but their IDs in platforms.js
 * are currently slug-based — they need ID migration before being added here.
 */
export const GOING_TO_CAMP_DOMAINS: Record<string, string> = {
  bc_parks: "camping.bcparks.ca",
  ontario_parks: "reservations.ontarioparks.ca",
  // TODO: Add after migrating platforms.js IDs to negative ints:
  // parks_canada: "reservation.pc.gc.ca",
  // alberta_parks: "reserve.albertaparks.ca",
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Format a Date to GoingToCamp's YY-Mon-DD format (e.g., "26-Jul-10").
 * Uses UTC methods because date strings like "2026-07-10" parse as UTC midnight.
 */
export function formatGtcDate(date: Date): string {
  const yy = String(date.getUTCFullYear()).slice(2);
  const mon = MONTHS[date.getUTCMonth()];
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mon}-${dd}`;
}

interface GtcResource {
  resourceId: number;
  availabilities?: Record<string, string>; // date → "AVAILABLE" | "RESERVED" | "CLOSED" | "UNKNOWN"
  site?: { name?: string; resource_id?: number };
}

interface GtcResponse {
  resourceAvailabilities?: GtcResource[];
}

export class GoingToCampPoller implements PlatformPoller {
  async checkCampground(
    watches: WatchedTarget[],
    signal?: AbortSignal,
  ): Promise<AvailabilityResult[]> {
    const platform = watches[0].platform;
    const domain = GOING_TO_CAMP_DOMAINS[platform];
    if (!domain) return [];

    const campgroundId = watches[0].campground_id;

    // Find the full date range across all watches in this group
    const allArrivals = watches.map((w) => w.arrival_date);
    const allDepartures = watches.map((w) => w.departure_date);
    const earliest = allArrivals.reduce((a, b) => (a < b ? a : b));
    const latest = allDepartures.reduce((a, b) => (a > b ? a : b));

    const url = `https://${domain}/api/maps/mapdatabyid`;

    let data: GtcResponse;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": "en-US",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
        body: JSON.stringify({
          mapId: Number(campgroundId),
          startDate: formatGtcDate(new Date(earliest)),
          endDate: formatGtcDate(new Date(latest)),
          partySize: 1,
        }),
        signal,
      });

      if (!res.ok) return [];
      data = await res.json();
    } catch {
      return [];
    }

    const resources = data.resourceAvailabilities || [];

    const results: AvailabilityResult[] = [];

    for (const watch of watches) {
      const arrival = new Date(watch.arrival_date);
      const departure = new Date(watch.departure_date);
      const available: AvailableSite[] = [];

      for (const resource of resources) {
        const siteName = resource.site?.name || String(resource.resourceId);
        const siteId = String(resource.resourceId);

        // Filter by specific site if requested
        if (watch.site_number && siteName !== watch.site_number) continue;

        // Check per-date availability for every night in the range
        const avail = resource.availabilities || {};
        let allAvailable = true;
        const d = new Date(arrival);
        while (d < departure) {
          const dateKey = d.toISOString().split("T")[0] + "T00:00:00Z";
          if (avail[dateKey] !== "AVAILABLE") {
            allAvailable = false;
            break;
          }
          d.setDate(d.getDate() + 1);
        }

        if (allAvailable) {
          available.push({ siteId, siteName });
        }
      }

      if (available.length > 0) {
        results.push({
          watchId: watch.id,
          userId: watch.user_id,
          sites: available,
        });
      }
    }

    return results;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-site && npx vitest run __tests__/platforms/going-to-camp.test.ts`
Expected: All 10 tests PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/ryan/Code/Alphacamper
git add alphacamper-site/lib/platforms/going-to-camp.ts alphacamper-site/__tests__/platforms/going-to-camp.test.ts
git commit -m "feat: add GoingToCamp availability poller for BC Parks and Ontario Parks"
```

---

## Task 4: Build platform dispatcher

**Files:**
- Create: `alphacamper-site/lib/platforms/index.ts`
- Create: `alphacamper-site/__tests__/platforms/dispatcher.test.ts`

- [ ] **Step 1: Write the failing test**

Create `alphacamper-site/__tests__/platforms/dispatcher.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getPoller, SUPPORTED_PLATFORMS } from "@/lib/platforms";

describe("getPoller", () => {
  it("returns RecreationGovPoller for recreation_gov", () => {
    const poller = getPoller("recreation_gov");
    expect(poller).not.toBeNull();
    expect(poller!.constructor.name).toBe("RecreationGovPoller");
  });

  it("returns GoingToCampPoller for bc_parks", () => {
    const poller = getPoller("bc_parks");
    expect(poller).not.toBeNull();
    expect(poller!.constructor.name).toBe("GoingToCampPoller");
  });

  it("returns GoingToCampPoller for ontario_parks", () => {
    const poller = getPoller("ontario_parks");
    expect(poller).not.toBeNull();
    expect(poller!.constructor.name).toBe("GoingToCampPoller");
  });

  it("returns null for unsupported platforms", () => {
    expect(getPoller("sepaq")).toBeNull();
    expect(getPoller("reserve_california")).toBeNull();
    expect(getPoller("manitoba_parks")).toBeNull();
    expect(getPoller("nonexistent")).toBeNull();
  });

  it("returns null for platforms with slug-based IDs (not yet migrated)", () => {
    // Parks Canada and Alberta use GoingToCamp but their IDs in platforms.js
    // are slugs, not negative ints — excluded until ID migration
    expect(getPoller("parks_canada")).toBeNull();
    expect(getPoller("alberta_parks")).toBeNull();
  });

  it("SUPPORTED_PLATFORMS lists all pollable platforms", () => {
    expect(SUPPORTED_PLATFORMS).toContain("recreation_gov");
    expect(SUPPORTED_PLATFORMS).toContain("bc_parks");
    expect(SUPPORTED_PLATFORMS).toContain("ontario_parks");
    expect(SUPPORTED_PLATFORMS).not.toContain("sepaq");
    expect(SUPPORTED_PLATFORMS).not.toContain("manitoba_parks");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-site && npx vitest run __tests__/platforms/dispatcher.test.ts`
Expected: FAIL — `Cannot find module '@/lib/platforms'`

- [ ] **Step 3: Implement the dispatcher**

Create `alphacamper-site/lib/platforms/index.ts`:

```typescript
import type { PlatformPoller } from "./types";
import { RecreationGovPoller } from "./recreation-gov";
import {
  GoingToCampPoller,
  GOING_TO_CAMP_DOMAINS,
} from "./going-to-camp";

export type { PlatformPoller, AvailabilityResult, WatchedTarget, AvailableSite } from "./types";

const recreationGov = new RecreationGovPoller();
const goingToCamp = new GoingToCampPoller();

/** All platforms that have a working availability poller */
export const SUPPORTED_PLATFORMS = [
  "recreation_gov",
  ...Object.keys(GOING_TO_CAMP_DOMAINS),
];

/** Get the poller for a platform, or null if unsupported */
export function getPoller(platform: string): PlatformPoller | null {
  if (platform === "recreation_gov") return recreationGov;
  if (platform in GOING_TO_CAMP_DOMAINS) return goingToCamp;
  return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-site && npx vitest run __tests__/platforms/dispatcher.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/ryan/Code/Alphacamper
git add alphacamper-site/lib/platforms/index.ts alphacamper-site/__tests__/platforms/dispatcher.test.ts
git commit -m "feat: add platform dispatcher routing watches to correct poller"
```

---

## Task 5: Refactor check-availability route to use dispatcher

**Files:**
- Modify: `alphacamper-site/app/api/check-availability/route.ts`

**Context:** The current route has inline Recreation.gov logic and a `if (watch.platform !== "recreation_gov") continue;` guard. Replace with the dispatcher. Also add a `GET` handler since **Vercel cron jobs always send GET requests** (not POST). Keep POST for manual triggers.

- [ ] **Step 1: Read the current file**

Read: `alphacamper-site/app/api/check-availability/route.ts`

- [ ] **Step 2: Rewrite the route to use the platform dispatcher**

Replace the entire contents of `alphacamper-site/app/api/check-availability/route.ts` with:

```typescript
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getPoller, SUPPORTED_PLATFORMS } from "@/lib/platforms";
import type { WatchedTarget, AvailabilityResult } from "@/lib/platforms";

async function checkAvailability(request: Request) {
  try {
    // Auth: Vercel cron sends Authorization: Bearer <CRON_SECRET> automatically
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase();

    // Get all active watches for supported platforms
    const { data: watches, error: watchError } = await supabase
      .from("watched_targets")
      .select("*")
      .eq("active", true)
      .in("platform", SUPPORTED_PLATFORMS)
      .limit(50);

    if (watchError || !watches) {
      return NextResponse.json(
        { error: "Failed to fetch watches" },
        { status: 500 },
      );
    }

    // Group by platform + campground_id
    const groups = new Map<string, WatchedTarget[]>();
    for (const watch of watches as WatchedTarget[]) {
      const key = `${watch.platform}:${watch.campground_id}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(watch);
    }

    const allAlerts: AvailabilityResult[] = [];
    let requestCount = 0;

    for (const [, group] of groups) {
      if (requestCount >= 30) break;

      const poller = getPoller(group[0].platform);
      if (!poller) continue;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);

      try {
        const results = await poller.checkCampground(group, controller.signal);
        allAlerts.push(...results);
        requestCount++;
      } catch {
        // Skip failed campground, continue with others
      } finally {
        clearTimeout(timeout);
      }

      // Rate limit delay between campground requests
      await new Promise((r) => setTimeout(r, 200));
    }

    // Insert alerts
    for (const alert of allAlerts) {
      await supabase.from("availability_alerts").insert({
        watched_target_id: alert.watchId,
        user_id: alert.userId,
        site_details: { sites: alert.sites },
      });
    }

    return NextResponse.json({
      checked: requestCount,
      alertsCreated: allAlerts.length,
      totalWatches: watches.length,
    });
  } catch (error) {
    console.error("[check-availability] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

// GET — Called by Vercel cron (cron jobs always use GET)
export async function GET(request: Request) {
  return checkAvailability(request);
}

// POST — Called by manual triggers (curl, Postman, etc.)
export async function POST(request: Request) {
  return checkAvailability(request);
}
```

- [ ] **Step 3: Run all platform tests to make sure nothing broke**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-site && npx vitest run __tests__/platforms/`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
cd /Users/ryan/Code/Alphacamper
git add alphacamper-site/app/api/check-availability/route.ts
git commit -m "refactor: use platform dispatcher in check-availability route

Replaces inline Recreation.gov logic with dispatcher that routes to
RecreationGovPoller or GoingToCampPoller based on platform. Now supports
BC Parks and Ontario Parks. Adds GET handler for Vercel cron."
```

---

## Task 6: Expand generateDeepLink for Canadian platforms

**Files:**
- Modify: `alphacamper-extension/lib/missions.js`

**Context:** Currently `generateDeepLink` only handles `recreation_gov` and `bc_parks`. The notification click and "Book Now" button need deep links for all platforms. The `PLATFORMS` object (from `platforms.js`, loaded globally in sidepanel and background) has `deepLinkTemplate` for each platform with `{campgroundId}`, `{locationId}`, or `{parkSlug}/{campgroundSlug}` placeholders.

- [ ] **Step 1: Read the current generateDeepLink**

Read: `alphacamper-extension/lib/missions.js:99-110`

- [ ] **Step 2: Replace generateDeepLink with a universal version**

Replace lines 99-109 in `alphacamper-extension/lib/missions.js`:

```javascript
  generateDeepLink(platform, campgroundId) {
    const p = PLATFORMS[platform];
    if (!p || !p.deepLinkTemplate) return '';
    return p.deepLinkTemplate
      .replace('{campgroundId}', campgroundId)
      .replace('{locationId}', campgroundId)
      .replace('{parkSlug}', campgroundId.split('/')[0] || campgroundId)
      .replace('{campgroundSlug}', campgroundId.split('/')[1] || campgroundId);
  }
```

This handles all template patterns:
- `{campgroundId}` — Recreation.gov, Reserve California, ReserveAmerica
- `{locationId}` — BC Parks, Ontario Parks, Alberta Parks
- `{parkSlug}/{campgroundSlug}` — Parks Canada (IDs are like `BrucePeninsula/CyprusLake`)
- `{parkSlug}` — SEPAQ, Manitoba, Saskatchewan

- [ ] **Step 3: Test manually**

Open browser console in sidepanel and verify:
```javascript
Missions.generateDeepLink('recreation_gov', '232447')
// → "https://www.recreation.gov/camping/campgrounds/232447"

Missions.generateDeepLink('bc_parks', '-2504')
// → "https://camping.bcparks.ca/create-booking/results?resourceLocationId=-2504"

Missions.generateDeepLink('ontario_parks', '-2740399')
// → "https://reservations.ontarioparks.ca/create-booking/results?resourceLocationId=-2740399"

Missions.generateDeepLink('parks_canada', 'BrucePeninsula/CyprusLake')
// → "https://reservation.pc.gc.ca/BrucePeninsula/CyprusLake"
```

- [ ] **Step 4: Commit**

```bash
cd /Users/ryan/Code/Alphacamper
git add alphacamper-extension/lib/missions.js
git commit -m "feat: expand generateDeepLink to handle all Canadian platforms"
```

---

## Task 7: Extension — alarm-based alert polling with chrome.notifications

**Files:**
- Modify: `alphacamper-extension/background.js`

**Context:** Web Push API (`PushManager`, `self.addEventListener('push')`) does NOT work in Chrome MV3 extension service workers. Instead, use `chrome.alarms` to poll the alerts API on an interval, and `chrome.notifications.create()` to show native notifications. This fits naturally with the existing alarm pattern in `background.js`. When a notification is clicked, open the booking deep link and trigger autofill.

- [ ] **Step 1: Read the current background.js**

Read: `alphacamper-extension/background.js`

- [ ] **Step 2: Add `importScripts` at the top of background.js**

The background service worker needs access to `PLATFORMS` (defined in `lib/platforms.js`). Since the extension uses plain scripts (not ES modules), add this as the very first line of `alphacamper-extension/background.js`:

```javascript
importScripts('lib/platforms.js');
```

- [ ] **Step 3: Add alert polling alarm and notification click handler**

Add the following to the end of `alphacamper-extension/background.js` (before the `chrome.tabs.onRemoved` listener):

```javascript
// ═══ CANCELLATION ALERT POLLING ═══
// Uses chrome.alarms (works in MV3 service workers, unlike Web Push)

const ALERT_ALARM = 'check-alerts';
// Use same API base as sidepanel (alphacamper.com is production domain)
const DEFAULT_API = 'https://alphacamper.com';

// Start polling when user has registered for watching
chrome.storage.local.get(['watchUserId'], (result) => {
  if (result.watchUserId) {
    chrome.alarms.create(ALERT_ALARM, { periodInMinutes: 1 });
  }
});

// Also start polling when watchUserId is set (e.g., after registration)
chrome.storage.onChanged.addListener((changes) => {
  if (changes.watchUserId?.newValue) {
    chrome.alarms.create(ALERT_ALARM, { periodInMinutes: 1 });
  }
  if (changes.watchUserId && !changes.watchUserId.newValue) {
    chrome.alarms.clear(ALERT_ALARM);
  }
});

// Persist notified alert IDs in chrome.storage.local so they survive
// service worker restarts (MV3 workers are ephemeral — shut down after ~30s idle)
async function getNotifiedIds() {
  const { notifiedAlertIds = [] } = await chrome.storage.local.get('notifiedAlertIds');
  return new Set(notifiedAlertIds);
}

async function addNotifiedId(id) {
  const ids = await getNotifiedIds();
  ids.add(id);
  // Keep only last 200 IDs to avoid unbounded growth
  const arr = [...ids].slice(-200);
  await chrome.storage.local.set({ notifiedAlertIds: arr });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALERT_ALARM) return;

  const { watchUserId: userId } = await chrome.storage.local.get('watchUserId');
  if (!userId) return;

  const notifiedIds = await getNotifiedIds();

  try {
    const res = await fetch(`${DEFAULT_API}/api/alerts?userId=${userId}`);
    if (!res.ok) return;

    const { alerts } = await res.json();
    if (!alerts?.length) return;

    for (const alert of alerts) {
      if (alert.claimed || notifiedIds.has(alert.id)) continue;
      await addNotifiedId(alert.id);

      const siteCount = alert.site_details?.sites?.length || 0;
      const campgroundName = alert.watched_targets?.campground_name || 'A campground';
      const platform = alert.watched_targets?.platform || '';
      const campgroundId = alert.watched_targets?.campground_id || '';

      // Notification ID carries data for the click handler
      const notifId = JSON.stringify({
        alertId: alert.id,
        platform,
        campgroundId,
        watchId: alert.watched_target_id,
      });

      chrome.notifications.create(notifId, {
        type: 'basic',
        iconUrl: 'assets/icon-128.png',
        title: 'Campsite Available!',
        message: `${campgroundName} has ${siteCount} site${siteCount !== 1 ? 's' : ''} open`,
        priority: 2,
        requireInteraction: true,
      });
    }
  } catch (err) {
    console.warn('[alerts] Polling failed:', err);
  }
});

// Handle notification click → open booking page + trigger autofill
chrome.notifications.onClicked.addListener(async (notificationId) => {
  chrome.notifications.clear(notificationId);

  let data;
  try {
    data = JSON.parse(notificationId);
  } catch {
    return; // Not one of our structured notification IDs (e.g., mission alarm)
  }

  if (!data.platform || !data.campgroundId) return;

  // Generate deep link using PLATFORMS config (available via importScripts at top)
  const p = PLATFORMS[data.platform];
  let deepLink = '';
  if (p?.deepLinkTemplate) {
    deepLink = p.deepLinkTemplate
      .replace('{campgroundId}', data.campgroundId)
      .replace('{locationId}', data.campgroundId)
      .replace('{parkSlug}', data.campgroundId.split('/')[0] || data.campgroundId)
      .replace('{campgroundSlug}', data.campgroundId.split('/')[1] || data.campgroundId);
  }

  if (!deepLink) return;

  // Open the booking page
  const tab = await chrome.tabs.create({ url: deepLink, active: true });

  // Wait for page load, then trigger autofill
  chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
    if (tabId === tab.id && info.status === 'complete') {
      chrome.tabs.onUpdated.removeListener(listener);
      // Delay to let SPA frameworks render the form
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, { action: 'fill_forms' });
      }, 2000);
    }
  });

  // Mark alert as claimed
  if (data.alertId) {
    fetch(`${DEFAULT_API}/api/alerts`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: data.alertId }),
    }).catch(() => {});
  }
});
```

- [ ] **Step 4: Test manually**

1. Load extension in `chrome://extensions`
2. Check service worker console — verify `importScripts` didn't throw, `PLATFORMS` is accessible
3. Register email in Watching tab
4. Add a watch for a campground you know has availability
5. Manually trigger `curl -X GET https://alphacamper.com/api/check-availability -H "Authorization: Bearer $CRON_SECRET"`
6. Wait up to 60 seconds for the alarm to fire
7. Verify native Chrome notification appears
8. Click notification → verify booking page opens and forms fill

- [ ] **Step 5: Commit**

```bash
cd /Users/ryan/Code/Alphacamper
git add alphacamper-extension/background.js
git commit -m "feat: add alarm-based alert polling with native Chrome notifications

Uses chrome.alarms (1-min interval) + chrome.notifications instead of
Web Push API (which doesn't work in MV3 service workers). Persists
notified IDs in chrome.storage.local to survive SW restarts.
Clicking a notification opens the booking deep link and triggers autofill."
```

---

## Task 8: Extension — upgrade "Book Now" to open + autofill

**Files:**
- Modify: `alphacamper-extension/sidepanel/sidepanel.js`

**Context:** Currently the "Book Now" button in the Watching alerts view opens a deep link but doesn't trigger autofill. Upgrade it to also send the `fill_forms` message after the page loads — same pattern as the notification click handler.

- [ ] **Step 1: Read the current sidepanel.js to find the Book Now handler**

Read: `alphacamper-extension/sidepanel/sidepanel.js`
Search for "Book Now" or the alert claim/deep link logic.

- [ ] **Step 2: Upgrade Book Now to trigger autofill after opening**

Find the Book Now click handler. It likely does:
```javascript
chrome.tabs.create({ url: deepLink });
```

Replace with:
```javascript
chrome.tabs.create({ url: deepLink, active: true }).then((tab) => {
  chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
    if (tabId === tab.id && info.status === 'complete') {
      chrome.tabs.onUpdated.removeListener(listener);
      // Wait for SPA frameworks to render forms
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, { action: 'fill_forms' });
      }, 2000);
    }
  });
});
```

Make sure the containing function can handle the Promise from `chrome.tabs.create`.

- [ ] **Step 3: Test manually**

1. Create a test watch for a Recreation.gov campground with availability
2. Manually trigger check-availability
3. Verify alert appears in Watching tab
4. Click "Book Now" — should open page AND fill forms automatically

- [ ] **Step 4: Commit**

```bash
cd /Users/ryan/Code/Alphacamper
git add alphacamper-extension/sidepanel/sidepanel.js
git commit -m "feat: auto-fill forms when clicking Book Now on availability alerts"
```

---

## Task 9: Add Ontario Parks to sidepanel platform dropdowns

**Files:**
- Modify: `alphacamper-extension/sidepanel/sidepanel.html`

**Context:** The sidepanel HTML has three platform dropdowns (watch form, mission target form, planner form) that currently only list Recreation.gov and BC Parks. Since the backend now supports Ontario Parks, the UI needs to match. We only add platforms that have working pollers (BC Parks, Ontario Parks) alongside Recreation.gov.

- [ ] **Step 1: Read sidepanel.html to find all platform dropdowns**

Read: `alphacamper-extension/sidepanel/sidepanel.html`
Search for `<select` elements with platform options. There are three:
1. Watch form (`id="w-platform"` around line 209)
2. Mission target form (`id="tf-platform"` around line 80)
3. Planner form (`id="p-platform"` around line 181)

- [ ] **Step 2: Add Ontario Parks option to all three dropdowns**

For each `<select>` that has platform options, add after the BC Parks option:

```html
<option value="ontario_parks">Ontario Parks</option>
```

So each dropdown becomes:
```html
<option value="recreation_gov">Recreation.gov</option>
<option value="bc_parks">BC Parks</option>
<option value="ontario_parks">Ontario Parks</option>
```

- [ ] **Step 3: Verify extension loads with new options**

Load extension in `chrome://extensions`. Open sidepanel. Verify all three dropdowns show the Ontario Parks option.

- [ ] **Step 4: Commit**

```bash
cd /Users/ryan/Code/Alphacamper
git add alphacamper-extension/sidepanel/sidepanel.html
git commit -m "feat: add Ontario Parks to all platform dropdowns in sidepanel"
```

---

## Task 10: Configure Vercel cron job

**Files:**
- Create or modify: `alphacamper-site/vercel.json`

- [ ] **Step 1: Check if vercel.json exists**

Run: `ls /Users/ryan/Code/Alphacamper/alphacamper-site/vercel.json 2>/dev/null || echo "NOT_FOUND"`

- [ ] **Step 2: Create vercel.json with cron config**

Create `alphacamper-site/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/check-availability",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

- [ ] **Step 3: Set CRON_SECRET env var on Vercel**

Generate a secret:
Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Then set it on Vercel:
Run: `vercel env add CRON_SECRET` (paste the value, select all environments)

- [ ] **Step 4: Commit**

```bash
cd /Users/ryan/Code/Alphacamper
git add alphacamper-site/vercel.json
git commit -m "feat: add 15-minute cron job for availability checking"
```

---

## Task 11: Update HowItWorks step 3 with early login guidance

**Files:**
- Modify: `alphacamper-site/components/HowItWorks.tsx`

- [ ] **Step 1: Read the current file**

Read: `alphacamper-site/components/HowItWorks.tsx`

- [ ] **Step 2: Update Step 3 in the steps array**

Find the step with `dot: "3"`. Replace:

```typescript
    dot: "3", when: "Minutes before the window", title: "Everything is set up for you",
    desc: "AI checks you're logged in, opens all your target pages in tabs, loads your saved details, and counts down to the exact second booking opens. You see a dashboard showing every target and its status. All you do is wait.",
```

With:

```typescript
    dot: "3", when: "10–15 minutes before", title: "Everything is set up for you",
    desc: "AI gets you logged in early — an active session looks human to the booking site and won't get dropped when traffic spikes. It opens your target pages, loads your saved details, and counts down to the exact second. You see a dashboard showing every target and its status. All you do is wait.",
```

- [ ] **Step 3: Verify the site builds**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-site && npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
cd /Users/ryan/Code/Alphacamper
git add alphacamper-site/components/HowItWorks.tsx
git commit -m "content: update step 3 with 10-15 min early login guidance"
```

---

## Task 12: Run full test suite and verify

- [ ] **Step 1: Run all tests**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-site && npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Build the site**

Run: `cd /Users/ryan/Code/Alphacamper/alphacamper-site && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Verify extension loads**

Load `alphacamper-extension` in `chrome://extensions` (developer mode). Verify:
- No errors in extension service worker console (click "service worker" link to check)
- `importScripts('lib/platforms.js')` loaded successfully (no errors in SW console)
- Sidepanel opens
- Watching tab renders
- All three platform dropdowns show Recreation.gov, BC Parks, Ontario Parks

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
cd /Users/ryan/Code/Alphacamper
git add -A
git commit -m "fix: address issues found during integration verification"
```
