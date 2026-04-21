// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetVerifiedIdentityFromRequest,
  mockFrom,
} = vi.hoisted(() => ({
  mockGetVerifiedIdentityFromRequest: vi.fn(),
  mockFrom: vi.fn(),
}))

vi.mock("@/lib/auth.server", () => ({
  getVerifiedIdentityFromRequest: mockGetVerifiedIdentityFromRequest,
}))

vi.mock("@/lib/supabase.server", () => ({
  getServiceRoleSupabase: () => ({ from: mockFrom }),
}))

import { GET, POST } from "@/app/api/events/route";

function toIsoNow() {
  return new Date().toISOString();
}

function createEventsSelectChain(store: Array<Record<string, unknown>>) {
  const state: {
    userId?: string;
    since?: string;
  } = {};

  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn((column: string, value: string) => {
      if (column === "user_id") state.userId = value;
      return chain;
    }),
    gte: vi.fn((column: string, value: string) => {
      if (column === "created_at") state.since = value;
      return chain;
    }),
    order: vi.fn(async () => ({
      data: store
        .filter((event) => event.user_id === state.userId)
        .filter((event) => !state.since || String(event.created_at) >= state.since)
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))),
      error: null,
    })),
  };

  return chain;
}

function createCountChain(
  store: Array<Record<string, unknown>>,
  timestampField: "created_at" | "notified_at",
) {
  const state: {
    userId?: string;
  since?: string;
  } = {};

  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn((column: string, value: string) => {
      if (column === "user_id") state.userId = value;
      return chain;
    }),
    gte: vi.fn(async (_column: string, value: string) => ({
      count: store
        .filter((row) => row.user_id === state.userId)
        .filter((row) => !value || String(row[timestampField]) >= value)
        .length,
      error: null,
    })),
  };

  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("/api/events", () => {
  it("requires auth before writing funnel events", async () => {
    mockGetVerifiedIdentityFromRequest.mockResolvedValue(null);

    const response = await POST(new Request("https://alphacamper.test/api/events", {
      method: "POST",
      body: JSON.stringify({ event_name: "sms_tapped" }),
    }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("rejects unknown event names", async () => {
    mockGetVerifiedIdentityFromRequest.mockResolvedValue({
      authKind: "extension",
      userId: "user-123",
      email: "camper@example.com",
    });

    const response = await POST(new Request("https://alphacamper.test/api/events", {
      method: "POST",
      body: JSON.stringify({ event_name: "mystery_event" }),
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Unknown event_name" });
  });

  it("writes a funnel event and reads it back in the customer summary", async () => {
    const funnelEvents: Array<Record<string, unknown>> = [];
    const watchedTargets = [
      { id: "watch-1", user_id: "user-123", created_at: toIsoNow() },
    ];
    const availabilityAlerts = [
      { id: "alert-1", user_id: "user-123", notified_at: toIsoNow() },
    ];

    mockGetVerifiedIdentityFromRequest.mockResolvedValue({
      authKind: "extension",
      userId: "user-123",
      email: "camper@example.com",
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "funnel_events") {
        return {
          insert: vi.fn(async (row: Record<string, unknown>) => {
            funnelEvents.push({
              id: `event-${funnelEvents.length + 1}`,
              created_at: toIsoNow(),
              ...row,
            });
            return { error: null };
          }),
          ...createEventsSelectChain(funnelEvents),
        };
      }

      if (table === "watched_targets") {
        return createCountChain(watchedTargets, "created_at");
      }

      if (table === "availability_alerts") {
        return createCountChain(availabilityAlerts, "notified_at");
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const writeResponse = await POST(new Request("https://alphacamper.test/api/events", {
      method: "POST",
      body: JSON.stringify({
        event_name: "sms_tapped",
        watch_id: "watch-1",
        metadata: { source: "watch_alert" },
      }),
    }));

    expect(writeResponse.status).toBe(200);
    await expect(writeResponse.json()).resolves.toEqual({ success: true });

    const readResponse = await GET(new Request("https://alphacamper.test/api/events?window_days=30"));
    const body = await readResponse.json();

    expect(readResponse.status).toBe(200);
    expect(body.summary).toMatchObject({
      watches_created: 1,
      sms_fired: 1,
      sms_tapped: 1,
      booking_confirmed: 0,
    });
    expect(body.events).toEqual([
      expect.objectContaining({
        watch_id: "watch-1",
        event_name: "sms_tapped",
        metadata: { source: "watch_alert" },
      }),
    ]);
  });
});
