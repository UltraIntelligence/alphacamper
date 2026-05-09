import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { isAlertableSupportStatus, normalizeSupportStatus } from "@/lib/parks";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const email = cleanString(body.email, 320).toLowerCase();
    const platform = cleanString(body.platform, 80);
    const campgroundId = cleanString(body.campgroundId, 160);
    const campgroundName = cleanString(body.campgroundName, 240);
    const supportStatus = normalizeSupportStatus(cleanString(body.supportStatus, 40), platform);

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    if (!platform || !campgroundId || !campgroundName) {
      return NextResponse.json({ error: "Missing campground" }, { status: 400 });
    }

    if (isAlertableSupportStatus(supportStatus)) {
      return NextResponse.json(
        { error: "This campground already supports alerts" },
        { status: 400 },
      );
    }

    const { error } = await getSupabase()
      .from("campground_interest")
      .insert({
        email,
        platform,
        campground_id: campgroundId,
        campground_name: campgroundName,
        support_status: supportStatus,
        source: "watch_search",
      });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: true, alreadyCaptured: true });
      }

      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
