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

    // Use the arrival date of the first watch to determine the month to fetch
    const startDate = new Date(watches[0].arrival_date);
    const monthStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const monthStartStr = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}-01T00:00:00.000Z`;

    const apiUrl = `https://www.recreation.gov/api/camps/availability/campground/${campgroundId}/month?start_date=${monthStartStr}`;

    let campsites: Record<string, RecreationGovSite> = {};

    try {
      const res = await fetch(apiUrl, {
        signal,
        headers: {
          "User-Agent": "Alphacamper/0.2.0",
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        return [];
      }

      const data: RecreationGovResponse = await res.json();
      campsites = data?.campsites || {};
    } catch {
      // Fetch failure or abort — return empty results, do not throw
      return [];
    }

    const results: AvailabilityResult[] = [];

    for (const watch of watches) {
      const arrival = new Date(watch.arrival_date);
      const departure = new Date(watch.departure_date);
      const availableSites: AvailableSite[] = [];

      for (const [siteId, siteData] of Object.entries(campsites)) {
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
          d.setDate(d.getDate() + 1);
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
