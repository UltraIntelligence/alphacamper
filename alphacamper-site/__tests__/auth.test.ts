import { describe, it, expect } from 'vitest'
import { validateEmail, getRedirectUrl } from '@/lib/auth'

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
})
