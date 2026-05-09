// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { StepSiteNumber } from '@/components/watch/StepSiteNumber'

afterEach(() => {
  cleanup()
})

describe('StepSiteNumber', () => {
  it('keeps the site number optional for the customer', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()

    render(
      <StepSiteNumber
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
          supportStatus: 'alertable',
        }}
        onUpdate={vi.fn()}
        onComplete={onComplete}
      />
    )

    expect(screen.getByText('Leave this blank and Alpha will alert you for any matching opening at Alice Lake.')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onComplete).toHaveBeenCalled()
  })

  it('explains the exact-site behavior when a site number is set', async () => {
    const onUpdate = vi.fn()

    render(
      <StepSiteNumber
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
          supportStatus: 'alertable',
        }}
        onUpdate={onUpdate}
        onComplete={vi.fn()}
      />
    )

    fireEvent.change(screen.getByLabelText('Specific site number'), {
      target: { value: 'A12' },
    })
    expect(onUpdate).toHaveBeenLastCalledWith({ siteNumber: 'A12' })

    cleanup()

    render(
      <StepSiteNumber
        data={{
          campgroundId: 'camp-1',
          campgroundName: 'Alice Lake',
          platform: 'bc_parks',
          province: 'BC',
          arrivalDate: '2026-07-10',
          departureDate: '2026-07-12',
          nights: 2,
          isAnyOpening: false,
          siteNumber: 'A12',
          email: '',
          supportStatus: 'alertable',
        }}
        onUpdate={vi.fn()}
        onComplete={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Save site preference' })).toBeTruthy()
    expect(screen.getByText('Alpha will only alert you if site A12 opens up.')).toBeTruthy()
  })
})
