'use client'

import { startTransition, useCallback, useEffect, useRef, useState, useTransition } from 'react'
import type { ProviderQualityPanelResponse } from '@/app/api/admin/provider-quality/route'
import type { CatalogRefreshJobRecord, CatalogRefreshJobsResponse } from '@/app/api/admin/catalog-refresh-jobs/route'

const MODE_LABELS: Record<string, string> = {
  live_polling: 'Live now',
  directory_only: 'Directory only',
  metadata_only: 'Info only',
}

const CONFIDENCE_LABELS: Record<string, string> = {
  verified: 'Verified',
  inferred: 'Needs label check',
  seeded: 'Seed data',
  unknown: 'Unreviewed',
}

const STATUS_LABELS: Record<string, string> = {
  healthy: 'Healthy',
  degraded: 'Needs attention',
  backing_off: 'Backing off',
  idle: 'Idle',
}

function formatTimestamp(value: string | null) {
  if (!value) return 'No recent check yet'

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return 'Recent check recorded'
  }
}

function formatJobTimestamp(value: string | null) {
  if (!value) return 'Waiting to start'
  return formatTimestamp(value)
}

function formatJobSummary(summary: CatalogRefreshJobRecord['summary_json']) {
  if (!summary) return 'No result yet'

  const parts = [
    summary.providers ? `${summary.providers} providers` : null,
    summary.parks ? `${summary.parks} parks` : null,
    summary.campgrounds ? `${summary.campgrounds} campgrounds` : null,
    summary.campsites ? `${summary.campsites} campsites` : null,
    summary.notices ? `${summary.notices} notices` : null,
  ].filter(Boolean)

  return parts.join(' · ') || 'Refresh finished'
}

function jobStatusLabel(status: string) {
  switch (status) {
    case 'queued':
      return 'Queued'
    case 'running':
      return 'Running now'
    case 'succeeded':
      return 'Finished'
    case 'failed':
      return 'Failed'
    default:
      return status
  }
}

function sortProviders(providers: ProviderQualityPanelResponse['providers']) {
  const modeRank: Record<string, number> = {
    live_polling: 0,
    directory_only: 1,
    metadata_only: 2,
  }
  const confidenceRank: Record<string, number> = {
    verified: 0,
    inferred: 1,
    seeded: 2,
    unknown: 3,
  }
  const statusRank: Record<string, number> = {
    healthy: 0,
    degraded: 1,
    backing_off: 2,
    idle: 3,
  }

  return [...providers].sort((a, b) => {
    return (
      (modeRank[a.availability_mode] ?? 9) - (modeRank[b.availability_mode] ?? 9) ||
      (confidenceRank[a.confidence] ?? 9) - (confidenceRank[b.confidence] ?? 9) ||
      (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9) ||
      a.provider_name.localeCompare(b.provider_name)
    )
  })
}

interface ProviderQualityPanelProps {
  token: string
}

export function ProviderQualityPanel({ token }: ProviderQualityPanelProps) {
  const [data, setData] = useState<ProviderQualityPanelResponse | null>(null)
  const [jobsData, setJobsData] = useState<CatalogRefreshJobsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobsLoading, setJobsLoading] = useState(true)
  const [jobError, setJobError] = useState<string | null>(null)
  const [flashMessage, setFlashMessage] = useState<{ tone: 'success' | 'info' | 'error'; text: string } | null>(null)
  const [isCreating, startCreateTransition] = useTransition()
  const flashTimeoutRef = useRef<number | null>(null)

  const showFlashMessage = useCallback((tone: 'success' | 'info' | 'error', text: string) => {
    if (flashTimeoutRef.current) {
      window.clearTimeout(flashTimeoutRef.current)
    }
    setFlashMessage({ tone, text })
    flashTimeoutRef.current = window.setTimeout(() => {
      setFlashMessage(null)
      flashTimeoutRef.current = null
    }, 4200)
  }, [])

  const loadPanel = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/provider-quality', {
        cache: 'no-store',
        signal,
      })

      if (!response.ok) {
        throw new Error('Could not load the operator network view.')
      }

      const payload = await response.json() as ProviderQualityPanelResponse
      setData(payload)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Could not load the operator network view.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadJobs = useCallback(async (signal?: AbortSignal) => {
    setJobsLoading(true)
    setJobError(null)

    try {
      const response = await fetch('/api/admin/catalog-refresh-jobs', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
        signal,
      })

      const payload = await response.json() as CatalogRefreshJobsResponse

      if (response.status === 403) {
        setJobsData(payload)
        return
      }

      if (!response.ok) {
        throw new Error(payload.reason ?? 'Could not load refresh jobs.')
      }

      setJobsData(payload)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setJobError(err instanceof Error ? err.message : 'Could not load refresh jobs.')
    } finally {
      setJobsLoading(false)
    }
  }, [token])

  const createRefreshJob = useCallback(async () => {
    startCreateTransition(async () => {
      setJobError(null)

      try {
        const response = await fetch('/api/admin/catalog-refresh-jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sourceLabel: 'dashboard',
            notes: 'Queued from the live site operator panel.',
          }),
        })

        const payload = await response.json() as { detail?: string; reason?: string }

        if (!response.ok) {
          throw new Error(payload.detail ?? payload.reason ?? 'Could not queue the refresh job.')
        }

        showFlashMessage('success', 'Catalog refresh started. Alphacamper will keep this status card updated.')
        await loadJobs()
        await loadPanel()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not queue the refresh job.'
        setJobError(message)
        showFlashMessage('error', message)
      }
    })
  }, [loadJobs, loadPanel, showFlashMessage, token])

  useEffect(() => {
    const controller = new AbortController()
    loadPanel(controller.signal)
    loadJobs(controller.signal)
    return () => controller.abort()
  }, [loadJobs, loadPanel])

  useEffect(() => {
    const latestJob = jobsData?.jobs?.[0]
    if (!latestJob || !['queued', 'running'].includes(latestJob.status)) {
      return
    }

    const interval = window.setInterval(() => {
      startTransition(() => {
        void loadJobs()
        void loadPanel()
      })
    }, 8000)

    return () => window.clearInterval(interval)
  }, [jobsData, loadJobs, loadPanel])

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        window.clearTimeout(flashTimeoutRef.current)
      }
    }
  }, [])

  const summary = data?.providerQuality
  const delivery = data?.alertDelivery
  const providers = sortProviders(data?.providers ?? [])
  const jobs = jobsData?.jobs ?? []
  const canManageRefresh = jobsData?.canManage ?? false
  const latestJob = jobs[0] ?? null

  return (
    <section className="dashboard-section">
      <div className="provider-quality-panel">
        <div className="provider-quality-hero">
          <div>
            <p className="provider-quality-eyebrow">Operator View</p>
            <h2 className="provider-quality-title">What&apos;s truly live right now</h2>
            <p className="provider-quality-copy">
              This is the behind-the-scenes view of which park systems are fully live,
              which ones still lean on seed data, and where the team still needs to
              tighten trust.
            </p>
          </div>
          <button
            type="button"
            className="btn-bold btn-bold-outline provider-quality-refresh"
            onClick={() => {
              loadPanel()
              loadJobs()
            }}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="provider-quality-summary-grid">
            <div className="skeleton skeleton-card" style={{ height: '120px', marginBottom: 0 }} />
            <div className="skeleton skeleton-card" style={{ height: '120px', marginBottom: 0 }} />
            <div className="skeleton skeleton-card" style={{ height: '120px', marginBottom: 0 }} />
            <div className="skeleton skeleton-card" style={{ height: '120px', marginBottom: 0 }} />
          </div>
        ) : error ? (
          <div className="provider-quality-empty">
            <p className="error-banner">{error}</p>
          </div>
        ) : !data?.available || !summary || !delivery ? (
          <div className="provider-quality-empty">
            <h3>Operator view is not connected yet</h3>
            <p>{data?.reason ?? 'The site does not know where the new availability API lives yet.'}</p>
          </div>
        ) : (
          <>
            <div className="provider-quality-summary-grid">
              <div className="provider-quality-stat">
                <span className="provider-quality-stat-label">Fully live</span>
                <strong>{summary.live_polling}</strong>
                <p>Park systems we are polling for real openings now.</p>
              </div>
              <div className="provider-quality-stat">
                <span className="provider-quality-stat-label">Needs trust check</span>
                <strong>{summary.inferred}</strong>
                <p>Live systems where some labels are still based on strong inference.</p>
              </div>
              <div className="provider-quality-stat">
                <span className="provider-quality-stat-label">Directory only</span>
                <strong>{summary.directory_only}</strong>
                <p>Places customers can browse today, but not poll live yet.</p>
              </div>
              <div className="provider-quality-stat">
                <span className="provider-quality-stat-label">Active alerts</span>
                <strong>{delivery.active_alerts}</strong>
                <p>Customer alerts currently waiting for an opening.</p>
              </div>
            </div>

            <div className="provider-quality-meta">
              <div className="provider-quality-meta-card">
                <span className="provider-quality-meta-label">Delivered alerts</span>
                <strong>{delivery.delivered}</strong>
                <p>{delivery.failed} failed deliveries still need cleanup.</p>
              </div>
              <div className="provider-quality-meta-card">
                <span className="provider-quality-meta-label">Coverage mix</span>
                <strong>{summary.total}</strong>
                <p>{summary.verified} verified, {summary.seeded} seed-backed, {summary.metadata_only} info-only.</p>
              </div>
            </div>

            <div className="provider-quality-actions">
              <div className="provider-quality-action-card">
                <span className="provider-quality-meta-label">Catalog refresh</span>
                <strong>{latestJob ? jobStatusLabel(latestJob.status) : 'Ready'}</strong>
                <p>
                  {canManageRefresh
                    ? 'Use this when you want the live API to pull in the latest catalog coverage.'
                    : jobsData?.reason ?? 'Only approved operator accounts can queue production refresh jobs.'}
                </p>
                <div className="provider-quality-action-row">
                  <button
                    type="button"
                    className="btn-bold btn-bold-primary provider-quality-action-button"
                    onClick={createRefreshJob}
                    disabled={!canManageRefresh || isCreating || (latestJob?.status === 'queued' || latestJob?.status === 'running')}
                  >
                    {isCreating ? 'Starting refresh…' : 'Refresh live catalog'}
                  </button>
                  {latestJob ? (
                    <span className={`provider-status-pill provider-status-pill--${latestJob.status}`}>
                      {jobStatusLabel(latestJob.status)}
                    </span>
                  ) : null}
                </div>
                <p className="provider-quality-action-footnote">
                  {latestJob
                    ? `Latest run: ${formatJobTimestamp(latestJob.finished_at ?? latestJob.started_at ?? latestJob.requested_at)}`
                    : 'No refresh run has been recorded in this panel yet.'}
                </p>
                {latestJob?.status === 'queued' || latestJob?.status === 'running' ? (
                  <p className="provider-quality-live-note">
                    Alphacamper is checking this every few seconds, so this card updates on its own while the refresh runs.
                  </p>
                ) : null}
                {flashMessage ? (
                  <div className={`provider-quality-flash provider-quality-flash--${flashMessage.tone}`}>
                    {flashMessage.text}
                  </div>
                ) : null}
                {jobError ? <p className="error-banner">{jobError}</p> : null}
              </div>

              <div className="provider-quality-action-card">
                <span className="provider-quality-meta-label">Recent refresh jobs</span>
                <strong>{jobs.length}</strong>
                <p>Plain-English history for the last few catalog refresh runs.</p>
                <div className="provider-quality-job-list">
                  {jobsLoading ? (
                    <div className="provider-quality-job-empty">Loading recent jobs…</div>
                  ) : jobs.length === 0 ? (
                    <div className="provider-quality-job-empty">No refresh jobs recorded yet.</div>
                  ) : (
                    jobs.slice(0, 4).map((job) => (
                      <div key={job.id} className="provider-quality-job-row">
                        <div>
                          <p className="provider-quality-job-title">{jobStatusLabel(job.status)}</p>
                          <p className="provider-quality-job-copy">{formatJobSummary(job.summary_json)}</p>
                        </div>
                        <div className="provider-quality-job-side">
                          <span className={`provider-status-pill provider-status-pill--${job.status}`}>
                            {jobStatusLabel(job.status)}
                          </span>
                          <p>{formatJobTimestamp(job.finished_at ?? job.started_at ?? job.requested_at)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="provider-quality-list">
              {providers.map((provider) => (
                <article key={provider.provider_id} className="provider-quality-row">
                  <div className="provider-quality-row-main">
                    <div className="provider-quality-row-top">
                      <div>
                        <h3>{provider.provider_name}</h3>
                        <p>
                          {provider.country ? `${provider.country} · ` : ''}
                          {provider.kind.replace('_', ' ')}
                        </p>
                      </div>
                      <span className={`provider-status-pill provider-status-pill--${provider.status}`}>
                        {STATUS_LABELS[provider.status] ?? provider.status}
                      </span>
                    </div>

                    <div className="provider-quality-pill-row">
                      <span className={`provider-badge provider-badge--mode provider-badge--${provider.availability_mode}`}>
                        {MODE_LABELS[provider.availability_mode] ?? provider.availability_mode}
                      </span>
                      <span className={`provider-badge provider-badge--confidence provider-badge--${provider.confidence}`}>
                        {CONFIDENCE_LABELS[provider.confidence] ?? provider.confidence}
                      </span>
                    </div>

                    <p className="provider-quality-note">{provider.verification_note}</p>
                  </div>

                  <div className="provider-quality-row-side">
                    <span className="provider-quality-side-label">Last check</span>
                    <strong>{formatTimestamp(provider.last_request_at)}</strong>
                    {provider.last_error_code ? (
                      <p>Error code: {provider.last_error_code}</p>
                    ) : provider.current_backoff_seconds > 0 ? (
                      <p>Cooling down for {provider.current_backoff_seconds}s</p>
                    ) : (
                      <p>No active blocker</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
