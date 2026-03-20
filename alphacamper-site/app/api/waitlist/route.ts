import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const { error } = await getSupabase()
      .from("waitlist")
      .insert({ email, source: "website" });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Already on the list" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Something went wrong" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
