'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertCard, type Alert } from './AlertCard'

interface AlertListProps {
  userId: string
}

export function AlertList({ userId }: AlertListProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = useCallback(async (signal?: AbortSignal) => {
    setError(null)
    try {
      const res = await fetch(`/api/alerts?userId=${userId}`, { signal })
      if (!res.ok) throw new Error('Failed to load alerts')
      const { alerts } = await res.json()
      setAlerts(alerts || [])
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    const controller = new AbortController()
    fetchAlerts(controller.signal)
    return () => controller.abort()
  }, [fetchAlerts])

  const handleDismiss = useCallback(async (id: string) => {
    const res = await fetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    }
  }, [])

  if (loading) {
    return (
      <div className="dashboard-section">
        <h2 className="dashboard-section-title">Recent Alerts</h2>
        <div className="skeleton skeleton-card" style={{ height: '70px' }} />
      </div>
    )
  }

  return (
    <div className="dashboard-section">
      <h2 className="dashboard-section-title">Recent Alerts</h2>
      {error ? (
        <div>
          <p className="error-banner">{error}</p>
          <button type="button" className="btn-bold btn-bold-outline" onClick={() => fetchAlerts()}>Retry</button>
        </div>
      ) : alerts.length === 0 ? (
        <div className="empty-state">
          <div className="illustration-placeholder" style={{ maxWidth: '180px', marginInline: 'auto', marginBottom: '12px', minHeight: '100px' }}>
            Alpha sleeping with one eye open
          </div>
          <p>No alerts yet. Alpha&apos;s watching — we&apos;ll email you when we find one.</p>
        </div>
      ) : (
        alerts.map((a) => (
          <AlertCard key={a.id} alert={a} onDismiss={handleDismiss} />
        ))
      )}
    </div>
  )
}
