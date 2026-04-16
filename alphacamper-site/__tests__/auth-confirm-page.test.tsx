// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'

let currentSearchParams = new URLSearchParams()
const {
  mockPush,
  mockVerifyOtp,
  mockGetSession,
  mockSendMagicLink,
} = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockVerifyOtp: vi.fn(),
  mockGetSession: vi.fn(),
  mockSendMagicLink: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => currentSearchParams,
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('@/lib/auth', () => ({
  clearMagicLinkEmail: () => window.localStorage.removeItem('alphacamper.magicLinkEmail'),
  readMagicLinkEmail: () => window.localStorage.getItem('alphacamper.magicLinkEmail'),
  sendMagicLink: mockSendMagicLink,
}))

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    auth: {
      verifyOtp: mockVerifyOtp,
      getSession: mockGetSession,
    },
  }),
}))

import AuthConfirmPage from '@/app/auth/confirm/page'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

beforeEach(() => {
  currentSearchParams = new URLSearchParams()
  mockPush.mockReset()
  mockVerifyOtp.mockReset()
  mockGetSession.mockReset()
  mockSendMagicLink.mockReset()
  window.localStorage.clear()
  vi.stubGlobal('fetch', vi.fn())
})

describe('auth confirm page', () => {
  it('finishes sign-in, creates the account, and saves the pending watch', async () => {
    currentSearchParams = new URLSearchParams({
      token_hash: 'otp-token',
      type: 'magiclink',
    })
    window.localStorage.setItem('alphacamper.pendingWatch', JSON.stringify({
      platform: 'bc_parks',
      campgroundId: 'camp-1',
      campgroundName: 'Alice Lake',
      siteNumber: 'A12',
      arrivalDate: '2026-07-10',
      departureDate: '2026-07-12',
    }))
    window.localStorage.setItem('alphacamper.magicLinkEmail', 'camper@example.com')

    mockVerifyOtp.mockResolvedValue({ error: null })
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'session-token',
        },
      },
    })
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = String(input)
      if (url === '/api/register') {
        return new Response(JSON.stringify({ user: { id: 'user-1' } }), { status: 200 })
      }
      if (url === '/api/watch') {
        return new Response(JSON.stringify({ success: true }), { status: 200 })
      }
      throw new Error(`Unexpected fetch: ${url}`)
    })
    const realSetTimeout = globalThis.setTimeout
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((callback: TimerHandler, delay?: number, ...args: unknown[]) => {
      if (delay === 1500 && typeof callback === 'function') {
        callback(...args)
        return 1 as never
      }
      return realSetTimeout(callback, delay, ...args)
    }) as typeof setTimeout)

    render(<AuthConfirmPage />)

    expect(await screen.findByText("You're in!")).toBeTruthy()
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled()
    })
    expect(vi.mocked(fetch).mock.calls).toEqual(
      expect.arrayContaining([
        [
          '/api/register',
          {
            method: 'POST',
            headers: { Authorization: 'Bearer session-token' },
          },
        ],
        [
          '/api/watch',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer session-token',
            },
            body: JSON.stringify({
              platform: 'bc_parks',
              campgroundId: 'camp-1',
              campgroundName: 'Alice Lake',
              siteNumber: 'A12',
              arrivalDate: '2026-07-10',
              departureDate: '2026-07-12',
            }),
          },
        ],
      ])
    )

    expect(window.localStorage.getItem('alphacamper.pendingWatch')).toBeNull()
    expect(window.localStorage.getItem('alphacamper.magicLinkEmail')).toBeNull()
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('lets the customer resend the login link if sign-in cannot finish', async () => {
    const user = userEvent.setup()
    currentSearchParams = new URLSearchParams()
    window.localStorage.setItem('alphacamper.magicLinkEmail', 'camper@example.com')
    window.localStorage.setItem('alphacamper.pendingWatch', JSON.stringify({
      platform: 'bc_parks',
      campgroundId: 'camp-1',
      campgroundName: 'Alice Lake',
      siteNumber: null,
      arrivalDate: '2026-07-10',
      departureDate: '2026-07-12',
    }))
    mockSendMagicLink.mockResolvedValue({ error: null })

    render(<AuthConfirmPage />)

    expect(await screen.findByText("We couldn't finish sign-in")).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Email me a new link' }))

    expect(mockSendMagicLink).toHaveBeenCalledWith('camper@example.com', window.location.origin, {
      campgroundName: 'Alice Lake',
      extensionId: null,
      flow: null,
    })
    expect(await screen.findByText('We sent a fresh link to camper@example.com.')).toBeTruthy()
  })
})
