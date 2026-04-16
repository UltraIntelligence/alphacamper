// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'

const { mockSendMagicLink } = vi.hoisted(() => ({
  mockSendMagicLink: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  sendMagicLink: mockSendMagicLink,
  storeMagicLinkEmail: (email: string) => {
    window.localStorage.setItem('alphacamper.magicLinkEmail', email.trim().toLowerCase())
  },
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('@/components/watch/WatchMapBackground', () => ({
  WatchMapBackground: () => <div data-testid="watch-map-background" />,
}))

vi.mock('@/components/watch/StepSearch', () => ({
  StepSearch: ({ onUpdate, onComplete }: { onUpdate: (partial: object) => void; onComplete: () => void }) => (
    <button
      type="button"
      onClick={() => {
        onUpdate({
          campgroundId: 'camp-1',
          campgroundName: 'Alice Lake',
          platform: 'bc_parks',
          province: 'BC',
        })
        onComplete()
      }}
    >
      Choose campground
    </button>
  ),
}))

vi.mock('@/components/watch/StepDates', () => ({
  StepDates: ({ onUpdate, onComplete }: { onUpdate: (partial: object) => void; onComplete: () => void }) => (
    <button
      type="button"
      onClick={() => {
        onUpdate({
          arrivalDate: '2026-07-10',
          departureDate: '2026-07-12',
          nights: 2,
        })
        onComplete()
      }}
    >
      Choose dates
    </button>
  ),
}))

vi.mock('@/components/watch/StepSiteNumber', () => ({
  StepSiteNumber: ({ onUpdate, onComplete }: { onUpdate: (partial: object) => void; onComplete: () => void }) => (
    <button
      type="button"
      onClick={() => {
        onUpdate({ siteNumber: 'A12' })
        onComplete()
      }}
    >
      Save site
    </button>
  ),
}))

vi.mock('@/components/watch/StepEmail', () => ({
  StepEmail: ({
    data,
    onUpdate,
    onSubmit,
    error,
  }: {
    data: { email: string }
    onUpdate: (partial: object) => void
    onSubmit: () => Promise<void>
    error: string | null
  }) => (
    <div>
      <input
        aria-label="email"
        value={data.email}
        onChange={(event) => onUpdate({ email: event.target.value })}
      />
      {error ? <p>{error}</p> : null}
      <button type="button" onClick={() => void onSubmit()}>Start watching</button>
    </div>
  ),
}))

import { WatchWizard } from '@/components/watch/WatchWizard'

afterEach(() => {
  cleanup()
})

beforeEach(() => {
  mockSendMagicLink.mockReset()
  window.localStorage.clear()
})

describe('WatchWizard', () => {
  it('stores the pending watch and sends the magic link for the real watch flow', async () => {
    const user = userEvent.setup()
    mockSendMagicLink.mockResolvedValue({ error: null })

    render(<WatchWizard />)

    await user.click(screen.getByRole('button', { name: 'Choose campground' }))
    await user.click(screen.getByRole('button', { name: 'Choose dates' }))
    await user.click(screen.getByRole('button', { name: 'Save site' }))
    await user.type(screen.getByLabelText('email'), 'camper@example.com')
    await user.click(screen.getByRole('button', { name: 'Start watching' }))

    expect(mockSendMagicLink).toHaveBeenCalledWith('camper@example.com', window.location.origin, {
      campgroundName: 'Alice Lake',
    })

    expect(JSON.parse(window.localStorage.getItem('alphacamper.pendingWatch') || '{}')).toEqual({
      platform: 'bc_parks',
      campgroundId: 'camp-1',
      campgroundName: 'Alice Lake',
      siteNumber: 'A12',
      arrivalDate: '2026-07-10',
      departureDate: '2026-07-12',
    })
    expect(window.localStorage.getItem('alphacamper.magicLinkEmail')).toBe('camper@example.com')
    expect(await screen.findByText('Verify your email')).toBeTruthy()
  })

  it('clears the pending watch again if sending the magic link fails', async () => {
    const user = userEvent.setup()
    mockSendMagicLink.mockResolvedValue({ error: 'Email service is down' })

    render(<WatchWizard />)

    await user.click(screen.getByRole('button', { name: 'Choose campground' }))
    await user.click(screen.getByRole('button', { name: 'Choose dates' }))
    await user.click(screen.getByRole('button', { name: 'Save site' }))
    await user.type(screen.getByLabelText('email'), 'camper@example.com')
    await user.click(screen.getByRole('button', { name: 'Start watching' }))

    expect(await screen.findByText('Email service is down')).toBeTruthy()
    expect(window.localStorage.getItem('alphacamper.pendingWatch')).toBeNull()
  })
})
