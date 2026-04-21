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
