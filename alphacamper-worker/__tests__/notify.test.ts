import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Resend SDK before importing the module under test
const mockSend = vi.fn();
const mockSentDmSend = vi.fn();

vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = { send: mockSend };
  },
}));

vi.mock("@sentdm/sentdm", () => ({
  default: class MockSentDm {
    messages = { send: mockSentDmSend };
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

  beforeEach(() => {
    process.env.SENTDM_API_KEY = "sentdm_test_123";
    process.env.SENTDM_TEMPLATE_NAME = "campsite_alert";
    mockSentDmSend.mockResolvedValue({
      success: true,
      data: {
        recipients: [{ message_id: "msg_123" }],
      },
    });
  });

  it("calls Sent.dm with the expected template payload", async () => {
    const result = await sendAlertSMS(baseSMSParams);

    expect(result).toBe(true);
    expect(mockSentDmSend).toHaveBeenCalledOnce();
    expect(mockSentDmSend).toHaveBeenCalledWith({
      channel: ["sms", "whatsapp"],
      to: ["+16045551234"],
      template: {
        name: "campsite_alert",
        parameters: {
          campground_name: "Alice Lake",
          site_count: "2",
          booking_url: "https://camping.bcparks.ca/create-booking/results?resourceLocationId=-2430",
        },
      },
    });
  });

  it("returns false when env vars not set", async () => {
    delete process.env.SENTDM_API_KEY;

    const result = await sendAlertSMS(baseSMSParams);

    expect(result).toBe(false);
    expect(mockSentDmSend).not.toHaveBeenCalled();
  });

  it("returns false on API error", async () => {
    mockSentDmSend.mockResolvedValue({ success: false, error: "Bad request" });

    const result = await sendAlertSMS(baseSMSParams);

    expect(result).toBe(false);
  });

  it("returns false on network exception", async () => {
    mockSentDmSend.mockRejectedValue(new Error("Network timeout"));

    const result = await sendAlertSMS(baseSMSParams);

    expect(result).toBe(false);
  });

  it("sends the correct single-site count", async () => {
    const result = await sendAlertSMS({
      ...baseSMSParams,
      sites: [{ siteId: "101", siteName: "A1" }],
    });

    expect(result).toBe(true);
    expect(mockSentDmSend.mock.calls[0][0].template.parameters.site_count).toBe("1");
  });
});
