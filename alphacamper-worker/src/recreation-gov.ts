import { USER_AGENT } from "./config.js";
import type { PollOutcome, PollResult } from "./poller.js";
import type { AvailableSite, WatchedTarget } from "./supabase.js";

interface RecreationGovSitePayload {
  site?: unknown;
  availabilities?: Record<string, unknown>;
}

interface RecreationGovAvailabilityResponse {
  campsites?: Record<string, RecreationGovSitePayload>;
}

interface RecreationGovSite {
  site: string;
  availabilities: Record<string, string>;
}

function collectMonthKeys(watches: WatchedTarget[]): Set<string> {
  const monthsNeeded = new Set<string>();

  for (const watch of watches) {
    const arrival = new Date(watch.arrival_date);
    const departure = new Date(watch.departure_date);
    if (Number.isNaN(arrival.getTime()) || Number.isNaN(departure.getTime())) {
      continue;
    }

    const cursor = new Date(Date.UTC(arrival.getUTCFullYear(), arrival.getUTCMonth(), 1));
    while (cursor < departure) {
      monthsNeeded.add(
        `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`,
      );
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  }

  return monthsNeeded;
}

function toRecGovMonthStart(monthKey: string): string | null {
  const [yearRaw, monthRaw] = monthKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return `${new Date(Date.UTC(year, month - 1, 1)).toISOString().split("T")[0]}T00:00:00.000Z`;
}

function mergeCampsites(
  target: Record<string, RecreationGovSite>,
  campsites: Record<string, RecreationGovSitePayload>,
): void {
  for (const [siteId, siteData] of Object.entries(campsites)) {
    if (!target[siteId]) {
      target[siteId] = {
        site: typeof siteData.site === "string" ? siteData.site : String(siteData.site ?? ""),
        availabilities: {},
      };
    }

    for (const [dateKey, status] of Object.entries(siteData.availabilities ?? {})) {
      if (typeof status === "string") {
        target[siteId].availabilities[dateKey] = status;
      }
    }
  }
}

function availableSitesForWatch(
  watch: WatchedTarget,
  campsites: Record<string, RecreationGovSite>,
): AvailableSite[] {
  const arrival = new Date(watch.arrival_date);
  const departure = new Date(watch.departure_date);
  if (
    Number.isNaN(arrival.getTime()) ||
    Number.isNaN(departure.getTime()) ||
    departure <= arrival
  ) {
    return [];
  }

  const availableSites: AvailableSite[] = [];

  for (const [siteId, siteData] of Object.entries(campsites)) {
    if (watch.site_number && siteData.site !== watch.site_number) continue;

    let allAvailable = true;
    const cursor = new Date(arrival);
    while (cursor < departure) {
      const dateKey = `${cursor.toISOString().split("T")[0]}T00:00:00Z`;
      if (siteData.availabilities[dateKey] !== "Available") {
        allAvailable = false;
        break;
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    if (allAvailable) {
      availableSites.push({
        siteId,
        siteName: siteData.site || siteId,
      });
    }
  }

  return availableSites;
}

export async function checkRecreationGovCampground(
  watches: WatchedTarget[],
  signal?: AbortSignal,
): Promise<PollOutcome> {
  if (watches.length === 0) return { results: [], httpStatus: 200 };

  const campgroundId = watches[0].campground_id;
  const apiBase = `https://www.recreation.gov/api/camps/availability/campground/${encodeURIComponent(campgroundId)}`;
  const campsites: Record<string, RecreationGovSite> = {};

  for (const monthKey of collectMonthKeys(watches)) {
    const monthStart = toRecGovMonthStart(monthKey);
    if (!monthStart) continue;

    try {
      const res = await fetch(`${apiBase}/month?start_date=${monthStart}`, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
        },
        signal,
      });

      if (!res.ok) {
        return { results: [], httpStatus: res.status };
      }

      const data = (await res.json()) as RecreationGovAvailabilityResponse;
      mergeCampsites(campsites, data.campsites ?? {});
    } catch {
      return { results: [], httpStatus: null };
    }
  }

  const results: PollResult[] = [];
  for (const watch of watches) {
    const sites = availableSitesForWatch(watch, campsites);
    if (sites.length > 0) {
      results.push({
        watchId: watch.id,
        userId: watch.user_id,
        sites,
      });
    }
  }

  return { results, httpStatus: 200 };
}
