import { describe, expect, it } from 'vitest'
import {
  evaluateDiagnosticsStatus,
  summarizeLiveWorkerProof,
} from '../scripts/railway-diagnostics'

const now = new Date('2026-05-09T12:00:00.000Z')

function providerQuality(overrides: Partial<Parameters<typeof summarizeLiveWorkerProof>[0]['providerQuality']> = {}) {
  return {
    available: true,
    reason: null,
    fetchedFrom: 'live_supabase',
    alertDelivery: {
      active_alerts: 5,
      total_deliveries: 0,
      delivered: 0,
    },
    providers: [
      {
        provider_id: 'railway_worker',
        status: 'healthy',
        last_request_at: '2026-05-09T11:55:00.000Z',
        last_error_code: null,
        verification_note: 'Worker heartbeat is visible.',
      },
    ],
    ...overrides,
  }
}

function supabase(overrides: Partial<Parameters<typeof summarizeLiveWorkerProof>[0]['supabase']> = {}) {
  return {
    configured: true,
    latestWorker: {
      id: 'singleton',
      last_cycle_at: '2026-05-09T11:55:00.000Z',
      last_successful_poll_at: '2026-05-09T11:55:00.000Z',
      platforms_healthy: {
        bc_parks: true,
        ontario_parks: true,
        parks_canada: true,
        gtc_new_brunswick: true,
        recreation_gov: true,
      },
      cycle_stats: {},
    },
    error: null,
    ...overrides,
  }
}

describe('Railway diagnostics live worker proof', () => {
  it('stays green only when route heartbeat and direct Supabase platform proof are current', () => {
    const proof = summarizeLiveWorkerProof({
      providerQuality: providerQuality(),
      supabase: supabase(),
      maxHeartbeatAgeMinutes: 30,
      now,
    })

    expect(proof.status).toBe('green')
    expect(proof.missingPlatforms).toEqual([])
  })

  it('does not go green when the production route reports a missing worker heartbeat', () => {
    const proof = summarizeLiveWorkerProof({
      providerQuality: providerQuality({
        reason: 'Railway worker heartbeat is not visible yet.',
        providers: [
          {
            provider_id: 'railway_worker',
            status: 'degraded',
            last_request_at: null,
            last_error_code: 'missing_worker_heartbeat',
            verification_note: 'No worker heartbeat is visible in live Supabase yet.',
          },
        ],
      }),
      supabase: supabase({ latestWorker: null }),
      maxHeartbeatAgeMinutes: 30,
      now,
    })

    expect(proof.status).toBe('yellow')
    expect(proof.workerError).toBe('missing_worker_heartbeat')
    expect(proof.missingPlatforms).toEqual([
      'bc_parks',
      'ontario_parks',
      'parks_canada',
      'gtc_new_brunswick',
      'recreation_gov',
    ])
  })

  it('does not go green when Railway logs look good but live heartbeat proof is yellow', () => {
    const status = evaluateDiagnosticsStatus({
      missingRequired: [],
      startupFound: ['Alphacamper Worker starting', 'Health check server on :'],
      failuresFound: [],
      liveStatus: 'yellow',
    })

    expect(status).toBe('yellow')
  })

  it('goes red when Railway logs include the worker_status write failure marker', () => {
    const status = evaluateDiagnosticsStatus({
      missingRequired: [],
      startupFound: ['Alphacamper Worker starting', 'Health check server on :'],
      failuresFound: ['worker_status heartbeat write failed'],
      liveStatus: 'green',
    })

    expect(status).toBe('red')
  })
})
