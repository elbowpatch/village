import { NextRequest, NextResponse } from 'next/server'

// Radio Browser streams are direct broadcaster URLs — no proxy needed.
// This endpoint is kept for backwards compatibility:
// it accepts a `url` param and echoes it back, optionally following redirects
// to resolve the final playable URL (helps with stations that use meta-redirects).

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  }

  try {
    // Follow redirects server-side to get the final playable URL
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'VillageApp/1.0',
        'Icy-MetaData': '1',
      },
    })

    const finalUrl = res.url || url
    return NextResponse.json({ url: finalUrl })
  } catch {
    // If HEAD fails, return the original URL and let the client try directly
    return NextResponse.json({ url })
  }
}
