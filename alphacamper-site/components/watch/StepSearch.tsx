'use client'

import { useState, useEffect, useRef } from 'react'
import { getNextHighlightedIndex } from '@/lib/search-nav'
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
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isDismissed, setIsDismissed] = useState(false)
  const itemsRef = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim() || query.trim().length < 2) {
      searchSeqRef.current += 1
      setResults([])
      setHighlightedIndex(-1)
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
        setHighlightedIndex(-1)
      } catch {
        if (seq === searchSeqRef.current) {
          setResults([])
          setHighlightedIndex(-1)
        }
      } finally {
        if (seq === searchSeqRef.current) setIsSearching(false)
      }
    }, 250)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [platformFilter, query])

  useEffect(() => {
    if (highlightedIndex >= 0) {
      itemsRef.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex])

  const handleSelect = (cg: { id: string; name: string; platform: 'bc_parks' | 'ontario_parks' | 'recreation_gov' | 'parks_canada'; province: string | null }) => {
    setHighlightedIndex(-1)
    setQuery(cg.name)
    onUpdate({
      campgroundId: cg.id,
      campgroundName: cg.name,
      platform: cg.platform,
      province: cg.province ?? '',
    })
  }

  const handleClear = () => {
    setHighlightedIndex(-1)
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
            setIsDismissed(false)
            if (isSelected) {
              onUpdate({ campgroundId: '', campgroundName: '', platform: '', province: '' })
            }
          }}
          onKeyDown={(e) => {
            const dropdownVisible = !isSelected && query.trim().length > 0 && !isDismissed && results.length > 0
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault()
              if (dropdownVisible) {
                setHighlightedIndex(getNextHighlightedIndex(e.key, highlightedIndex, Math.min(results.length, 10)))
              }
            } else if (e.key === 'Enter') {
              if (dropdownVisible && highlightedIndex >= 0 && results[highlightedIndex] != null) {
                handleSelect(results[highlightedIndex])
              }
            } else if (e.key === 'Escape') {
              if (debounceRef.current) clearTimeout(debounceRef.current)
              searchSeqRef.current += 1
              setResults([])
              setHighlightedIndex(-1)
              setIsSearching(false)
              setIsDismissed(true)
            }
          }}
          role="combobox"
          aria-expanded={!isSelected && query.trim().length > 0 && !isDismissed}
          aria-autocomplete="list"
          aria-controls="step-search-listbox"
          aria-activedescendant={highlightedIndex >= 0 ? `step-search-result-${highlightedIndex}` : undefined}
          autoFocus
        />
      </div>

      {!isSelected && query.trim().length > 0 && !isDismissed && results.length === 0 && (
        <p
          role="status"
          aria-live="polite"
          style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}
        >
          {isSearching ? 'Searching...' : `No campgrounds found matching "${query}".`}
        </p>
      )}
      {!isSelected && query.trim().length > 0 && !isDismissed && results.length > 0 && (
        <div role="listbox" id="step-search-listbox" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {results.slice(0, 10).map((cg, index) => (
            <div
              key={`${cg.platform}:${cg.id}`}
              ref={(el) => { itemsRef.current[index] = el as HTMLElement | null }}
              id={`step-search-result-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
              tabIndex={-1}
              className="selectable-item"
              data-highlighted={index === highlightedIndex ? 'true' : undefined}
              onClick={() => handleSelect(cg)}
            >
              <strong>{cg.name}</strong>
              <span className="selectable-item-label">
                {getPlatformLabel(cg.platform)}
              </span>
            </div>
          ))}
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
