import { NextResponse } from 'next/server'

const CACHE_HEADERS = { 'Cache-Control': 'no-store' }
const DEV_FALLBACK_API_URL = 'http://127.0.0.1:8000'

export interface ProviderQualityPanelResponse {
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

  if (explicit) return explicit.replace(/\/$/, '')
  if (process.env.NODE_ENV !== 'production') return DEV_FALLBACK_API_URL
  return ''
}

export async function GET() {
  const baseUrl = resolveAlphacamperApiBaseUrl()

  if (!baseUrl) {
    return json({
      available: false,
      reason: 'Set ALPHACAMPER_API_URL to show the operator network view.',
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
        available: false,
        reason: `The operator backend answered with ${response.status}.`,
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
    const message = error instanceof Error ? error.message : 'Unable to reach the operator backend.'
    return json({
      available: false,
      reason: message,
      fetchedFrom: endpoint,
      providerQuality: null,
      alertDelivery: null,
      providers: [],
    })
  }
}
