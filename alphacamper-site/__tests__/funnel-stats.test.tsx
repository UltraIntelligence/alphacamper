// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { FunnelStats } from "@/components/dashboard/FunnelStats";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("FunnelStats", () => {
  it("renders an empty state when no funnel activity exists", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        summary: {
          watches_created: 0,
          sms_fired: 0,
          sms_tapped: 0,
          booking_confirmed: 0,
        },
        window_days: 30,
      }),
    }));

    render(<FunnelStats token="token-123" />);

    expect(await screen.findByText(/No activity in the last/i)).toBeTruthy();
    expect(screen.getByText(/30/)).toBeTruthy();
  });
});
