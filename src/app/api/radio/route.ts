import { NextRequest, NextResponse } from 'next/server'

// Server-side proxy for the Radio Garden API — bypasses browser CORS restrictions
// Unofficial API: https://radio.garden/api
// OpenAPI spec: https://github.com/jonasrmichel/radio-garden-openapi

const RG_BASE = 'https://radio.garden/api'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; VillageApp/1.0)',
  'Accept': 'application/json',
  'Referer': 'https://radio.garden/',
  'Origin': 'https://radio.garden',
}

async function rgFetch(path: string) {
  const res = await fetch(`${RG_BASE}${path}`, {
    headers: HEADERS,
    next: { revalidate: 1800 }, // 30 min cache
  })
  if (!res.ok) throw new Error(`Radio Garden ${res.status}: ${path}`)
  return res.json()
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'trending'
  const query  = searchParams.get('q') || ''
  const placeId = searchParams.get('placeId') || ''

  try {
    switch (action) {

      // ── Trending: geo-nearest place → its channels ──────────────────────
      case 'trending': {
        // Fetch all places and pick a popular African hub by default
        const places = await rgFetch('/ara/content/places')
        // Default: Nairobi (place id varies; find by title)
        const allPlaces: any[] = places?.data?.list ?? []
        const nairobi = allPlaces.find((p: any) =>
          p.title?.toLowerCase().includes('nairobi')
        ) || allPlaces.find((p: any) =>
          p.country?.toLowerCase().includes('kenya')
        ) || allPlaces[0]

        if (!nairobi) return NextResponse.json({ stations: [] })

        const channelData = await rgFetch(`/ara/content/page/${nairobi.id}/channels`)
        const channels: any[] = channelData?.data?.content?.[0]?.items ?? []
        const stations = channels.slice(0, 30).map(normalise)
        return NextResponse.json({ stations, place: nairobi.title })
      }

      // ── Search: query against Radio Garden search endpoint ──────────────
      case 'search': {
        if (!query) return NextResponse.json({ stations: [] })
        const data = await rgFetch(`/search?q=${encodeURIComponent(query)}`)
        // search returns mixed hits — filter to type: 'channel'
        const hits: any[] = data?.hits?.hits ?? []
        const stations = hits
          .filter((h: any) => h._source?.type === 'channel')
          .slice(0, 30)
          .map((h: any) => normaliseSearchHit(h._source))
        return NextResponse.json({ stations })
      }

      // ── Place channels: all stations for a given placeId ────────────────
      case 'place': {
        if (!placeId) return NextResponse.json({ stations: [] })
        const data = await rgFetch(`/ara/content/page/${placeId}/channels`)
        const channels: any[] = data?.data?.content?.[0]?.items ?? []
        const stations = channels.map(normalise)
        return NextResponse.json({ stations })
      }

      // ── All places list (for country/city picker) ────────────────────────
      case 'places': {
        const data = await rgFetch('/ara/content/places')
        const places: any[] = (data?.data?.list ?? []).map((p: any) => ({
          id: p.id,
          title: p.title,
          country: p.country,
          size: p.size ?? 0,
        }))
        return NextResponse.json({ places })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (err) {
    console.error('[radio/route]', err)
    return NextResponse.json({ error: 'Failed to load radio data', stations: [] }, { status: 500 })
  }
}

// Normalise a Radio Garden channel item → our RadioStation shape
function normalise(ch: any) {
  const channelId: string = ch.href?.split('/').pop() ?? ch.id ?? ''
  return {
    stationuuid: channelId,
    name: ch.title ?? ch.name ?? '',
    // Stream URL goes through our own proxy to avoid another CORS hop
    url: `/api/radio/stream?id=${channelId}`,
    url_resolved: `/api/radio/stream?id=${channelId}`,
    favicon: '', // Radio Garden doesn't supply logos per-channel
    tags: '',
    country: ch.country ?? ch.subtitle ?? '',
    language: '',
    votes: 0,
    codec: 'mp3',
    bitrate: 0,
    // keep the raw RG id so we can resolve stream later
    rgId: channelId,
  }
}

function normaliseSearchHit(src: any) {
  const channelId: string = src.url?.split('/').pop() ?? src.id ?? ''
  return {
    stationuuid: channelId,
    name: src.title ?? '',
    url: `/api/radio/stream?id=${channelId}`,
    url_resolved: `/api/radio/stream?id=${channelId}`,
    favicon: '',
    tags: src.subtitle ?? '',
    country: src.country ?? '',
    language: '',
    votes: 0,
    codec: 'mp3',
    bitrate: 0,
    rgId: channelId,
  }
}
