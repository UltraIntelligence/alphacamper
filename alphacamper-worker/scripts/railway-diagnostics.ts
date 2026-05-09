/// <reference types="node" />
/**
 * Secret-safe Railway worker diagnostics.
 *
 * This command checks whether the Railway CLI can see the worker service,
 * whether required variables exist, and whether recent logs show the worker
 * starting. It never prints variable values.
 *
 * Usage:
 *   npm run smoke:railway
 *   npm run smoke:railway -- --service alphacamper-worker --environment production
 *   npm run smoke:railway -- --allow-blocked
 */

import "../src/env.js";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_SITE_URL = "https://alphacamper.com";
const DEFAULT_MAX_HEARTBEAT_AGE_MINUTES = 30;

const REQUIRED_VARIABLES = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const NOTIFICATION_VARIABLES = [
  "RESEND_API_KEY",
  "SENTDM_API_KEY",
];

const STARTUP_MARKERS = [
  "Alphacamper Worker starting",
  "Health check server on :",
];

const FAILURE_MARKERS = [
  "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
  "Cycle failed",
  "updateWorkerStatus failed",
  "worker_status heartbeat write failed",
];

const REQUIRED_WORKER_PLATFORMS = [
  "bc_parks",
  "ontario_parks",
  "parks_canada",
  "gtc_new_brunswick",
  "recreation_gov",
];

type Options = {
  service: string | null;
  environment: string | null;
  allowBlocked: boolean;
  siteUrl: string;
  maxHeartbeatAgeMinutes: number;
};

type CommandResult = {
  status: number | null;
  stdout: string;
  stderr: string;
};

type ProviderHealth = {
  provider_id: string;
  status: string;
  last_request_at: string | null;
  last_error_code: string | null;
  verification_note: string;
};

type ProviderQualityResponse = {
  available: boolean;
  reason: string | null;
  fetchedFrom: string | null;
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

type SupabaseWorkerStatus = {
  configured: boolean;
  latestWorker: WorkerStatusRow | null;
  error: string | null;
};

type SmokeStatus = "green" | "yellow" | "red";

type LiveWorkerProof = {
  status: SmokeStatus;
  fetchedFrom: string | null;
  providerReason: string | null;
  workerStatus: string | null;
  workerError: string | null;
  workerLastRequest: string | null;
  routeHeartbeatAge: number | null;
  supabaseConfigured: boolean;
  supabaseHeartbeat: string | null;
  supabaseHeartbeatAge: number | null;
  missingPlatforms: string[] | null;
  supabaseError: string | null;
};

function parseArgs(argv: string[]): Options {
  const options: Options = {
    service: null,
    environment: null,
    allowBlocked: false,
    siteUrl: DEFAULT_SITE_URL,
    maxHeartbeatAgeMinutes: DEFAULT_MAX_HEARTBEAT_AGE_MINUTES,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--allow-blocked") {
      options.allowBlocked = true;
      continue;
    }
    if (arg === "--service") {
      const value = argv[index + 1];
      if (!value) throw new Error("--service requires a value");
      options.service = value;
      index += 1;
      continue;
    }
    if (arg === "--environment") {
      const value = argv[index + 1];
      if (!value) throw new Error("--environment requires a value");
      options.environment = value;
      index += 1;
      continue;
    }
    if (arg === "--site-url") {
      const value = argv[index + 1];
      if (!value) throw new Error("--site-url requires a value");
      options.siteUrl = value.replace(/\/$/, "");
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

  return options;
}

function railway(args: string[]): CommandResult {
  const result = spawnSync("railway", args, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 5,
  });

  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function combined(result: CommandResult) {
  return `${result.stdout}\n${result.stderr}`.trim();
}

function isAuthBlocked(result: CommandResult) {
  const output = combined(result);
  return /Unauthorized|railway login|not logged in|login again/i.test(output);
}

function scopedArgs(options: Options) {
  const args: string[] = [];
  if (options.service) args.push("--service", options.service);
  if (options.environment) args.push("--environment", options.environment);
  return args;
}

function printLine(label: string, value: string | number | boolean | null | undefined) {
  console.log(`${label.padEnd(28)} ${value ?? "none"}`);
}

function missingRequiredPlatforms(platforms: Record<string, boolean> | null | undefined): string[] {
  if (!platforms) return REQUIRED_WORKER_PLATFORMS;
  return REQUIRED_WORKER_PLATFORMS.filter((platform) => platforms[platform] !== true);
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
  const response = await fetch(`${siteUrl}/api/admin/provider-quality`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Provider-quality route returned HTTP ${response.status}`);
  }

  return (await response.json()) as ProviderQualityResponse;
}

async function fetchSupabaseWorkerStatus(): Promise<SupabaseWorkerStatus> {
  loadSiteEnvFallback();

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return {
      configured: false,
      latestWorker: null,
      error: null,
    };
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("worker_status")
    .select("id, last_cycle_at, last_successful_poll_at, platforms_healthy, cycle_stats")
    .order("last_cycle_at", { ascending: false })
    .limit(1);

  return {
    configured: true,
    latestWorker: error ? null : ((data ?? [])[0] as WorkerStatusRow | undefined) ?? null,
    error: error?.message ?? null,
  };
}

export function summarizeLiveWorkerProof(params: {
  providerQuality: ProviderQualityResponse;
  supabase: SupabaseWorkerStatus;
  maxHeartbeatAgeMinutes: number;
  now?: Date;
}): LiveWorkerProof {
  const worker =
    params.providerQuality.providers.find((provider) => provider.provider_id === "railway_worker") ?? null;
  const workerLastRequest = worker?.last_request_at ?? null;
  const routeHeartbeatAge = minutesSinceAt(workerLastRequest, params.now ?? new Date());
  const supabaseHeartbeat = params.supabase.latestWorker?.last_cycle_at ?? null;
  const supabaseHeartbeatAge = minutesSinceAt(supabaseHeartbeat, params.now ?? new Date());
  const missingPlatforms = params.supabase.configured
    ? missingRequiredPlatforms(params.supabase.latestWorker?.platforms_healthy)
    : null;

  const routeHealthy =
    params.providerQuality.available &&
    params.providerQuality.fetchedFrom === "live_supabase" &&
    worker?.status === "healthy" &&
    !worker.last_error_code &&
    routeHeartbeatAge !== null &&
    routeHeartbeatAge <= params.maxHeartbeatAgeMinutes;
  const supabaseHealthy =
    params.supabase.configured &&
    !params.supabase.error &&
    supabaseHeartbeatAge !== null &&
    supabaseHeartbeatAge <= params.maxHeartbeatAgeMinutes &&
    missingPlatforms?.length === 0;

  let status: SmokeStatus = "green";
  if (!params.providerQuality.available || params.providerQuality.fetchedFrom !== "live_supabase") {
    status = "red";
  } else if (!routeHealthy || !supabaseHealthy) {
    status = "yellow";
  }

  return {
    status,
    fetchedFrom: params.providerQuality.fetchedFrom,
    providerReason: params.providerQuality.reason,
    workerStatus: worker?.status ?? null,
    workerError: worker?.last_error_code ?? null,
    workerLastRequest,
    routeHeartbeatAge,
    supabaseConfigured: params.supabase.configured,
    supabaseHeartbeat,
    supabaseHeartbeatAge,
    missingPlatforms,
    supabaseError: params.supabase.error,
  };
}

function minutesSinceAt(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return null;
  return Math.floor((now.getTime() - time) / 60000);
}

async function checkLiveWorkerProof(options: Options): Promise<LiveWorkerProof> {
  const [providerQuality, supabase] = await Promise.all([
    fetchProviderQuality(options.siteUrl),
    fetchSupabaseWorkerStatus(),
  ]);

  return summarizeLiveWorkerProof({
    providerQuality,
    supabase,
    maxHeartbeatAgeMinutes: options.maxHeartbeatAgeMinutes,
  });
}

function printLiveWorkerProof(proof: LiveWorkerProof) {
  printLine("Live status", proof.status);
  printLine("Provider-quality", proof.fetchedFrom);
  printLine("Provider reason", proof.providerReason);
  printLine("Worker status", proof.workerStatus);
  printLine("Worker error", proof.workerError);
  printLine("Worker last request", proof.workerLastRequest);
  printLine("Route heartbeat age", proof.routeHeartbeatAge === null ? "unknown" : `${proof.routeHeartbeatAge} minutes`);

  if (proof.supabaseConfigured) {
    printLine("Supabase heartbeat", proof.supabaseHeartbeat);
    printLine(
      "Supabase heartbeat age",
      proof.supabaseHeartbeatAge === null ? "unknown" : `${proof.supabaseHeartbeatAge} minutes`,
    );
    printLine("Missing platforms", proof.missingPlatforms?.length ? proof.missingPlatforms.join(", ") : "none");
    printLine("Supabase error", proof.supabaseError);
  } else {
    printLine("Supabase direct read", "skipped: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
}

export function evaluateDiagnosticsStatus(params: {
  missingRequired: string[];
  startupFound: string[];
  failuresFound: string[];
  liveStatus: SmokeStatus;
}): SmokeStatus {
  if (params.missingRequired.length > 0 || params.failuresFound.length > 0 || params.liveStatus === "red") {
    return "red";
  }

  if (params.startupFound.length !== STARTUP_MARKERS.length || params.liveStatus !== "green") {
    return "yellow";
  }

  return "green";
}

function safeParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function collectVariableNames(value: unknown): Set<string> {
  const names = new Set<string>();

  function visit(node: unknown) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }

    const record = node as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (/^[A-Z0-9_]+$/.test(key)) names.add(key);
    }

    const named = record.name ?? record.key ?? record.variable;
    if (typeof named === "string" && /^[A-Z0-9_]+$/.test(named)) {
      names.add(named);
    }

    for (const child of Object.values(record)) visit(child);
  }

  visit(value);
  return names;
}

function lineHasAny(text: string, markers: string[]) {
  return markers.filter((marker) => text.includes(marker));
}

function redactLogLine(line: string) {
  return line
    .replace(/(SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY|SENTDM_API_KEY)=\S+/g, "$1=[redacted]")
    .replace(/(service[_-]?role|re_[A-Za-z0-9_]+|sentdm_[A-Za-z0-9_]+)/gi, "[redacted]");
}

function printMarkerLines(text: string, markers: string[]) {
  const lines = text
    .split(/\r?\n/)
    .filter((line) => markers.some((marker) => line.includes(marker)))
    .slice(-8);

  for (const line of lines) {
    console.log(`  ${redactLogLine(line)}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  console.log("Railway Worker Diagnostics");
  printLine("Service override", options.service);
  printLine("Environment override", options.environment);
  printLine("Production site", options.siteUrl);
  printLine("Max heartbeat age", `${options.maxHeartbeatAgeMinutes} minutes`);

  let liveProof: LiveWorkerProof;
  try {
    liveProof = await checkLiveWorkerProof(options);
  } catch (error) {
    liveProof = {
      status: "red",
      fetchedFrom: null,
      providerReason: `Live provider-quality check failed: ${String(error)}`,
      workerStatus: null,
      workerError: null,
      workerLastRequest: null,
      routeHeartbeatAge: null,
      supabaseConfigured: false,
      supabaseHeartbeat: null,
      supabaseHeartbeatAge: null,
      missingPlatforms: null,
      supabaseError: null,
    };
  }

  console.log("\nLive production proof:");
  printLiveWorkerProof(liveProof);

  const whoami = railway(["whoami"]);
  if (whoami.status !== 0) {
    const blocked = isAuthBlocked(whoami);
    printLine("Status", blocked ? "blocked" : "red");
    printLine("Railway auth", blocked ? "not authenticated" : "failed");
    console.log("\nNext action: run `railway login`, link the project/service, then rerun `npm run smoke:railway`.");
    process.exit(options.allowBlocked && blocked ? 0 : 1);
  }

  printLine("Railway auth", "ok");
  printLine("Railway user", combined(whoami).split(/\r?\n/)[0] ?? "ok");

  const status = railway(["status", "--json"]);
  if (status.status !== 0) {
    printLine("Status", isAuthBlocked(status) ? "blocked" : "red");
    printLine("Project status", combined(status) || "failed");
    console.log("\nNext action: run `railway link` from alphacamper-worker and select the worker service.");
    process.exit(options.allowBlocked && isAuthBlocked(status) ? 0 : 1);
  }

  const statusJson = safeParseJson(status.stdout);
  printLine("Project linked", statusJson ? "yes" : "yes, non-json output");

  const variables = railway(["variable", "list", "--json", ...scopedArgs(options)]);
  if (variables.status !== 0) {
    printLine("Status", isAuthBlocked(variables) ? "blocked" : "red");
    printLine("Variables", combined(variables) || "failed");
    process.exit(options.allowBlocked && isAuthBlocked(variables) ? 0 : 1);
  }

  const variableNames = collectVariableNames(safeParseJson(variables.stdout));
  const missingRequired = REQUIRED_VARIABLES.filter((name) => !variableNames.has(name));
  const missingNotifications = NOTIFICATION_VARIABLES.filter((name) => !variableNames.has(name));

  printLine("Required vars present", missingRequired.length === 0 ? "yes" : "no");
  printLine("Missing required vars", missingRequired.length ? missingRequired.join(", ") : "none");
  printLine("Missing notify vars", missingNotifications.length ? missingNotifications.join(", ") : "none");

  const runtimeLogs = railway(["logs", "--lines", "120", ...scopedArgs(options)]);
  const buildLogs = railway(["logs", "--build", "--lines", "80", ...scopedArgs(options)]);
  const logText = `${combined(runtimeLogs)}\n${combined(buildLogs)}`;
  const startupFound = lineHasAny(logText, STARTUP_MARKERS);
  const failuresFound = lineHasAny(logText, FAILURE_MARKERS);

  printLine("Runtime logs readable", runtimeLogs.status === 0 ? "yes" : "no");
  printLine("Build logs readable", buildLogs.status === 0 ? "yes" : "no");
  printLine("Startup markers", startupFound.length ? startupFound.join(", ") : "none");
  printLine("Failure markers", failuresFound.length ? failuresFound.join(", ") : "none");

  if (startupFound.length || failuresFound.length) {
    console.log("\nRelevant log lines:");
    printMarkerLines(logText, [...STARTUP_MARKERS, ...FAILURE_MARKERS]);
  }

  const statusValue = evaluateDiagnosticsStatus({
    missingRequired,
    startupFound,
    failuresFound,
    liveStatus: liveProof.status,
  });

  printLine("Status", statusValue);

  if (statusValue === "green") {
    console.log("\nNext action: run the customer watch/notification smoke.");
    process.exit(0);
  }

  if (liveProof.status !== "green") {
    console.log("\nNext action: fix the live worker heartbeat, then rerun `npm run smoke:railway`.");
  } else {
    console.log("\nNext action: fix Railway deploy/env/log blockers, then rerun `npm run smoke:railway`.");
  }
  process.exit(statusValue === "yellow" ? 1 : 2);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
