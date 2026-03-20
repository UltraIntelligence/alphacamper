export interface Campground {
  id: string
  name: string
  platform: 'bc_parks' | 'ontario_parks'
  province: string
  park?: string
}

const PLATFORM_DOMAINS: Record<string, string> = {
  bc_parks: 'camping.bcparks.ca',
  ontario_parks: 'reservations.ontarioparks.ca',
}

export const CAMPGROUNDS: Campground[] = [
  // ── BC Parks ──
  { id: '-2504', name: 'Rathtrevor Beach', platform: 'bc_parks', province: 'BC' },
  { id: '-2493', name: 'Golden Ears - Alouette', platform: 'bc_parks', province: 'BC' },
  { id: '-2471', name: 'Cultus Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2443', name: 'Birkenhead Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2532', name: 'Shuswap Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2457', name: 'Englishman River Falls', platform: 'bc_parks', province: 'BC' },
  { id: '-2499', name: 'Joffre Lakes', platform: 'bc_parks', province: 'BC' },
  { id: '-2472', name: 'Cypress Provincial Park', platform: 'bc_parks', province: 'BC' },
  { id: '-2503', name: 'Porteau Cove', platform: 'bc_parks', province: 'BC' },
  { id: '-2430', name: 'Alice Lake', platform: 'bc_parks', province: 'BC' },
  { id: '-2521', name: 'Okanagan Lake South', platform: 'bc_parks', province: 'BC' },
  { id: '-2497', name: 'Haynes Point', platform: 'bc_parks', province: 'BC' },

  // ── Ontario Parks ──
  { id: '-2740399', name: 'Algonquin - Canisbay Lake', platform: 'ontario_parks', province: 'ON', park: 'Algonquin' },
  { id: '-2740407', name: 'Algonquin - Pog Lake', platform: 'ontario_parks', province: 'ON', park: 'Algonquin' },
  { id: '-2740393', name: 'Algonquin - Lake of Two Rivers', platform: 'ontario_parks', province: 'ON', park: 'Algonquin' },
  { id: '-2740523', name: 'Killarney - George Lake', platform: 'ontario_parks', province: 'ON', park: 'Killarney' },
  { id: '-2740285', name: 'Sandbanks - Outlet River', platform: 'ontario_parks', province: 'ON', park: 'Sandbanks' },
  { id: '-2740575', name: 'Pinery - Burley', platform: 'ontario_parks', province: 'ON', park: 'Pinery' },
  { id: '-2740387', name: 'Bon Echo - Mazinaw Lake', platform: 'ontario_parks', province: 'ON', park: 'Bon Echo' },
  { id: '-2740451', name: 'Grundy Lake', platform: 'ontario_parks', province: 'ON', park: 'Grundy Lake' },
  { id: '-2740611', name: 'Silent Lake', platform: 'ontario_parks', province: 'ON', park: 'Silent Lake' },
  { id: '-2740303', name: 'Arrowhead', platform: 'ontario_parks', province: 'ON', park: 'Arrowhead' },
]

export function searchCampgrounds(query: string): Campground[] {
  if (!query.trim()) return []
  const q = query.toLowerCase().trim()
  return CAMPGROUNDS.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.province.toLowerCase().includes(q) ||
      (c.park && c.park.toLowerCase().includes(q)) ||
      (q.length >= 3 && c.platform === 'bc_parks' && 'british columbia'.includes(q)) ||
      (q.length >= 3 && c.platform === 'ontario_parks' && 'ontario'.includes(q))
  )
}

export function getCampground(id: string): Campground | undefined {
  return CAMPGROUNDS.find((c) => c.id === id)
}

export function getPlatformDomain(platform: string): string | null {
  return PLATFORM_DOMAINS[platform] ?? null
}
