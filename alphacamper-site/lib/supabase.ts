import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getGlobalHeaders() {
  if (process.env.NEXT_PUBLIC_RLS_DEV_OVERRIDE === "true") {
    return { "x-rls-dev-override": "true" };
  }

  return undefined;
}

export function getSupabase() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("Missing Supabase environment variables");
    }
    _client = createClient(url, key, {
      auth: { flowType: "pkce" },
      global: { headers: getGlobalHeaders() },
    });
  }
  return _client;
}
