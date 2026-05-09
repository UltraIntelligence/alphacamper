/// <reference types="node" />
/**
 * Secret-safe customer watch smoke checker.
 *
 * Default mode is read-only. It checks the live operator route and reports
 * whether the Railway worker blocker is still present.
 *
 * Write mode requires an explicit test customer access token:
 *   ALPHACAMPER_ACCESS_TOKEN=... npm run smoke:customer-watch -- --apply --simulate-alert --allow-yellow
 *
 * The simulated alert path writes a smoke-tagged alert row for the test watch,
 * verifies /api/alerts can see it, then deletes the alert. It does not send
 * Resend, Sent.dm, SMS, WhatsApp, or RCS notifications.
 */

import { existsSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_SITE_URL = "https://alphacamper.com";
const DEFAULT_PLATFORM = "gtc_new_brunswick";
const DEFAULT_CAMPGROUND_ID = "-2147483638";
const DEFAULT_ARRIVAL_DATE = "2026-07-10";
const DEFAULT_DEPARTURE_DATE = "2026-07-12";

type SmokeStatus = "green" | "yellow" | "red";

type Options = {
  siteUrl: string;
  accessToken: string | null;
  apply: boolean;
  simulateAlert: boolean;
  keepRecords: boolean;
  allowYellow: boolean;
  platform: string;
  campgroundId: string;
  arrivalDate: string;
  departureDate: string;
  siteNumber: string | null;
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
  providers: Array<{
    provider_id: string;
    status: string;
    last_error_code: string | null;
    last_request_at: string | null;
  }>;
};

type WatchResponse = {
  success?: boolean;
  watch?: {
    id?: string;
    user_id?: string;
    platform?: string;
    campground_id?: string;
    campground_name?: string;
    arrival_date?: string;
    departure_date?: string;
    active?: boolean;
  };
  error?: string;
};

type WatchesResponse = {
  watches?: Array<{ id?: string; active?: boolean }>;
  error?: string;
};

type AlertsResponse = {
  alerts?: Array<{
    id?: string;
    watched_target_id?: string;
    user_id?: string;
    notified_at?: string | null;
    site_details?: Record<string, unknown> | null;
  }>;
  error?: string;
};

type EventsResponse = {
  events?: Array<{
    id?: string;
    watch_id?: string | null;
    event_name?: string;
    metadata?: Record<string, unknown> | null;
  }>;
  summary?: Record<string, number>;
  error?: string;
};

type CampgroundsResponse = {
  campgrounds?: Array<{
    id: string;
    platform: string;
    name: string;
    support_status?: string | null;
  }>;
};

function parseArgs(argv: string[]): Options {
  const options: Options = {
    siteUrl: DEFAULT_SITE_URL,
    accessToken: process.env.ALPHACAMPER_ACCESS_TOKEN ?? null,
    apply: false,
    simulateAlert: false,
    keepRecords: false,
    allowYellow: false,
    platform: DEFAULT_PLATFORM,
    campgroundId: DEFAULT_CAMPGROUND_ID,
    arrivalDate: DEFAULT_ARRIVAL_DATE,
    departureDate: DEFAULT_DEPARTURE_DATE,
    siteNumber: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--apply") {
      options.apply = true;
      continue;
    }
    if (arg === "--simulate-alert") {
      options.simulateAlert = true;
      continue;
    }
    if (arg === "--keep-records") {
      options.keepRecords = true;
      continue;
    }
    if (arg === "--allow-yellow") {
      options.allowYellow = true;
      continue;
    }
    if (arg === "--site-url") {
      options.siteUrl = requireValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--access-token") {
      options.accessToken = requireValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--platform") {
      options.platform = requireValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--campground-id") {
      options.campgroundId = requireValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--arrival-date") {
      options.arrivalDate = requireValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--departure-date") {
      options.departureDate = requireValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--site-number") {
      options.siteNumber = requireValue(argv, index, arg);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  options.siteUrl = options.siteUrl.replace(/\/$/, "");
  return options;
}

function requireValue(argv: string[], index: number, name: string): string {
  const value = argv[index + 1];
  if (!value) throw new Error(`${name} requires a value`);
  return value;
}

function loadLocalEnv() {
  if (existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
  }
  if (!process.env.SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  }
}

function printLine(label: string, value: string | number | boolean | null | undefined) {
  console.log(`${label.padEnd(30)} ${value ?? "none"}`);
}

async function getJson<T>(url: string, token?: string | null): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const body = (await response.json()) as T;
  if (!response.ok) {
    const error = body && typeof body === "object" && "error" in body
      ? String((body as { error?: unknown }).error)
      : `HTTP ${response.status}`;
    throw new Error(error);
  }
  return body;
}

async function postJson<T>(
  url: string,
  token: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as T;
  if (!response.ok) {
    const error = result && typeof result === "object" && "error" in result
      ? String((result as { error?: unknown }).error)
      : `HTTP ${response.status}`;
    throw new Error(error);
  }
  return result;
}

async function deleteJson<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const result = (await response.json()) as T;
  if (!response.ok) {
    const error = result && typeof result === "object" && "error" in result
      ? String((result as { error?: unknown }).error)
      : `HTTP ${response.status}`;
    throw new Error(error);
  }
  return result;
}

function getServiceSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function workerIsMissing(providerQuality: ProviderQualityResponse) {
  const worker = providerQuality.providers.find((provider) => provider.provider_id === "railway_worker");
  return !worker || worker.status !== "healthy" || Boolean(worker.last_error_code);
}

async function verifyCampground(options: Options) {
  const url = new URL(`${options.siteUrl}/api/campgrounds`);
  url.searchParams.set("id", options.campgroundId);
  url.searchParams.set("platform", options.platform);

  const response = await getJson<CampgroundsResponse>(url.toString());
  const campground = response.campgrounds?.[0] ?? null;
  if (!campground) {
    throw new Error(`No campground found for ${options.platform}/${options.campgroundId}`);
  }
  if (campground.support_status !== "alertable") {
    throw new Error(`Campground is ${campground.support_status ?? "unknown"}, not alertable`);
  }
  return campground;
}

async function seedSimulatedAlert(
  supabase: SupabaseClient,
  watch: NonNullable<WatchResponse["watch"]>,
  runId: string,
) {
  if (!watch.id || !watch.user_id) {
    throw new Error("Created watch did not return id and user_id; cannot seed simulated alert");
  }

  const { data, error } = await supabase
    .from("availability_alerts")
    .insert({
      watched_target_id: watch.id,
      user_id: watch.user_id,
      site_details: {
        smoke: true,
        smoke_run_id: runId,
        source: "customer-watch-smoke",
        notification: "not sent",
        site_number: "SMOKE-1",
      },
      notified_at: new Date().toISOString(),
      claimed: false,
    })
    .select("id, notified_at")
    .single();

  if (error) throw new Error(error.message);
  return data as { id: string; notified_at: string | null };
}

async function cleanupSmokeRows(
  supabase: SupabaseClient | null,
  options: Options,
  ids: { watchId: string | null; alertId: string | null; runId: string },
) {
  if (options.keepRecords) return;

  if (supabase && ids.alertId) {
    const { error } = await supabase.from("availability_alerts").delete().eq("id", ids.alertId);
    if (error) console.warn(`Cleanup warning: alert delete failed: ${error.message}`);
  }

  if (supabase) {
    const { error } = await supabase
      .from("funnel_events")
      .delete()
      .contains("metadata", { smoke_run_id: ids.runId });
    if (error) console.warn(`Cleanup warning: funnel event delete failed: ${error.message}`);
  }

  if (ids.watchId && options.accessToken) {
    try {
      await deleteJson(`${options.siteUrl}/api/watch?id=${encodeURIComponent(ids.watchId)}`, options.accessToken);
    } catch (error) {
      console.warn(`Cleanup warning: watch soft-delete failed: ${String(error)}`);
    }
  }
}

async function main() {
  loadLocalEnv();
  const options = parseArgs(process.argv.slice(2));
  const supabase = getServiceSupabase();
  const runId = `customer-watch-smoke-${new Date().toISOString()}`;
  const ids: { watchId: string | null; alertId: string | null; runId: string } = {
    watchId: null,
    alertId: null,
    runId,
  };

  console.log("Customer Watch Smoke");
  printLine("Site", options.siteUrl);
  printLine("Mode", options.apply ? "write smoke" : "read-only");
  printLine("Simulated alert", options.simulateAlert ? "yes, no notification sent" : "no");

  const providerQuality = await getJson<ProviderQualityResponse>(
    `${options.siteUrl}/api/admin/provider-quality`,
  );
  const workerMissing = workerIsMissing(providerQuality);
  const worker = providerQuality.providers.find((provider) => provider.provider_id === "railway_worker");

  printLine("Provider-quality", providerQuality.fetchedFrom);
  printLine("Active watches before", providerQuality.alertDelivery?.active_alerts);
  printLine("Delivered alerts before", providerQuality.alertDelivery?.delivered);
  printLine("Worker status", worker?.status);
  printLine("Worker error", worker?.last_error_code);
  printLine("Worker last request", worker?.last_request_at);

  let status: SmokeStatus = "yellow";

  if (!providerQuality.available || providerQuality.fetchedFrom !== "live_supabase") {
    status = "red";
  }

  if (!options.apply) {
    printLine("Watch creation", "skipped: add --apply and a test token");
    printLine("Alert visibility", "skipped");
    printLine("Funnel event", "skipped");
    printLine("Status", status);
    process.exit(status === "yellow" && options.allowYellow ? 0 : 1);
  }

  if (!options.accessToken) {
    throw new Error("Write smoke requires ALPHACAMPER_ACCESS_TOKEN or --access-token");
  }

  if (options.simulateAlert && !supabase) {
    throw new Error("--simulate-alert requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for setup and cleanup");
  }

  try {
    const campground = await verifyCampground(options);
    printLine("Campground", campground.name);
    printLine("Campground status", campground.support_status);

    const watchResponse = await postJson<WatchResponse>(
      `${options.siteUrl}/api/watch`,
      options.accessToken,
      {
        platform: options.platform,
        campgroundId: options.campgroundId,
        siteNumber: options.siteNumber,
        arrivalDate: options.arrivalDate,
        departureDate: options.departureDate,
      },
    );

    const watch = watchResponse.watch;
    if (!watch?.id) throw new Error("Watch creation succeeded but no watch id was returned");
    ids.watchId = watch.id;
    printLine("Watch creation", "ok");
    printLine("Watch id", watch.id);

    const watches = await getJson<WatchesResponse>(`${options.siteUrl}/api/watch`, options.accessToken);
    const watchVisible = Boolean(watches.watches?.some((row) => row.id === watch.id));
    printLine("Watch visible", watchVisible ? "yes" : "no");
    if (!watchVisible) status = "red";

    const eventName = "autofill_started";
    await postJson<{ success?: boolean }>(`${options.siteUrl}/api/events`, options.accessToken, {
      event_name: eventName,
      watch_id: watch.id,
      metadata: {
        smoke: true,
        smoke_run_id: runId,
        source: "customer-watch-smoke",
      },
    });

    const events = await getJson<EventsResponse>(
      `${options.siteUrl}/api/events?window_days=1`,
      options.accessToken,
    );
    const eventVisible = Boolean(
      events.events?.some((event) => event.watch_id === watch.id && event.metadata?.smoke_run_id === runId),
    );
    printLine("Funnel event", eventVisible ? "ok" : "not found");
    if (!eventVisible) status = "red";

    if (options.simulateAlert && supabase) {
      const simulatedAlert = await seedSimulatedAlert(supabase, watch, runId);
      ids.alertId = simulatedAlert.id;
      printLine("Simulated alert row", simulatedAlert.id);

      const alerts = await getJson<AlertsResponse>(`${options.siteUrl}/api/alerts`, options.accessToken);
      const alertVisible = Boolean(
        alerts.alerts?.some((alert) => alert.id === simulatedAlert.id && alert.site_details?.smoke_run_id === runId),
      );
      printLine("Alert visibility", alertVisible ? "ok" : "not found");
      if (!alertVisible) status = "red";
    } else {
      const alerts = await getJson<AlertsResponse>(`${options.siteUrl}/api/alerts`, options.accessToken);
      printLine("Alert route", `ok, ${alerts.alerts?.length ?? 0} visible`);
    }

    // Simulated alerts prove customer visibility only. They are not delivery proof.
  } finally {
    await cleanupSmokeRows(supabase, options, ids);
  }

  const after = await getJson<ProviderQualityResponse>(`${options.siteUrl}/api/admin/provider-quality`);
  printLine("Active watches after", after.alertDelivery?.active_alerts);
  printLine("Delivered alerts after", after.alertDelivery?.delivered);
  printLine("Live notification proof", workerMissing ? "blocked by Railway heartbeat" : "worker ready, run live notification proof next");
  printLine("Status", status);

  process.exit(status === "yellow" && options.allowYellow ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
