// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetVerifiedIdentityFromRequest,
  mockGetStripe,
  mockResolveBillingProduct,
  mockGetTrustedOrigin,
  mockFrom,
} = vi.hoisted(() => ({
  mockGetVerifiedIdentityFromRequest: vi.fn(),
  mockGetStripe: vi.fn(),
  mockResolveBillingProduct: vi.fn(),
  mockGetTrustedOrigin: vi.fn(),
  mockFrom: vi.fn(),
}))

vi.mock("@/lib/auth.server", () => ({
  getVerifiedIdentityFromRequest: mockGetVerifiedIdentityFromRequest,
}))

vi.mock("@/lib/stripe", () => ({
  getStripe: mockGetStripe,
  resolveBillingProduct: mockResolveBillingProduct,
}))

vi.mock("@/lib/site-url", () => ({
  getTrustedOrigin: mockGetTrustedOrigin,
}))

vi.mock("@/lib/supabase.server", () => ({
  getServiceRoleSupabase: () => ({ from: mockFrom }),
}))

import { POST } from "@/app/api/checkout/route";

function buildSubscriptionLookup(data: unknown) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => ({ data, error: null })),
  };

  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTrustedOrigin.mockReturnValue("https://alphacamper.test");
});

describe("/api/checkout", () => {
  it("returns 401 when no signed-in customer is present", async () => {
    mockGetVerifiedIdentityFromRequest.mockResolvedValue(null);

    const response = await POST(new Request("https://alphacamper.test/api/checkout", {
      method: "POST",
      body: JSON.stringify({ product: "summer" }),
    }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("creates a hosted Stripe checkout session for the selected product", async () => {
    mockGetVerifiedIdentityFromRequest.mockResolvedValue({
      authKind: "supabase",
      userId: "user-123",
      email: "camper@example.com",
    });
    mockResolveBillingProduct.mockReturnValue({
      product: "summer",
      productKey: "summer_pass_2026",
      priceId: "price_summer_123",
    });

    const lookupChain = buildSubscriptionLookup(null);
    const createSession = vi.fn().mockResolvedValue({
      url: "https://checkout.stripe.test/session_123",
    });
    mockFrom.mockReturnValue(lookupChain);
    mockGetStripe.mockReturnValue({
      checkout: {
        sessions: {
          create: createSession,
        },
      },
    });

    const response = await POST(new Request("https://alphacamper.test/api/checkout", {
      method: "POST",
      body: JSON.stringify({ product: "summer" }),
    }));

    expect(response.status).toBe(200);
    expect(lookupChain.eq).toHaveBeenCalledWith("user_id", "user-123");
    expect(createSession).toHaveBeenCalledWith(expect.objectContaining({
      mode: "subscription",
      line_items: [{ price: "price_summer_123", quantity: 1 }],
      success_url: "https://alphacamper.test/dashboard?checkout=success",
      cancel_url: "https://alphacamper.test/checkout?product=summer&canceled=true",
      client_reference_id: "user-123",
      customer_email: "camper@example.com",
      metadata: {
        user_id: "user-123",
        product_key: "summer_pass_2026",
      },
      subscription_data: {
        metadata: {
          user_id: "user-123",
          product_key: "summer_pass_2026",
        },
      },
    }));
    await expect(response.json()).resolves.toEqual({
      url: "https://checkout.stripe.test/session_123",
    });
  });
});
