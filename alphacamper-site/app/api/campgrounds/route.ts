import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { normalizeSupportStatus, searchCampgrounds } from '@/lib/parks'

const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }
const BASE_COLUMNS = 'id, platform, root_map_id, name, short_name, province, support_status, provider_key, source_url, last_verified_at'
const EVIDENCE_COLUMNS = `${BASE_COLUMNS}, availability_mode, confidence, source_evidence`
const PROVINCE_SEARCH_ALIASES: Array<{ code: string; aliases: string[] }> = [
  { code: 'AB', aliases: ['alberta'] },
  { code: 'BC', aliases: ['british columbia'] },
  { code: 'MB', aliases: ['manitoba'] },
  { code: 'NB', aliases: ['new brunswick'] },
  { code: 'NL', aliases: ['newfoundland and labrador', 'newfoundland labrador'] },
  { code: 'NS', aliases: ['nova scotia'] },
  { code: 'NT', aliases: ['northwest territories', 'northwest territory'] },
  { code: 'ON', aliases: ['ontario'] },
  { code: 'PE', aliases: ['pei', 'p e i', 'prince edward island'] },
  { code: 'QC', aliases: ['quebec'] },
  { code: 'SK', aliases: ['saskatchewan'] },
  { code: 'YT', aliases: ['yukon'] },
]

type CampgroundRow = {
  id: string
  platform: string
  root_map_id: number | null
  name: string
  short_name: string | null
  province: string | null
  support_status?: string | null
  provider_key?: string | null
  source_url?: string | null
  last_verified_at?: string | null
  availability_mode?: string | null
  confidence?: string | null
  source_evidence?: Record<string, unknown> | null
}

function cachedJson(body: unknown) {
  return NextResponse.json(body, { headers: CACHE_HEADERS })
}

function shouldRetryWithoutEvidenceColumns(error: { message?: string } | null | undefined) {
  return Boolean(error?.message?.match(/availability_mode|confidence|source_evidence/))
}

function normalizeCampgroundKey(value: string | null | undefined) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\b(campground|campgrounds|provincial park|park|recreation area|day use area|day-use area)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeProvinceSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function provinceCodesForSearch(value: string) {
  const normalized = normalizeProvinceSearch(value)
  if (!normalized) return []

  return PROVINCE_SEARCH_ALIASES
    .filter(({ code, aliases }) => (
      normalized === code.toLowerCase() || aliases.includes(normalized)
    ))
    .map(({ code }) => code)
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

  const escapedQuery = q
    .replace(/\\/g, '\\\\')
    .replace(/[%_]/g, '\\$&')
    .replace(/[,.()]/g, '')
    .trim()

  // After stripping punctuation, query might be empty (e.g., ".." or "(),").
  // An empty pattern would produce a match-all `%%` ILIKE — return empty instead.
  if (!id && escapedQuery.length < 2) {
    return cachedJson({ campgrounds: [] })
  }

  const buildQuery = (columns: string) => {
    let query = supabase
      .from('campgrounds')
      .select(columns)
      .limit(limit)

    if (id) {
      query = query.eq('id', id)
      if (platform) query = query.eq('platform', platform)
      return query
    }

    const provinceFilters = provinceCodesForSearch(escapedQuery).map(code => `province.eq.${code}`)
    query = query.or([
      `name.ilike.%${escapedQuery}%`,
      `short_name.ilike.%${escapedQuery}%`,
      `province.ilike.%${escapedQuery}%`,
      ...provinceFilters,
    ].join(','))
    if (platform) query = query.eq('platform', platform)
    return query
  }

  let { data, error } = await buildQuery(EVIDENCE_COLUMNS)
  if (error && shouldRetryWithoutEvidenceColumns(error)) {
    const fallback = await buildQuery(BASE_COLUMNS)
    data = fallback.data
    error = fallback.error
  }

  if (error) {
    console.error(`[campgrounds] Supabase ${id ? 'exact lookup' : 'query'} failed:`, error.message)
  }

  if (id) {
    const exactResults = (error ? [] : (data ?? [])) as unknown as CampgroundRow[]
    const campgrounds = exactResults.map((result) => ({
      ...result,
      support_status: normalizeSupportStatus(result.support_status, result.platform),
    }))
    return cachedJson({ campgrounds })
  }

  const dbResults = (error ? [] : (data ?? [])) as unknown as CampgroundRow[]

  // Merge static fallback — covers Recreation.gov and pre-sync state for Camis platforms
  const staticResults = searchCampgrounds(q).filter(c => !platform || c.platform === platform).map(c => ({
    id: c.id,
    platform: c.platform,
    root_map_id: null as number | null,
    name: c.name,
    short_name: null as string | null,
    province: c.province ?? null,
    support_status: c.supportStatus,
    provider_key: c.platform,
    source_url: null as string | null,
    last_verified_at: null as string | null,
    availability_mode: null as string | null,
    confidence: null as string | null,
    source_evidence: null as Record<string, unknown> | null,
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
    ...dbResults.map((result) => ({
      ...result,
      support_status: normalizeSupportStatus(result.support_status, result.platform),
    })),
    ...staticResults.filter((result) => {
      if (dbKeys.has(`${result.id}:${result.platform}`)) return false
      const nameKey = normalizeCampgroundKey(result.name)
      if (!nameKey) return true
      return !dbNameKeys.has(`${result.platform}:${nameKey}`)
    }),
  ].slice(0, limit)

  return cachedJson({ campgrounds: merged })
}
