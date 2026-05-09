import { describe, it, expect } from "vitest";
import { DOMAINS, COOKIE_TTLS, SUPPORTED_PLATFORMS } from "../src/config.js";

describe("DOMAINS registry", () => {
  it("includes all four legacy Camis platforms", () => {
    expect(DOMAINS.bc_parks).toBe("camping.bcparks.ca");
    expect(DOMAINS.ontario_parks).toBe("reservations.ontarioparks.ca");
    expect(DOMAINS.parks_canada).toBe("reservation.pc.gc.ca");
  });

  it("includes the seven GoingToCamp white-label platforms", () => {
    expect(DOMAINS.gtc_manitoba).toBe("manitoba.goingtocamp.com");
    expect(DOMAINS.gtc_novascotia).toBe("novascotia.goingtocamp.com");
    expect(DOMAINS.gtc_longpoint).toBe("longpoint.goingtocamp.com");
    expect(DOMAINS.gtc_maitland).toBe("maitlandvalley.goingtocamp.com");
    expect(DOMAINS.gtc_stclair).toBe("stclair.goingtocamp.com");
    expect(DOMAINS.gtc_nlcamping).toBe("nlcamping.ca");
    expect(DOMAINS.gtc_new_brunswick).toBe("reservations.parcsnbparks.ca");
  });

  it("tracks Recreation.gov as a worker-owned non-Camis platform", () => {
    expect(DOMAINS.recreation_gov).toBeUndefined();
    expect(SUPPORTED_PLATFORMS).toContain("recreation_gov");
  });

  it("has a cookie TTL entry for every domain", () => {
    for (const domain of Object.values(DOMAINS)) {
      expect(COOKIE_TTLS[domain], `missing TTL for ${domain}`).toBeGreaterThan(0);
    }
  });

  it("exposes platforms via SUPPORTED_PLATFORMS", () => {
    for (const platform of Object.keys(DOMAINS)) {
      expect(SUPPORTED_PLATFORMS).toContain(platform);
    }
  });
});
