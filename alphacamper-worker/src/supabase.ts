import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SUPPORTED_PLATFORMS } from "./config.js";
import { log } from "./logger.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WatchedTarget {
  id: string;
  user_id: string;
  platform: string;
  campground_id: string;
  campground_name: string;
  site_number: string | null;
  arrival_date: string;
  departure_date: string;
  active: boolean;
  last_checked_at: string | null;
}

export interface AvailableSite {
  siteId: string;
  siteName: string;
}

// ─── Supabase singleton ───────────────────────────────────────────────────────

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
    }
    _client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function fetchActiveWatches(limit = 500): Promise<WatchedTarget[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await getClient()
    .from("watched_targets")
    .select("*")
    .eq("active", true)
    .in("platform", SUPPORTED_PLATFORMS)
    .gte("departure_date", today)
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) {
    log.error("fetchActiveWatches failed", { error: error.message });
    return [];
  }
  return (data ?? []) as WatchedTarget[];
}

export function groupByCampground(watches: WatchedTarget[]): Map<string, WatchedTarget[]> {
  const map = new Map<string, WatchedTarget[]>();
  for (const watch of watches) {
    const key = `${watch.platform}:${watch.campground_id}`;
    const group = map.get(key);
    if (group) {
      group.push(watch);
    } else {
      map.set(key, [watch]);
    }
  }
  return map;
}

export function shouldCreateAlert(sites: AvailableSite[]): boolean {
  return sites.length > 0;
}

export async function createAlert(
  watchId: string,
  userId: string,
  sites: AvailableSite[]
): Promise<boolean> {
  const supabase = getClient();

  // Dedup: check if an unclaimed alert already exists for this watch
  const { data: existing, error: checkError } = await supabase
    .from("availability_alerts")
    .select("id")
    .eq("watched_target_id", watchId)
    .eq("claimed", false)
    .limit(1);

  if (checkError) {
    log.error("createAlert dedup check failed", { watchId, error: checkError.message });
    return false;
  }

  if (existing && existing.length > 0) {
    log.debug("createAlert skipped — unclaimed alert already exists", { watchId });
    return false;
  }

  const { error: insertError } = await supabase.from("availability_alerts").insert({
    watched_target_id: watchId,
    user_id: userId,
    site_details: { sites },
    claimed: false,
  });

  if (insertError) {
    // Unique constraint violation — another process already inserted
    if (insertError.code === "23505") {
      log.debug("createAlert skipped — unique constraint hit", { watchId });
      return false;
    }
    log.error("createAlert insert failed", { watchId, error: insertError.message });
    return false;
  }

  log.info("Alert created", { watchId, userId, siteCount: sites.length });
  return true;
}

export async function fetchUserContact(userId: string): Promise<{ email: string | null; phone: string | null }> {
  const { data, error } = await getClient()
    .from("users")
    .select("email, phone")
    .eq("id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    log.error("fetchUserContact failed", { userId, error: error.message });
    return { email: null, phone: null };
  }

  return { email: data?.email ?? null, phone: data?.phone ?? null };
}

export async function updateLastChecked(watchIds: string[]): Promise<void> {
  if (watchIds.length === 0) return;

  const { error } = await getClient()
    .from("watched_targets")
    .update({ last_checked_at: new Date().toISOString() })
    .in("id", watchIds);

  if (error) {
    log.error("updateLastChecked failed", { error: error.message });
  }
}

export async function expireStaleAlerts(): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data, error } = await getClient()
    .from("availability_alerts")
    .update({ claimed: true })
    .eq("claimed", false)
    .lt("notified_at", oneHourAgo)
    .select("id");

  if (error) {
    log.error("expireStaleAlerts failed", { error: error.message });
    return 0;
  }

  const count = (data ?? []).length;
  if (count > 0) {
    log.info("Expired stale alerts", { count });
  }
  return count;
}

export async function upsertCampgrounds(
  rows: Array<{
    id: string;
    platform: string;
    root_map_id: number;
    name: string;
    short_name: string | null;
    province: string | null;
  }>
): Promise<boolean> {
  if (rows.length === 0) return true;
  const { error } = await getClient()
    .from("campgrounds")
    .upsert(rows, { onConflict: "id,platform" });
  if (error) {
    log.error("upsertCampgrounds failed", { error: error.message, count: rows.length });
    return false;
  }
  return true;
}

export async function updateWorkerStatus(stats: {
  last_cycle_at?: string;
  watches_checked?: number;
  alerts_created?: number;
  consecutive_403?: Record<string, number>;
  platforms_healthy?: Record<string, boolean>;
}): Promise<void> {
  const lastCycleAt = stats.last_cycle_at ?? new Date().toISOString();
  const consecutive403Counts = Object.values(stats.consecutive_403 ?? {}).map((value) => Number(value) || 0);
  const { error } = await getClient()
    .from("worker_status")
    .upsert(
      {
        id: "singleton",
        last_cycle_at: lastCycleAt,
        last_successful_poll_at: lastCycleAt,
        consecutive_403_count: consecutive403Counts.length > 0 ? Math.max(...consecutive403Counts) : 0,
        platforms_healthy: stats.platforms_healthy ?? {},
        cycle_stats: {
          watches_checked: stats.watches_checked ?? 0,
          alerts_created: stats.alerts_created ?? 0,
          consecutive_403: stats.consecutive_403 ?? {},
        },
      },
      { onConflict: "id" }
    );

  if (error) {
    log.error("updateWorkerStatus failed", { error: error.message });
  }
}
