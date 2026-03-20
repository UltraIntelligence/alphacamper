'use client'

import { useState, useMemo } from 'react'
import { searchCampgrounds } from '@/lib/parks'
import type { WatchData } from './WatchWizard'

interface StepSearchProps {
  data: WatchData
  onUpdate: (partial: Partial<WatchData>) => void
  onComplete: () => void
}

export function StepSearch({ data, onUpdate, onComplete }: StepSearchProps) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return []
    return searchCampgrounds(query)
  }, [query])

  const handleSelect = (cg: { id: string; name: string; platform: 'bc_parks' | 'ontario_parks' | 'recreation_gov'; province: string }) => {
    setQuery(cg.name)
    onUpdate({
      campgroundId: cg.id,
      campgroundName: cg.name,
      platform: cg.platform,
      province: cg.province,
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
          Start typing — we&apos;ll search BC Parks, Ontario Parks, and US national parks
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
          {results.length === 0 ? (
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
                  {cg.platform === 'bc_parks' ? 'BC Parks' : cg.platform === 'ontario_parks' ? 'Ontario Parks' : 'Recreation.gov'}
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
              {data.platform === 'bc_parks' ? 'BC Parks' : data.platform === 'ontario_parks' ? 'Ontario Parks' : 'Recreation.gov'}
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
