import { describe, it, expect, vi, beforeEach } from "vitest";
import { RecreationGovPoller } from "@/lib/platforms/recreation-gov";
import type { WatchedTarget } from "@/lib/platforms/types";

const makeWatch = (overrides: Partial<WatchedTarget> = {}): WatchedTarget => ({
  id: "watch-1",
  user_id: "user-1",
  platform: "recreation_gov",
  campground_id: "12345",
  campground_name: "Test Campground",
  site_number: null,
  arrival_date: "2026-07-10T00:00:00Z",
  departure_date: "2026-07-12T00:00:00Z",
  active: true,
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

describe("RecreationGovPoller", () => {
  it("returns available sites when all dates are Available", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
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
      })
    );
    vi.stubGlobal("fetch", mockFetch);

    const poller = new RecreationGovPoller();
    const results = await poller.checkCampground([makeWatch()]);

    expect(results).toHaveLength(1);
    expect(results[0].watchId).toBe("watch-1");
    expect(results[0].sites).toHaveLength(1);
    expect(results[0].sites[0].siteId).toBe("site-1");
    expect(results[0].sites[0].siteName).toBe("A1");
  });

  it("returns empty when no sites are fully available", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      makeApiResponse({
        "site-1": {
          site: "A1",
          availabilities: {
            "2026-07-10T00:00:00Z": "Reserved",
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
      })
    );
    vi.stubGlobal("fetch", mockFetch);

    const poller = new RecreationGovPoller();
    const results = await poller.checkCampground([makeWatch()]);

    expect(results).toHaveLength(0);
  });

  it("filters by site_number when specified", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
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
      })
    );
    vi.stubGlobal("fetch", mockFetch);

    const poller = new RecreationGovPoller();
    const results = await poller.checkCampground([
      makeWatch({ site_number: "B5" }),
    ]);

    expect(results).toHaveLength(1);
    expect(results[0].sites).toHaveLength(1);
    expect(results[0].sites[0].siteName).toBe("B5");
  });

  it("returns empty results on fetch failure", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    const poller = new RecreationGovPoller();
    const results = await poller.checkCampground([makeWatch()]);

    expect(results).toHaveLength(0);
  });
});
