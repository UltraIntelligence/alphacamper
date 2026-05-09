import { describe, expect, it } from "vitest";

import {
  buildCatalogCampgroundRows,
  getCatalogProviderProfile,
} from "../src/catalog-ingestion.js";
import type { CamisCampground } from "../src/id-resolver.js";

function makeMap() {
  const rathtrevor: CamisCampground = {
    resourceLocationId: -2504,
    rootMapId: -2147483545,
    shortName: "Rathtrevor",
    fullName: "Rathtrevor Beach Provincial Park",
    rawPayload: {
      resourceLocationId: -2504,
      rootMapId: -2147483545,
      localizedValues: [{ shortName: "Rathtrevor", fullName: "Rathtrevor Beach Provincial Park" }],
    },
  };

  return new Map<string, CamisCampground>([
    ["-2504", rathtrevor],
    ["rathtrevor", rathtrevor],
    ["rathtrevor beach provincial park", rathtrevor],
    [
      "-9999",
      {
        resourceLocationId: -9999,
        rootMapId: -1,
        shortName: "Internet",
        fullName: "Internet",
      },
    ],
  ]);
}

describe("catalog ingestion row builder", () => {
  it("dedupes provider aliases by resourceLocationId and keeps source evidence", () => {
    const verifiedAt = new Date("2026-05-09T00:00:00.000Z");
    const rows = buildCatalogCampgroundRows("bc_parks", makeMap(), verifiedAt);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: "-2504",
      platform: "bc_parks",
      name: "Rathtrevor Beach Provincial Park",
      short_name: "Rathtrevor",
      support_status: "alertable",
      availability_mode: "live_polling",
      confidence: "verified",
      provider_key: "bc_parks",
      source_url: "https://camping.bcparks.ca/api/resourceLocation",
      last_verified_at: "2026-05-09T00:00:00.000Z",
    });
    expect(rows[0].source_evidence).toMatchObject({
      dedupe_key: "bc_parks:-2504",
      dedupe_rule: "Use provider platform + resourceLocationId as the canonical row; name keys are lookup aliases only.",
    });
    expect(rows[0].raw_payload).toMatchObject({ resourceLocationId: -2504 });
  });

  it("marks Manitoba and Nova Scotia alertable after site-level polling proof", () => {
    const manitoba = getCatalogProviderProfile("gtc_manitoba");
    const novaScotia = getCatalogProviderProfile("gtc_novascotia");

    expect(manitoba.supportStatus).toBe("alertable");
    expect(manitoba.availabilityMode).toBe("live_polling");
    expect(manitoba.confidence).toBe("verified");
    expect(manitoba.verificationNote).toContain("5,480 campsite IDs");

    expect(novaScotia.supportStatus).toBe("alertable");
    expect(novaScotia.availabilityMode).toBe("live_polling");
    expect(novaScotia.confidence).toBe("verified");
    expect(novaScotia.verificationNote).toContain("1,700 campsite IDs");
  });

  it("marks New Brunswick alertable after site-level polling proof", () => {
    const profile = getCatalogProviderProfile("gtc_new_brunswick");

    expect(profile.providerName).toBe("New Brunswick Parks");
    expect(profile.supportStatus).toBe("alertable");
    expect(profile.availabilityMode).toBe("live_polling");
    expect(profile.sourceUrl).toBe("https://reservations.parcsnbparks.ca/api/resourceLocation");
    expect(profile.confidence).toBe("verified");
  });
});
