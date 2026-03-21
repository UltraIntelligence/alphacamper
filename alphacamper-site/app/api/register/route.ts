import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getVerifiedEmailFromRequest } from "@/lib/auth";

// POST — Resolve (or create) the users-table record for the caller.
// Email is always sourced from a verified Supabase JWT.
export async function POST(request: Request) {
  try {
    const email = await getVerifiedEmailFromRequest(request);
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase();

    // INSERT is safe even for existing users — on conflict the row is untouched.
    // This avoids relying on an UPDATE RLS policy, which doesn't exist for `users`.
    const { error: insertError } = await supabase
      .from("users")
      .insert({ email });

    // 23505 = unique_violation (expected for existing users) — anything else is unexpected
    if (insertError && insertError.code !== "23505") {
      console.error("[register] Unexpected insert error", insertError.message);
    }

    // Always SELECT to get the row (whether just-inserted or already-existing).
    const { data, error } = await supabase
      .from("users")
      .select()
      .eq("email", email)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ user: data });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

