import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// POST — Register a user from the extension (email-based, simple auth)
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Check if user exists
    const { data: existing } = await getSupabase()
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json({ user: existing });
    }

    // Create new user
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
