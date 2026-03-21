import { getSupabase } from './supabase'

export function getBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null

  const match = authHeader.match(/^bearer\s+(.+)$/i)
  if (!match) return null

  const token = match[1]?.trim()
  return token ? token : null
}

/**
 * Verifies the Supabase JWT from an Authorization: Bearer header,
 * then resolves the caller's row ID from the users table.
 * Returns null if the token is missing, invalid, or the user has no DB record.
 */
async function getVerifiedUser(request: Request) {
  const token = getBearerToken(request.headers.get('Authorization'))
  if (!token) return null

  const { data: { user } } = await getSupabase().auth.getUser(token)
  return user ?? null
}

export async function getUserIdFromRequest(request: Request): Promise<string | null> {
  const user = await getVerifiedUser(request)
  if (!user?.email) return null

  const { data, error } = await getSupabase()
    .from('users')
    .select('id')
    .eq('email', user.email)
    .single()

  if (error) {
    console.error('[auth] Failed users.select(id) lookup', {
      email: user.email,
      error: error.message,
    })
    throw new Error('Failed to load authenticated user')
  }

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
  const normalizedOrigin = origin.replace(/\/+$/, '')
  return `${normalizedOrigin}/auth/confirm`
}

/**
 * Send magic link email for account activation.
 * Watch creation completes after the caller returns with a verified session.
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
