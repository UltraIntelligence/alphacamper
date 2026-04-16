// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('react-day-picker', () => ({
  DayPicker: ({ onSelect }: { onSelect: (range: { from?: Date; to?: Date } | undefined) => void }) => (
    <div>
      <button type="button" onClick={() => onSelect({ from: new Date(2026, 6, 10) })}>Pick arrival</button>
      <button type="button" onClick={() => onSelect({ from: new Date(2026, 6, 10), to: new Date(2026, 6, 12) })}>Pick valid range</button>
      <button type="button" onClick={() => onSelect({ from: new Date(2026, 6, 10), to: new Date(2026, 6, 30) })}>Pick long range</button>
    </div>
  ),
}))

import { StepDates } from '@/components/watch/StepDates'

afterEach(() => {
  cleanup()
})

describe('StepDates', () => {
  it('updates exact trip dates and lets the customer continue', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    const onComplete = vi.fn()

    render(
      <StepDates
        data={{
          campgroundId: 'camp-1',
          campgroundName: 'Alice Lake',
          platform: 'bc_parks',
          province: 'BC',
          arrivalDate: '',
          departureDate: '',
          nights: 1,
          isAnyOpening: false,
          siteNumber: '',
          email: '',
        }}
        onUpdate={onUpdate}
        onComplete={onComplete}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Pick valid range' }))

    expect(onUpdate).toHaveBeenCalledWith({
      arrivalDate: '2026-07-10',
      departureDate: '2026-07-12',
      nights: 2,
    })

    cleanup()

    render(
      <StepDates
        data={{
          campgroundId: 'camp-1',
          campgroundName: 'Alice Lake',
          platform: 'bc_parks',
          province: 'BC',
          arrivalDate: '2026-07-10',
          departureDate: '2026-07-12',
          nights: 2,
          isAnyOpening: false,
          siteNumber: '',
          email: '',
        }}
        onUpdate={vi.fn()}
        onComplete={onComplete}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onComplete).toHaveBeenCalled()
  })

  it('blocks unsupported long date ranges', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()

    render(
      <StepDates
        data={{
          campgroundId: 'camp-1',
          campgroundName: 'Alice Lake',
          platform: 'bc_parks',
          province: 'BC',
          arrivalDate: '',
          departureDate: '',
          nights: 1,
          isAnyOpening: false,
          siteNumber: '',
          email: '',
        }}
        onUpdate={onUpdate}
        onComplete={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Pick long range' }))

    expect(onUpdate).toHaveBeenCalledWith({
      arrivalDate: '2026-07-10',
      departureDate: '',
      nights: 1,
    })
    expect(screen.getByText('Max 14 nights — try a shorter stay.')).toBeTruthy()
  })

  it('shows the upgrade path instead of fake filters when Any opening is selected', () => {
    render(
      <StepDates
        data={{
          campgroundId: 'camp-1',
          campgroundName: 'Alice Lake',
          platform: 'bc_parks',
          province: 'BC',
          arrivalDate: '',
          departureDate: '',
          nights: 1,
          isAnyOpening: true,
          siteNumber: '',
          email: '',
        }}
        onUpdate={vi.fn()}
        onComplete={vi.fn()}
      />
    )

    expect(screen.getByText('Unlock "Any Opening" mode')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Upgrade to Alpha Pro' }).getAttribute('href')).toBe('/#pricing')
  })
})
