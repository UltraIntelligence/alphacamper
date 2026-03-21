import { createHmac, timingSafeEqual } from 'node:crypto'
import { getSupabase } from './supabase'
import { getBearerToken } from './auth'

const EXTENSION_TOKEN_PREFIX = 'ext_'
const EXTENSION_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000

interface AuthIdentity {
  email: string | null
  userId: string | null
}

function getExtensionAuthSecret(): string {
  const secret = process.env.EXTENSION_AUTH_SECRET
  if (!secret) {
    throw new Error('Missing EXTENSION_AUTH_SECRET')
  }
  return secret
}

function signExtensionPayload(encodedPayload: string): string {
  return createHmac('sha256', getExtensionAuthSecret())
    .update(encodedPayload)
    .digest('base64url')
}

export function issueExtensionAuthToken(userId: string, email: string): string {
  const encodedPayload = Buffer.from(JSON.stringify({
    userId,
    email,
    exp: Date.now() + EXTENSION_TOKEN_TTL_MS,
  })).toString('base64url')

  return `${EXTENSION_TOKEN_PREFIX}${encodedPayload}.${signExtensionPayload(encodedPayload)}`
}

function verifyExtensionAuthToken(token: string): AuthIdentity | null {
  if (!token.startsWith(EXTENSION_TOKEN_PREFIX)) return null

  const rawToken = token.slice(EXTENSION_TOKEN_PREFIX.length)
  const [encodedPayload, signature] = rawToken.split('.')
  if (!encodedPayload || !signature) return null

  try {
    const provided = Buffer.from(signature)
    const expected = Buffer.from(signExtensionPayload(encodedPayload))
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return null
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as {
      userId?: string
      email?: string
      exp?: number
    }

    if (!payload.userId || !payload.email || !payload.exp || payload.exp < Date.now()) {
      return null
    }

    return {
      userId: payload.userId,
      email: payload.email,
    }
  } catch {
    return null
  }
}

async function getVerifiedIdentity(request: Request): Promise<AuthIdentity | null> {
  const token = getBearerToken(request.headers.get('Authorization'))
  if (!token) return null

  const extensionIdentity = verifyExtensionAuthToken(token)
  if (extensionIdentity) return extensionIdentity

  const { data: { user } } = await getSupabase().auth.getUser(token)
  if (!user?.email) return null

  return {
    email: user.email,
    userId: null,
  }
}

export async function getUserIdFromRequest(request: Request): Promise<string | null> {
  const identity = await getVerifiedIdentity(request)
  if (!identity) return null
  if (identity.userId) return identity.userId

  const { data, error } = await getSupabase()
    .from('users')
    .select('id')
    .eq('email', identity.email)
    .maybeSingle()

  if (error) {
    console.error('[auth] Failed users.select(id) lookup', {
      email: identity.email,
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
  const identity = await getVerifiedIdentity(request)
  return identity?.email ?? null
}
