'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { searchCampgrounds, type Campground } from '@/lib/parks'

export function ParkSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Campground[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  function handleChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const matches = searchCampgrounds(value)
      setResults(matches.slice(0, 8))
      setIsOpen(matches.length > 0 && value.length > 0)
    }, 200)
  }

  function handleSelect(park: Campground) {
    setQuery(park.name)
    setIsOpen(false)
    router.push(`/watch/new?park=${park.id}`)
  }

  function handleSubmit() {
    if (results.length > 0) {
      handleSelect(results[0])
    } else if (query.trim()) {
      router.push(`/watch/new?q=${encodeURIComponent(query.trim())}`)
    }
  }

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
          placeholder="Search for a park or campground..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
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
              key={park.id}
              className="park-search-item"
              onClick={() => handleSelect(park)}
              role="option"
              aria-selected={false}
            >
              <span className="park-search-item-name">{park.name}</span>
              <span className="park-search-item-badge">{park.province}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
