// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'

const { mockSendMagicLink } = vi.hoisted(() => ({
  mockSendMagicLink: vi.fn(),
}))

const originalFetch = global.fetch

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
          supportStatus: 'alertable',
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
  global.fetch = vi.fn(async () => ({
    ok: true,
    json: async () => ({
      campgrounds: [{
        id: '-2147483647',
        name: 'Alice Lake Provincial Park',
        platform: 'bc_parks',
        province: 'BC',
        support_status: 'alertable',
      }],
    }),
  })) as typeof fetch
})

afterEach(() => {
  global.fetch = originalFetch
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

  it('uses the exact park details passed from live search results', async () => {
    const user = userEvent.setup()
    mockSendMagicLink.mockResolvedValue({ error: null })

    render(
      <WatchWizard
        initialParkId="-2147483647"
        initialParkName="Alice Lake Provincial Park"
        initialPlatform="bc_parks"
        initialProvince="BC"
      />
    )

    await user.click(await screen.findByRole('button', { name: 'Choose dates' }))
    await user.click(screen.getByRole('button', { name: 'Save site' }))
    await user.type(screen.getByLabelText('email'), 'camper@example.com')
    await user.click(screen.getByRole('button', { name: 'Start watching' }))

    expect(mockSendMagicLink).toHaveBeenCalledWith('camper@example.com', window.location.origin, {
      campgroundName: 'Alice Lake Provincial Park',
    })

    expect(JSON.parse(window.localStorage.getItem('alphacamper.pendingWatch') || '{}')).toEqual({
      platform: 'bc_parks',
      campgroundId: '-2147483647',
      campgroundName: 'Alice Lake Provincial Park',
      siteNumber: 'A12',
      arrivalDate: '2026-07-10',
      departureDate: '2026-07-12',
    })
  })

  it('does not auto-select a campground when the URL metadata fails validation', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ campgrounds: [] }),
    })) as typeof fetch

    render(
      <WatchWizard
        initialParkId="-2147483647"
        initialParkName="Not Alice Lake"
        initialPlatform="bc_parks"
        initialProvince="BC"
      />
    )

    expect(await screen.findByRole('button', { name: 'Choose campground' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Choose dates' })).toBeNull()
  })

  it('does not skip search when a prefilled campground is not alertable yet', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        campgrounds: [{
          id: 'coming-soon-1',
          name: 'Bow Valley Campground',
          platform: 'alberta_parks',
          province: 'AB',
          support_status: 'coming_soon',
        }],
      }),
    })) as typeof fetch

    render(
      <WatchWizard
        initialParkId="coming-soon-1"
        initialParkName="Bow Valley Campground"
        initialPlatform="alberta_parks"
        initialProvince="AB"
      />
    )

    expect(await screen.findByRole('button', { name: 'Choose campground' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Choose dates' })).toBeNull()
  })

  it('keeps a manual campground choice when hydration finishes later', async () => {
    const user = userEvent.setup()
    mockSendMagicLink.mockResolvedValue({ error: null })

    let resolveFetch: ((value: Response) => void) | undefined
    global.fetch = vi.fn(() => new Promise((resolve) => {
      resolveFetch = resolve as (value: Response) => void
    })) as typeof fetch

    render(<WatchWizard initialParkId="-2147483647" initialPlatform="bc_parks" />)

    await user.click(await screen.findByRole('button', { name: 'Choose campground' }))

    resolveFetch?.({
      ok: true,
      json: async () => ({
        campgrounds: [{
          id: '-2147483647',
          name: 'Tunnel Mountain Trailer Court',
          platform: 'bc_parks',
          province: 'BC',
        }],
      }),
    } as Response)

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
  })
})
