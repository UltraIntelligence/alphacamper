import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getPoller, SUPPORTED_PLATFORMS } from "@/lib/platforms";
import type { WatchedTarget, AvailabilityResult } from "@/lib/platforms";

async function checkAvailability(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase();

    const { data: watches, error: watchError } = await supabase
      .from("watched_targets")
      .select("*")
      .eq("active", true)
      .in("platform", SUPPORTED_PLATFORMS)
      .limit(50);

    if (watchError || !watches) {
      return NextResponse.json(
        { error: "Failed to fetch watches" },
        { status: 500 },
      );
    }

    const groups = new Map<string, WatchedTarget[]>();
    for (const watch of watches as WatchedTarget[]) {
      const key = `${watch.platform}:${watch.campground_id}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(watch);
    }

    const allAlerts: AvailabilityResult[] = [];
    let requestCount = 0;

    for (const [, group] of groups) {
      if (requestCount >= 30) break;

      const poller = getPoller(group[0].platform);
      if (!poller) continue;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);

      try {
        const results = await poller.checkCampground(group, controller.signal);
        allAlerts.push(...results);
        requestCount++;
      } catch {
        // Skip failed campground
      } finally {
        clearTimeout(timeout);
      }

      await new Promise((r) => setTimeout(r, 200));
    }

    for (const alert of allAlerts) {
      await supabase.from("availability_alerts").insert({
        watched_target_id: alert.watchId,
        user_id: alert.userId,
        site_details: { sites: alert.sites },
      });
    }

    return NextResponse.json({
      checked: requestCount,
      alertsCreated: allAlerts.length,
      totalWatches: watches.length,
    });
  } catch (error) {
    console.error("[check-availability] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return checkAvailability(request);
}

export async function POST(request: Request) {
  return checkAvailability(request);
}
