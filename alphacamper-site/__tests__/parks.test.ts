import { describe, it, expect } from 'vitest'
import {
  searchCampgrounds,
  getCampground,
  getPlatformDomain,
  CAMPGROUNDS,
} from '@/lib/parks'

describe('searchCampgrounds', () => {
  it('returns campgrounds matching a query (case-insensitive)', () => {
    const results = searchCampgrounds('alice')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name.toLowerCase()).toContain('alice')
  })

  it('returns empty array for no match', () => {
    const results = searchCampgrounds('xyznonexistent')
    expect(results).toEqual([])
  })

  it('returns empty array when query is empty', () => {
    const results = searchCampgrounds('')
    expect(results).toEqual([])
  })

  it('CAMPGROUNDS array has 100+ entries', () => {
    expect(CAMPGROUNDS.length).toBeGreaterThanOrEqual(100)
  })

  it('matches by park name', () => {
    const results = searchCampgrounds('algonquin')
    expect(results.length).toBeGreaterThan(0)
    results.forEach(r => expect(r.park?.toLowerCase()).toContain('algonquin'))
  })

  it('matches by province', () => {
    const results = searchCampgrounds('ontario')
    expect(results.length).toBeGreaterThan(0)
    results.forEach(r => expect(r.province).toBe('ON'))
  })
})

describe('getCampground', () => {
  it('returns campground by id', () => {
    const cg = getCampground('-2430')
    expect(cg).toBeDefined()
    expect(cg!.name).toBe('Alice Lake')
  })

  it('returns undefined for unknown id', () => {
    expect(getCampground('unknown')).toBeUndefined()
  })
})

describe('getPlatformDomain', () => {
  it('returns domain for bc_parks', () => {
    expect(getPlatformDomain('bc_parks')).toBe('camping.bcparks.ca')
  })

  it('returns domain for ontario_parks', () => {
    expect(getPlatformDomain('ontario_parks')).toBe('reservations.ontarioparks.ca')
  })

  it('returns domain for recreation_gov', () => {
    expect(getPlatformDomain('recreation_gov')).toBe('www.recreation.gov')
  })

  it('returns domain for parks_canada', () => {
    expect(getPlatformDomain('parks_canada')).toBe('reservation.pc.gc.ca')
  })

  it('returns null for unsupported platform', () => {
    expect(getPlatformDomain('unknown')).toBeNull()
  })
})
