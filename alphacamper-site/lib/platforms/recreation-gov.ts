import type { PlatformPoller, WatchedTarget, AvailabilityResult, AvailableSite } from "./types";

interface RecreationGovSite {
  site: string;
  availabilities: Record<string, string>;
}

interface RecreationGovResponse {
  campsites: Record<string, RecreationGovSite>;
}

export class RecreationGovPoller implements PlatformPoller {
  async checkCampground(
    watches: WatchedTarget[],
    signal?: AbortSignal,
  ): Promise<AvailabilityResult[]> {
    if (watches.length === 0) return [];

    // All watches in this group share the same campground_id
    const campgroundId = watches[0].campground_id;

    const REC_GOV_BASE = `https://www.recreation.gov/api/camps/availability/campground/${campgroundId}`;

    // Collect all distinct months needed across all watches
    const monthsNeeded = new Set<string>();
    for (const watch of watches) {
      const arrival = new Date(watch.arrival_date);
      const departure = new Date(watch.departure_date);
      const d = new Date(arrival);
      while (d < departure) {
        const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        monthsNeeded.add(monthKey);
        d.setUTCMonth(d.getUTCMonth() + 1);
        d.setUTCDate(1);
      }
    }

    // Fetch each month and merge campsites
    const allCampsites: Record<string, { site: string; availabilities: Record<string, string> }> = {};

    for (const monthKey of monthsNeeded) {
      const [year, month] = monthKey.split('-').map(Number);
      const monthStart = new Date(Date.UTC(year, month - 1, 1));
      const monthStr = monthStart.toISOString().split("T")[0] + "T00:00:00.000Z";

      try {
        const res = await fetch(
          `${REC_GOV_BASE}/month?start_date=${monthStr}`,
          {
            headers: {
              "User-Agent": "Alphacamper/0.2.0",
              Accept: "application/json",
            },
            signal,
          },
        );

        if (!res.ok) continue;

        const data = await res.json();
        const campsites = data?.campsites || {};

        // Merge: for each site, merge availabilities
        for (const [siteId, siteData] of Object.entries(campsites) as [string, { site: unknown; availabilities?: Record<string, unknown> }][]) {
          if (!allCampsites[siteId]) {
            allCampsites[siteId] = { site: siteData.site, availabilities: {} };
          }
          Object.assign(allCampsites[siteId].availabilities, siteData.availabilities || {});
        }
      } catch {
        continue;
      }
    }

    const results: AvailabilityResult[] = [];

    for (const watch of watches) {
      const arrival = new Date(watch.arrival_date);
      const departure = new Date(watch.departure_date);
      const availableSites: AvailableSite[] = [];

      for (const [siteId, siteData] of Object.entries(allCampsites)) {
        // Filter by specific site number if the watch specifies one
        if (watch.site_number && siteData.site !== watch.site_number) continue;

        // Check that every night in the range is "Available"
        let allAvailable = true;
        const d = new Date(arrival);
        while (d < departure) {
          const dateKey = d.toISOString().split("T")[0] + "T00:00:00Z";
          if (siteData.availabilities?.[dateKey] !== "Available") {
            allAvailable = false;
            break;
          }
          d.setUTCDate(d.getUTCDate() + 1);
        }

        if (allAvailable) {
          availableSites.push({
            siteId,
            siteName: siteData.site || siteId,
          });
        }
      }

      if (availableSites.length > 0) {
        results.push({
          watchId: watch.id,
          userId: watch.user_id,
          sites: availableSites,
        });
      }
    }

    return results;
  }
}
