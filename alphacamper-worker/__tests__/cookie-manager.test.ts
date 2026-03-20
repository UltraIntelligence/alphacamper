import { describe, it, expect, beforeEach } from "vitest";
import { CookieManager } from "../src/cookie-manager.js";

describe("CookieManager cache logic", () => {
  let mgr: CookieManager;

  beforeEach(() => {
    mgr = new CookieManager();
  });

  it("reports expired when no cookies cached", () => {
    expect(mgr.isExpired("camping.bcparks.ca")).toBe(true);
  });

  it("reports not expired after caching cookies", () => {
    mgr.setCookies("camping.bcparks.ca", [
      { name: "session", value: "abc", domain: "camping.bcparks.ca", path: "/", expires: -1, httpOnly: false, secure: false, sameSite: "Lax" },
    ]);
    expect(mgr.isExpired("camping.bcparks.ca")).toBe(false);
  });

  it("returns cached cookie header string", () => {
    mgr.setCookies("camping.bcparks.ca", [
      { name: "sid", value: "123", domain: "camping.bcparks.ca", path: "/", expires: -1, httpOnly: false, secure: false, sameSite: "Lax" },
      { name: "tok", value: "abc", domain: "camping.bcparks.ca", path: "/", expires: -1, httpOnly: false, secure: false, sameSite: "Lax" },
    ]);
    expect(mgr.getCookieHeader("camping.bcparks.ca")).toBe("sid=123; tok=abc");
  });

  it("returns empty string when no cookies", () => {
    expect(mgr.getCookieHeader("camping.bcparks.ca")).toBe("");
  });

  it("force-expires cookies for a domain", () => {
    mgr.setCookies("camping.bcparks.ca", [
      { name: "sid", value: "123", domain: "camping.bcparks.ca", path: "/", expires: -1, httpOnly: false, secure: false, sameSite: "Lax" },
    ]);
    expect(mgr.isExpired("camping.bcparks.ca")).toBe(false);
    mgr.forceExpire("camping.bcparks.ca");
    expect(mgr.isExpired("camping.bcparks.ca")).toBe(true);
  });

  it("reduces TTL on adaptive refresh", () => {
    const originalTtl = mgr.getTtl("camping.bcparks.ca");
    mgr.reduceTtl("camping.bcparks.ca");
    expect(mgr.getTtl("camping.bcparks.ca")).toBeLessThan(originalTtl);
  });

  it("does not reduce TTL below 5 minutes", () => {
    // Reduce many times
    for (let i = 0; i < 20; i++) mgr.reduceTtl("camping.bcparks.ca");
    expect(mgr.getTtl("camping.bcparks.ca")).toBeGreaterThanOrEqual(5 * 60 * 1000);
  });
});
