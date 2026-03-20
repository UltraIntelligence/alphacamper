export const DOMAINS: Record<string, string> = {
  bc_parks: "camping.bcparks.ca",
  ontario_parks: "reservations.ontarioparks.ca",
};

export const SUPPORTED_PLATFORMS = Object.keys(DOMAINS);

export const COOKIE_TTLS: Record<string, number> = {
  "camping.bcparks.ca": 25 * 60 * 1000,
  "reservations.ontarioparks.ca": 20 * 60 * 1000,
};

export const POLL_INTERVAL_FAST_MS = Number(process.env.POLL_INTERVAL_FAST_MS) || 5 * 60 * 1000;
export const POLL_INTERVAL_SLOW_MS = Number(process.env.POLL_INTERVAL_SLOW_MS) || 15 * 60 * 1000;
export const CYCLE_TIMEOUT_MS = Number(process.env.CYCLE_TIMEOUT_MS) || 20 * 60 * 1000;
export const REQUEST_DELAY_MS = 2000;
export const MAX_CAMPGROUNDS_PER_CYCLE = 500;

export const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || "";

export function getDisabledPlatforms(): Set<string> {
  const raw = process.env.DISABLED_PLATFORMS || "";
  return new Set(raw.split(",").map(s => s.trim()).filter(Boolean));
}

export const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export const CAMIS_APP_VERSION = "5.106.226";
