import { describe, expect, it } from 'vitest'
import {
  evaluateProductionWorkerSmokeStatus,
  formatPlatformCounts,
  summarizeActiveWatchesByPlatform,
} from '../scripts/smoke-production'

describe('production worker smoke status', () => {
  const greenInput = {
    providerAvailable: true,
    fetchedFrom: 'live_supabase',
    routeWorkerHealthy: true,
    heartbeatRecent: true,
    requiredPlatformsHealthy: true,
    supabaseError: null,
  }

  it('stays green only when live route and direct heartbeat proof are clean', () => {
    expect(evaluateProductionWorkerSmokeStatus(greenInput)).toBe('green')
  })

  it('goes yellow when the worker heartbeat or required platforms are missing', () => {
    expect(
      evaluateProductionWorkerSmokeStatus({
        ...greenInput,
        heartbeatRecent: false,
      }),
    ).toBe('yellow')
    expect(
      evaluateProductionWorkerSmokeStatus({
        ...greenInput,
        requiredPlatformsHealthy: false,
      }),
    ).toBe('yellow')
  })

  it('goes red when provider-quality is unavailable or not live Supabase truth', () => {
    expect(
      evaluateProductionWorkerSmokeStatus({
        ...greenInput,
        providerAvailable: false,
      }),
    ).toBe('red')
    expect(
      evaluateProductionWorkerSmokeStatus({
        ...greenInput,
        fetchedFrom: 'static_fallback',
      }),
    ).toBe('red')
  })

  it('summarizes active watches by platform without customer data', () => {
    expect(
      summarizeActiveWatchesByPlatform([
        { platform: 'bc_parks' },
        { platform: 'ontario_parks' },
        { platform: 'bc_parks' },
        { platform: '' },
        { platform: null },
      ]),
    ).toEqual({
      bc_parks: 2,
      ontario_parks: 1,
      unknown: 2,
    })
  })

  it('formats platform counts deterministically', () => {
    expect(formatPlatformCounts({ ontario_parks: 1, bc_parks: 4 })).toBe('bc_parks:4, ontario_parks:1')
    expect(formatPlatformCounts({})).toBe('none')
  })
})
