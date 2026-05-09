'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { RevenueQualityResponse } from '@/app/api/admin/revenue-quality/route'

interface RevenueQualityPanelProps {
  token: string
}

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function formatPercent(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value)
}

function primaryGrossRevenue(data: RevenueQualityResponse) {
  const targetCurrency = data.target.currency.toLowerCase()
  return data.billing.gross_revenue_by_currency[targetCurrency] ?? 0
}

export function RevenueQualityPanel({ token }: RevenueQualityPanelProps) {
  const [data, setData] = useState<RevenueQualityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [hidden, setHidden] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPanel = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/revenue-quality', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
        signal,
      })

      if (response.status === 401 || response.status === 403) {
        setHidden(true)
        return
      }

      const payload = await response.json() as RevenueQualityResponse

      if (!response.ok) {
        throw new Error(payload.reason ?? 'Could not load the revenue view.')
      }

      setData(payload)
      setHidden(!payload.canView)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Could not load the revenue view.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    const controller = new AbortController()
    loadPanel(controller.signal)
    return () => controller.abort()
  }, [loadPanel])

  const revenue = useMemo(() => data ? primaryGrossRevenue(data) : 0, [data])
  const progress = data ? revenue / data.target.revenue_cents : 0
  const bookingRate = data && data.funnel.booking_submitted > 0
    ? data.funnel.booking_confirmed / data.funnel.booking_submitted
    : 0

  if (hidden) return null

  return (
    <section className="dashboard-section">
      <div className="provider-quality-panel">
        <div className="provider-quality-hero">
          <div>
            <p className="provider-quality-eyebrow">Operator View</p>
            <h2 className="provider-quality-title">Revenue quality</h2>
            <p className="provider-quality-copy">
              A plain-English read on whether paid passes, alerts, and booking outcomes
              are moving toward the summer goal.
            </p>
          </div>
          <button
            type="button"
            className="btn-bold btn-bold-outline provider-quality-refresh"
            onClick={() => loadPanel()}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="provider-quality-meta">
            <div className="skeleton skeleton-card" style={{ height: '120px', marginBottom: 0 }} />
            <div className="skeleton skeleton-card" style={{ height: '120px', marginBottom: 0 }} />
            <div className="skeleton skeleton-card" style={{ height: '120px', marginBottom: 0 }} />
            <div className="skeleton skeleton-card" style={{ height: '120px', marginBottom: 0 }} />
          </div>
        ) : error ? (
          <div className="provider-quality-empty">
            <p className="error-banner">{error}</p>
          </div>
        ) : !data?.available ? (
          <div className="provider-quality-empty">
            <h3>Revenue view is not connected yet</h3>
            <p>{data?.reason ?? 'Alphacamper cannot read the billing tables yet.'}</p>
          </div>
        ) : (
          <>
            <div className="provider-quality-meta">
              <div className="provider-quality-meta-card">
                <span className="provider-quality-stat-label">Gross sales</span>
                <strong>{formatMoney(revenue, data.target.currency)}</strong>
                <p>{formatPercent(progress)} of the {formatMoney(data.target.revenue_cents, data.target.currency)} summer target.</p>
              </div>
              <div className="provider-quality-meta-card">
                <span className="provider-quality-stat-label">Paid passes</span>
                <strong>{data.billing.paid_passes}</strong>
                <p>{data.billing.summer_passes} summer, {data.billing.year_passes} year.</p>
              </div>
              <div className="provider-quality-meta-card">
                <span className="provider-quality-stat-label">Active watches</span>
                <strong>{data.productOutcome.active_watches}</strong>
                <p>{data.productOutcome.delivered_alerts} alerts delivered so far.</p>
              </div>
              <div className="provider-quality-meta-card">
                <span className="provider-quality-stat-label">Bookings</span>
                <strong>{data.funnel.booking_confirmed}</strong>
                <p>{formatPercent(bookingRate)} confirmed after submit.</p>
              </div>
            </div>

            <div className="provider-quality-meta">
              <div className="provider-quality-meta-card">
                <span className="provider-quality-meta-label">Checkout health</span>
                <strong>{data.runtime.stripe_env_ready ? 'Ready' : 'Missing env'}</strong>
                <p>
                  {data.runtime.stripe_env_ready
                    ? 'Runtime Stripe variable names are present.'
                    : `${data.runtime.missing_stripe_env.length} Stripe variable names are missing.`}
                </p>
              </div>
              <div className="provider-quality-meta-card">
                <span className="provider-quality-meta-label">Net revenue</span>
                <strong>{data.billing.net_revenue_verified ? 'Verified' : 'Not yet'}</strong>
                <p>Gross is visible now. Net after refunds still needs Stripe-side reporting.</p>
              </div>
            </div>

            {data.blockers.length > 0 ? (
              <div className="provider-quality-list">
                <article className="provider-quality-row">
                  <div className="provider-quality-row-main">
                    <div className="provider-quality-row-top">
                      <div>
                        <h3>What still blocks a clean score</h3>
                        <p>Use this as the operator to-do list before calling revenue reporting green.</p>
                      </div>
                      <span className="provider-status-pill provider-status-pill--degraded">
                        Needs attention
                      </span>
                    </div>
                    <div className="provider-quality-pill-row">
                      {data.blockers.slice(0, 4).map((blocker) => (
                        <span key={blocker} className="provider-badge provider-badge--confidence provider-badge--inferred">
                          {blocker}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="provider-quality-row-side">
                    <span className="provider-quality-side-label">Source</span>
                    <strong>{data.fetchedFrom ?? 'Unknown'}</strong>
                    <p>Live Supabase tables, without customer emails or secret values.</p>
                  </div>
                </article>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  )
}
