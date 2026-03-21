import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getUserIdFromRequest } from "@/lib/auth";

// POST — Add a new watch target
export async function POST(request: Request) {
  try {
    // Read body first — needed for watch fields in all cases
    const body = await request.json();

    // Authenticated path: userId from JWT. Unauthenticated wizard path: userId from body.
    let userId = await getUserIdFromRequest(request);
    if (!userId) {
      userId = typeof body.userId === "string" ? body.userId : null;
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { platform, campgroundId, campgroundName, siteNumber, arrivalDate, departureDate } = body;

    if (!platform || !campgroundId || !arrivalDate || !departureDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await getSupabase()
      .from("watched_targets")
      .insert({
        user_id: userId,
        platform,
        campground_id: campgroundId,
        campground_name: campgroundName || campgroundId,
        site_number: siteNumber || null,
        arrival_date: arrivalDate,
        departure_date: departureDate,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, watch: data });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// GET — List watches for the authenticated user
export async function GET(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await getSupabase()
    .from("watched_targets")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ watches: data });
}

// DELETE — Remove a watch (ownership verified before soft-delete)
export async function DELETE(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("watched_targets")
    .update({ active: false })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
