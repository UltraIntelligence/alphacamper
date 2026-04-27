'use client'

import { useState, useEffect, useRef } from 'react'
import { getNextHighlightedIndex } from '@/lib/search-nav'
import type { WatchData } from './WatchWizard'
import type { CampgroundPlatform } from '@/lib/parks'

interface StepSearchProps {
  data: WatchData
  initialQuery?: string
  platformFilter?: WatchData['platform']
  onUpdate: (partial: Partial<WatchData>) => void
  onComplete: () => void
}

const PLATFORM_LABEL: Record<string, string> = {
  bc_parks: 'BC Parks',
  ontario_parks: 'Ontario Parks',
  parks_canada: 'Parks Canada',
  recreation_gov: 'Recreation.gov',
  gtc_manitoba: 'Manitoba Parks',
  gtc_novascotia: 'Nova Scotia Parks',
  gtc_longpoint: 'Long Point Region',
  gtc_maitland: 'Maitland Valley',
  gtc_stclair: 'St. Clair Region',
  gtc_nlcamping: 'Newfoundland & Labrador Parks',
}

function getPlatformLabel(platform: WatchData['platform']): string {
  if (!platform) return 'Unknown platform'
  return PLATFORM_LABEL[platform] ?? platform
}

type Campground = {
  id: string
  name: string
  platform: CampgroundPlatform
  province: string | null
}

export function StepSearch({ data, initialQuery, platformFilter, onUpdate, onComplete }: StepSearchProps) {
  const [query, setQuery] = useState(initialQuery ?? '')
  const [results, setResults] = useState<Campground[]>([])
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

  const handleSelect = (cg: Campground) => {
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

  const isSelected = Boolean(data.campgroundId)
  const showDropdown = !isSelected && query.trim().length > 0 && !isDismissed

  return (
    <div className="step-pane">
      <h2 className="step-question">
        Which park are you <em>trying to book</em>?
      </h2>
      <p className="step-lede">
        We scan BC Parks, Ontario Parks, Parks Canada, and Recreation.gov. Start
        typing a park name and pick yours.
      </p>

      <div className="step-field">
        <label className="step-field-label" htmlFor="campground-search">
          Park or campground
        </label>
        <div className="step-search-input-wrap">
          <span className="step-search-glyph" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <input
            id="campground-search"
            className="step-search-input"
            type="text"
            placeholder="Algonquin, Alice Lake, Rathtrevor…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsDismissed(false)
              if (isSelected) {
                onUpdate({ campgroundId: '', campgroundName: '', platform: '', province: '' })
              }
            }}
            onKeyDown={(e) => {
              const dropdownVisible = showDropdown && results.length > 0
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
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            aria-controls="step-search-listbox"
            aria-activedescendant={highlightedIndex >= 0 ? `step-search-result-${highlightedIndex}` : undefined}
            autoFocus
          />
          {isSearching ? (
            <span className="step-search-pulse" aria-hidden="true" />
          ) : null}
        </div>
      </div>

      {showDropdown && results.length === 0 ? (
        <p className="step-search-empty" role="status" aria-live="polite">
          {isSearching ? 'Searching…' : `No campgrounds match "${query}".`}
        </p>
      ) : null}

      {showDropdown && results.length > 0 ? (
        <div className="step-search-results" role="listbox" id="step-search-listbox">
          {results.slice(0, 10).map((cg, index) => (
            <button
              key={`${cg.platform}:${cg.id}`}
              ref={(el) => {
                itemsRef.current[index] = el
              }}
              id={`step-search-result-${index}`}
              type="button"
              role="option"
              aria-selected={index === highlightedIndex}
              tabIndex={-1}
              className="step-search-result"
              data-highlighted={index === highlightedIndex ? 'true' : undefined}
              onClick={() => handleSelect(cg)}
            >
              <span className="step-search-result-mono" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="step-search-result-main">
                <span className="step-search-result-name">{cg.name}</span>
                <span className="step-search-result-meta">
                  {getPlatformLabel(cg.platform)}
                  {cg.province ? <> · {cg.province}</> : null}
                </span>
              </span>
              <span className="step-search-result-arrow" aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      ) : null}

      {isSelected ? (
        <div className="step-search-picked">
          <div className="step-search-picked-row">
            <span className="step-search-picked-dot" aria-hidden="true" />
            <div className="step-search-picked-text">
              <span className="step-search-picked-name">{data.campgroundName}</span>
              <span className="step-search-picked-meta">
                {getPlatformLabel(data.platform)}
                {data.province ? <> · {data.province}</> : null}
              </span>
            </div>
            <button
              type="button"
              className="step-search-picked-change"
              onClick={handleClear}
            >
              Change
            </button>
          </div>
        </div>
      ) : null}

      <div className="step-actions">
        <button
          type="button"
          className="step-cta"
          onClick={onComplete}
          disabled={!isSelected}
        >
          Continue
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  )
}
