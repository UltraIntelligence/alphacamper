import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// POST — Add a new watch target
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, platform, campgroundId, campgroundName, siteNumber, arrivalDate, departureDate } = body;

    if (!userId || !platform || !campgroundId || !arrivalDate || !departureDate) {
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

// GET — List watches for a user
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
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

// DELETE — Remove a watch
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("watched_targets")
    .update({ active: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
