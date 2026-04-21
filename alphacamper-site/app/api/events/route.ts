import { NextResponse } from "next/server";
import { getVerifiedIdentityFromRequest } from "@/lib/auth.server";
import { getServiceRoleSupabase } from "@/lib/supabase.server";

const EVENT_NAMES = [
  "sms_tapped",
  "autofill_started",
  "autofill_field_not_found",
  "booking_submitted",
  "booking_confirmed",
  "booking_failed",
 ] as const;

export const EVENT_NAME_WHITELIST = new Set(EVENT_NAMES);
type FunnelEventName = (typeof EVENT_NAMES)[number];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(request: Request) {
  try {
    const identity = await getVerifiedIdentityFromRequest(request);
    if (!identity) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const requestedWindowDays = Number(searchParams.get("window_days")) || 30;
    const windowDays = Math.min(Math.max(requestedWindowDays, 1), 90);
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    const supabase = getServiceRoleSupabase();
    const { data: events, error: eventsError } = await supabase
      .from("funnel_events")
      .select("id, watch_id, event_name, metadata, created_at")
      .eq("user_id", identity.userId)
      .gte("created_at", since)
      .order("created_at", { ascending: false });

    if (eventsError) {
      return NextResponse.json({ error: eventsError.message }, { status: 500 });
    }

    const { count: watchesCreated, error: watchesError } = await supabase
      .from("watched_targets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", identity.userId)
      .gte("created_at", since);

    if (watchesError) {
      return NextResponse.json({ error: watchesError.message }, { status: 500 });
    }

    const { count: alertsSent, error: alertsError } = await supabase
      .from("availability_alerts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", identity.userId)
      .gte("notified_at", since);

    if (alertsError) {
      return NextResponse.json({ error: alertsError.message }, { status: 500 });
    }

    const safeEvents = Array.isArray(events) ? events : [];

    return NextResponse.json({
      events: safeEvents,
      summary: {
        watches_created: watchesCreated ?? 0,
        sms_fired: alertsSent ?? 0,
        sms_tapped: safeEvents.filter((event) => event.event_name === "sms_tapped").length,
        booking_confirmed: safeEvents.filter((event) => event.event_name === "booking_confirmed").length,
        booking_failed: safeEvents.filter((event) => event.event_name === "booking_failed").length,
        autofill_started: safeEvents.filter((event) => event.event_name === "autofill_started").length,
        autofill_field_not_found: safeEvents.filter((event) => event.event_name === "autofill_field_not_found").length,
        booking_submitted: safeEvents.filter((event) => event.event_name === "booking_submitted").length,
      },
      window_days: windowDays,
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const identity = await getVerifiedIdentityFromRequest(request);
    if (!identity) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const eventName = typeof body.event_name === "string" ? body.event_name : "";
    const watchId = typeof body.watch_id === "string" && body.watch_id.trim()
      ? body.watch_id.trim()
      : null;
    const metadata = body.metadata === undefined
      ? {}
      : isPlainObject(body.metadata)
        ? body.metadata
        : null;

    if (!EVENT_NAME_WHITELIST.has(eventName as FunnelEventName)) {
      return NextResponse.json({ error: "Unknown event_name" }, { status: 400 });
    }

    if (metadata === null) {
      return NextResponse.json({ error: "metadata must be an object" }, { status: 400 });
    }

    const { error } = await getServiceRoleSupabase()
      .from("funnel_events")
      .insert({
        user_id: identity.userId,
        watch_id: watchId,
        event_name: eventName,
        metadata,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
