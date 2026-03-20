import { getSupabase } from './supabase'

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
export async function sendMagicLink(email: string): Promise<{ error: string | null }> {
  const supabase = getSupabase()
  const redirectTo = getRedirectUrl(window.location.origin)
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  })
  return { error: error?.message ?? null }
}
