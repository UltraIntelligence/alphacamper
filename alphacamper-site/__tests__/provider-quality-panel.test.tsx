// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ProviderQualityPanel', () => {
  it('shows the operator summary in plain language', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          available: true,
          reason: null,
          fetchedFrom: 'https://api.alphacamper.test/v1/admin/overview',
          providerQuality: {
            total: 4,
            live_polling: 2,
            directory_only: 1,
            metadata_only: 1,
            verified: 2,
            inferred: 1,
            seeded: 1,
            unknown: 0,
          },
          alertDelivery: {
            active_alerts: 18,
            total_deliveries: 30,
            delivered: 28,
            failed: 2,
            webhook_deliveries: 20,
            email_deliveries: 10,
          },
          providers: [
            {
              provider_id: 'bc',
              provider_name: 'BC Parks',
              country: 'CA',
              kind: 'provincial',
              status: 'healthy',
              availability_mode: 'live_polling',
              confidence: 'verified',
              verification_note: 'Live polling verified through the browser-backed BC Parks flow.',
              last_request_at: '2026-04-17T00:00:00Z',
              next_allowed_at: null,
              current_backoff_seconds: 0,
              consecutive_errors: 0,
              last_error_code: null,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          available: true,
          canManage: true,
          reason: null,
          operatorEmail: 'ops@alphacamper.com',
          fetchedFrom: 'https://api.alphacamper.test/v1/admin/catalog-refresh-jobs',
          jobs: [
            {
              id: 'job-1',
              mode: 'promote_local_catalog',
              status: 'succeeded',
              requested_by: 'ops@alphacamper.com',
              trigger_source: 'api',
              requested_at: '2026-04-17T02:00:00Z',
              started_at: '2026-04-17T02:01:00Z',
              finished_at: '2026-04-17T02:10:00Z',
              summary_json: {
                providers: 14,
                parks: 367,
                campgrounds: 474,
                campsites: 1393,
                notices: 52,
              },
              metadata_json: { source_label: 'dashboard' },
              error_message: null,
            },
          ],
        }),
      }))

    const { ProviderQualityPanel } = await import('@/components/dashboard/ProviderQualityPanel')

    render(<ProviderQualityPanel token="site-token" />)

    await waitFor(() => {
      expect(screen.getByText("What's truly live right now")).toBeTruthy()
    })

    expect(screen.getByText('Fully live')).toBeTruthy()
    expect(screen.getByText('Needs trust check')).toBeTruthy()
    expect(screen.getByText('Directory only')).toBeTruthy()
    expect(screen.getByText('BC Parks')).toBeTruthy()
    expect(screen.getByText('Live now')).toBeTruthy()
    expect(screen.getByText('Verified')).toBeTruthy()
    expect(screen.getByText('Refresh live catalog')).toBeTruthy()
    expect(screen.getByText('Recent refresh jobs')).toBeTruthy()
    expect(screen.getByText(/367 parks/)).toBeTruthy()
  })
})
