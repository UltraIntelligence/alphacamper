import { createClient } from '@supabase/supabase-js'
import { getSupabase } from './supabase'

/**
 * Verifies the Supabase JWT from an Authorization: Bearer header,
 * then resolves the caller's row ID from the users table.
 * Returns null if the token is missing, invalid, or the user has no DB record.
 */
async function getVerifiedUser(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await authClient.auth.getUser(token)
  return user ?? null
}

export async function getUserIdFromRequest(request: Request): Promise<string | null> {
  const user = await getVerifiedUser(request)
  if (!user?.email) return null

  const { data } = await getSupabase()
    .from('users')
    .select('id')
    .eq('email', user.email)
    .single()

  return data?.id ?? null
}

/**
 * Like getUserIdFromRequest but returns the verified email instead of the
 * users-table ID. Used by /api/register which needs to upsert the users table.
 */
export async function getVerifiedEmailFromRequest(request: Request): Promise<string | null> {
  const user = await getVerifiedUser(request)
  return user?.email ?? null
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function getRedirectUrl(origin: string): string {
  return `${origin}/auth/confirm`
}

/**
 * Send magic link email for account activation.
 * Fire-and-forget in Phase 1 — watch creation doesn't depend on auth.
 */
export async function sendMagicLink(email: string, origin: string): Promise<{ error: string | null }> {
  const supabase = getSupabase()
  const redirectTo = getRedirectUrl(origin)
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  })
  return { error: error?.message ?? null }
}
