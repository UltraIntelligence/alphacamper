import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getVerifiedEmailFromRequest } from "@/lib/auth";

// POST — Resolve (or create) the users-table record for the caller.
// Authenticated callers: email sourced from verified Supabase JWT.
// Unauthenticated callers (wizard flow): email accepted from request body.
export async function POST(request: Request) {
  try {
    let email = await getVerifiedEmailFromRequest(request);

    if (!email) {
      // Unauthenticated wizard flow — accept email from body
      const body = await request.json().catch(() => ({}));
      const candidate = typeof body.email === "string" ? body.email.trim() : "";
      if (candidate && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) {
        email = candidate;
      }
    }

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: existing } = await getSupabase()
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json({ user: existing });
    }

    const { data, error } = await getSupabase()
      .from("users")
      .insert({ email })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ user: data });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
