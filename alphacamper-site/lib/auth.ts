export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const MAGIC_LINK_EMAIL_STORAGE_KEY = 'alphacamper.magicLinkEmail'

export function getRedirectUrl(origin: string, params?: Record<string, string | null | undefined>): string {
  const normalizedOrigin = origin.replace(/\/+$/, '')
  const url = new URL(`${normalizedOrigin}/auth/confirm`)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        url.searchParams.set(key, value)
      }
    }
  }

  return url.toString()
}

export function getBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null

  const match = authHeader.match(/^bearer\s+(.+)$/i)
  if (!match) return null

  const token = match[1]?.trim()
  return token ? token : null
}

export function storeMagicLinkEmail(email: string): void {
  if (typeof window === 'undefined') return

  const normalizedEmail = email.trim().toLowerCase()
  if (!validateEmail(normalizedEmail)) {
    window.localStorage.removeItem(MAGIC_LINK_EMAIL_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(MAGIC_LINK_EMAIL_STORAGE_KEY, normalizedEmail)
}

export function readMagicLinkEmail(): string | null {
  if (typeof window === 'undefined') return null

  const email = window.localStorage.getItem(MAGIC_LINK_EMAIL_STORAGE_KEY)?.trim().toLowerCase() ?? ''
  return validateEmail(email) ? email : null
}

export function clearMagicLinkEmail(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(MAGIC_LINK_EMAIL_STORAGE_KEY)
}

/**
 * Send magic link email for account activation.
 *
 * Uses supabase.auth.signInWithOtp on the PKCE-configured browser client so
 * the email contains a ?code=<code> link whose completion requires the
 * code_verifier stored in localStorage. This defeats email-client link
 * prefetching (Apple Mail MPP, Outlook, corporate security scanners) that
 * otherwise burns the single-use token before the user can click.
 *
 * The campgroundName / extensionId / flow options are captured in
 * localStorage via the caller; Supabase's email template does not render
 * per-link context, but /auth/confirm picks up the pending watch draft on
 * its own after session exchange.
 */
export async function sendMagicLink(
  email: string,
  origin: string,
  options?: {
    campgroundName?: string
    extensionId?: string | null
    flow?: string | null
  }
): Promise<{ error: string | null }> {
  const redirectTo = getRedirectUrl(origin, {
    extensionId: options?.extensionId,
    flow: options?.flow,
  })

  if (typeof window === 'undefined') {
    return { error: 'Magic link must be sent from the browser' }
  }

  try {
    const { getSupabase } = await import('./supabase')
    const supabase = getSupabase()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })
    return { error: error?.message ?? null }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Failed to send magic link',
    }
  }
}
