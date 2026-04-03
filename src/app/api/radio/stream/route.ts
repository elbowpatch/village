import { NextRequest, NextResponse } from 'next/server'

// Resolves a Radio Garden channel ID to its actual stream URL
// Radio Garden's listen endpoint returns a 302 redirect to the broadcaster's stream
// We follow it server-side and return the resolved URL to the client so the
// <audio> element can play it directly without hitting CORS.

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  try {
    const listenUrl = `https://radio.garden/api/ara/content/listen/${id}/channel.mp3`

    // Follow the redirect manually so we can extract the real stream URL
    const res = await fetch(listenUrl, {
      method: 'HEAD',
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VillageApp/1.0)',
        'Referer': 'https://radio.garden/',
      },
    })

    // Radio Garden returns a 302 with a Location header pointing to the stream
    const location = res.headers.get('location')
    if (location) {
      return NextResponse.json({ url: location })
    }

    // If no redirect, the URL itself might be the stream (some channels)
    if (res.ok || res.status === 200) {
      return NextResponse.json({ url: listenUrl })
    }

    return NextResponse.json({ error: 'Could not resolve stream' }, { status: 404 })
  } catch (err) {
    console.error('[radio/stream]', err)
    return NextResponse.json({ error: 'Stream resolution failed' }, { status: 500 })
  }
}
