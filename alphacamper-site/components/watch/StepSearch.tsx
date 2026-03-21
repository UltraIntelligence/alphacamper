'use client'

import { useState, useEffect, useRef } from 'react'
import type { WatchData } from './WatchWizard'

interface StepSearchProps {
  data: WatchData
  initialQuery?: string
  onUpdate: (partial: Partial<WatchData>) => void
  onComplete: () => void
}

export function StepSearch({ data, initialQuery, onUpdate, onComplete }: StepSearchProps) {
  const [query, setQuery] = useState(initialQuery ?? '')
  const [results, setResults] = useState<{ id: string; name: string; platform: 'bc_parks' | 'ontario_parks' | 'recreation_gov' | 'parks_canada'; province: string | null }[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim() || query.trim().length < 2) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/campgrounds?q=${encodeURIComponent(query)}&limit=10`)
        if (res.ok) setResults((await res.json()).campgrounds ?? [])
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  const handleSelect = (cg: { id: string; name: string; platform: 'bc_parks' | 'ontario_parks' | 'recreation_gov' | 'parks_canada'; province: string | null }) => {
    setQuery(cg.name)
    onUpdate({
      campgroundId: cg.id,
      campgroundName: cg.name,
      platform: cg.platform,
      province: cg.province ?? '',
    })
  }

  const handleClear = () => {
    setQuery('')
    onUpdate({ campgroundId: '', campgroundName: '', platform: '', province: '' })
  }

  const isSelected = !!data.campgroundId

  return (
    <div>
      <div className="field-group">
        <label className="field-label" htmlFor="campground-search">
          Search for a park or campground
        </label>
        <span className="field-hint">
          Start typing — we search BC Parks, Ontario Parks, Parks Canada, and Recreation.gov
        </span>
        <input
          id="campground-search"
          className="field-input"
          type="text"
          placeholder="e.g. Alice Lake, Algonquin, Rathtrevor..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (isSelected) {
              onUpdate({ campgroundId: '', campgroundName: '', platform: '', province: '' })
            }
          }}
          autoFocus
        />
      </div>

      {!isSelected && query.trim().length > 0 && (
        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isSearching && results.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Searching...</p>
          ) : results.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              No campgrounds found matching &ldquo;{query}&rdquo;.
            </p>
          ) : (
            results.slice(0, 10).map((cg) => (
              <button
                key={cg.id}
                type="button"
                className="selectable-item"
                onClick={() => handleSelect(cg)}
              >
                <strong>{cg.name}</strong>
                <span className="selectable-item-label">
                  {cg.platform === 'bc_parks' ? 'BC Parks' : cg.platform === 'ontario_parks' ? 'Ontario Parks' : cg.platform === 'parks_canada' ? 'Parks Canada' : 'Recreation.gov'}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {isSelected && (
        <div style={{ marginBottom: '20px' }}>
          <div className="selectable-item" data-selected="true" style={{ cursor: 'default' }}>
            <strong>{data.campgroundName}</strong>
            <span className="selectable-item-label">
              {data.platform === 'bc_parks' ? 'BC Parks' : data.platform === 'ontario_parks' ? 'Ontario Parks' : data.platform === 'parks_canada' ? 'Parks Canada' : 'Recreation.gov'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClear}
            style={{
              marginTop: '8px',
              background: 'none',
              border: 'none',
              color: 'var(--color-accent)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              padding: 0,
            }}
          >
            Change campground
          </button>
        </div>
      )}

      {isSelected && (
        <button
          type="button"
          className="btn-bold btn-bold-primary btn-bold-full"
          onClick={onComplete}
        >
          Continue
        </button>
      )}
    </div>
  )
}
