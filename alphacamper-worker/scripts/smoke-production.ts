/// <reference types="node" />
/**
 * Production worker smoke checker.
 *
 * This does not deploy anything and does not print secrets. It checks the live
 * operator route first, then reads Supabase directly when service-role env vars
 * are available.
 *
 * Usage:
 *   npm run smoke:production
 *   npm run smoke:production -- --allow-yellow
 *   npm run smoke:production -- --site-url https://alphacamper.com
 */

import "../src/env.js";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_SITE_URL = "https://alphacamper.com";
const DEFAULT_MAX_HEARTBEAT_AGE_MINUTES = 30;

const REQUIRED_WORKER_PLATFORMS = [
  "bc_parks",
  "ontario_parks",
  "parks_canada",
  "gtc_new_brunswick",
  "recreation_gov",
];

type SmokeStatus = "green" | "yellow" | "red";

type ProviderHealth = {
  provider_id: string;
  status: string;
  confidence: string;
  last_request_at: string | null;
  last_error_code: string | null;
  verification_note: string;
};

type ProviderQualityResponse = {
  available: boolean;
  reason: string | null;
  fetchedFrom: string | null;
  providerQuality: Record<string, number> | null;
  alertDelivery: {
    active_alerts: number;
    total_deliveries: number;
    delivered: number;
  } | null;
  providers: ProviderHealth[];
};

type WorkerStatusRow = {
  id: string;
  last_cycle_at: string | null;
  last_successful_poll_at: string | null;
  platforms_healthy: Record<string, boolean> | null;
  cycle_stats: Record<string, unknown> | null;
};

type Options = {
  siteUrl: string;
  allowYellow: boolean;
  maxHeartbeatAgeMinutes: number;
};

export type ProductionWorkerSmokeStatusInput = {
  providerAvailable: boolean;
  fetchedFrom: string | null;
  routeWorkerHealthy: boolean;
  heartbeatRecent: boolean;
  requiredPlatformsHealthy: boolean;
  supabaseError: string | null;
};

function parseArgs(argv: string[]): Options {
  const options: Options = {
    siteUrl: DEFAULT_SITE_URL,
    allowYellow: false,
    maxHeartbeatAgeMinutes: DEFAULT_MAX_HEARTBEAT_AGE_MINUTES,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--allow-yellow") {
      options.allowYellow = true;
      continue;
    }
    if (arg === "--site-url") {
      const value = argv[index + 1];
      if (!value) throw new Error("--site-url requires a value");
      options.siteUrl = value;
      index += 1;
      continue;
    }
    if (arg === "--max-heartbeat-age-minutes") {
      const value = Number(argv[index + 1]);
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error("--max-heartbeat-age-minutes requires a positive number");
      }
      options.maxHeartbeatAgeMinutes = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  options.siteUrl = options.siteUrl.replace(/\/$/, "");
  return options;
}

function loadSiteEnvFallback() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  const siteEnv = resolve(process.cwd(), "../alphacamper-site/.env.local");
  if (!existsSync(siteEnv)) return;

  process.loadEnvFile(siteEnv);
  if (!process.env.SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  }
}

async function fetchProviderQuality(siteUrl: string): Promise<ProviderQualityResponse> {
  const endpoint = `${siteUrl}/api/admin/provider-quality`;
  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Provider-quality route returned HTTP ${response.status}`);
  }

  return (await response.json()) as ProviderQualityResponse;
}

async function fetchSupabaseWorkerStatus(): Promise<{
  configured: boolean;
  latestWorker: WorkerStatusRow | null;
  activeWatches: number | null;
  recentAlerts: number | null;
  error: string | null;
}> {
  loadSiteEnvFallback();

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return {
      configured: false,
      latestWorker: null,
      activeWatches: null,
      recentAlerts: null,
      error: null,
    };
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const [workerResult, watchesResult, alertsResult] = await Promise.all([
    supabase
      .from("worker_status")
      .select("id, last_cycle_at, last_successful_poll_at, platforms_healthy, cycle_stats")
      .order("last_cycle_at", { ascending: false })
      .limit(1),
    supabase
      .from("watched_targets")
      .select("id", { count: "exact", head: true })
      .eq("active", true),
    supabase
      .from("availability_alerts")
      .select("id", { count: "exact", head: true }),
  ]);

  if (workerResult.error) {
    return {
      configured: true,
      latestWorker: null,
      activeWatches: watchesResult.count ?? null,
      recentAlerts: alertsResult.count ?? null,
      error: workerResult.error.message,
    };
  }

  return {
    configured: true,
    latestWorker: ((workerResult.data ?? [])[0] as WorkerStatusRow | undefined) ?? null,
    activeWatches: watchesResult.count ?? null,
    recentAlerts: alertsResult.count ?? null,
    error: null,
  };
}

function minutesSince(iso: string | null): number | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return null;
  return Math.floor((Date.now() - time) / 60000);
}

function missingRequiredPlatforms(platforms: Record<string, boolean> | null | undefined): string[] {
  if (!platforms) return REQUIRED_WORKER_PLATFORMS;
  return REQUIRED_WORKER_PLATFORMS.filter((platform) => platforms[platform] !== true);
}

function printLine(label: string, value: string | number | null | undefined) {
  console.log(`${label.padEnd(24)} ${value ?? "none"}`);
}

export function evaluateProductionWorkerSmokeStatus(input: ProductionWorkerSmokeStatusInput): SmokeStatus {
  if (!input.providerAvailable || input.fetchedFrom !== "live_supabase") {
    return "red";
  }

  if (
    !input.routeWorkerHealthy ||
    !input.heartbeatRecent ||
    !input.requiredPlatformsHealthy ||
    input.supabaseError
  ) {
    return "yellow";
  }

  return "green";
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  console.log("Production Worker Smoke");
  printLine("Site", options.siteUrl);

  let providerQuality: ProviderQualityResponse;
  try {
    providerQuality = await fetchProviderQuality(options.siteUrl);
  } catch (error) {
    console.error(`Status                  red`);
    console.error(`Provider-quality        failed: ${String(error)}`);
    process.exit(1);
  }

  const worker = providerQuality.providers.find((provider) => provider.provider_id === "railway_worker") ?? null;
  const supabase = await fetchSupabaseWorkerStatus();
  const heartbeatAge = minutesSince(supabase.latestWorker?.last_cycle_at ?? null);
  const platformMisses = missingRequiredPlatforms(supabase.latestWorker?.platforms_healthy);

  const routeWorkerHealthy = worker?.status === "healthy" && !worker.last_error_code;
  const heartbeatRecent =
    supabase.configured &&
    supabase.latestWorker?.last_cycle_at &&
    heartbeatAge !== null &&
    heartbeatAge <= options.maxHeartbeatAgeMinutes;
  const requiredPlatformsHealthy = supabase.configured && platformMisses.length === 0;

  const status = evaluateProductionWorkerSmokeStatus({
    providerAvailable: providerQuality.available,
    fetchedFrom: providerQuality.fetchedFrom,
    routeWorkerHealthy,
    heartbeatRecent: Boolean(heartbeatRecent),
    requiredPlatformsHealthy,
    supabaseError: supabase.error,
  });

  printLine("Status", status);
  printLine("Provider-quality", providerQuality.fetchedFrom);
  printLine("Provider reason", providerQuality.reason);
  printLine("Active watches", providerQuality.alertDelivery?.active_alerts);
  printLine("Total alerts", providerQuality.alertDelivery?.total_deliveries);
  printLine("Delivered alerts", providerQuality.alertDelivery?.delivered);
  printLine("Worker status", worker?.status);
  printLine("Worker error", worker?.last_error_code);
  printLine("Worker last request", worker?.last_request_at);

  if (supabase.configured) {
    printLine("Supabase heartbeat", supabase.latestWorker?.last_cycle_at);
    printLine("Heartbeat age", heartbeatAge === null ? "unknown" : `${heartbeatAge} minutes`);
    printLine("Supabase active", supabase.activeWatches);
    printLine("Supabase alerts", supabase.recentAlerts);
    printLine("Missing platforms", platformMisses.length ? platformMisses.join(", ") : "none");
    printLine("Supabase error", supabase.error);
  } else {
    printLine("Supabase direct read", "skipped: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  if (status === "green") {
    console.log("\nNext action: run the customer watch/notification smoke.");
    process.exit(0);
  }

  console.log("\nNext action: verify the Railway service deployment, env vars, logs, and /health endpoint.");
  process.exit(status === "yellow" && options.allowYellow ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
