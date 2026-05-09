// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockFrom,
} = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}))

vi.mock("@/lib/supabase.server", () => ({
  getServiceRoleSupabase: () => ({ from: mockFrom }),
}))

import { hasActiveSubscription } from "@/lib/subscription";

function buildLookupChain(data: unknown) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => ({ data, error: null })),
  };

  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("hasActiveSubscription", () => {
  it("returns true for an active paid pass inside its access window", async () => {
    mockFrom.mockReturnValue(buildLookupChain({
      status: "active",
      current_period_end: "2099-01-01T00:00:00.000Z",
    }));

    await expect(hasActiveSubscription("user-123")).resolves.toBe(true);
  });

  it("returns false when the latest subscription is canceled", async () => {
    mockFrom.mockReturnValue(buildLookupChain({
      status: "canceled",
      current_period_end: "2026-07-01T00:00:00.000Z",
    }));

    await expect(hasActiveSubscription("user-123")).resolves.toBe(false);
  });

  it("returns false for an expired paid pass", async () => {
    mockFrom.mockReturnValue(buildLookupChain({
      status: "active",
      current_period_end: "2020-01-01T00:00:00.000Z",
    }));

    await expect(hasActiveSubscription("user-123")).resolves.toBe(false);
  });
});
