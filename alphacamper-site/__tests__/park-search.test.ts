import { describe, it, expect } from 'vitest'
import { getCampground } from '@/lib/parks'

const LANDING_PAGE_PARK_IDS = [
  '-2430',     // Alice Lake
  '-2504',     // Rathtrevor Beach
  '-2493',     // Golden Ears
  '-2499',     // Joffre Lakes
  '-2740399',  // Algonquin - Canisbay Lake
  '-2740523',  // Killarney - George Lake
  '-2740285',  // Sandbanks - Outlet River
  '-2740575',  // Pinery - Burley
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
