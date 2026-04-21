import { NextResponse } from 'next/server'

const CACHE_HEADERS = { 'Cache-Control': 'no-store' }

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

export function resolveAlphacamperApiBaseUrl() {
  const explicit =
    process.env.ALPHACAMPER_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_ALPHACAMPER_API_URL?.trim()

  return explicit ? explicit.replace(/\/$/, '') : ''
}

export async function GET() {
  const baseUrl = resolveAlphacamperApiBaseUrl()

  if (!baseUrl) {
    return json({
      status: 'admin_api_offline',
      available: false,
      reason: 'The admin API is offline for beta.',
      fetchedFrom: null,
      providerQuality: null,
      alertDelivery: null,
      providers: [],
    })
  }

  const endpoint = `${baseUrl}/v1/admin/overview`

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      return json({
        status: 'admin_api_offline',
        available: false,
        reason: 'The admin API is offline for beta.',
        fetchedFrom: endpoint,
        providerQuality: null,
        alertDelivery: null,
        providers: [],
      })
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
    return json({
      status: 'admin_api_offline',
      available: false,
      reason: 'The admin API is offline for beta.',
      fetchedFrom: endpoint,
      providerQuality: null,
      alertDelivery: null,
      providers: [],
    })
  }
}
