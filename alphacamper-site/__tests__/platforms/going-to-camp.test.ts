import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GoingToCampPoller,
  GOING_TO_CAMP_DOMAINS,
  formatGtcDate,
} from "@/lib/platforms/going-to-camp";
import type { WatchedTarget } from "@/lib/platforms/types";

const makeWatch = (overrides: Partial<WatchedTarget> = {}): WatchedTarget => ({
  id: "watch-1",
  user_id: "user-1",
  platform: "bc_parks",
  campground_id: "-2504",
  campground_name: "Test Campground",
  site_number: null,
  arrival_date: "2026-07-10T00:00:00Z",
  departure_date: "2026-07-12T00:00:00Z",
  active: true,
  ...overrides,
});

const makeApiResponse = (resourceAvailabilities: unknown[]) => ({
  ok: true,
  status: 200,
  json: async () => ({ resourceAvailabilities }),
});

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("formatGtcDate", () => {
  it('formats "2026-07-10" → "26-Jul-10"', () => {
    expect(formatGtcDate(new Date("2026-07-10T00:00:00Z"))).toBe("26-Jul-10");
  });

  it('formats "2026-01-05" → "26-Jan-05"', () => {
    expect(formatGtcDate(new Date("2026-01-05T00:00:00Z"))).toBe("26-Jan-05");
  });

  it('formats "2026-12-25" → "26-Dec-25"', () => {
    expect(formatGtcDate(new Date("2026-12-25T00:00:00Z"))).toBe("26-Dec-25");
  });

  it('formats "2026-03-01" → "26-Mar-01"', () => {
    expect(formatGtcDate(new Date("2026-03-01T00:00:00Z"))).toBe("26-Mar-01");
  });
});

describe("GOING_TO_CAMP_DOMAINS", () => {
  it("maps bc_parks to camping.bcparks.ca", () => {
    expect(GOING_TO_CAMP_DOMAINS["bc_parks"]).toBe("camping.bcparks.ca");
  });

  it("maps ontario_parks to reservations.ontarioparks.ca", () => {
    expect(GOING_TO_CAMP_DOMAINS["ontario_parks"]).toBe(
      "reservations.ontarioparks.ca"
    );
  });

  it("does NOT include manitoba_parks", () => {
    expect(GOING_TO_CAMP_DOMAINS["manitoba_parks"]).toBeUndefined();
  });
});

describe("GoingToCampPoller", () => {
  it("calls correct domain and path for bc_parks", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      makeApiResponse([])
    );
    vi.stubGlobal("fetch", mockFetch);

    const poller = new GoingToCampPoller();
    await poller.checkCampground([makeWatch({ platform: "bc_parks" })]);

    expect(mockFetch).toHaveBeenCalledOnce();
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("camping.bcparks.ca");
    expect(url).toContain("/api/maps/mapdatabyid");
  });

  it("calls correct domain and path for ontario_parks", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      makeApiResponse([])
    );
    vi.stubGlobal("fetch", mockFetch);

    const poller = new GoingToCampPoller();
    await poller.checkCampground([
      makeWatch({ platform: "ontario_parks" }),
    ]);

    expect(mockFetch).toHaveBeenCalledOnce();
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("reservations.ontarioparks.ca");
    expect(url).toContain("/api/maps/mapdatabyid");
  });

  it("sends correct request body with negative IDs and GTC date format", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      makeApiResponse([])
    );
    vi.stubGlobal("fetch", mockFetch);

    const poller = new GoingToCampPoller();
    await poller.checkCampground([makeWatch()]);

    expect(mockFetch).toHaveBeenCalledOnce();
    const options = mockFetch.mock.calls[0][1];
    const body = JSON.parse(options.body);
    expect(body.mapId).toBe(-2504);
    expect(body.startDate).toBe("26-Jul-10");
    expect(body.endDate).toBe("26-Jul-12");
    expect(body.partySize).toBe(1);
  });

  it("returns available sites when ALL nights are AVAILABLE", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      makeApiResponse([
        {
          resourceId: -100,
          site: { name: "Site A1" },
          availabilities: {
            "2026-07-10T00:00:00Z": "AVAILABLE",
            "2026-07-11T00:00:00Z": "AVAILABLE",
          },
        },
        {
          resourceId: -101,
          site: { name: "Site B2" },
          availabilities: {
            "2026-07-10T00:00:00Z": "AVAILABLE",
            "2026-07-11T00:00:00Z": "RESERVED",
          },
        },
      ])
    );
    vi.stubGlobal("fetch", mockFetch);

    const poller = new GoingToCampPoller();
    const results = await poller.checkCampground([makeWatch()]);

    expect(results).toHaveLength(1);
    expect(results[0].watchId).toBe("watch-1");
    expect(results[0].sites).toHaveLength(1);
    expect(results[0].sites[0].siteId).toBe("-100");
    expect(results[0].sites[0].siteName).toBe("Site A1");
  });

  it("returns empty when no sites have all nights available", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      makeApiResponse([
        {
          resourceId: -100,
          site: { name: "Site A1" },
          availabilities: {
            "2026-07-10T00:00:00Z": "RESERVED",
            "2026-07-11T00:00:00Z": "AVAILABLE",
          },
        },
        {
          resourceId: -101,
          site: { name: "Site B2" },
          availabilities: {
            "2026-07-10T00:00:00Z": "AVAILABLE",
            "2026-07-11T00:00:00Z": "CLOSED",
          },
        },
      ])
    );
    vi.stubGlobal("fetch", mockFetch);

    const poller = new GoingToCampPoller();
    const results = await poller.checkCampground([makeWatch()]);

    expect(results).toHaveLength(0);
  });

  it("filters by site_number when specified", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      makeApiResponse([
        {
          resourceId: -100,
          site: { name: "Site A1" },
          availabilities: {
            "2026-07-10T00:00:00Z": "AVAILABLE",
            "2026-07-11T00:00:00Z": "AVAILABLE",
          },
        },
        {
          resourceId: -101,
          site: { name: "Site B2" },
          availabilities: {
            "2026-07-10T00:00:00Z": "AVAILABLE",
            "2026-07-11T00:00:00Z": "AVAILABLE",
          },
        },
      ])
    );
    vi.stubGlobal("fetch", mockFetch);

    const poller = new GoingToCampPoller();
    const results = await poller.checkCampground([
      makeWatch({ site_number: "Site B2" }),
    ]);

    expect(results).toHaveLength(1);
    expect(results[0].sites).toHaveLength(1);
    expect(results[0].sites[0].siteName).toBe("Site B2");
  });

  it("returns empty on fetch failure (ok: false)", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    const poller = new GoingToCampPoller();
    const results = await poller.checkCampground([makeWatch()]);

    expect(results).toHaveLength(0);
  });

  it("returns empty on network error (fetch throws)", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.stubGlobal("fetch", mockFetch);

    const poller = new GoingToCampPoller();
    const results = await poller.checkCampground([makeWatch()]);

    expect(results).toHaveLength(0);
  });
});
