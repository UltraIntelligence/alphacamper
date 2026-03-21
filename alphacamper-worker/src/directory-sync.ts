import { log } from "./logger.js";
import { fetchCampgroundMap } from "./id-resolver.js";
import { upsertCampgrounds } from "./supabase.js";
import { DOMAINS } from "./config.js";

const PLATFORM_PROVINCE: Record<string, string | null> = {
  bc_parks: "BC",
  ontario_parks: "ON",
  parks_canada: null, // spans AB, BC, ON, NB, PE, etc. — unknown from Camis API
};

const BATCH_SIZE = 200;

export async function syncDirectoryForDomain(
  platform: string,
  cookieHeader: string,
): Promise<void> {
  const domain = DOMAINS[platform];
  if (!domain) return;

  const map = await fetchCampgroundMap(domain, cookieHeader);
  if (map.size === 0) {
    log.warn("Empty campground map — skipping sync", { platform });
    return;
  }

  // The map is indexed by resourceLocationId, shortName, and fullName — deduplicate by numeric ID
  const seen = new Set<number>();
  const rows: Parameters<typeof upsertCampgrounds>[0] = [];
  for (const entry of map.values()) {
    if (seen.has(entry.resourceLocationId)) continue;
    seen.add(entry.resourceLocationId);
    rows.push({
      id: String(entry.resourceLocationId),
      platform,
      name: entry.fullName || entry.shortName,
      short_name: entry.shortName || null,
      province: PLATFORM_PROVINCE[platform] ?? null,
    });
  }

  let allSucceeded = true;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const ok = await upsertCampgrounds(rows.slice(i, i + BATCH_SIZE));
    if (!ok) allSucceeded = false;
  }

  if (allSucceeded) {
    log.info("Directory sync complete", { platform, count: rows.length });
  } else {
    log.warn("Directory sync completed with errors", { platform, count: rows.length });
  }
}
