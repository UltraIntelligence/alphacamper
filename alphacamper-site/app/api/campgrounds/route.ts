import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { searchCampgrounds } from '@/lib/parks'

const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }

function cachedJson(body: unknown) {
  return NextResponse.json(body, { headers: CACHE_HEADERS })
}

function normalizeCampgroundKey(value: string | null | undefined) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\b(campground|campgrounds|provincial park|park|recreation area|day use area|day-use area)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const id = searchParams.get('id')?.trim() ?? ''
  const platform = searchParams.get('platform') ?? undefined
  const limit = Math.min(Math.max(1, Number(searchParams.get('limit')) || 10), 20)

  if (!id && q.length < 2) {
    return cachedJson({ campgrounds: [] })
  }

  const supabase = getSupabase()

  let query = supabase
    .from('campgrounds')
    .select('id, platform, root_map_id, name, short_name, province')
    .limit(limit)

  if (id) {
    query = query.eq('id', id)
    if (platform) query = query.eq('platform', platform)
    const { data, error } = await query
    if (error) {
      console.error('[campgrounds] Supabase exact lookup failed:', error.message)
      return cachedJson({ campgrounds: [] })
    }
    return cachedJson({ campgrounds: data ?? [] })
  }

  const escapedQuery = q
    .replace(/\\/g, '\\\\')
    .replace(/[%_]/g, '\\$&')
    .replace(/[,.()]/g, '')
    .trim()

  // After stripping punctuation, query might be empty (e.g., ".." or "(),").
  // An empty pattern would produce a match-all `%%` ILIKE — return empty instead.
  if (escapedQuery.length < 2) {
    return cachedJson({ campgrounds: [] })
  }

  query = query.or(
    `name.ilike.%${escapedQuery}%,short_name.ilike.%${escapedQuery}%,province.ilike.%${escapedQuery}%`
  )

  if (platform) query = query.eq('platform', platform)

  const { data, error } = await query

  if (error) {
    console.error('[campgrounds] Supabase query failed:', error.message)
  }

  const dbResults = (error ? [] : (data ?? [])) as Array<{
    id: string
    platform: string
    root_map_id: number | null
    name: string
    short_name: string | null
    province: string | null
  }>

  // Merge static fallback — covers Recreation.gov and pre-sync state for Camis platforms
  const staticResults = searchCampgrounds(q).filter(c => !platform || c.platform === platform).map(c => ({
    id: c.id,
    platform: c.platform,
    root_map_id: null as number | null,
    name: c.name,
    short_name: null as string | null,
    province: c.province ?? null,
  }))

  const dbKeys = new Set(dbResults.map(r => `${r.id}:${r.platform}`))
  const dbNameKeys = new Set(
    dbResults.flatMap((result) => {
      const keys = [normalizeCampgroundKey(result.name), normalizeCampgroundKey(result.short_name)]
        .filter(Boolean)
        .map((nameKey) => `${result.platform}:${nameKey}`)
      return Array.from(new Set(keys))
    })
  )
  const merged = [
    ...dbResults,
    ...staticResults.filter((result) => {
      if (dbKeys.has(`${result.id}:${result.platform}`)) return false
      const nameKey = normalizeCampgroundKey(result.name)
      if (!nameKey) return true
      return !dbNameKeys.has(`${result.platform}:${nameKey}`)
    }),
  ].slice(0, limit)

  return cachedJson({ campgrounds: merged })
}
