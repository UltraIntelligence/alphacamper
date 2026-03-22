'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type SearchResult = { id: string; platform: string; name: string; province: string | null }

export function ParkSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const latestSearchRef = useRef(0)

  async function fetchResults(q: string, limit = 8): Promise<SearchResult[]> {
    if (!q.trim() || q.trim().length < 2) return []
    try {
      const res = await fetch(`/api/campgrounds?q=${encodeURIComponent(q)}&limit=${limit}`)
      if (!res.ok) return []
      return (await res.json()).campgrounds ?? []
    } catch {
      return []
    }
  }

  function handleChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim() || value.trim().length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      const seq = ++latestSearchRef.current
      const matches = await fetchResults(value)
      if (seq !== latestSearchRef.current) return
      setResults(matches)
      setIsOpen(matches.length > 0)
    }, 200)
  }

  function handleSelect(park: SearchResult) {
    setQuery(park.name)
    setIsOpen(false)
    router.push(`/watch/new?park=${park.id}`)
  }

  async function handleSubmit() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (!query.trim()) return
    const seq = ++latestSearchRef.current
    // Immediate fetch (no debounce) so Enter key always gets fresh results
    const matches = await fetchResults(query, 1)
    if (seq !== latestSearchRef.current) return
    if (matches.length > 0) {
      handleSelect(matches[0])
    } else {
      router.push(`/watch/new?q=${encodeURIComponent(query.trim())}`)
    }
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="park-search" ref={wrapRef}>
      <div className="park-search-input-wrap">
        <input
          className="park-search-input"
          type="text"
          placeholder="Park or campground name"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          aria-label="Search for a park or campground"
          autoComplete="off"
        />
        <button
          className="park-search-btn"
          onClick={handleSubmit}
          type="button"
        >
          Watch this park &rarr;
        </button>
      </div>

      {isOpen && results.length > 0 && (
        <div className="park-search-dropdown" role="listbox">
          {results.map((park) => (
            <div
              key={`${park.id}:${park.platform}`}
              className="park-search-item"
              onClick={() => handleSelect(park)}
              role="option"
              aria-selected={false}
            >
              <span className="park-search-item-name">{park.name}</span>
              <span className="park-search-item-badge">{park.province ?? 'Parks Canada'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
