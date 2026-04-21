// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.restoreAllMocks()
  delete process.env.ALPHACAMPER_API_URL
  delete process.env.NEXT_PUBLIC_ALPHACAMPER_API_URL
})

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
