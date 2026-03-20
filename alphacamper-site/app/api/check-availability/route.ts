import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// POST — Check availability for all active watches (called by cron or manual trigger)
// Rate limited: max 30 requests per invocation
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Simple auth: either cron secret or skip for dev
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase();

    // Get all active watches
    const { data: watches, error: watchError } = await supabase
      .from("watched_targets")
      .select("*")
      .eq("active", true)
      .limit(30);

    if (watchError || !watches) {
      return NextResponse.json({ error: "Failed to fetch watches" }, { status: 500 });
    }

    // Group by campground to minimize API calls
    const byCampground = new Map<string, typeof watches>();
    for (const watch of watches) {
      const key = `${watch.platform}:${watch.campground_id}`;
      if (!byCampground.has(key)) byCampground.set(key, []);
      byCampground.get(key)!.push(watch);
    }

    const alerts: Array<{ watchId: string; userId: string; sites: unknown[] }> = [];
    let requestCount = 0;

    for (const [, group] of byCampground) {
      if (requestCount >= 30) break;

      const watch = group[0];
      if (watch.platform !== "recreation_gov") continue; // BC Parks API TBD

      // Recreation.gov public availability API
      const startDate = new Date(watch.arrival_date);
      const monthStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const apiUrl = `https://www.recreation.gov/api/camps/availability/campground/${watch.campground_id}/month?start_date=${monthStart.toISOString().split("T")[0]}T00:00:00.000Z`;

      try {
        const res = await fetch(apiUrl, {
          headers: {
            "User-Agent": "Alphacamper/0.2.0",
            Accept: "application/json",
          },
        });
        requestCount++;

        if (!res.ok) continue;

        const data = await res.json();
        const campsites = data?.campsites || {};

        // Check each watch in this group
        for (const w of group) {
          const arrival = new Date(w.arrival_date);
          const departure = new Date(w.departure_date);
          const availableSites: Array<{ siteId: string; siteName: string }> = [];

          for (const [siteId, siteData] of Object.entries(campsites)) {
            const site = siteData as { availabilities: Record<string, string>; site: string };

            // If watching a specific site, skip others
            if (w.site_number && site.site !== w.site_number) continue;

            // Check if all dates in range are available
            let allAvailable = true;
            const d = new Date(arrival);
            while (d < departure) {
              const dateKey = d.toISOString().split("T")[0] + "T00:00:00Z";
              if (site.availabilities?.[dateKey] !== "Available") {
                allAvailable = false;
                break;
              }
              d.setDate(d.getDate() + 1);
            }

            if (allAvailable) {
              availableSites.push({ siteId, siteName: site.site || siteId });
            }
          }

          if (availableSites.length > 0) {
            alerts.push({
              watchId: w.id,
              userId: w.user_id,
              sites: availableSites,
            });
          }
        }

        // Rate limit delay between campground requests
        await new Promise((r) => setTimeout(r, 200));
      } catch {
        // Skip failed requests silently
        continue;
      }
    }

    // Insert alerts
    for (const alert of alerts) {
      await supabase.from("availability_alerts").insert({
        watched_target_id: alert.watchId,
        user_id: alert.userId,
        site_details: { sites: alert.sites },
      });
    }

    return NextResponse.json({
      checked: requestCount,
      alertsCreated: alerts.length,
      totalWatches: watches.length,
    });
  } catch (error) {
    console.error("[check-availability] Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
