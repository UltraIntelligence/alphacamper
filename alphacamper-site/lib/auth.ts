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
 * Watch creation completes after the caller returns with a verified session.
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
  const res = await fetch('/api/auth/send-magic-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, redirectTo, campgroundName: options?.campgroundName }),
  })
  const data = await res.json() as { error: string | null }
  return { error: data.error ?? null }
}
