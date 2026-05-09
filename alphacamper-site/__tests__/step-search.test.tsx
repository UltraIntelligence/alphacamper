// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { StepSearch } from '@/components/watch/StepSearch'
import type { WatchData } from '@/components/watch/WatchWizard'

const baseData: WatchData = {
  campgroundId: '',
  campgroundName: '',
  platform: '',
  province: '',
  arrivalDate: '',
  departureDate: '',
  nights: 1,
  isAnyOpening: false,
  siteNumber: '',
  email: '',
  supportStatus: 'unsupported',
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
    campgrounds: [{
      id: 'coming-soon-1',
      name: 'Bow Valley Campground',
      platform: 'alberta_parks',
      province: 'AB',
      support_status: 'coming_soon',
    }],
  }), { status: 200 })))
})

describe('StepSearch', () => {
  it('shows support status and blocks continuing when alerts are not live', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    const onComplete = vi.fn()

    const { rerender } = render(
      <StepSearch
        data={baseData}
        onUpdate={onUpdate}
        onComplete={onComplete}
      />
    )

    await user.type(screen.getByLabelText('Park or campground'), 'Bow')
    await user.click(await screen.findByRole('option', { name: /Bow Valley Campground/ }))

    expect(onUpdate).toHaveBeenCalledWith({
      campgroundId: 'coming-soon-1',
      campgroundName: 'Bow Valley Campground',
      platform: 'alberta_parks',
      province: 'AB',
      supportStatus: 'coming_soon',
    })

    rerender(
      <StepSearch
        data={{
          ...baseData,
          campgroundId: 'coming-soon-1',
          campgroundName: 'Bow Valley Campground',
          platform: 'alberta_parks',
          province: 'AB',
          supportStatus: 'coming_soon',
        }}
        onUpdate={onUpdate}
        onComplete={onComplete}
      />
    )

    const continueButton = screen.getByRole('button', { name: /Alerts not live yet/ })
    expect(continueButton).toHaveProperty('disabled', true)
  })
})
