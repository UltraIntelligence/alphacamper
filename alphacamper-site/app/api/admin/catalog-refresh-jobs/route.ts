import { NextResponse } from 'next/server'
import { getVerifiedEmailFromRequest } from '@/lib/auth.server'
import { resolveAlphacamperApiBaseUrl } from '@/app/api/admin/provider-quality/route'

const CACHE_HEADERS = { 'Cache-Control': 'no-store' }

export interface CatalogRefreshJobRecord {
  id: string
  mode: string
  status: string
  requested_by: string | null
  trigger_source: string | null
  requested_at: string
  started_at: string | null
  finished_at: string | null
  summary_json: Record<string, number> | null
  metadata_json: Record<string, string | null> | null
  error_message: string | null
}

export interface CatalogRefreshJobsResponse {
  available: boolean
  canManage: boolean
  reason: string | null
  operatorEmail: string | null
  fetchedFrom: string | null
  jobs: CatalogRefreshJobRecord[]
}

function json(body: CatalogRefreshJobsResponse, status = 200) {
  return NextResponse.json(body, { status, headers: CACHE_HEADERS })
}

function getAdminApiKey() {
  return process.env.ALPHACAMPER_API_ADMIN_KEY?.trim() ?? ''
}

function getOperatorEmailAllowlist() {
  return (process.env.OPERATOR_EMAIL_ALLOWLIST ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

async function getOperatorEmail(request: Request) {
  try {
    return await getVerifiedEmailFromRequest(request)
  } catch {
    return null
  }
}

function isAllowedOperator(email: string | null) {
  if (!email) return false
  const allowlist = getOperatorEmailAllowlist()
  if (allowlist.length === 0) return false
  return allowlist.includes(email.toLowerCase())
}

async function proxyList(request: Request) {
  const baseUrl = resolveAlphacamperApiBaseUrl()
  const adminApiKey = getAdminApiKey()

  if (!baseUrl || !adminApiKey) {
    return json({
      available: false,
      canManage: false,
      reason: 'The operator refresh controls are not configured yet.',
      operatorEmail: null,
      fetchedFrom: null,
      jobs: [],
    })
  }

  const operatorEmail = await getOperatorEmail(request)
  if (!isAllowedOperator(operatorEmail)) {
    return json({
      available: true,
      canManage: false,
      reason: 'This dashboard account is not approved for operator refresh controls.',
      operatorEmail,
      fetchedFrom: `${baseUrl}/v1/admin/catalog-refresh-jobs`,
      jobs: [],
    }, 403)
  }

  const endpoint = `${baseUrl}/v1/admin/catalog-refresh-jobs`

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        'X-Admin-Key': adminApiKey,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      return json({
        available: false,
        canManage: true,
        reason: `The refresh backend answered with ${response.status}.`,
        operatorEmail,
        fetchedFrom: endpoint,
        jobs: [],
      }, response.status)
    }

    const jobs = await response.json() as CatalogRefreshJobRecord[]
    return json({
      available: true,
      canManage: true,
      reason: null,
      operatorEmail,
      fetchedFrom: endpoint,
      jobs,
    })
  } catch (error) {
    return json({
      available: false,
      canManage: true,
      reason: error instanceof Error ? error.message : 'Could not reach the refresh backend.',
      operatorEmail,
      fetchedFrom: endpoint,
      jobs: [],
    }, 502)
  }
}

export async function GET(request: Request) {
  return proxyList(request)
}

export async function POST(request: Request) {
  const baseUrl = resolveAlphacamperApiBaseUrl()
  const adminApiKey = getAdminApiKey()

  if (!baseUrl || !adminApiKey) {
    return json({
      available: false,
      canManage: false,
      reason: 'The operator refresh controls are not configured yet.',
      operatorEmail: null,
      fetchedFrom: null,
      jobs: [],
    }, 503)
  }

  const operatorEmail = await getOperatorEmail(request)
  if (!isAllowedOperator(operatorEmail)) {
    return json({
      available: true,
      canManage: false,
      reason: 'This dashboard account is not approved for operator refresh controls.',
      operatorEmail,
      fetchedFrom: `${baseUrl}/v1/admin/catalog-refresh-jobs`,
      jobs: [],
    }, 403)
  }

  let incoming: { sourceLabel?: string | null; notes?: string | null } = {}
  try {
    incoming = await request.json() as { sourceLabel?: string | null; notes?: string | null }
  } catch {
    incoming = {}
  }

  const endpoint = `${baseUrl}/v1/admin/catalog-refresh-jobs`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Admin-Key': adminApiKey,
      },
      cache: 'no-store',
      body: JSON.stringify({
        mode: 'promote_local_catalog',
        requested_by: operatorEmail,
        source_label: incoming.sourceLabel ?? 'dashboard',
        notes: incoming.notes ?? 'Queued from the site dashboard operator panel.',
      }),
      signal: AbortSignal.timeout(8000),
    })

    const payload = await response.json()

    return NextResponse.json(payload, {
      status: response.status,
      headers: CACHE_HEADERS,
    })
  } catch (error) {
    return NextResponse.json({
      detail: error instanceof Error ? error.message : 'Could not queue the refresh job.',
    }, {
      status: 502,
      headers: CACHE_HEADERS,
    })
  }
}
