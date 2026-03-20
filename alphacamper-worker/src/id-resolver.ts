import { log } from "./logger.js";
import { CAMIS_APP_VERSION } from "./config.js";

interface CamisCampground {
  resourceLocationId: number;
  rootMapId: number;
  shortName: string;
  fullName: string;
}

// Cache per domain: key -> CamisCampground
const cache = new Map<string, Map<string, CamisCampground>>();

export async function fetchCampgroundMap(
  domain: string,
  cookieHeader: string,
): Promise<Map<string, CamisCampground>> {
  if (cache.has(domain)) return cache.get(domain)!;

  const url = `https://${domain}/api/resourceLocation`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
      "app-language": "en-CA",
      "app-version": CAMIS_APP_VERSION,
      Cookie: cookieHeader,
    },
  });

  if (!res.ok) {
    log.error(`Failed to fetch campground list from ${domain}`, { status: res.status });
    return new Map();
  }

  const data: Array<{
    resourceLocationId: number;
    rootMapId: number;
    localizedValues: Array<{ shortName: string; fullName: string }>;
  }> = await res.json();

  const map = new Map<string, CamisCampground>();
  for (const item of data) {
    const short = item.localizedValues?.[0]?.shortName || "";
    const full = item.localizedValues?.[0]?.fullName || "";
    const entry: CamisCampground = {
      resourceLocationId: item.resourceLocationId,
      rootMapId: item.rootMapId,
      shortName: short,
      fullName: full,
    };
    // Index by multiple keys for flexible lookup
    map.set(String(item.resourceLocationId), entry);
    map.set(short.toLowerCase(), entry);
    if (full) map.set(full.toLowerCase(), entry);
  }

  cache.set(domain, map);
  log.info(`Cached ${data.length} campgrounds for ${domain}`);
  return map;
}

export function resolveCampground(
  campgroundMap: Map<string, CamisCampground>,
  campgroundId: string,
  campgroundName: string,
): CamisCampground | null {
  // Try by ID first
  let result = campgroundMap.get(campgroundId);
  if (result) return result;

  // Try by name (case-insensitive)
  result = campgroundMap.get(campgroundName.toLowerCase());
  if (result) return result;

  // Try partial name match
  for (const [key, value] of campgroundMap) {
    if (key.includes(campgroundName.toLowerCase()) || campgroundName.toLowerCase().includes(key)) {
      return value;
    }
  }

  return null;
}

export function clearCache(): void {
  cache.clear();
}
