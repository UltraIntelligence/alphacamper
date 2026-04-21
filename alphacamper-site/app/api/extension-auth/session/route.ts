import { NextResponse } from "next/server";
import { getVerifiedIdentityFromRequest, issueExtensionAuthToken } from "@/lib/auth.server";
import { getSupabaseForRequest } from "@/lib/supabase.server";

/**
 * POST /api/extension-auth/session
 *
 * Issues a long-lived extension auth token.
 * SECURITY: Only Supabase JWTs are accepted here — extension tokens are
 * explicitly rejected to prevent token-to-token reissuance without real
 * re-authentication (magic-link or OAuth).
 */
export async function POST(request: Request) {
  try {
    const identity = await getVerifiedIdentityFromRequest(request);
    if (!identity || identity.authKind !== "supabase") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user row exists (INSERT if new, ignore conflict if existing)
    const supabase = getSupabaseForRequest(request);
    const { error: insertError } = await supabase
      .from("users")
      .insert({ id: identity.userId, email: identity.email });

    // 23505 = unique_violation (expected for existing users) — anything else is unexpected
    if (insertError && insertError.code !== "23505") {
      console.error("[extension-auth/session] Unexpected insert error", insertError.message);
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, email")
      .eq("id", identity.userId)
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
