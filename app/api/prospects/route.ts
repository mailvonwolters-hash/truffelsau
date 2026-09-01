import { NextResponse } from 'next/server'

const supabaseUrl = 'https://oxetkdardsfcahrmtbnq.supabase.co'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const allowedTags = new Set(['hairdresser', 'restaurant', 'craft', 'doctors'])
    const radius = Number(body.radius)
    const payload = {
      query: typeof body.query === 'string' ? body.query.slice(0, 120) : undefined,
      lat: typeof body.lat === 'number' ? body.lat : undefined,
      lng: typeof body.lng === 'number' ? body.lng : undefined,
      radius: Number.isFinite(radius) ? Math.min(Math.max(radius, 1), 20) : 10,
      tag: allowedTags.has(body.tag) ? body.tag : 'hairdresser',
      resolveOnly: body.resolveOnly === true,
    }
    const response = await fetch(`${supabaseUrl}/functions/v1/get-prospects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json({ error: 'Die Suche ist momentan nicht verfügbar.' }, { status: 502 })
  }
}
