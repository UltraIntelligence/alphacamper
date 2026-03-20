import { USER_AGENT, REQUEST_DELAY_MS } from "./config.js";
import { log } from "./logger.js";
import type { WatchedTarget, AvailableSite } from "./supabase.js";

export interface PollResult {
  watchId: string;
  userId: string;
  sites: AvailableSite[];
}

export interface PollOutcome {
  results: PollResult[];
  httpStatus: number | null;
}

interface CartInfo {
  cartUid: string;
  cartTransactionUid: string;
}

// Per-domain cart cache (carts are tied to cookies)
const cartCache = new Map<string, CartInfo>();

export async function getCart(domain: string, cookieHeader: string): Promise<CartInfo | null> {
  if (cartCache.has(domain)) return cartCache.get(domain)!;

  try {
    const res = await fetch(`https://${domain}/api/cart`, {
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "app-language": "en-CA",
        "app-version": "5.106.226",
        Cookie: cookieHeader,
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const info: CartInfo = {
      cartUid: data.cartUid,
      cartTransactionUid: data.createTransactionUid,
    };
    cartCache.set(domain, info);
    return info;
  } catch {
    return null;
  }
}

export function clearCartCache(): void {
  cartCache.clear();
}

export async function checkCampground(
  domain: string,
  mapId: number,
  watches: WatchedTarget[],
  cookieHeader: string,
): Promise<PollOutcome> {
  // Get cart
  const cart = await getCart(domain, cookieHeader);
  if (!cart) {
    log.warn(`No cart available for ${domain}`);
    return { results: [], httpStatus: null };
  }

  // Compute date envelope across all watches
  let earliest = watches[0].arrival_date;
  let latest = watches[0].departure_date;
  for (const w of watches) {
    if (w.arrival_date < earliest) earliest = w.arrival_date;
    if (w.departure_date > latest) latest = w.departure_date;
  }

  // Build availability URL
  const params = new URLSearchParams({
    mapId: String(mapId),
    bookingCategoryId: "0",
    equipmentCategoryId: "-32768",
    subEquipmentCategoryId: "-32768",
    cartUid: cart.cartUid,
    cartTransactionUid: cart.cartTransactionUid,
    bookingUid: crypto.randomUUID(),
    groupHoldUid: "",
    startDate: earliest,
    endDate: latest,
    getDailyAvailability: "true",
    isReserving: "true",
    filterData: "[]",
    boatLength: "0",
    boatDraft: "0",
    boatWidth: "0",
    peopleCapacityCategoryCounts: "[]",
    numEquipment: "0",
    seed: new Date().toISOString(),
  });

  const url = `https://${domain}/api/availability/map?${params}`;

  let data: any;
  let httpStatus: number;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "app-language": "en-CA",
        "app-version": "5.106.226",
        "User-Agent": USER_AGENT,
        Cookie: cookieHeader,
      },
    });

    httpStatus = res.status;

    if (!res.ok) {
      log.warn(`HTTP ${res.status} from ${domain}/api/availability/map`, { mapId });
      return { results: [], httpStatus };
    }

    data = await res.json();
  } catch (err) {
    log.error(`Request failed for ${domain}`, { mapId, error: String(err) });
    return { results: [], httpStatus: null };
  }

  // If response has mapLinkAvailabilities but no resourceAvailabilities,
  // we're at the root map level and need to drill into sub-maps
  const resourceAvail: Record<string, Array<{ availability: number }>> =
    data?.resourceAvailabilities || {};

  // If no resources at this level, check sub-maps
  if (Object.keys(resourceAvail).length === 0 && data?.mapLinkAvailabilities) {
    // Drill into each sub-map that has any availability
    const subMapIds = Object.keys(data.mapLinkAvailabilities);
    const allResults: PollResult[] = [];

    for (const subMapId of subMapIds) {
      // Check if sub-map has any available nights (code 0)
      const subAvail: number[] = data.mapLinkAvailabilities[subMapId];
      if (!subAvail.some((code: number) => code === 0)) continue;

      await delay(REQUEST_DELAY_MS);
      const subOutcome = await checkCampground(
        domain,
        Number(subMapId),
        watches,
        cookieHeader,
      );
      allResults.push(...subOutcome.results);
    }

    return { results: dedupeResults(allResults), httpStatus: 200 };
  }

  // Parse site-level availability
  const results: PollResult[] = [];

  for (const watch of watches) {
    const arrivalDate = new Date(watch.arrival_date);
    const departureDate = new Date(watch.departure_date);

    // Calculate which array indices correspond to this watch's nights
    const envelopeStart = new Date(earliest);
    const startIdx = Math.round(
      (arrivalDate.getTime() - envelopeStart.getTime()) / (24 * 60 * 60 * 1000),
    );
    const nights = Math.round(
      (departureDate.getTime() - arrivalDate.getTime()) / (24 * 60 * 60 * 1000),
    );

    const availableSites: AvailableSite[] = [];

    for (const [siteId, nightData] of Object.entries(resourceAvail)) {
      // Check all nights in this watch's range
      let allAvailable = true;
      for (let i = startIdx; i < startIdx + nights; i++) {
        if (i >= nightData.length || nightData[i].availability !== 0) {
          allAvailable = false;
          break;
        }
      }

      if (allAvailable) {
        availableSites.push({ siteId, siteName: siteId });
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

  return { results, httpStatus: 200 };
}

function dedupeResults(results: PollResult[]): PollResult[] {
  const seen = new Map<string, PollResult>();
  for (const r of results) {
    const existing = seen.get(r.watchId);
    if (existing) {
      // Merge sites
      const siteIds = new Set(existing.sites.map(s => s.siteId));
      for (const site of r.sites) {
        if (!siteIds.has(site.siteId)) {
          existing.sites.push(site);
        }
      }
    } else {
      seen.set(r.watchId, { ...r, sites: [...r.sites] });
    }
  }
  return [...seen.values()];
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
