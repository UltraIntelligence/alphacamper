'use client'

import { useState, useEffect, useCallback } from 'react'
import { WatchCard, type Watch } from './WatchCard'
import Link from 'next/link'

interface WatchListProps {
  token: string
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function WatchList({ token }: WatchListProps) {
  const [watches, setWatches] = useState<Watch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPast, setShowPast] = useState(false)

  const fetchWatches = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/watch', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to load watches')
      const { watches } = await res.json()
      setWatches(watches || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load watches')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchWatches() }, [fetchWatches])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/watch?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to delete')
      setWatches((prev) => prev.filter((w) => w.id !== id))
    } catch {
      setError('Failed to delete watch. Please try again.')
    }
  }

  const today = todayStr()
  const current = watches.filter((w) => w.departure_date >= today)
  const past = watches.filter((w) => w.departure_date < today)

  if (loading) {
    return (
      <div className="dashboard-section">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-section">
        <p className="error-banner">{error}</p>
        <button type="button" className="btn-bold btn-bold-outline" onClick={fetchWatches}>
          Retry
        </button>
      </div>
    )
  }

  if (watches.length === 0) {
    return (
      <div className="dashboard-section">
        <div className="dashboard-empty">
          <p className="dashboard-empty-kicker">No watches yet</p>
          <h2 className="dashboard-empty-title">
            Tell us the site.<br />
            We&apos;ll go get it.
          </h2>
          <p className="dashboard-empty-body">
            Pick a park. Pick your dates. Pick a specific site if you have one.
            The second it opens, we text you and autofill the booking form in
            your browser.
          </p>
          <Link href="/watch/new" className="dashboard-empty-cta">
            Create your first watch
            <span aria-hidden="true">→</span>
          </Link>
          <p className="dashboard-empty-note">
            Free to set up. You only pay when you&apos;re ready to let us book for you.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-section">
      {current.map((w) => (
        <WatchCard key={w.id} watch={w} isPast={false} onDelete={handleDelete} />
      ))}

      {past.length > 0 && (
        <>
          <button
            type="button"
            className="btn-text-muted"
            onClick={() => setShowPast(!showPast)}
            aria-expanded={showPast}
            style={{ marginTop: '8px', display: 'block' }}
          >
            {showPast ? 'Hide' : 'Show'} past watches ({past.length})
          </button>
          {showPast && past.map((w) => (
            <WatchCard key={w.id} watch={w} isPast={true} onDelete={handleDelete} />
          ))}
        </>
      )}
    </div>
  )
}
