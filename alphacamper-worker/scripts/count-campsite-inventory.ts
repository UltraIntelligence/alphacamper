/// <reference types="node" />
/**
 * Read-only campsite inventory proof.
 *
 * Counts campsite-level resource IDs from the same CAMIS availability endpoint
 * the Railway worker uses for alerts. This proves inventory enumeration only:
 * it does not prove active customer watches, worker heartbeat, or notification
 * delivery.
 *
 * Usage:
 *   npx tsx scripts/count-campsite-inventory.ts
 *   npx tsx scripts/count-campsite-inventory.ts bc_parks ontario_parks
 *   npx tsx scripts/count-campsite-inventory.ts --max-campgrounds 5 --delay-ms 500
 */

import "../src/env.js";
import { fileURLToPath } from "node:url";
import { CookieManager } from "../src/cookie-manager.js";
import { CAMIS_APP_VERSION, DOMAINS, REQUEST_DELAY_MS, USER_AGENT } from "../src/config.js";
import { buildCatalogCampgroundRows, CATALOG_PROVIDER_PROFILES } from "../src/catalog-ingestion.js";
import { fetchCampgroundMap } from "../src/id-resolver.js";
import { delay, getCart } from "../src/poller.js";

type RunStatus = "green" | "yellow" | "red";

interface Options {
  platforms: string[];
  startDate: string;
  endDate: string;
  delayMs: number;
  maxCampgrounds: number | null;
}

interface CountResult {
  ok: boolean;
  httpStatus: number | null;
  resourceCount: number;
  mapCalls: number;
  error: string | null;
}

interface CampgroundResult {
  id: string;
  name: string;
  rootMapId: number;
  campsiteCount: number;
  mapCalls: number;
  ok: boolean;
  error: string | null;
}

interface PlatformSummary {
  platform: string;
  providerName: string;
  domain: string;
  campgroundRows: number;
  countableCampgroundRows: number;
  campgroundsChecked: number;
  excludedCampgrounds: number;
  campsiteCount: number;
  failedCampgrounds: number;
  status: RunStatus;
  error: string | null;
}

interface ExcludedCampgroundRow {
  id: string;
  name: string;
  reason: string;
}

const DEFAULT_PLATFORMS = Object.values(CATALOG_PROVIDER_PROFILES)
  .filter((profile) => (
    profile.supportStatus === "alertable" &&
    profile.availabilityMode === "live_polling" &&
    DOMAINS[profile.platform]
  ))
  .map((profile) => profile.platform);

export function isCountableRootMapId(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function splitCountableCampgroundRows<T extends { id: string; name: string; root_map_id: unknown }>(
  rows: T[],
): { countableRows: Array<T & { root_map_id: number }>; excludedRows: ExcludedCampgroundRow[] } {
  const countableRows: Array<T & { root_map_id: number }> = [];
  const excludedRows: ExcludedCampgroundRow[] = [];

  for (const row of rows) {
    if (isCountableRootMapId(row.root_map_id)) {
      countableRows.push(row as T & { root_map_id: number });
      continue;
    }

    excludedRows.push({
      id: row.id,
      name: row.name,
      reason: `missing provider root map ID (${String(row.root_map_id)})`,
    });
  }

  return { countableRows, excludedRows };
}

function readOptionValue(argv: string[], index: number, name: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return value;
}

function parseArgs(argv: string[]): Options {
  const options: Options = {
    platforms: [],
    startDate: "2026-07-15",
    endDate: "2026-07-16",
    delayMs: REQUEST_DELAY_MS,
    maxCampgrounds: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--start-date") {
      options.startDate = readOptionValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--end-date") {
      options.endDate = readOptionValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--delay-ms") {
      const value = Number(readOptionValue(argv, index, arg));
      if (!Number.isFinite(value) || value < 0) throw new Error("--delay-ms must be >= 0");
      options.delayMs = value;
      index += 1;
      continue;
    }
    if (arg === "--max-campgrounds") {
      const value = Number(readOptionValue(argv, index, arg));
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error("--max-campgrounds must be a positive integer");
      }
      options.maxCampgrounds = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    options.platforms.push(arg);
  }

  if (options.platforms.length === 0) {
    options.platforms = DEFAULT_PLATFORMS;
  }

  const unknown = options.platforms.filter((platform) => !DOMAINS[platform]);
  if (unknown.length > 0) {
    throw new Error(
      `Unknown CAMIS platform(s): ${unknown.join(", ")}. Supported: ${Object.keys(DOMAINS).join(", ")}`,
    );
  }

  const start = new Date(`${options.startDate}T00:00:00Z`);
  const end = new Date(`${options.endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new Error("--start-date and --end-date must be valid YYYY-MM-DD values, with end after start");
  }

  return options;
}

function buildAvailabilityUrl(
  domain: string,
  mapId: number,
  cookieCart: { cartUid: string; cartTransactionUid: string },
  options: Pick<Options, "startDate" | "endDate">,
): string {
  const params = new URLSearchParams({
    mapId: String(mapId),
    bookingCategoryId: "0",
    equipmentCategoryId: "-32768",
    subEquipmentCategoryId: "-32768",
    cartUid: cookieCart.cartUid,
    cartTransactionUid: cookieCart.cartTransactionUid,
    bookingUid: crypto.randomUUID(),
    groupHoldUid: "",
    startDate: options.startDate,
    endDate: options.endDate,
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

  return `https://${domain}/api/availability/map?${params}`;
}

async function fetchAvailabilityMap(
  domain: string,
  cookieHeader: string,
  url: string,
): Promise<{ ok: boolean; status: number | null; payload: any; error: string | null }> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
        "app-language": "en-CA",
        "app-version": CAMIS_APP_VERSION,
        "User-Agent": USER_AGENT,
        Origin: `https://${domain}`,
        Referer: `https://${domain}/`,
        Cookie: cookieHeader,
      },
    });

    const text = await response.text();
    if (!response.ok) {
      return { ok: false, status: response.status, payload: null, error: text.slice(0, 300) };
    }

    return {
      ok: true,
      status: response.status,
      payload: text ? JSON.parse(text) : {},
      error: null,
    };
  } catch (error) {
    return { ok: false, status: null, payload: null, error: String(error) };
  }
}

async function collectResourcesForMap(
  domain: string,
  cookieHeader: string,
  cart: { cartUid: string; cartTransactionUid: string },
  options: Options,
  mapId: number,
  resourceIds: Set<string>,
  visitedMapIds: Set<number>,
  depth = 0,
): Promise<CountResult> {
  if (visitedMapIds.has(mapId)) {
    return { ok: true, httpStatus: 200, resourceCount: resourceIds.size, mapCalls: 0, error: null };
  }

  if (depth > 6) {
    return {
      ok: false,
      httpStatus: null,
      resourceCount: resourceIds.size,
      mapCalls: 0,
      error: `Exceeded nested map depth at mapId ${mapId}`,
    };
  }

  visitedMapIds.add(mapId);

  const url = buildAvailabilityUrl(domain, mapId, cart, options);
  const response = await fetchAvailabilityMap(domain, cookieHeader, url);
  if (!response.ok) {
    return {
      ok: false,
      httpStatus: response.status,
      resourceCount: resourceIds.size,
      mapCalls: 1,
      error: response.error,
    };
  }

  const resourceAvailabilities = response.payload?.resourceAvailabilities ?? {};
  for (const siteId of Object.keys(resourceAvailabilities)) {
    resourceIds.add(siteId);
  }

  let mapCalls = 1;
  for (const subMapIdRaw of Object.keys(response.payload?.mapLinkAvailabilities ?? {})) {
    const subMapId = Number(subMapIdRaw);
    if (!Number.isFinite(subMapId)) continue;
    if (options.delayMs > 0) await delay(options.delayMs);
    const subResult = await collectResourcesForMap(
      domain,
      cookieHeader,
      cart,
      options,
      subMapId,
      resourceIds,
      visitedMapIds,
      depth + 1,
    );
    mapCalls += subResult.mapCalls;
    if (!subResult.ok) {
      return {
        ok: false,
        httpStatus: subResult.httpStatus,
        resourceCount: resourceIds.size,
        mapCalls,
        error: subResult.error,
      };
    }
  }

  return { ok: true, httpStatus: 200, resourceCount: resourceIds.size, mapCalls, error: null };
}

async function countCampground(
  domain: string,
  cookieHeader: string,
  cart: { cartUid: string; cartTransactionUid: string },
  options: Options,
  campground: { id: string; name: string; root_map_id: number },
): Promise<CampgroundResult> {
  const resourceIds = new Set<string>();
  const visitedMapIds = new Set<number>();
  const result = await collectResourcesForMap(
    domain,
    cookieHeader,
    cart,
    options,
    campground.root_map_id,
    resourceIds,
    visitedMapIds,
  );

  return {
    id: campground.id,
    name: campground.name,
    rootMapId: campground.root_map_id,
    campsiteCount: result.resourceCount,
    mapCalls: result.mapCalls,
    ok: result.ok,
    error: result.error,
  };
}

function platformRunStatus(summary: PlatformSummary): RunStatus {
  if (
    summary.error ||
    summary.countableCampgroundRows === 0 ||
    summary.campgroundsChecked === 0 ||
    summary.campsiteCount === 0
  ) return "red";
  if (summary.failedCampgrounds > 0 || summary.campgroundsChecked < summary.countableCampgroundRows) {
    return "yellow";
  }
  return "green";
}

async function countPlatform(
  platform: string,
  cookieManager: CookieManager,
  options: Options,
): Promise<PlatformSummary> {
  const domain = DOMAINS[platform];
  const profile = CATALOG_PROVIDER_PROFILES[platform];
  const providerName = profile?.providerName ?? platform;

  const summary: PlatformSummary = {
    platform,
    providerName,
    domain,
    campgroundRows: 0,
    countableCampgroundRows: 0,
    campgroundsChecked: 0,
    excludedCampgrounds: 0,
    campsiteCount: 0,
    failedCampgrounds: 0,
    status: "red",
    error: null,
  };

  console.log(`\n─── ${providerName} · ${platform} · ${domain} ───`);
  const cookieOk = await cookieManager.refreshCookies(domain);
  if (!cookieOk) {
    summary.error = "Cookie refresh failed; provider may be blocking the browser session.";
    console.log(`Status: red — ${summary.error}`);
    return summary;
  }

  const cookieHeader = cookieManager.getCookieHeader(domain);
  const campgroundMap = await fetchCampgroundMap(domain, cookieHeader);
  const rows = buildCatalogCampgroundRows(platform, campgroundMap).sort((a, b) => (
    a.name.localeCompare(b.name)
  ));
  const { countableRows, excludedRows } = splitCountableCampgroundRows(rows);
  const rowsToCheck = options.maxCampgrounds ? countableRows.slice(0, options.maxCampgrounds) : countableRows;

  summary.campgroundRows = rows.length;
  summary.countableCampgroundRows = countableRows.length;
  summary.excludedCampgrounds = excludedRows.length;
  console.log(
    `Campground rows from provider directory: ${rows.length}` +
    ` (${countableRows.length} countable, ${excludedRows.length} excluded)`,
  );
  for (const excluded of excludedRows) {
    console.log(`Excluded ${excluded.name}: ${excluded.reason}`);
  }
  if (options.maxCampgrounds) {
    console.log(`Limited proof run: checking first ${rowsToCheck.length} row(s).`);
  }

  const cart = await getCart(domain, cookieHeader);
  if (!cart) {
    summary.error = "Could not create provider cart/session for availability calls.";
    console.log(`Status: red — ${summary.error}`);
    return summary;
  }

  for (let index = 0; index < rowsToCheck.length; index += 1) {
    const row = rowsToCheck[index];
    const result = await countCampground(domain, cookieHeader, cart, options, row);
    summary.campgroundsChecked += 1;

    if (result.ok) {
      summary.campsiteCount += result.campsiteCount;
      console.log(
        `${String(index + 1).padStart(3, " ")}/${rowsToCheck.length} ${row.name}: ` +
        `${result.campsiteCount} campsite IDs (${result.mapCalls} map call${result.mapCalls === 1 ? "" : "s"})`,
      );
    } else {
      summary.failedCampgrounds += 1;
      console.log(
        `${String(index + 1).padStart(3, " ")}/${rowsToCheck.length} ${row.name}: FAILED — ${result.error}`,
      );
    }

    if (index < rowsToCheck.length - 1 && options.delayMs > 0) {
      await delay(options.delayMs);
    }
  }

  summary.status = platformRunStatus(summary);
  return summary;
}

function overallStatus(summaries: PlatformSummary[]): RunStatus {
  if (summaries.length === 0 || summaries.every((summary) => summary.status === "red")) return "red";
  if (summaries.some((summary) => summary.status !== "green")) return "yellow";
  return "green";
}

function printSummary(summaries: PlatformSummary[], options: Options): void {
  const status = overallStatus(summaries);
  const totalCampgrounds = summaries.reduce((sum, item) => sum + item.campgroundRows, 0);
  const totalCountable = summaries.reduce((sum, item) => sum + item.countableCampgroundRows, 0);
  const totalChecked = summaries.reduce((sum, item) => sum + item.campgroundsChecked, 0);
  const totalExcluded = summaries.reduce((sum, item) => sum + item.excludedCampgrounds, 0);
  const totalCampsites = summaries.reduce((sum, item) => sum + item.campsiteCount, 0);
  const totalFailures = summaries.reduce((sum, item) => sum + item.failedCampgrounds, 0);

  console.log("\n═══ Realtime Campsite Inventory Count Proof ═══");
  console.log(`Status: ${status}`);
  console.log(`Date window: ${options.startDate} to ${options.endDate}`);
  console.log(`Campground rows: ${totalCampgrounds}`);
  console.log(`Countable campground rows: ${totalCountable}`);
  console.log(`Campgrounds checked: ${totalChecked}`);
  console.log(`Excluded non-countable rows: ${totalExcluded}`);
  console.log(`Verified campsite-level count: ${totalCampsites}`);
  console.log(`Failed campgrounds: ${totalFailures}`);
  console.log("\nProvider table:");
  console.log("Provider                         Rows  Countable  Checked  Excluded  Campsites  Failed  Status");
  for (const item of summaries) {
    console.log(
      `${item.providerName.padEnd(32)} ` +
      `${String(item.campgroundRows).padStart(4)} ` +
      `${String(item.countableCampgroundRows).padStart(10)} ` +
      `${String(item.campgroundsChecked).padStart(8)} ` +
      `${String(item.excludedCampgrounds).padStart(8)} ` +
      `${String(item.campsiteCount).padStart(10)} ` +
      `${String(item.failedCampgrounds).padStart(7)} ` +
      `${item.status}`,
    );
  }
  console.log("\nNot counted here: search-only rows, stale unsupported rows, worker heartbeat, active-watch polling, or notifications.");
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const cookieManager = new CookieManager();
  const summaries: PlatformSummary[] = [];

  console.log("Realtime Campsite Inventory Count Proof");
  console.log(`Platforms: ${options.platforms.join(", ")}`);
  console.log(`Date window: ${options.startDate} to ${options.endDate}`);
  console.log("Counting official/provider campsite resource IDs from live availability responses.");

  for (const platform of options.platforms) {
    summaries.push(await countPlatform(platform, cookieManager, options));
  }

  printSummary(summaries, options);

  const status = overallStatus(summaries);
  process.exit(status === "red" ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
