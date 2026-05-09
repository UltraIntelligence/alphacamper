import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkRecreationGovCampground } from "../src/recreation-gov.js";
import type { WatchedTarget } from "../src/supabase.js";

const makeWatch = (overrides: Partial<WatchedTarget> = {}): WatchedTarget => ({
  id: "watch-1",
  user_id: "user-1",
  platform: "recreation_gov",
  campground_id: "12345",
  campground_name: "Test Campground",
  site_number: null,
  arrival_date: "2026-07-10",
  departure_date: "2026-07-12",
  active: true,
  last_checked_at: null,
  ...overrides,
});

const makeApiResponse = (campsites: Record<string, unknown>) => ({
  ok: true,
  status: 200,
  json: async () => ({ campsites }),
});

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("checkRecreationGovCampground", () => {
  it("returns available sites when all nights are available", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeApiResponse({
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
        }),
      ),
    );

    const outcome = await checkRecreationGovCampground([makeWatch()]);

    expect(outcome.httpStatus).toBe(200);
    expect(outcome.results).toHaveLength(1);
    expect(outcome.results[0].watchId).toBe("watch-1");
    expect(outcome.results[0].sites).toEqual([{ siteId: "site-1", siteName: "A1" }]);
  });

  it("filters by exact site number when one is set", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeApiResponse({
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
        }),
      ),
    );

    const outcome = await checkRecreationGovCampground([makeWatch({ site_number: "B5" })]);

    expect(outcome.results).toHaveLength(1);
    expect(outcome.results[0].sites).toEqual([{ siteId: "site-2", siteName: "B5" }]);
  });

  it("returns the upstream status when Recreation.gov rate limits or fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({}),
      }),
    );

    const outcome = await checkRecreationGovCampground([makeWatch()]);

    expect(outcome.httpStatus).toBe(429);
    expect(outcome.results).toEqual([]);
  });

  it("does not treat malformed watch dates as available", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeApiResponse({
          "site-1": {
            site: "A1",
            availabilities: {
              "2026-07-10T00:00:00Z": "Available",
            },
          },
        }),
      ),
    );

    const outcome = await checkRecreationGovCampground([
      makeWatch({ arrival_date: "not-a-date" }),
    ]);

    expect(outcome.httpStatus).toBe(200);
    expect(outcome.results).toEqual([]);
  });
});
