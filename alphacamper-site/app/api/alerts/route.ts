import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// GET — Fetch alerts for a user
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("availability_alerts")
    .select("*, watched_targets(*)")
    .eq("user_id", userId)
    .eq("claimed", false)
    .order("notified_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ alerts: data });
}

// PATCH — Mark alert as claimed
export async function PATCH(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Alert id required" }, { status: 400 });
    }

    const { error } = await getSupabase()
      .from("availability_alerts")
      .update({ claimed: true })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
