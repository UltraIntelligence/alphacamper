import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { validateEmail } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const origin = new URL(request.url).origin;
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const extensionId = typeof body.extensionId === "string" ? body.extensionId.trim() : "";

    if (!validateEmail(email) || !extensionId) {
      return NextResponse.json({ error: "Valid email and extensionId required" }, { status: 400 });
    }

    const redirectUrl = new URL("/auth/confirm", origin);
    redirectUrl.searchParams.set("extensionId", extensionId);
    redirectUrl.searchParams.set("flow", "extension");

    const { error } = await getSupabase().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectUrl.toString() },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
