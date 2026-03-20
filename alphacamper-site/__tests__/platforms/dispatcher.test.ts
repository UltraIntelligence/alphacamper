import { describe, it, expect } from "vitest";
import { getPoller, SUPPORTED_PLATFORMS } from "@/lib/platforms";
import { RecreationGovPoller } from "@/lib/platforms/recreation-gov";
import { GoingToCampPoller } from "@/lib/platforms/going-to-camp";

describe("Platform Dispatcher", () => {
  describe("getPoller", () => {
    it('returns RecreationGovPoller for "recreation_gov"', () => {
      const poller = getPoller("recreation_gov");
      expect(poller).not.toBeNull();
      expect(poller?.constructor.name).toBe("RecreationGovPoller");
    });

    it('returns GoingToCampPoller for "bc_parks"', () => {
      const poller = getPoller("bc_parks");
      expect(poller).not.toBeNull();
      expect(poller?.constructor.name).toBe("GoingToCampPoller");
    });

    it('returns GoingToCampPoller for "ontario_parks"', () => {
      const poller = getPoller("ontario_parks");
      expect(poller).not.toBeNull();
      expect(poller?.constructor.name).toBe("GoingToCampPoller");
    });

    it('returns null for unsupported platform "sepaq"', () => {
      const poller = getPoller("sepaq");
      expect(poller).toBeNull();
    });

    it('returns null for unsupported platform "reserve_california"', () => {
      const poller = getPoller("reserve_california");
      expect(poller).toBeNull();
    });

    it('returns null for unsupported platform "manitoba_parks"', () => {
      const poller = getPoller("manitoba_parks");
      expect(poller).toBeNull();
    });

    it("returns null for nonexistent platform", () => {
      const poller = getPoller("nonexistent");
      expect(poller).toBeNull();
    });

    it('returns null for slug-based platform "parks_canada" not yet migrated', () => {
      const poller = getPoller("parks_canada");
      expect(poller).toBeNull();
    });

    it('returns null for slug-based platform "alberta_parks" not yet migrated', () => {
      const poller = getPoller("alberta_parks");
      expect(poller).toBeNull();
    });
  });

  describe("SUPPORTED_PLATFORMS", () => {
    it('contains "recreation_gov"', () => {
      expect(SUPPORTED_PLATFORMS).toContain("recreation_gov");
    });

    it('contains "bc_parks"', () => {
      expect(SUPPORTED_PLATFORMS).toContain("bc_parks");
    });

    it('contains "ontario_parks"', () => {
      expect(SUPPORTED_PLATFORMS).toContain("ontario_parks");
    });

    it('does not contain "sepaq"', () => {
      expect(SUPPORTED_PLATFORMS).not.toContain("sepaq");
    });

    it('does not contain "manitoba_parks"', () => {
      expect(SUPPORTED_PLATFORMS).not.toContain("manitoba_parks");
    });
  });
});
