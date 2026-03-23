import { describe, it, expect } from 'vitest'
import { getNextHighlightedIndex } from '@/lib/search-nav'

describe('getNextHighlightedIndex', () => {
  describe('ArrowDown', () => {
    it('moves from -1 to 0', () => {
      expect(getNextHighlightedIndex('ArrowDown', -1, 3)).toBe(0)
    })
    it('advances forward', () => {
      expect(getNextHighlightedIndex('ArrowDown', 1, 3)).toBe(2)
    })
    it('wraps from last to first', () => {
      expect(getNextHighlightedIndex('ArrowDown', 2, 3)).toBe(0)
    })
  })

  describe('ArrowUp', () => {
    it('moves from -1 to last', () => {
      expect(getNextHighlightedIndex('ArrowUp', -1, 3)).toBe(2)
    })
    it('moves from 0 to last (wrap)', () => {
      expect(getNextHighlightedIndex('ArrowUp', 0, 3)).toBe(2)
    })
    it('decrements normally', () => {
      expect(getNextHighlightedIndex('ArrowUp', 2, 3)).toBe(1)
    })
  })

  describe('other keys', () => {
    it('returns current index unchanged', () => {
      expect(getNextHighlightedIndex('Enter', 1, 3)).toBe(1)
    })
  })

  describe('edge cases', () => {
    it('returns -1 when total is 0', () => {
      expect(getNextHighlightedIndex('ArrowDown', -1, 0)).toBe(-1)
      expect(getNextHighlightedIndex('ArrowUp', -1, 0)).toBe(-1)
    })
  })
})
