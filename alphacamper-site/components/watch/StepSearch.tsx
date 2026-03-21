'use client'

import { useState, useEffect, useRef } from 'react'
import type { WatchData } from './WatchWizard'

interface StepSearchProps {
  data: WatchData
  initialQuery?: string
  platformFilter?: WatchData['platform']
  onUpdate: (partial: Partial<WatchData>) => void
  onComplete: () => void
}

function getPlatformLabel(platform: WatchData['platform']): string {
  switch (platform) {
    case 'bc_parks':
      return 'BC Parks'
    case 'ontario_parks':
      return 'Ontario Parks'
    case 'parks_canada':
      return 'Parks Canada'
    case 'recreation_gov':
      return 'Recreation.gov'
    default:
      return platform || 'Unknown platform'
  }
}

export function StepSearch({ data, initialQuery, platformFilter, onUpdate, onComplete }: StepSearchProps) {
  const [query, setQuery] = useState(initialQuery ?? '')
  const [results, setResults] = useState<{ id: string; name: string; platform: 'bc_parks' | 'ontario_parks' | 'recreation_gov' | 'parks_canada'; province: string | null }[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchSeqRef = useRef(0)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim() || query.trim().length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      const seq = ++searchSeqRef.current
      setIsSearching(true)
      try {
        const params = new URLSearchParams({
          q: query,
          limit: '10',
        })
        if (platformFilter) {
          params.set('platform', platformFilter)
        }

        const res = await fetch(`/api/campgrounds?${params.toString()}`)
        if (seq !== searchSeqRef.current) return
        setResults(res.ok ? ((await res.json()).campgrounds ?? []) : [])
      } catch {
        if (seq === searchSeqRef.current) setResults([])
      } finally {
        if (seq === searchSeqRef.current) setIsSearching(false)
      }
    }, 250)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [platformFilter, query])

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
                key={`${cg.platform}:${cg.id}`}
                type="button"
                className="selectable-item"
                onClick={() => handleSelect(cg)}
              >
                <strong>{cg.name}</strong>
                <span className="selectable-item-label">
                  {getPlatformLabel(cg.platform)}
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
              {getPlatformLabel(data.platform)}
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
