import { describe, it, expect } from 'vitest'
import { getCampground } from '@/lib/parks'

const LANDING_PAGE_PARK_IDS = [
  '-2430',     // Alice Lake (BC)
  '-2504',     // Rathtrevor Beach (BC)
  '-2493',     // Golden Ears (BC)
  '-2740399',  // Algonquin (ON)
  '232447',    // Upper Pines, Yosemite (CA)
  '232493',    // Fish Creek, Glacier NP (MT)
  '10171274',  // Apgar, Glacier NP (MT)
  '272300',    // Jumbo Rocks, Joshua Tree (CA)
]

describe('landing page park integration', () => {
  it.each(LANDING_PAGE_PARK_IDS)('park %s exists in CAMPGROUNDS', (id) => {
    const park = getCampground(id)
    expect(park).toBeDefined()
    expect(park!.id).toBe(id)
  })

  it('getCampground returns undefined for invalid id', () => {
    expect(getCampground('nonexistent')).toBeUndefined()
  })
})
