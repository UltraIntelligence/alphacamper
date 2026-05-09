import { NextResponse } from 'next/server'
import { getServiceRoleSupabase } from '@/lib/supabase.server'

const CACHE_HEADERS = { 'Cache-Control': 'no-store' }

type CatalogProviderSyncRow = {
  provider_key: string
  provider_name: string
  source_url: string
  support_status: string
  availability_mode: string
  confidence: string
  status: string
  row_count: number
  last_attempted_at: string | null
  last_success_at: string | null
  last_error: string | null
  stale_after_hours: number
  metadata_json: Record<string, unknown> | null
}

type WorkerStatusRow = {
  id: string
  last_cycle_at: string | null
  last_successful_poll_at: string | null
  platforms_healthy: Record<string, unknown> | null
  cycle_stats: Record<string, unknown> | null
}

type WatchedTargetRow = {
  id: string
  active: boolean | null
}

type AvailabilityAlertRow = {
  id: string
  claimed: boolean | null
  notified_at: string | null
}

export interface ProviderQualityPanelResponse {
  status?: 'admin_api_offline'
  available: boolean
  reason: string | null
  fetchedFrom: string | null
  providerQuality: {
    total: number
    live_polling: number
    directory_only: number
    metadata_only: number
    verified: number
    inferred: number
    seeded: number
    unknown: number
  } | null
  alertDelivery: {
    active_alerts: number
    total_deliveries: number
    delivered: number
    failed: number
    webhook_deliveries: number
    email_deliveries: number
  } | null
  providers: Array<{
    provider_id: string
    provider_name: string
    country: string | null
    kind: string
    status: string
    availability_mode: string
    confidence: string
    verification_note: string
    last_request_at: string | null
    next_allowed_at: string | null
    current_backoff_seconds: number
    consecutive_errors: number
    last_error_code: string | null
  }>
}

function json(body: ProviderQualityPanelResponse, status = 200) {
  return NextResponse.json(body, { status, headers: CACHE_HEADERS })
}

function adminApiOffline(fetchedFrom: string | null = null) {
  return json({
    status: 'admin_api_offline',
    available: false,
    reason: 'The admin API is offline for beta.',
    fetchedFrom,
    providerQuality: null,
    alertDelivery: null,
    providers: [],
  })
}

export function resolveAlphacamperApiBaseUrl() {
  const explicit =
    process.env.ALPHACAMPER_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_ALPHACAMPER_API_URL?.trim()

  return explicit ? explicit.replace(/\/$/, '') : ''
}

function providerKind(providerKey: string, supportStatus: string) {
  if (providerKey === 'parks_canada') return 'national'
  if (providerKey === 'recreation_gov') return 'federal'
  if (providerKey.startsWith('gtc_') || providerKey.endsWith('_parks')) return 'provincial'
  if (supportStatus === 'search_only') return 'directory'
  return 'provider'
}

function providerCountry(providerKey: string) {
  if (providerKey === 'recreation_gov') return 'US'
  return 'CA'
}

function isProviderStale(row: CatalogProviderSyncRow, now = Date.now()) {
  if (!row.last_success_at) return true
  const successTime = new Date(row.last_success_at).getTime()
  if (Number.isNaN(successTime)) return true
  const staleAfterMs = Math.max(1, row.stale_after_hours || 24) * 60 * 60 * 1000
  return now - successTime > staleAfterMs
}

function providerStatus(row: CatalogProviderSyncRow) {
  if (row.status === 'failed' || row.last_error) return 'degraded'
  if (isProviderStale(row)) return 'idle'
  return 'healthy'
}

function verificationNote(row: CatalogProviderSyncRow) {
  const note = row.metadata_json?.verification_note
  if (typeof note === 'string' && note.trim()) return note

  if (row.last_error) {
    return `Last provider refresh failed: ${row.last_error}`
  }

  return `Last provider refresh ${row.status} with ${row.row_count} rows from ${row.source_url}.`
}

async function getSupabaseOverview(): Promise<ProviderQualityPanelResponse | null> {
  try {
    const supabase = getServiceRoleSupabase()

    const [syncsResult, workerResult, watchesResult, alertsResult] = await Promise.all([
      supabase
        .from('catalog_provider_syncs')
        .select('provider_key, provider_name, source_url, support_status, availability_mode, confidence, status, row_count, last_attempted_at, last_success_at, last_error, stale_after_hours, metadata_json'),
      supabase
        .from('worker_status')
        .select('id, last_cycle_at, last_successful_poll_at, platforms_healthy, cycle_stats'),
      supabase
        .from('watched_targets')
        .select('id, active'),
      supabase
        .from('availability_alerts')
        .select('id, claimed, notified_at'),
    ])

    if (syncsResult.error) {
      return null
    }

    const syncs = ((syncsResult.data ?? []) as CatalogProviderSyncRow[])
      .sort((a, b) => a.provider_name.localeCompare(b.provider_name))
    const workerRows = (workerResult.error ? [] : (workerResult.data ?? [])) as WorkerStatusRow[]
    const latestWorker = workerRows
      .slice()
      .sort((a, b) => {
        const aTime = a.last_cycle_at ? new Date(a.last_cycle_at).getTime() : 0
        const bTime = b.last_cycle_at ? new Date(b.last_cycle_at).getTime() : 0
        return bTime - aTime
      })[0] ?? null
    const watches = (watchesResult.error ? [] : (watchesResult.data ?? [])) as WatchedTargetRow[]
    const alerts = (alertsResult.error ? [] : (alertsResult.data ?? [])) as AvailabilityAlertRow[]

    const providerQuality = {
      total: syncs.length,
      live_polling: syncs.filter(row => row.availability_mode === 'live_polling').length,
      directory_only: syncs.filter(row => row.availability_mode === 'directory_only').length,
      metadata_only: syncs.filter(row => row.availability_mode === 'metadata_only').length,
      verified: syncs.filter(row => row.confidence === 'verified').length,
      inferred: syncs.filter(row => row.confidence === 'inferred').length,
      seeded: syncs.filter(row => row.confidence === 'seeded').length,
      unknown: syncs.filter(row => row.confidence === 'unknown').length,
    }

    const workerMissing = !latestWorker?.last_cycle_at
    const workerPlatforms = latestWorker?.platforms_healthy ?? {}
    const workerProvider = {
      provider_id: 'railway_worker',
      provider_name: 'Railway Worker',
      country: null,
      kind: 'alert_engine',
      status: workerMissing ? 'degraded' : 'healthy',
      availability_mode: 'live_polling',
      confidence: workerMissing ? 'unknown' : 'verified',
      verification_note: workerMissing
        ? 'No worker heartbeat is visible in live Supabase yet. Verify the Railway service is running and pointed at the live project.'
        : `Worker heartbeat is visible. Platforms reported: ${Object.keys(workerPlatforms).join(', ') || 'none'}.`,
      last_request_at: latestWorker?.last_cycle_at ?? null,
      next_allowed_at: null,
      current_backoff_seconds: 0,
      consecutive_errors: workerMissing ? 1 : 0,
      last_error_code: workerMissing ? 'missing_worker_heartbeat' : null,
    }

    return {
      available: true,
      reason: workerMissing ? 'Railway worker heartbeat is not visible yet.' : null,
      fetchedFrom: 'live_supabase',
      providerQuality,
      alertDelivery: {
        active_alerts: watches.filter(row => row.active).length,
        total_deliveries: alerts.length,
        delivered: alerts.filter(row => row.notified_at).length,
        failed: 0,
        webhook_deliveries: 0,
        email_deliveries: alerts.filter(row => row.notified_at).length,
      },
      providers: [
        workerProvider,
        ...syncs.map(row => ({
          provider_id: row.provider_key,
          provider_name: row.provider_name,
          country: providerCountry(row.provider_key),
          kind: providerKind(row.provider_key, row.support_status),
          status: providerStatus(row),
          availability_mode: row.availability_mode,
          confidence: row.confidence,
          verification_note: verificationNote(row),
          last_request_at: row.last_success_at ?? row.last_attempted_at,
          next_allowed_at: null,
          current_backoff_seconds: 0,
          consecutive_errors: row.status === 'failed' || row.last_error ? 1 : 0,
          last_error_code: row.last_error ? 'provider_sync_failed' : null,
        })),
      ],
    }
  } catch {
    return null
  }
}

export async function GET() {
  const baseUrl = resolveAlphacamperApiBaseUrl()

  if (!baseUrl) {
    const supabaseOverview = await getSupabaseOverview()
    return supabaseOverview ? json(supabaseOverview) : adminApiOffline()
  }

  const endpoint = `${baseUrl}/v1/admin/overview`

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      const supabaseOverview = await getSupabaseOverview()
      return supabaseOverview ? json({ ...supabaseOverview, fetchedFrom: 'live_supabase' }) : adminApiOffline(endpoint)
    }

    const data = await response.json()

    return json({
      available: true,
      reason: null,
      fetchedFrom: endpoint,
      providerQuality: data.provider_quality ?? null,
      alertDelivery: data.alert_delivery ?? null,
      providers: Array.isArray(data.providers) ? data.providers : [],
    })
  } catch (error) {
    const supabaseOverview = await getSupabaseOverview()
    return supabaseOverview ? json({ ...supabaseOverview, fetchedFrom: 'live_supabase' }) : adminApiOffline(endpoint)
  }
}
