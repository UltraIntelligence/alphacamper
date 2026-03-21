import { getSupabase } from './supabase'

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function getRedirectUrl(origin: string): string {
  const normalizedOrigin = origin.replace(/\/+$/, '')
  return `${normalizedOrigin}/auth/confirm`
}

export function getBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null

  const match = authHeader.match(/^bearer\s+(.+)$/i)
  if (!match) return null

  const token = match[1]?.trim()
  return token ? token : null
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
