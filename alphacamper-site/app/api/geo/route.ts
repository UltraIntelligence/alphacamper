import { type NextRequest, NextResponse } from 'next/server'

// Returns the visitor's approximate coordinates from Vercel's edge geo headers.
// Falls back to an empty object when headers are absent (local dev, non-Vercel).
export async function GET(request: NextRequest) {
  const rawLat = request.headers.get('x-vercel-ip-latitude')
  const rawLon = request.headers.get('x-vercel-ip-longitude')

  if (rawLat && rawLon) {
    const lat = parseFloat(rawLat)
    const lon = parseFloat(rawLon)
    if (!isNaN(lat) && !isNaN(lon)) {
      return NextResponse.json({ lat, lon })
    }
  }

  return NextResponse.json({})
}
