import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { searchCampgrounds } from '@/lib/parks'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const platform = searchParams.get('platform') ?? undefined
  const limit = Math.min(Math.max(1, Number(searchParams.get('limit')) || 10), 20)

  if (q.length < 2) {
    return NextResponse.json({ campgrounds: [] })
  }

  const supabase = getSupabase()

  let query = supabase
    .from('campgrounds')
    .select('id, platform, name, short_name, province')
    .limit(limit)

  const escapedQuery = q
    .replace(/[%_]/g, '\\$&')
    .replace(/[,.()]/g, '')
    .trim()

  // After stripping punctuation, query might be empty (e.g., ".." or "(),").
  // An empty pattern would produce a match-all `%%` ILIKE — return empty instead.
  if (escapedQuery.length < 2) {
    return NextResponse.json({ campgrounds: [] })
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
    name: string
    short_name: string | null
    province: string | null
  }>

  // Merge static fallback — covers Recreation.gov and pre-sync state for Camis platforms
  const staticResults = searchCampgrounds(q).filter(c => !platform || c.platform === platform).map(c => ({
    id: c.id,
    platform: c.platform,
    name: c.name,
    short_name: null as string | null,
    province: c.province ?? null,
  }))

  const dbKeys = new Set(dbResults.map(r => `${r.id}:${r.platform}`))
  const merged = [
    ...dbResults,
    ...staticResults.filter(r => !dbKeys.has(`${r.id}:${r.platform}`)),
  ].slice(0, limit)

  return NextResponse.json(
    { campgrounds: merged },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } }
  )
}
