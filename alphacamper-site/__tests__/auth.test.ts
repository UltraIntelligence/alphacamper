import { describe, it, expect } from 'vitest'
import { validateEmail, getRedirectUrl, getBearerToken } from '@/lib/auth'

describe('validateEmail', () => {
  it('accepts valid emails', () => {
    expect(validateEmail('user@example.com')).toBe(true)
    expect(validateEmail('a@b.co')).toBe(true)
  })

  it('rejects invalid emails', () => {
    expect(validateEmail('')).toBe(false)
    expect(validateEmail('not-an-email')).toBe(false)
    expect(validateEmail('@no-local.com')).toBe(false)
  })
})

describe('getRedirectUrl', () => {
  it('returns auth confirm path', () => {
    const url = getRedirectUrl('http://localhost:3000')
    expect(url).toBe('http://localhost:3000/auth/confirm')
  })

  it('preserves extra redirect params when provided', () => {
    const url = getRedirectUrl('http://localhost:3000/', {
      extensionId: 'abc123',
      flow: 'extension',
    })

    expect(url).toBe('http://localhost:3000/auth/confirm?extensionId=abc123&flow=extension')
  })
})

describe('getBearerToken', () => {
  it('accepts bearer headers regardless of casing', () => {
    expect(getBearerToken('Bearer token-123')).toBe('token-123')
    expect(getBearerToken('bearer token-123')).toBe('token-123')
    expect(getBearerToken('BeArEr token-123')).toBe('token-123')
  })

  it('rejects invalid authorization headers', () => {
    expect(getBearerToken(null)).toBeNull()
    expect(getBearerToken('Basic abc')).toBeNull()
    expect(getBearerToken('Bearer    ')).toBeNull()
  })
})
