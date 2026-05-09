import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}))

describe('worker alert persistence', () => {
  beforeEach(() => {
    vi.resetModules()
    mockCreateClient.mockReset()
    process.env.SUPABASE_URL = 'https://supabase.test'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role'
  })

  it('creates alerts in the real availability_alerts table with site details', async () => {
    const dedupChain = {
      select: vi.fn(() => dedupChain),
      eq: vi.fn(() => dedupChain),
      limit: vi.fn(async () => ({ data: [], error: null })),
    }
    const insert = vi.fn(async () => ({ error: null }))

    mockCreateClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'availability_alerts') {
          return {
            ...dedupChain,
            insert,
          }
        }

        throw new Error(`Unexpected table ${table}`)
      }),
    })

    const { createAlert } = await import('../src/supabase.js')
    const created = await createAlert('watch-1', 'user-1', [{ siteId: '101', siteName: 'A12' }])

    expect(created).toBe(true)
    expect(insert).toHaveBeenCalledWith({
      watched_target_id: 'watch-1',
      user_id: 'user-1',
      site_details: {
        sites: [{ siteId: '101', siteName: 'A12' }],
      },
      claimed: false,
    })
  })

  it('marks stale availability alerts claimed based on notified_at', async () => {
    const select = vi.fn(async () => ({ data: [{ id: 'alert-1' }, { id: 'alert-2' }], error: null }))
    const lt = vi.fn(() => ({ select }))
    const eq = vi.fn(() => ({ lt }))
    const update = vi.fn(() => ({ eq }))

    mockCreateClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'availability_alerts') {
          return { update }
        }

        throw new Error(`Unexpected table ${table}`)
      }),
    })

    const { expireStaleAlerts } = await import('../src/supabase.js')
    const expiredCount = await expireStaleAlerts()

    expect(expiredCount).toBe(2)
    expect(update).toHaveBeenCalledWith({ claimed: true })
    expect(eq).toHaveBeenCalledWith('claimed', false)
    expect(lt).toHaveBeenCalledWith('notified_at', expect.any(String))
  })

  it('maps worker cycle stats into the real worker_status schema', async () => {
    const upsert = vi.fn(async () => ({ error: null }))

    mockCreateClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'worker_status') {
          return { upsert }
        }

        throw new Error(`Unexpected table ${table}`)
      }),
    })

    const { updateWorkerStatus } = await import('../src/supabase.js')

    const written = await updateWorkerStatus({
      last_cycle_at: '2026-04-17T08:00:00.000Z',
      watches_checked: 18,
      alerts_created: 3,
      consecutive_403: {
        'camping.bcparks.ca': 2,
        'reservations.ontarioparks.ca': 5,
      },
      platforms_healthy: {
        bc_parks: true,
        ontario_parks: false,
      },
    })

    expect(written).toBe(true)
    expect(upsert).toHaveBeenCalledWith(
      {
        id: 'singleton',
        last_cycle_at: '2026-04-17T08:00:00.000Z',
        last_successful_poll_at: '2026-04-17T08:00:00.000Z',
        consecutive_403_count: 5,
        platforms_healthy: {
          bc_parks: true,
          ontario_parks: false,
        },
        cycle_stats: {
          watches_checked: 18,
          alerts_created: 3,
          consecutive_403: {
            'camping.bcparks.ca': 2,
            'reservations.ontarioparks.ca': 5,
          },
        },
      },
      { onConflict: 'id' }
    )
  })

  it('reports worker_status write failures so health can go degraded', async () => {
    const upsert = vi.fn(async () => ({ error: { message: 'permission denied' } }))

    mockCreateClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'worker_status') {
          return { upsert }
        }

        throw new Error(`Unexpected table ${table}`)
      }),
    })

    const { updateWorkerStatus } = await import('../src/supabase.js')

    const written = await updateWorkerStatus({
      last_cycle_at: '2026-04-17T08:00:00.000Z',
      watches_checked: 0,
      alerts_created: 0,
      platforms_healthy: { bc_parks: true },
    })

    expect(written).toBe(false)
  })
})
