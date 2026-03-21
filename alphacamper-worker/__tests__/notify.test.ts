import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Resend SDK before importing the module under test
const mockSend = vi.fn();

vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = { send: mockSend };
  },
}));

// Must import after mock setup
import { sendAlertEmail, sendAlertSMS, buildAlertHtml, _resetResend } from "../src/notify.js";

beforeEach(() => {
  vi.clearAllMocks();
  _resetResend();
  process.env.RESEND_API_KEY = "re_test_123";
});

describe("sendAlertEmail", () => {
  const baseParams = {
    email: "camper@example.com",
    campgroundName: "Rathtrevor Beach",
    campgroundId: "-2504",
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
      campgroundId: "-2740399",
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
      campgroundId: "-2504",
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
      campgroundId: "-2504",
      platform: "bc_parks",
      arrivalDate: "2026-07-01",
      departureDate: "2026-07-03",
      sites: [{ siteId: "1", siteName: "A1" }],
    });

    expect(html).toContain("https://camping.bcparks.ca/create-booking/results?resourceLocationId=-2504");
    expect(html).toContain("Book now");
  });

  it("includes booking link for Ontario Parks", () => {
    const html = buildAlertHtml({
      email: "test@example.com",
      campgroundName: "Test",
      campgroundId: "-2740399",
      platform: "ontario_parks",
      arrivalDate: "2026-07-01",
      departureDate: "2026-07-03",
      sites: [{ siteId: "1", siteName: "A1" }],
    });

    expect(html).toContain("https://reservations.ontarioparks.ca/create-booking/results?resourceLocationId=-2740399");
  });
});

describe("sendAlertSMS", () => {
  const baseSMSParams = {
    phone: "+16045551234",
    campgroundName: "Alice Lake",
    campgroundId: "-2430",
    platform: "bc_parks",
    sites: [
      { siteId: "101", siteName: "A1" },
      { siteId: "102", siteName: "A2" },
    ],
  };

  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.TELNYX_API_KEY = "KEY_test_123";
    process.env.TELNYX_FROM_NUMBER = "+18005551234";
    mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", mockFetch);
  });

  it("calls Telnyx API with correct params", async () => {
    const result = await sendAlertSMS(baseSMSParams);

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledOnce();

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.telnyx.com/v2/messages");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer KEY_test_123");

    const body = JSON.parse(options.body);
    expect(body.from).toBe("+18005551234");
    expect(body.to).toBe("+16045551234");
    expect(body.text).toContain("Alice Lake");
    expect(body.text).toContain("2 spots");
  });

  it("returns false when env vars not set", async () => {
    delete process.env.TELNYX_API_KEY;
    delete process.env.TELNYX_FROM_NUMBER;

    const result = await sendAlertSMS(baseSMSParams);

    expect(result).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns false on API error", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400, text: async () => "Bad request" });

    const result = await sendAlertSMS(baseSMSParams);

    expect(result).toBe(false);
  });

  it("returns false on network exception", async () => {
    mockFetch.mockRejectedValue(new Error("Network timeout"));

    const result = await sendAlertSMS(baseSMSParams);

    expect(result).toBe(false);
  });

  it("handles single site correctly", async () => {
    const result = await sendAlertSMS({
      ...baseSMSParams,
      sites: [{ siteId: "101", siteName: "A1" }],
    });

    expect(result).toBe(true);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toContain("1 spot");
    expect(body.text).not.toContain("1 spots");
  });
});
