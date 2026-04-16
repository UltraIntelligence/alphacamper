// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockGenerateLink,
  mockCreateClient,
  mockRender,
  mockSendEmail,
} = vi.hoisted(() => ({
  mockGenerateLink: vi.fn(),
  mockCreateClient: vi.fn(),
  mockRender: vi.fn(),
  mockSendEmail: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}))

vi.mock('@react-email/components', () => ({
  render: mockRender,
}))

vi.mock('@/emails/MagicLinkEmail', () => ({
  MagicLinkEmail: vi.fn(() => null),
}))

vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: mockSendEmail }
  },
}))

import { POST } from '@/app/api/auth/send-magic-link/route'

beforeEach(() => {
  vi.clearAllMocks()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.test'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
  process.env.RESEND_API_KEY = 're_test_123'
  process.env.RESEND_FROM_EMAIL = 'alerts@alphacamper.com'

  mockCreateClient.mockReturnValue({
    auth: {
      admin: {
        generateLink: mockGenerateLink,
      },
    },
  })
  mockRender.mockResolvedValue('<html>Magic link</html>')
  mockSendEmail.mockResolvedValue({ error: null })
})

describe('send magic link route', () => {
  it('validates the required email payload', async () => {
    const response = await POST(new Request('https://alphacamper.test/api/auth/send-magic-link', {
      method: 'POST',
      body: JSON.stringify({ email: 'camper@example.com' }),
    }) as never)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'email and redirectTo are required' })
  })

  it('returns a helpful error when email delivery is not configured', async () => {
    delete process.env.RESEND_API_KEY

    const response = await POST(new Request('https://alphacamper.test/api/auth/send-magic-link', {
      method: 'POST',
      body: JSON.stringify({
        email: 'camper@example.com',
        redirectTo: 'https://alphacamper.com/auth/confirm',
      }),
    }) as never)

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Email service not configured' })
  })

  it('creates a Supabase magic link and sends the branded email', async () => {
    mockGenerateLink.mockResolvedValue({
      data: {
        properties: {
          action_link: 'https://supabase.test/verify?token=abc',
        },
      },
      error: null,
    })

    const response = await POST(new Request('https://alphacamper.test/api/auth/send-magic-link', {
      method: 'POST',
      body: JSON.stringify({
        email: 'camper@example.com',
        redirectTo: 'https://alphacamper.com/auth/confirm?flow=watch',
        campgroundName: 'Alice Lake',
      }),
    }) as never)

    expect(response.status).toBe(200)
    expect(mockGenerateLink).toHaveBeenCalledWith({
      type: 'magiclink',
      email: 'camper@example.com',
      options: {
        redirectTo: 'https://alphacamper.com/auth/confirm?flow=watch',
      },
    })
    expect(mockRender).toHaveBeenCalledOnce()
    expect(mockSendEmail).toHaveBeenCalledWith({
      from: 'Alphacamper <alerts@alphacamper.com>',
      to: 'camper@example.com',
      subject: 'Sign in to Alphacamper',
      html: '<html>Magic link</html>',
    })
    await expect(response.json()).resolves.toEqual({ error: null })
  })
})
