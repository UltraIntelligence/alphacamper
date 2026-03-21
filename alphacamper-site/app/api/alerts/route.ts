import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getUserIdFromRequest } from "@/lib/auth";

// GET — Fetch alerts for the authenticated user
export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH — Mark alert as claimed (ownership verified via JWT)
export async function PATCH(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const { error } = await getSupabase()
      .from("availability_alerts")
      .update({ claimed: true })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
