import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { validateEmail } from "@/lib/auth";

function getTrustedOrigin(): string {
  // Explicit config takes priority; VERCEL_URL is set automatically on Vercel deployments
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  // Local development fallback — never used in production
  return "http://localhost:3000";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const extensionId = typeof body.extensionId === "string" ? body.extensionId.trim() : "";

    if (!validateEmail(email) || !extensionId) {
      return NextResponse.json({ error: "Valid email and extensionId required" }, { status: 400 });
    }

    const origin = getTrustedOrigin();
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
