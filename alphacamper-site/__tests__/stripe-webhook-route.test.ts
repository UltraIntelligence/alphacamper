// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetStripe,
  mockGetStripeWebhookSecret,
  mockFrom,
} = vi.hoisted(() => ({
  mockGetStripe: vi.fn(),
  mockGetStripeWebhookSecret: vi.fn(),
  mockFrom: vi.fn(),
}))

vi.mock("@/lib/stripe", async () => {
  const actual = await vi.importActual<typeof import("@/lib/stripe")>("@/lib/stripe");
  return {
    ...actual,
    getStripe: mockGetStripe,
    getStripeWebhookSecret: mockGetStripeWebhookSecret,
  };
})

vi.mock("@/lib/supabase.server", () => ({
  getServiceRoleSupabase: () => ({ from: mockFrom }),
}))

import { POST } from "@/app/api/stripe/webhook/route";

function buildLookupChain(data: unknown, error: { message: string } | null = null) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => ({ data, error })),
  };

  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetStripeWebhookSecret.mockReturnValue("whsec_test_123");
});

describe("/api/stripe/webhook", () => {
  it("rejects an invalid Stripe signature", async () => {
    mockGetStripe.mockReturnValue({
      webhooks: {
        constructEvent: vi.fn(() => {
          throw new Error("No signatures found matching the expected signature");
        }),
      },
    });

    const response = await POST(new Request("https://alphacamper.test/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "bad_signature" },
      body: "{}",
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "No signatures found matching the expected signature",
    });
  });

  it("upserts the one-time pass record when checkout completes", async () => {
    const constructEvent = vi.fn().mockReturnValue({
      id: "evt_checkout_complete",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          mode: "payment",
          customer: "cus_123",
          payment_intent: "pi_123",
          payment_status: "paid",
          amount_total: 2900,
          currency: "usd",
          client_reference_id: "user-123",
          metadata: {
            user_id: "user-123",
            product_key: "summer_pass_2026",
          },
        },
      },
    });
    const insertEvent = vi.fn().mockResolvedValue({ error: null });
    const upsertSubscription = vi.fn().mockResolvedValue({ error: null });

    mockGetStripe.mockReturnValue({
      webhooks: { constructEvent },
      subscriptions: { retrieve: vi.fn() },
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "stripe_webhook_events") {
        return {
          ...buildLookupChain(null),
          insert: insertEvent,
          delete: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null })),
          })),
        };
      }

      if (table === "subscriptions") {
        return {
          upsert: upsertSubscription,
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const response = await POST(new Request("https://alphacamper.test/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "good_signature" },
      body: JSON.stringify({ hello: "world" }),
    }));

    expect(response.status).toBe(200);
    expect(insertEvent).toHaveBeenCalledWith({
      id: "evt_checkout_complete",
      event_type: "checkout.session.completed",
    });
    expect(upsertSubscription).toHaveBeenCalledWith(expect.objectContaining({
      user_id: "user-123",
      stripe_customer_id: "cus_123",
      stripe_subscription_id: null,
      stripe_payment_intent_id: "pi_123",
      stripe_checkout_session_id: "cs_test_123",
      checkout_mode: "payment",
      product_key: "summer_pass_2026",
      status: "active",
      current_period_end: "2026-11-01T00:00:00.000Z",
      amount_total: 2900,
      currency: "usd",
    }), {
      onConflict: "user_id",
    });
    await expect(response.json()).resolves.toEqual({ received: true });
  });

  it("keeps processing legacy subscription checkout sessions", async () => {
    const constructEvent = vi.fn().mockReturnValue({
      id: "evt_checkout_subscription",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_subscription",
          mode: "subscription",
          customer: "cus_123",
          subscription: "sub_123",
          client_reference_id: "user-123",
          metadata: {
            user_id: "user-123",
            product_key: "summer_pass_2026",
          },
        },
      },
    });
    const retrieveSubscription = vi.fn().mockResolvedValue({
      id: "sub_123",
      customer: "cus_123",
      status: "active",
      current_period_end: 1_785_693_600,
      metadata: {
        user_id: "user-123",
        product_key: "summer_pass_2026",
      },
    });
    const insertEvent = vi.fn().mockResolvedValue({ error: null });
    const upsertSubscription = vi.fn().mockResolvedValue({ error: null });

    mockGetStripe.mockReturnValue({
      webhooks: { constructEvent },
      subscriptions: { retrieve: retrieveSubscription },
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "stripe_webhook_events") {
        return {
          ...buildLookupChain(null),
          insert: insertEvent,
          delete: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null })),
          })),
        };
      }

      if (table === "subscriptions") {
        return {
          upsert: upsertSubscription,
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const response = await POST(new Request("https://alphacamper.test/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "good_signature" },
      body: JSON.stringify({ hello: "world" }),
    }));

    expect(response.status).toBe(200);
    expect(retrieveSubscription).toHaveBeenCalledWith("sub_123");
    expect(upsertSubscription).toHaveBeenCalledWith(expect.objectContaining({
      user_id: "user-123",
      stripe_customer_id: "cus_123",
      stripe_subscription_id: "sub_123",
      stripe_payment_intent_id: null,
      stripe_checkout_session_id: "cs_test_subscription",
      checkout_mode: "subscription",
      product_key: "summer_pass_2026",
      status: "active",
      current_period_end: "2026-08-02T18:00:00.000Z",
    }), {
      onConflict: "user_id",
    });
  });

  it("treats duplicate event ids as a no-op", async () => {
    const constructEvent = vi.fn().mockReturnValue({
      id: "evt_duplicate",
      type: "checkout.session.completed",
      data: { object: {} },
    });
    const insertEvent = vi.fn();
    const upsertSubscription = vi.fn();

    mockGetStripe.mockReturnValue({
      webhooks: { constructEvent },
      subscriptions: { retrieve: vi.fn() },
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === "stripe_webhook_events") {
        return {
          ...buildLookupChain({ id: "evt_duplicate" }),
          insert: insertEvent,
          delete: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null })),
          })),
        };
      }

      if (table === "subscriptions") {
        return {
          upsert: upsertSubscription,
        };
      }

      throw new Error(`Unexpected table ${table}`);
    });

    const response = await POST(new Request("https://alphacamper.test/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "good_signature" },
      body: JSON.stringify({ hello: "world" }),
    }));

    expect(response.status).toBe(200);
    expect(insertEvent).not.toHaveBeenCalled();
    expect(upsertSubscription).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      received: true,
      duplicate: true,
    });
  });
});
