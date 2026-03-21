import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getVerifiedEmailFromRequest, issueExtensionAuthToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const email = await getVerifiedEmailFromRequest(request);
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await getSupabase()
      .from("users")
      .upsert({ email }, { onConflict: "email" })
      .select("id, email")
      .single();

    if (error || !data?.id || !data?.email) {
      return NextResponse.json({ error: error?.message ?? "Failed to create extension session" }, { status: 500 });
    }

    return NextResponse.json({
      token: issueExtensionAuthToken(data.id, data.email),
      user: {
        id: data.id,
        email: data.email,
      },
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
