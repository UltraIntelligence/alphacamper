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
    .from("alerts")
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

  const { error: insertError } = await supabase.from("alerts").insert({
    watched_target_id: watchId,
    user_id: userId,
    available_sites: sites,
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
    .from("alerts")
    .update({ claimed: true })
    .eq("claimed", false)
    .lt("created_at", oneHourAgo)
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

export async function updateWorkerStatus(stats: Record<string, unknown>): Promise<void> {
  const { error } = await getClient()
    .from("worker_status")
    .upsert(
      { id: 1, ...stats, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );

  if (error) {
    log.error("updateWorkerStatus failed", { error: error.message });
  }
}
