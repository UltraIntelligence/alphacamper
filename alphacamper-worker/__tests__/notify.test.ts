import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Resend SDK before importing the module under test
const mockSend = vi.fn();

vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = { send: mockSend };
  },
}));

// Must import after mock setup
import { sendAlertEmail, buildAlertHtml, _resetResend } from "../src/notify.js";

beforeEach(() => {
  vi.clearAllMocks();
  _resetResend();
  process.env.RESEND_API_KEY = "re_test_123";
});

describe("sendAlertEmail", () => {
  const baseParams = {
    email: "camper@example.com",
    campgroundName: "Rathtrevor Beach",
    platform: "bc_parks",
    arrivalDate: "2026-07-10",
    departureDate: "2026-07-12",
    sites: [
      { siteId: "101", siteName: "A1" },
      { siteId: "102", siteName: "A2" },
    ],
  };

  it("calls Resend with correct params", async () => {
    mockSend.mockResolvedValue({ data: { id: "email_123" }, error: null });

    const result = await sendAlertEmail(baseParams);

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledOnce();

    const call = mockSend.mock.calls[0][0];
    expect(call.from).toBe("Alphacamper <onboarding@resend.dev>");
    expect(call.to).toBe("camper@example.com");
    expect(call.subject).toContain("Rathtrevor Beach");
    expect(call.html).toContain("Rathtrevor Beach");
    expect(call.html).toContain("2026-07-10");
    expect(call.html).toContain("2026-07-12");
  });

  it("returns false on Resend API error", async () => {
    mockSend.mockResolvedValue({
      data: null,
      error: { message: "Invalid API key", name: "validation_error" },
    });

    const result = await sendAlertEmail(baseParams);

    expect(result).toBe(false);
    expect(mockSend).toHaveBeenCalledOnce();
  });

  it("returns false on network exception", async () => {
    mockSend.mockRejectedValue(new Error("Network timeout"));

    const result = await sendAlertEmail(baseParams);

    expect(result).toBe(false);
  });

  it("returns false when RESEND_API_KEY is not set", async () => {
    _resetResend();
    delete process.env.RESEND_API_KEY;

    const result = await sendAlertEmail(baseParams);

    expect(result).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();
  });
});

describe("buildAlertHtml", () => {
  it("includes campground name and dates", () => {
    const html = buildAlertHtml({
      email: "test@example.com",
      campgroundName: "Canisbay Lake",
      platform: "ontario_parks",
      arrivalDate: "2026-08-01",
      departureDate: "2026-08-03",
      sites: [{ siteId: "201", siteName: "B5" }],
    });

    expect(html).toContain("Canisbay Lake");
    expect(html).toContain("2026-08-01");
    expect(html).toContain("2026-08-03");
    expect(html).toContain("B5");
    expect(html).toContain("1 available");
  });

  it("limits displayed sites to 10 and shows overflow", () => {
    const sites = Array.from({ length: 15 }, (_, i) => ({
      siteId: String(i),
      siteName: `Site${i}`,
    }));

    const html = buildAlertHtml({
      email: "test@example.com",
      campgroundName: "Test Park",
      platform: "bc_parks",
      arrivalDate: "2026-07-01",
      departureDate: "2026-07-03",
      sites,
    });

    expect(html).toContain("Site9");
    expect(html).not.toContain("Site10");
    expect(html).toContain("and 5 more");
  });

  it("includes booking link for BC Parks", () => {
    const html = buildAlertHtml({
      email: "test@example.com",
      campgroundName: "Test",
      platform: "bc_parks",
      arrivalDate: "2026-07-01",
      departureDate: "2026-07-03",
      sites: [{ siteId: "1", siteName: "A1" }],
    });

    expect(html).toContain("https://camping.bcparks.ca");
    expect(html).toContain("Book now");
  });

  it("includes booking link for Ontario Parks", () => {
    const html = buildAlertHtml({
      email: "test@example.com",
      campgroundName: "Test",
      platform: "ontario_parks",
      arrivalDate: "2026-07-01",
      departureDate: "2026-07-03",
      sites: [{ siteId: "1", siteName: "A1" }],
    });

    expect(html).toContain("https://reservations.ontarioparks.ca");
  });
});
