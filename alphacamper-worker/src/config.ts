import "./env.js";

export const DOMAINS: Record<string, string> = {
  bc_parks: "camping.bcparks.ca",
  ontario_parks: "reservations.ontarioparks.ca",
  parks_canada: "reservation.pc.gc.ca",
  // GoingToCamp white-label domains — same Camis API surface
  gtc_manitoba: "manitoba.goingtocamp.com",
  gtc_novascotia: "novascotia.goingtocamp.com",
  gtc_longpoint: "longpoint.goingtocamp.com",
  gtc_maitland: "maitlandvalley.goingtocamp.com",
  gtc_stclair: "stclair.goingtocamp.com",
  gtc_nlcamping: "nlcamping.ca",
  gtc_new_brunswick: "reservations.parcsnbparks.ca",
};

export const RECREATION_GOV_PLATFORM = "recreation_gov";

export const SUPPORTED_PLATFORMS = [
  ...Object.keys(DOMAINS),
  RECREATION_GOV_PLATFORM,
];

export const COOKIE_TTLS: Record<string, number> = {
  "camping.bcparks.ca": 25 * 60 * 1000,
  "reservations.ontarioparks.ca": 20 * 60 * 1000,
  "reservation.pc.gc.ca": 20 * 60 * 1000,
  "manitoba.goingtocamp.com": 20 * 60 * 1000,
  "novascotia.goingtocamp.com": 20 * 60 * 1000,
  "longpoint.goingtocamp.com": 20 * 60 * 1000,
  "maitlandvalley.goingtocamp.com": 20 * 60 * 1000,
  "stclair.goingtocamp.com": 20 * 60 * 1000,
  "nlcamping.ca": 20 * 60 * 1000,
  "reservations.parcsnbparks.ca": 20 * 60 * 1000,
};

export const POLL_INTERVAL_FAST_MS = Number(process.env.POLL_INTERVAL_FAST_MS) || 5 * 60 * 1000;
export const POLL_INTERVAL_SLOW_MS = Number(process.env.POLL_INTERVAL_SLOW_MS) || 15 * 60 * 1000;
export const CYCLE_TIMEOUT_MS = Number(process.env.CYCLE_TIMEOUT_MS) || 20 * 60 * 1000;
export const REQUEST_DELAY_MS = 2000;
export const MAX_CAMPGROUNDS_PER_CYCLE = 500;

export const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || "";
export const CAMPFLARE_API_KEY = process.env.CAMPFLARE_API_KEY || "";

export function getDisabledPlatforms(): Set<string> {
  const raw = process.env.DISABLED_PLATFORMS || "";
  return new Set(raw.split(",").map(s => s.trim()).filter(Boolean));
}

export const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export const CAMIS_APP_VERSION = "5.106.226";
