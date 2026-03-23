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
export async function sendMagicLink(
  email: string,
  origin: string,
  campgroundName?: string
): Promise<{ error: string | null }> {
  const redirectTo = getRedirectUrl(origin)
  const res = await fetch('/api/auth/send-magic-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, redirectTo, campgroundName }),
  })
  const data = await res.json() as { error: string | null }
  return { error: data.error ?? null }
}
