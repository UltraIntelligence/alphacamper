import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkCampground, getCart, clearCartCache } from "../src/poller.js";
import type { WatchedTarget } from "../src/supabase.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeWatch(overrides: Partial<WatchedTarget> = {}): WatchedTarget {
  return {
    id: "watch-1",
    user_id: "user-1",
    platform: "bc_parks",
    campground_id: "-2504",
    campground_name: "Rathtrevor",
    site_number: null,
    arrival_date: "2026-07-10",
    departure_date: "2026-07-12",
    active: true,
    last_checked_at: null,
    ...overrides,
  };
}

function makeCartResponse() {
  return { cartUid: "cart-1", createTransactionUid: "txn-1" };
}

function mockFetch(responses: Array<{ ok: boolean; status?: number; body?: unknown; throws?: boolean }>) {
  let callIndex = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      const resp = responses[Math.min(callIndex++, responses.length - 1)];
      if (resp.throws) throw new Error("Network error");
      return {
        ok: resp.ok,
        status: resp.status ?? (resp.ok ? 200 : 500),
        json: async () => resp.body,
      };
    }),
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  clearCartCache();
  vi.restoreAllMocks();
});

describe("getCart", () => {
  it("extracts cartUid and cartTransactionUid from response", async () => {
    mockFetch([{ ok: true, body: makeCartResponse() }]);

    const cart = await getCart("camping.bcparks.ca", "session=abc");
    expect(cart).toEqual({ cartUid: "cart-1", cartTransactionUid: "txn-1" });
  });

  it("returns null when cart request fails", async () => {
    mockFetch([{ ok: false, status: 401 }]);

    const cart = await getCart("camping.bcparks.ca", "session=bad");
    expect(cart).toBeNull();
  });

  it("returns null on network error", async () => {
    mockFetch([{ ok: false, throws: true }]);

    const cart = await getCart("camping.bcparks.ca", "session=bad");
    expect(cart).toBeNull();
  });
});

describe("checkCampground", () => {
  it("returns available sites when all nights have availability 0", async () => {
    mockFetch([
      // cart
      { ok: true, body: makeCartResponse() },
      // availability map
      {
        ok: true,
        body: {
          mapId: -100,
          resourceAvailabilities: {
            "-200": [{ availability: 0 }, { availability: 0 }],
            "-201": [{ availability: 0 }, { availability: 1 }],
          },
        },
      },
    ]);

    const watches = [makeWatch()];
    const outcome = await checkCampground("camping.bcparks.ca", -100, watches, "session=abc");

    expect(outcome.httpStatus).toBe(200);
    expect(outcome.results).toHaveLength(1);
    expect(outcome.results[0].watchId).toBe("watch-1");
    // Only site -200 has all nights available
    expect(outcome.results[0].sites).toHaveLength(1);
    expect(outcome.results[0].sites[0].siteId).toBe("-200");
  });

  it("returns empty results when all nights are unavailable (availability 1)", async () => {
    mockFetch([
      { ok: true, body: makeCartResponse() },
      {
        ok: true,
        body: {
          mapId: -100,
          resourceAvailabilities: {
            "-200": [{ availability: 1 }, { availability: 1 }],
            "-201": [{ availability: 1 }, { availability: 1 }],
          },
        },
      },
    ]);

    const outcome = await checkCampground("camping.bcparks.ca", -100, [makeWatch()], "session=abc");

    expect(outcome.httpStatus).toBe(200);
    expect(outcome.results).toHaveLength(0);
  });

  it("handles mixed availability correctly — only fully-available sites returned", async () => {
    mockFetch([
      { ok: true, body: makeCartResponse() },
      {
        ok: true,
        body: {
          mapId: -100,
          resourceAvailabilities: {
            "-200": [{ availability: 0 }, { availability: 0 }], // available
            "-201": [{ availability: 0 }, { availability: 1 }], // partially unavailable
            "-202": [{ availability: 4 }, { availability: 0 }], // filtered out
            "-203": [{ availability: 6 }, { availability: 6 }], // not operating
          },
        },
      },
    ]);

    const outcome = await checkCampground("camping.bcparks.ca", -100, [makeWatch()], "session=abc");

    expect(outcome.httpStatus).toBe(200);
    expect(outcome.results).toHaveLength(1);
    const siteIds = outcome.results[0].sites.map(s => s.siteId);
    expect(siteIds).toContain("-200");
    expect(siteIds).not.toContain("-201");
    expect(siteIds).not.toContain("-202");
    expect(siteIds).not.toContain("-203");
  });

  it("returns httpStatus 403 on forbidden response", async () => {
    mockFetch([
      { ok: true, body: makeCartResponse() },
      { ok: false, status: 403 },
    ]);

    const outcome = await checkCampground("camping.bcparks.ca", -100, [makeWatch()], "session=bad");

    expect(outcome.httpStatus).toBe(403);
    expect(outcome.results).toHaveLength(0);
  });

  it("returns httpStatus null on network error", async () => {
    mockFetch([
      { ok: true, body: makeCartResponse() },
      { ok: false, throws: true },
    ]);

    const outcome = await checkCampground("camping.bcparks.ca", -100, [makeWatch()], "session=abc");

    expect(outcome.httpStatus).toBeNull();
    expect(outcome.results).toHaveLength(0);
  });

  it("returns httpStatus null when cart is unavailable", async () => {
    mockFetch([{ ok: false, status: 401 }]);

    const outcome = await checkCampground("camping.bcparks.ca", -100, [makeWatch()], "session=abc");

    expect(outcome.httpStatus).toBeNull();
    expect(outcome.results).toHaveLength(0);
  });

  it("drills into sub-maps when root map has no resourceAvailabilities", async () => {
    mockFetch([
      // cart
      { ok: true, body: makeCartResponse() },
      // root map — only mapLinkAvailabilities, no resourceAvailabilities
      {
        ok: true,
        body: {
          mapId: -100,
          mapLinkAvailabilities: {
            "-300": [0, 0], // has availability — should drill in
            "-301": [1, 1], // no availability — should skip
          },
        },
      },
      // sub-map -300 cart (cached, won't be re-requested)
      // sub-map -300 availability
      {
        ok: true,
        body: {
          mapId: -300,
          resourceAvailabilities: {
            "-400": [{ availability: 0 }, { availability: 0 }],
          },
        },
      },
    ]);

    // Override delay to avoid slowing tests
    vi.stubGlobal("setTimeout", (fn: () => void) => fn());

    const outcome = await checkCampground("camping.bcparks.ca", -100, [makeWatch()], "session=abc");

    expect(outcome.httpStatus).toBe(200);
    expect(outcome.results).toHaveLength(1);
    expect(outcome.results[0].sites[0].siteId).toBe("-400");
  });
});
