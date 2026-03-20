import type {
  PlatformPoller,
  WatchedTarget,
  AvailabilityResult,
  AvailableSite,
} from "./types";

export const GOING_TO_CAMP_DOMAINS: Record<string, string> = {
  bc_parks: "camping.bcparks.ca",
  ontario_parks: "reservations.ontarioparks.ca",
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Format a Date to GoingToCamp's YY-Mon-DD format using UTC values */
export function formatGtcDate(date: Date): string {
  const year = String(date.getUTCFullYear()).slice(-2);
  const month = MONTH_NAMES[date.getUTCMonth()];
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface GtcSite {
  name: string;
}

interface GtcResource {
  resourceId: number;
  site: GtcSite;
  availabilities: Record<string, string>;
}

interface GtcResponse {
  resourceAvailabilities: GtcResource[];
}

export class GoingToCampPoller implements PlatformPoller {
  async checkCampground(
    watches: WatchedTarget[],
    signal?: AbortSignal
  ): Promise<AvailabilityResult[]> {
    if (watches.length === 0) return [];

    const { platform, campground_id: campgroundId } = watches[0];
    const domain = GOING_TO_CAMP_DOMAINS[platform];
    if (!domain) return [];

    const apiUrl = `https://${domain}/api/maps/mapdatabyid`;

    // Use the arrival/departure of the first watch for the API request;
    // each watch is evaluated individually against the returned data.
    const arrivalDate = new Date(watches[0].arrival_date);
    const departureDate = new Date(watches[0].departure_date);

    let resources: GtcResource[] = [];

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": "en-US",
          "User-Agent":
            "Mozilla/5.0 (compatible; Alphacamper/0.2.0; +https://alphacamper.com)",
        },
        body: JSON.stringify({
          mapId: Number(campgroundId),
          startDate: formatGtcDate(arrivalDate),
          endDate: formatGtcDate(departureDate),
          partySize: 1,
        }),
      });

      if (!res.ok) {
        return [];
      }

      const data: GtcResponse = await res.json();
      resources = data?.resourceAvailabilities ?? [];
    } catch {
      // Network failure or abort — return empty, do not throw
      return [];
    }

    const results: AvailabilityResult[] = [];

    for (const watch of watches) {
      const arrival = new Date(watch.arrival_date);
      const departure = new Date(watch.departure_date);
      const availableSites: AvailableSite[] = [];

      for (const resource of resources) {
        const siteName = resource.site?.name ?? String(resource.resourceId);

        // Filter by specific site name if the watch specifies one
        if (watch.site_number && siteName !== watch.site_number) continue;

        // Check that every night in the range is "AVAILABLE"
        let allAvailable = true;
        const d = new Date(arrival);
        while (d < departure) {
          const dateKey = d.toISOString().split("T")[0] + "T00:00:00Z";
          if (resource.availabilities?.[dateKey] !== "AVAILABLE") {
            allAvailable = false;
            break;
          }
          d.setUTCDate(d.getUTCDate() + 1);
        }

        if (allAvailable) {
          availableSites.push({
            siteId: String(resource.resourceId),
            siteName,
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
