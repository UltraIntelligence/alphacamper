'use client'

import { useCallback, useEffect, useState } from 'react'

interface FunnelStatsProps {
  token: string
}

interface FunnelSummary {
  watches_created: number
  sms_fired: number
  sms_tapped: number
  booking_confirmed: number
}

interface FunnelResponse {
  summary: FunnelSummary
  window_days: number
}

const EMPTY_SUMMARY: FunnelSummary = {
  watches_created: 0,
  sms_fired: 0,
  sms_tapped: 0,
  booking_confirmed: 0,
}

export function FunnelStats({ token }: FunnelStatsProps) {
  const [summary, setSummary] = useState<FunnelSummary>(EMPTY_SUMMARY)
  const [windowDays, setWindowDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async (signal?: AbortSignal) => {
    setError(null)
    try {
      const response = await fetch('/api/events?window_days=30', {
        signal,
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to load funnel stats')

      const data = await response.json() as FunnelResponse
      setSummary(data.summary || EMPTY_SUMMARY)
      setWindowDays(data.window_days || 30)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Failed to load funnel stats')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    const controller = new AbortController()
    fetchSummary(controller.signal)
    return () => controller.abort()
  }, [fetchSummary])

  if (loading) {
    return (
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">Your Funnel</h2>
        <div className="skeleton skeleton-card" style={{ height: '140px' }} />
      </div>
    )
  }

  return (
    <div className="dashboard-section">
      <h2 className="dashboard-section-title">Your Funnel</h2>
      {error ? (
        <div>
          <p className="error-banner">{error}</p>
          <button type="button" className="btn-bold btn-bold-outline" onClick={() => fetchSummary()}>
            Retry
          </button>
        </div>
      ) : summary.watches_created === 0 && summary.sms_fired === 0 && summary.sms_tapped === 0 && summary.booking_confirmed === 0 ? (
        <div className="empty-state">
          <div className="illustration-placeholder" style={{ maxWidth: '180px', marginInline: 'auto', marginBottom: '12px', minHeight: '100px' }}>
            Alpha holding a clipboard with no checkmarks yet
          </div>
          <p>No funnel activity yet for the last {windowDays} days. Create a watch and we&apos;ll start tracking the journey.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {[
            { label: 'Watches created', value: summary.watches_created },
            { label: 'Alerts sent', value: summary.sms_fired },
            { label: 'Alerts tapped', value: summary.sms_tapped },
            { label: 'Bookings confirmed', value: summary.booking_confirmed },
          ].map((step) => (
            <div
              key={step.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                borderRadius: '18px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
              }}
            >
              <span style={{ color: 'var(--color-text-muted)' }}>{step.label}</span>
              <strong style={{ fontSize: '1.4rem', fontFamily: 'var(--font-display)' }}>{step.value}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
