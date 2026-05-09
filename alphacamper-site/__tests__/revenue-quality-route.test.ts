// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetVerifiedEmailFromRequest,
  mockGetServiceRoleSupabase,
} = vi.hoisted(() => ({
  mockGetVerifiedEmailFromRequest: vi.fn(),
  mockGetServiceRoleSupabase: vi.fn(),
}));

vi.mock("@/lib/auth.server", () => ({
  getVerifiedEmailFromRequest: mockGetVerifiedEmailFromRequest,
}));

vi.mock("@/lib/supabase.server", () => ({
  getServiceRoleSupabase: mockGetServiceRoleSupabase,
}));

function mockSupabaseTable(dataByTable: Record<string, { data?: unknown[]; error?: { message: string } | null }>) {
  mockGetServiceRoleSupabase.mockReturnValue({
    from: vi.fn((table: string) => ({
      select: vi.fn(async () => ({
        data: dataByTable[table]?.data ?? [],
        error: dataByTable[table]?.error ?? null,
      })),
    })),
  });
}

function stubStripeEnv() {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_safe");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_safe");
  vi.stubEnv("STRIPE_PRICE_SUMMER", "price_summer");
  vi.stubEnv("STRIPE_PRICE_YEAR", "price_year");
  vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_test_safe");
}

beforeEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  mockGetVerifiedEmailFromRequest.mockReset();
  mockGetServiceRoleSupabase.mockReset();
  mockGetServiceRoleSupabase.mockImplementation(() => {
    throw new Error("Missing Supabase environment variables");
  });
});

describe("revenue quality route", () => {
  it("requires an approved operator account", async () => {
    mockGetVerifiedEmailFromRequest.mockResolvedValue("camper@example.com");
    vi.stubEnv("OPERATOR_EMAIL_ALLOWLIST", "ops@alphacamper.com");

    const { GET } = await import("@/app/api/admin/revenue-quality/route");
    const response = await GET(new Request("https://alphacamper.test/api/admin/revenue-quality"));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      available: false,
      canView: false,
      operatorEmail: "camper@example.com",
    });
  });

  it("aggregates paid passes, revenue, funnel events, and alert outcomes", async () => {
    mockGetVerifiedEmailFromRequest.mockResolvedValue("ops@alphacamper.com");
    vi.stubEnv("OPERATOR_EMAIL_ALLOWLIST", "ops@alphacamper.com");
    stubStripeEnv();

    mockSupabaseTable({
      subscriptions: {
        data: [
          {
            id: "sub-1",
            product_key: "summer_pass_2026",
            status: "active",
            checkout_mode: "payment",
            amount_total: 2900,
            currency: "usd",
            current_period_end: "2026-11-01T00:00:00.000Z",
          },
          {
            id: "sub-2",
            product_key: "year_pass_2026",
            status: "active",
            checkout_mode: "payment",
            amount_total: 4900,
            currency: "usd",
            current_period_end: "2027-01-01T00:00:00.000Z",
          },
          {
            id: "sub-3",
            product_key: "summer_pass_2026",
            status: "past_due",
            checkout_mode: "payment",
            amount_total: 2900,
            currency: "usd",
            current_period_end: null,
          },
        ],
      },
      funnel_events: {
        data: [
          { id: "event-1", event_name: "sms_tapped" },
          { id: "event-2", event_name: "booking_submitted" },
          { id: "event-3", event_name: "booking_confirmed" },
        ],
      },
      stripe_webhook_events: {
        data: [
          { id: "evt-1", event_type: "checkout.session.completed" },
          { id: "evt-2", event_type: "checkout.session.completed" },
        ],
      },
      watched_targets: {
        data: [
          { id: "watch-1", active: true },
          { id: "watch-2", active: false },
        ],
      },
      availability_alerts: {
        data: [
          { id: "alert-1", claimed: false, notified_at: "2026-05-09T09:12:00Z" },
          { id: "alert-2", claimed: true, notified_at: null },
        ],
      },
      campground_interest: {
        data: [
          {
            id: "interest-1",
            platform: "alberta_parks",
            campground_id: "bow-valley",
            campground_name: "Bow Valley",
            support_status: "search_only",
            source: "watch_search",
            created_at: "2026-05-09T09:12:00Z",
          },
          {
            id: "interest-2",
            platform: "alberta_parks",
            campground_id: "bow-valley",
            campground_name: "Bow Valley",
            support_status: "search_only",
            source: "watch_search",
            created_at: "2026-05-08T09:12:00Z",
          },
          {
            id: "interest-3",
            platform: "sepaq",
            campground_id: "oka",
            campground_name: "Oka",
            support_status: "coming_soon",
            source: "watch_search",
            created_at: "2026-04-01T09:12:00Z",
          },
        ],
      },
    });

    const { GET } = await import("@/app/api/admin/revenue-quality/route");
    const response = await GET(new Request("https://alphacamper.test/api/admin/revenue-quality"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      available: true,
      canView: true,
      fetchedFrom: "live_supabase",
      runtime: {
        stripe_env_ready: true,
        missing_stripe_env: [],
      },
      billing: {
        paid_passes: 2,
        summer_passes: 1,
        year_passes: 1,
        payment_mode_passes: 2,
        past_due_passes: 1,
        gross_revenue_by_currency: {
          usd: 7800,
        },
        webhook_events: 2,
        webhook_events_by_type: {
          "checkout.session.completed": 2,
        },
      },
      funnel: {
        total_events: 3,
        sms_tapped: 1,
        booking_submitted: 1,
        booking_confirmed: 1,
      },
      productOutcome: {
        total_watches: 2,
        active_watches: 1,
        total_alerts: 2,
        delivered_alerts: 1,
        claimed_alerts: 1,
      },
      demand: {
        total_requests: 3,
        unique_campgrounds: 2,
        by_support_status: {
          search_only: 2,
          coming_soon: 1,
        },
        by_platform: {
          alberta_parks: 2,
          sepaq: 1,
        },
      },
    });
    expect(body.demand.top_campgrounds[0]).toMatchObject({
      platform: "alberta_parks",
      campground_id: "bow-valley",
      campground_name: "Bow Valley",
      support_status: "search_only",
      request_count: 2,
      last_requested_at: "2026-05-09T09:12:00Z",
    });
    expect(body.blockers).toContain("Net revenue after refunds is not verified from Stripe yet.");
  });

  it("keeps the route usable while clearly showing missing Stripe setup", async () => {
    mockGetVerifiedEmailFromRequest.mockResolvedValue("ops@alphacamper.com");
    vi.stubEnv("OPERATOR_EMAIL_ALLOWLIST", "ops@alphacamper.com");

    mockSupabaseTable({
      subscriptions: { data: [] },
      funnel_events: { data: [] },
      stripe_webhook_events: { data: [] },
      watched_targets: { data: [] },
      availability_alerts: { data: [] },
    });

    const { GET } = await import("@/app/api/admin/revenue-quality/route");
    const response = await GET(new Request("https://alphacamper.test/api/admin/revenue-quality"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.available).toBe(true);
    expect(body.runtime.stripe_env_ready).toBe(false);
    expect(body.runtime.missing_stripe_env).toEqual([
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "STRIPE_PRICE_SUMMER",
      "STRIPE_PRICE_YEAR",
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    ]);
    expect(body.blockers[0]).toContain("Missing runtime Stripe env vars");
  });

  it("keeps demand capture read errors separate from core revenue availability", async () => {
    mockGetVerifiedEmailFromRequest.mockResolvedValue("ops@alphacamper.com");
    vi.stubEnv("OPERATOR_EMAIL_ALLOWLIST", "ops@alphacamper.com");
    stubStripeEnv();

    mockSupabaseTable({
      subscriptions: { data: [] },
      funnel_events: { data: [] },
      stripe_webhook_events: { data: [] },
      watched_targets: { data: [] },
      availability_alerts: { data: [] },
      campground_interest: { error: { message: "relation does not exist" } },
    });

    const { GET } = await import("@/app/api/admin/revenue-quality/route");
    const response = await GET(new Request("https://alphacamper.test/api/admin/revenue-quality"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.available).toBe(true);
    expect(body.demand).toMatchObject({
      total_requests: 0,
      unique_campgrounds: 0,
      read_error: "campground_interest: relation does not exist",
    });
    expect(body.blockers).toContain("campground_interest: relation does not exist");
  });

  it("returns a friendly unavailable response when a table cannot be read", async () => {
    mockGetVerifiedEmailFromRequest.mockResolvedValue("ops@alphacamper.com");
    vi.stubEnv("OPERATOR_EMAIL_ALLOWLIST", "ops@alphacamper.com");

    mockSupabaseTable({
      subscriptions: { error: { message: "relation does not exist" } },
      funnel_events: { data: [] },
      stripe_webhook_events: { data: [] },
      watched_targets: { data: [] },
      availability_alerts: { data: [] },
    });

    const { GET } = await import("@/app/api/admin/revenue-quality/route");
    const response = await GET(new Request("https://alphacamper.test/api/admin/revenue-quality"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      available: false,
      canView: true,
      reason: "subscriptions: relation does not exist",
      fetchedFrom: "live_supabase",
      blockers: ["subscriptions: relation does not exist"],
    });
  });
});
