// @vitest-environment node

import { describe, expect, it } from "vitest";
import { GET, POST } from "@/app/api/check-availability/route";

describe("/api/check-availability", () => {
  it("is retired so Vercel cannot create silent alerts", async () => {
    const response = await GET();

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toEqual({
      status: "retired",
      engine: "railway-worker",
      alertCreationEnabled: false,
      message: "Availability polling now runs in the Railway worker.",
    });
  });

  it("keeps POST retired too", async () => {
    const response = await POST();

    expect(response.status).toBe(410);
  });
});
