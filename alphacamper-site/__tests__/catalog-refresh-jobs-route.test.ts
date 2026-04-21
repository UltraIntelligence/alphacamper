// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth.server', () => ({
  getVerifiedEmailFromRequest: vi.fn(),
}))

beforeEach(() => {
  vi.restoreAllMocks()
  delete process.env.ALPHACAMPER_API_URL
  delete process.env.NEXT_PUBLIC_ALPHACAMPER_API_URL
  delete process.env.ALPHACAMPER_API_ADMIN_KEY
  delete process.env.OPERATOR_EMAIL_ALLOWLIST
})

describe('catalog refresh jobs route', () => {
  it('returns a friendly empty state when operator controls are not configured', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    const { GET } = await import('@/app/api/admin/catalog-refresh-jobs/route')
    const response = await GET(new Request('https://alphacamper.test/api/admin/catalog-refresh-jobs'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      status: 'admin_api_offline',
      available: false,
      canManage: false,
      jobs: [],
    })
  })

  it('returns admin_api_offline when the backend cannot be reached', async () => {
    process.env.ALPHACAMPER_API_URL = 'https://api.alphacamper.test'
    process.env.ALPHACAMPER_API_ADMIN_KEY = 'secret-admin-key'
    process.env.OPERATOR_EMAIL_ALLOWLIST = 'ops@alphacamper.com'

    const { getVerifiedEmailFromRequest } = await import('@/lib/auth.server')
    vi.mocked(getVerifiedEmailFromRequest).mockResolvedValue('ops@alphacamper.com')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED')))

    const { GET } = await import('@/app/api/admin/catalog-refresh-jobs/route')
    const response = await GET(new Request('https://alphacamper.test/api/admin/catalog-refresh-jobs', {
      headers: { Authorization: 'Bearer site-token' },
    }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      status: 'admin_api_offline',
      available: false,
      canManage: false,
      operatorEmail: 'ops@alphacamper.com',
      fetchedFrom: 'https://api.alphacamper.test/v1/admin/catalog-refresh-jobs',
      jobs: [],
    })
  })

  it('proxies job history for an allowed operator', async () => {
    process.env.ALPHACAMPER_API_URL = 'https://api.alphacamper.test'
    process.env.ALPHACAMPER_API_ADMIN_KEY = 'secret-admin-key'
    process.env.OPERATOR_EMAIL_ALLOWLIST = 'ops@alphacamper.com'

    const { getVerifiedEmailFromRequest } = await import('@/lib/auth.server')
    vi.mocked(getVerifiedEmailFromRequest).mockResolvedValue('ops@alphacamper.com')

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ([
        {
          id: 'job-1',
          mode: 'promote_local_catalog',
          status: 'succeeded',
          requested_by: 'ops@alphacamper.com',
          trigger_source: 'api',
          requested_at: '2026-04-17T02:00:00Z',
          started_at: '2026-04-17T02:01:00Z',
          finished_at: '2026-04-17T02:10:00Z',
          summary_json: { parks: 10 },
          metadata_json: { source_label: 'dashboard' },
          error_message: null,
        },
      ]),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { GET } = await import('@/app/api/admin/catalog-refresh-jobs/route')
    const response = await GET(new Request('https://alphacamper.test/api/admin/catalog-refresh-jobs', {
      headers: { Authorization: 'Bearer site-token' },
    }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.alphacamper.test/v1/admin/catalog-refresh-jobs',
      expect.objectContaining({
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
          'X-Admin-Key': 'secret-admin-key',
        },
      })
    )
    expect(body).toMatchObject({
      available: true,
      canManage: true,
      operatorEmail: 'ops@alphacamper.com',
      jobs: [{ id: 'job-1', status: 'succeeded' }],
    })
  })
})
