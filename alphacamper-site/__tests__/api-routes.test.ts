// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockGetUserIdFromRequest,
  mockGetVerifiedIdentityFromRequest,
  mockFrom,
} = vi.hoisted(() => ({
  mockGetUserIdFromRequest: vi.fn(),
  mockGetVerifiedIdentityFromRequest: vi.fn(),
  mockFrom: vi.fn(),
}))
const mockSupabase = { from: mockFrom }

vi.mock('@/lib/auth.server', () => ({
  getUserIdFromRequest: mockGetUserIdFromRequest,
  getVerifiedIdentityFromRequest: mockGetVerifiedIdentityFromRequest,
}))

vi.mock('@/lib/supabase.server', () => ({
  getSupabaseForRequest: () => mockSupabase,
}))

import * as watchRoute from '@/app/api/watch/route'
import * as alertsRoute from '@/app/api/alerts/route'
import * as registerRoute from '@/app/api/register/route'

function buildInsertChain(result: { data: unknown; error: { message: string } | null }) {
  const chain = {
    data: result.data,
    error: result.error,
    insert: vi.fn(() => chain),
    select: vi.fn(() => chain),
    single: vi.fn(() => chain),
  }

  return chain
}

function buildSelectChain(result: { data: unknown; error: { message: string } | null }) {
  const chain = {
    data: result.data,
    error: result.error,
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn(() => chain),
  }

  return chain
}

function buildUpdateChain(error: { message: string } | null = null) {
  const result = { error }
  const chain = {
    error,
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
  }

  Object.assign(chain, result)
  return chain
}

beforeEach(() => {
  mockGetUserIdFromRequest.mockReset()
  mockGetVerifiedIdentityFromRequest.mockReset()
  mockFrom.mockReset()
})

describe('watch routes', () => {
  it('requires auth before creating a watch', async () => {
    mockGetUserIdFromRequest.mockResolvedValue(null)

    const response = await watchRoute.POST(new Request('https://alphacamper.test/api/watch', {
      method: 'POST',
      body: JSON.stringify({}),
    }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
  })

  it('creates a watch with exact dates and optional site number', async () => {
    mockGetUserIdFromRequest.mockResolvedValue('user-123')
    const campgroundQueryChain = buildSelectChain({
      data: { id: 'camp-1', platform: 'bc_parks', name: 'Alice Lake Provincial Park' },
      error: null,
    })
    const insertChain = buildInsertChain({
      data: { id: 'watch-1', site_number: 'A12' },
      error: null,
    })
    mockFrom.mockImplementation((table: string) => (
      table === 'campgrounds' ? campgroundQueryChain : insertChain
    ))

    const response = await watchRoute.POST(new Request('https://alphacamper.test/api/watch', {
      method: 'POST',
      body: JSON.stringify({
        platform: 'bc_parks',
        campgroundId: 'camp-1',
        campgroundName: 'Alice Lake',
        siteNumber: 'A12',
        arrivalDate: '2026-07-10',
        departureDate: '2026-07-12',
      }),
    }))

    expect(response.status).toBe(200)
    expect(insertChain.insert).toHaveBeenCalledWith({
      user_id: 'user-123',
      platform: 'bc_parks',
      campground_id: 'camp-1',
      campground_name: 'Alice Lake Provincial Park',
      site_number: 'A12',
      arrival_date: '2026-07-10',
      departure_date: '2026-07-12',
    })
    await expect(response.json()).resolves.toEqual({
      success: true,
      watch: { id: 'watch-1', site_number: 'A12' },
    })
  })

  it('rejects a watch when the campground id and platform are not valid', async () => {
    mockGetUserIdFromRequest.mockResolvedValue('user-123')
    const campgroundQueryChain = buildSelectChain({
      data: null,
      error: { message: 'not found' },
    })
    mockFrom.mockImplementation((table: string) => (
      table === 'campgrounds' ? campgroundQueryChain : buildInsertChain({ data: null, error: null })
    ))

    const response = await watchRoute.POST(new Request('https://alphacamper.test/api/watch', {
      method: 'POST',
      body: JSON.stringify({
        platform: 'bc_parks',
        campgroundId: 'unknown-camp',
        campgroundName: 'Fake Camp',
        siteNumber: 'A12',
        arrivalDate: '2026-07-10',
        departureDate: '2026-07-12',
      }),
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid campground selection' })
  })

  it('lists only active watches for the signed-in customer', async () => {
    mockGetUserIdFromRequest.mockResolvedValue('user-123')
    const queryChain = buildSelectChain({
      data: [{ id: 'watch-1' }, { id: 'watch-2' }],
      error: null,
    })
    mockFrom.mockReturnValue(queryChain)

    const response = await watchRoute.GET(new Request('https://alphacamper.test/api/watch'))

    expect(response.status).toBe(200)
    expect(queryChain.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-123')
    expect(queryChain.eq).toHaveBeenNthCalledWith(2, 'active', true)
    await expect(response.json()).resolves.toEqual({
      watches: [{ id: 'watch-1' }, { id: 'watch-2' }],
    })
  })

  it('soft-deletes a watch instead of removing the row', async () => {
    mockGetUserIdFromRequest.mockResolvedValue('user-123')
    const updateChain = buildUpdateChain()
    mockFrom.mockReturnValue(updateChain)

    const response = await watchRoute.DELETE(
      new Request('https://alphacamper.test/api/watch?id=watch-1', { method: 'DELETE' })
    )

    expect(response.status).toBe(200)
    expect(updateChain.update).toHaveBeenCalledWith({ active: false })
    expect(updateChain.eq).toHaveBeenNthCalledWith(1, 'id', 'watch-1')
    expect(updateChain.eq).toHaveBeenNthCalledWith(2, 'user_id', 'user-123')
    await expect(response.json()).resolves.toEqual({ success: true })
  })
})

describe('alerts routes', () => {
  it('loads recent unclaimed alerts for the signed-in customer', async () => {
    mockGetUserIdFromRequest.mockResolvedValue('user-123')
    const queryChain = buildSelectChain({
      data: [{ id: 'alert-1' }],
      error: null,
    })
    mockFrom.mockReturnValue(queryChain)

    const response = await alertsRoute.GET(new Request('https://alphacamper.test/api/alerts'))

    expect(response.status).toBe(200)
    expect(queryChain.eq).toHaveBeenNthCalledWith(1, 'user_id', 'user-123')
    expect(queryChain.eq).toHaveBeenNthCalledWith(2, 'claimed', false)
    expect(queryChain.limit).toHaveBeenCalledWith(20)
    await expect(response.json()).resolves.toEqual({ alerts: [{ id: 'alert-1' }] })
  })

  it('marks an alert claimed for the signed-in customer', async () => {
    mockGetUserIdFromRequest.mockResolvedValue('user-123')
    const updateChain = buildUpdateChain()
    mockFrom.mockReturnValue(updateChain)

    const response = await alertsRoute.PATCH(new Request('https://alphacamper.test/api/alerts', {
      method: 'PATCH',
      body: JSON.stringify({ id: 'alert-1' }),
    }))

    expect(response.status).toBe(200)
    expect(updateChain.update).toHaveBeenCalledWith({ claimed: true })
    expect(updateChain.eq).toHaveBeenNthCalledWith(1, 'id', 'alert-1')
    expect(updateChain.eq).toHaveBeenNthCalledWith(2, 'user_id', 'user-123')
    await expect(response.json()).resolves.toEqual({ success: true })
  })
})

describe('register route', () => {
  it('requires a verified email before creating the user row', async () => {
    mockGetVerifiedIdentityFromRequest.mockResolvedValue(null)

    const response = await registerRoute.POST(new Request('https://alphacamper.test/api/register', {
      method: 'POST',
    }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
  })

  it('treats duplicate user inserts as safe and returns the existing account', async () => {
    mockGetVerifiedIdentityFromRequest.mockResolvedValue({
      authKind: 'supabase',
      userId: 'user-1',
      email: 'camper@example.com',
    })
    const insertChain = {
      insert: vi.fn(async () => ({ error: { code: '23505', message: 'duplicate key value' } })),
    }
    const selectChain = buildSelectChain({
      data: { id: 'user-1', email: 'camper@example.com' },
      error: null,
    })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          ...insertChain,
          select: selectChain.select,
          eq: selectChain.eq,
          single: selectChain.single,
        }
      }

      return selectChain
    })

    const response = await registerRoute.POST(new Request('https://alphacamper.test/api/register', {
      method: 'POST',
    }))

    expect(response.status).toBe(200)
    expect(insertChain.insert).toHaveBeenCalledWith({
      id: 'user-1',
      email: 'camper@example.com',
    })
    expect(selectChain.eq).toHaveBeenCalledWith('id', 'user-1')
    await expect(response.json()).resolves.toEqual({
      user: { id: 'user-1', email: 'camper@example.com' },
    })
  })
})
