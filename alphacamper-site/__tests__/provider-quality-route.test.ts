// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetServiceRoleSupabase } = vi.hoisted(() => ({
  mockGetServiceRoleSupabase: vi.fn(),
}))

vi.mock('@/lib/supabase.server', () => ({
  getServiceRoleSupabase: mockGetServiceRoleSupabase,
}))

beforeEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()
  mockGetServiceRoleSupabase.mockReset()
  mockGetServiceRoleSupabase.mockImplementation(() => {
    throw new Error('Missing Supabase environment variables')
  })
  delete process.env.ALPHACAMPER_API_URL
  delete process.env.NEXT_PUBLIC_ALPHACAMPER_API_URL
})

function mockSupabaseTable(dataByTable: Record<string, unknown[]>) {
  mockGetServiceRoleSupabase.mockReturnValue({
    from: vi.fn((table: string) => ({
      select: vi.fn(async () => ({
        data: dataByTable[table] ?? [],
        error: null,
      })),
    })),
  })
}

describe('provider quality route', () => {
  it('falls back to a friendly empty response when the backend is not configured in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    const { GET } = await import('@/app/api/admin/provider-quality/route')
    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      status: 'admin_api_offline',
      available: false,
      fetchedFrom: null,
      providers: [],
    })
  })

  it('returns admin_api_offline when the backend cannot be reached', async () => {
    process.env.ALPHACAMPER_API_URL = 'https://api.alphacamper.test'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED')))

    const { GET } = await import('@/app/api/admin/provider-quality/route')
    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      status: 'admin_api_offline',
      available: false,
      fetchedFrom: 'https://api.alphacamper.test/v1/admin/overview',
      providers: [],
    })
  })

  it('falls back to live Supabase operator truth when the beta admin API is offline', async () => {
    mockSupabaseTable({
      catalog_provider_syncs: [
        {
          provider_key: 'bc_parks',
          provider_name: 'BC Parks',
          source_url: 'https://camping.bcparks.ca/api/resourceLocation',
          support_status: 'alertable',
          availability_mode: 'live_polling',
          confidence: 'verified',
          status: 'succeeded',
          row_count: 145,
          last_attempted_at: '2026-05-09T09:10:58.425Z',
          last_success_at: '2026-05-09T09:10:58.425Z',
          last_error: null,
          stale_after_hours: 24,
          metadata_json: {
            verification_note: 'Official BC Parks CAMIS directory and worker live polling are verified.',
          },
        },
        {
          provider_key: 'gtc_manitoba',
          provider_name: 'Manitoba Parks',
          source_url: 'https://manitoba.goingtocamp.com/api/resourceLocation',
          support_status: 'search_only',
          availability_mode: 'directory_only',
          confidence: 'verified',
          status: 'succeeded',
          row_count: 45,
          last_attempted_at: '2026-05-09T09:11:12.624Z',
          last_success_at: '2026-05-09T09:11:12.624Z',
          last_error: null,
          stale_after_hours: 24,
          metadata_json: {
            verification_note: 'Official GoingToCamp directory is verified.',
          },
        },
      ],
      worker_status: [],
      watched_targets: [
        { id: 'watch-1', active: true },
        { id: 'watch-2', active: false },
      ],
      availability_alerts: [
        { id: 'alert-1', claimed: false, notified_at: '2026-05-09T09:12:00Z' },
      ],
    })

    const { GET } = await import('@/app/api/admin/provider-quality/route')
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      available: true,
      reason: 'Railway worker heartbeat is not visible yet.',
      fetchedFrom: 'live_supabase',
      providerQuality: {
        total: 2,
        live_polling: 1,
        directory_only: 1,
        verified: 2,
      },
      alertDelivery: {
        active_alerts: 1,
        total_deliveries: 1,
        delivered: 1,
      },
    })
    expect(body.providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provider_id: 'railway_worker',
          status: 'degraded',
          last_error_code: 'missing_worker_heartbeat',
        }),
        expect.objectContaining({
          provider_id: 'bc_parks',
          provider_name: 'BC Parks',
          availability_mode: 'live_polling',
        }),
      ]),
    )
  })

  it('proxies the operator summary from the backend when configured', async () => {
    process.env.ALPHACAMPER_API_URL = 'https://api.alphacamper.test'

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        provider_quality: {
          total: 3,
          live_polling: 2,
          directory_only: 1,
          metadata_only: 0,
          verified: 2,
          inferred: 1,
          seeded: 0,
          unknown: 0,
        },
        alert_delivery: {
          active_alerts: 9,
          total_deliveries: 12,
          delivered: 11,
          failed: 1,
          webhook_deliveries: 8,
          email_deliveries: 4,
        },
        providers: [
          {
            provider_id: 'ontario',
            provider_name: 'Ontario Parks',
            country: 'CA',
            kind: 'provincial',
            status: 'healthy',
            availability_mode: 'live_polling',
            confidence: 'verified',
            verification_note: 'Live and healthy.',
            last_request_at: '2026-04-17T00:00:00Z',
            next_allowed_at: null,
            current_backoff_seconds: 0,
            consecutive_errors: 0,
            last_error_code: null,
          },
        ],
      }),
    })

    vi.stubGlobal('fetch', fetchMock)

    const { GET } = await import('@/app/api/admin/provider-quality/route')
    const response = await GET()
    const body = await response.json()

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.alphacamper.test/v1/admin/overview',
      expect.objectContaining({
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
    )
    expect(body).toMatchObject({
      available: true,
      fetchedFrom: 'https://api.alphacamper.test/v1/admin/overview',
      providerQuality: {
        total: 3,
        live_polling: 2,
      },
      alertDelivery: {
        active_alerts: 9,
      },
      providers: [
        {
          provider_name: 'Ontario Parks',
          availability_mode: 'live_polling',
        },
      ],
    })
  })
})
