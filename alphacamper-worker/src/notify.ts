import { createHash } from "crypto";
import { Resend } from "resend";
import SentDm from "@sentdm/sentdm";
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
  campgroundId: string;
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
  const { campgroundName, platform, arrivalDate, departureDate, sites, campgroundId } = params;

  const safeName = escapeHtml(campgroundName);
  const safeArrival = escapeHtml(arrivalDate);
  const safeDeparture = escapeHtml(departureDate);

  const siteList = sites
    .slice(0, 10)
    .map((s) => `<li>${escapeHtml(s.siteName)}</li>`)
    .join("");
  const moreText = sites.length > 10 ? `<p>...and ${sites.length - 10} more</p>` : "";

  const bookingUrl = getBookingUrl(platform, params.campgroundId);
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

/**
 * Generates a campground-specific booking URL.
 * Mirrors the deep-link patterns from AlertCard.tsx and platforms.js.
 */
// Camis-based platforms all share the /create-booking/results?resourceLocationId={id} pattern
const CAMIS_BOOKING_DOMAINS: Record<string, string> = {
  bc_parks: "camping.bcparks.ca",
  ontario_parks: "reservations.ontarioparks.ca",
  parks_canada: "reservation.pc.gc.ca",
  gtc_manitoba: "manitoba.goingtocamp.com",
  gtc_novascotia: "novascotia.goingtocamp.com",
  gtc_longpoint: "longpoint.goingtocamp.com",
  gtc_maitland: "maitlandvalley.goingtocamp.com",
  gtc_stclair: "stclair.goingtocamp.com",
  gtc_nlcamping: "nlcamping.ca",
  gtc_new_brunswick: "reservations.parcsnbparks.ca",
};

function getBookingUrl(platform: string, campgroundId: string): string | null {
  if (!campgroundId) return null;
  const camisDomain = CAMIS_BOOKING_DOMAINS[platform];
  if (camisDomain) {
    return `https://${camisDomain}/create-booking/results?resourceLocationId=${encodeURIComponent(campgroundId)}`;
  }
  if (platform === "recreation_gov") {
    return `https://www.recreation.gov/camping/campgrounds/${encodeURIComponent(campgroundId)}`;
  }
  return null;
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

// ─── SMS/WhatsApp via Sent.dm ─────────────────────────────────────────────────

let _sentdm: SentDm | null = null;

function getSentDm(): SentDm | null {
  if (_sentdm) return _sentdm;
  const key = process.env.SENTDM_API_KEY;
  if (!key) {
    log.warn("SENTDM_API_KEY not set — SMS/WhatsApp notifications disabled");
    return null;
  }
  _sentdm = new SentDm({ apiKey: key });
  return _sentdm;
}

interface AlertSMSParams {
  phone: string;
  campgroundName: string;
  campgroundId: string;
  platform: string;
  sites: AvailableSite[];
}

export async function sendAlertSMS(params: AlertSMSParams): Promise<boolean> {
  const client = getSentDm();
  if (!client) return false;

  const siteCount = params.sites.length;
  const bookingUrl = getBookingUrl(params.platform, params.campgroundId);
  const templateName = process.env.SENTDM_TEMPLATE_NAME ?? "campsite_alert";

  try {
    const response = await client.messages.send({
      channel: ["sms", "whatsapp"],
      to: [params.phone],
      template: {
        name: templateName,
        parameters: {
          campground_name: params.campgroundName,
          site_count: String(siteCount),
          booking_url: bookingUrl ?? "https://alphacamper.com",
        },
      },
    });

    if (!response.success) {
      log.error("Sent.dm API error", {
        recipient: maskPii(params.phone),
        campground: params.campgroundName,
        error: response.error,
      });
      return false;
    }

    log.info("Alert message sent", {
      recipient: maskPii(params.phone),
      campground: params.campgroundName,
      messageIds: response.data?.recipients?.map((r) => r.message_id),
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
  _sentdm = null;
}

// Exported for testing
export { buildAlertHtml, getResend };
