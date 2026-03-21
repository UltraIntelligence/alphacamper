import { createHash } from "crypto";
import { Resend } from "resend";
import { log } from "./logger.js";
import type { AvailableSite } from "./supabase.js";

let hasWarnedAboutMissingPiiSalt = false;
let hasWarnedAboutMissingFromEmail = false;

/** Produces a consistent 8-char pseudonymous identifier from a PII string (email or phone).
 *  Allows log grouping without storing or exposing the original value. */
function maskPii(value: string): string {
  const salt = process.env.PII_MASK_SALT;
  if (!salt) {
    if (!hasWarnedAboutMissingPiiSalt) {
      hasWarnedAboutMissingPiiSalt = true;
      log.warn("PII_MASK_SALT not set — recipient identifiers will be redacted instead of hashed");
    }
    return "redacted";
  }
  return createHash("sha256").update(salt + value).digest("hex").slice(0, 8);
}

// ─── Resend singleton ────────────────────────────────────────────────────────

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    log.warn("RESEND_API_KEY not set — email notifications disabled");
    return null;
  }
  _resend = new Resend(key);
  return _resend;
}

// ─── Email builder ───────────────────────────────────────────────────────────

interface AlertEmailParams {
  email: string;
  campgroundName: string;
  platform: string;
  arrivalDate: string;
  departureDate: string;
  sites: AvailableSite[];
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildAlertHtml(params: AlertEmailParams): string {
  const { campgroundName, platform, arrivalDate, departureDate, sites } = params;

  const safeName = escapeHtml(campgroundName);
  const safeArrival = escapeHtml(arrivalDate);
  const safeDeparture = escapeHtml(departureDate);

  const siteList = sites
    .slice(0, 10)
    .map((s) => `<li>${escapeHtml(s.siteName)}</li>`)
    .join("");
  const moreText = sites.length > 10 ? `<p>...and ${sites.length - 10} more</p>` : "";

  const bookingUrl = getBookingUrl(platform, campgroundName);
  const bookingLink = bookingUrl
    ? `<p><a href="${bookingUrl}" style="display:inline-block;padding:12px 24px;background:#2d6a4f;color:#fff;text-decoration:none;border-radius:6px;font-weight:500;">Book now</a></p>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a;">
  <h2 style="color:#2d6a4f;margin-bottom:4px;">A spot opened up!</h2>
  <p style="font-size:18px;margin-top:0;"><strong>${safeName}</strong></p>
  <table style="border-collapse:collapse;margin:16px 0;">
    <tr><td style="padding:4px 12px 4px 0;color:#666;">Dates</td><td>${safeArrival} to ${safeDeparture}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#666;">Sites</td><td>${sites.length} available</td></tr>
  </table>
  <ul style="padding-left:20px;margin:8px 0;">${siteList}</ul>
  ${moreText}
  ${bookingLink}
  <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;">
  <p style="font-size:12px;color:#999;">You're receiving this because you set up a watch on Alphacamper. Availability can change fast — book quickly!</p>
</body>
</html>`;
}

function getBookingUrl(platform: string, _campgroundName: string): string | null {
  switch (platform) {
    case "bc_parks":
      return "https://camping.bcparks.ca";
    case "ontario_parks":
      return "https://reservations.ontarioparks.ca";
    case "parks_canada":
      return "https://reservation.pc.gc.ca";
    case "recreation_gov":
      return "https://www.recreation.gov";
    default:
      return null;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function sendAlertEmail(params: AlertEmailParams): Promise<boolean> {
  const resend = getResend();
  if (!resend) return false;

  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
    if (!process.env.RESEND_FROM_EMAIL && !hasWarnedAboutMissingFromEmail) {
      hasWarnedAboutMissingFromEmail = true;
      log.warn("RESEND_FROM_EMAIL is not set — using Resend sandbox sender; emails may not be delivered in production");
    }
    const { data, error } = await resend.emails.send({
      from: `Alphacamper <${fromEmail}>`,
      to: params.email,
      subject: `🏕️ Spot open at ${params.campgroundName}!`,
      html: buildAlertHtml(params),
    });

    if (error) {
      log.error("Resend API error", {
        recipient: maskPii(params.email),
        campground: params.campgroundName,
        error: error.message,
      });
      return false;
    }

    log.info("Alert email sent", {
      recipient: maskPii(params.email),
      campground: params.campgroundName,
      emailId: data?.id,
    });
    return true;
  } catch (err) {
    log.error("sendAlertEmail failed", {
      recipient: maskPii(params.email),
      campground: params.campgroundName,
      error: String(err),
    });
    return false;
  }
}

// ─── SMS via Telnyx ──────────────────────────────────────────────────────────

interface AlertSMSParams {
  phone: string;
  campgroundName: string;
  platform: string;
  sites: AvailableSite[];
}

export async function sendAlertSMS(params: AlertSMSParams): Promise<boolean> {
  const apiKey = process.env.TELNYX_API_KEY;
  const fromNumber = process.env.TELNYX_FROM_NUMBER;

  if (!apiKey || !fromNumber) {
    log.warn("TELNYX_API_KEY or TELNYX_FROM_NUMBER not set — SMS disabled");
    return false;
  }

  const siteCount = params.sites.length;
  const bookingUrl = getBookingUrl(params.platform, params.campgroundName);
  const text = `🏕️ ${siteCount} spot${siteCount > 1 ? "s" : ""} open at ${params.campgroundName}! ${bookingUrl || "Check Alphacamper for details."}`;

  try {
    const res = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromNumber,
        to: params.phone,
        text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      log.error("Telnyx API error", {
        recipient: maskPii(params.phone),
        campground: params.campgroundName,
        status: res.status,
        body,
      });
      return false;
    }

    log.info("Alert SMS sent", {
      recipient: maskPii(params.phone),
      campground: params.campgroundName,
    });
    return true;
  } catch (err) {
    log.error("sendAlertSMS failed", {
      recipient: maskPii(params.phone),
      campground: params.campgroundName,
      error: String(err),
    });
    return false;
  }
}

/** Reset singleton — for testing only */
export function _resetResend(): void {
  _resend = null;
}

// Exported for testing
export { buildAlertHtml, getResend };
