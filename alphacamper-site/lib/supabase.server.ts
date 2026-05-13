import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getBearerToken } from "./auth";

let serviceRoleClient: SupabaseClient | null = null;

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  return url;
}

function getSupabaseAnonKey() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return key;
}

function getSupabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return key;
}

function getGlobalHeaders(authToken?: string) {
  const headers: Record<string, string> = {};

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return headers;
}

function createServerClient(key: string, authToken?: string) {
  return createClient(getSupabaseUrl(), key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: getGlobalHeaders(authToken),
    },
  });
}

export function getServiceRoleSupabase() {
  if (!serviceRoleClient) {
    serviceRoleClient = createServerClient(getSupabaseServiceRoleKey());
  }

  return serviceRoleClient;
}

export function getSupabaseForRequest(request: Request) {
  const token = getBearerToken(request.headers.get("Authorization"));

  if (token?.startsWith("ext_")) {
    return getServiceRoleSupabase();
  }

  return createServerClient(getSupabaseAnonKey(), token ?? undefined);
}
