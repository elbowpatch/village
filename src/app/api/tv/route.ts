import { NextRequest, NextResponse } from 'next/server'

// iptv-org — world's largest open IPTV collection, 8 000+ free channels globally
// Playlist index: https://iptv-org.github.io/api/channels.json  (channel metadata)
// Streams:        https://iptv-org.github.io/api/streams.json   (stream URLs)
// Guides:         https://iptv-org.github.io/epg/               (EPG)
// License: CC0 (public domain). No auth required.

const IPTV_BASE = 'https://iptv-org.github.io/api'
const IPTV_CDN  = 'https://cdn.jsdelivr.net/gh/iptv-org/api@gh-pages'

// Mirrors for resilience
function mirrors(file: string) {
  return [
    `${IPTV_BASE}/${file}`,
    `${IPTV_CDN}/${file}`,
  ]
}

interface IptvChannel {
  id: string
  name: string
  alt_names?: string[]
  network?: string
  owners?: string[]
  country: string          // ISO 3166-1 alpha-2
  subdivision?: string
  city?: string
  broadcast_area?: string[]
  languages?: string[]
  categories?: string[]
  is_nsfw?: boolean
  launched?: string
  closed?: string
  logo?: string
  website?: string
  is_closed?: boolean
}

interface IptvStream {
  channel: string          // channel id
  url: string
  http_referrer?: string
  user_agent?: string
  status?: string          // 'online' | 'error' | 'timeout' | 'blocked' | 'not_247'
  width?: number
  height?: number
}

async function fetchJSON<T>(urls: string[]): Promise<T | null> {
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'VillageApp/1.0' },
        next: { revalidate: 3600 },
      })
      if (!res.ok) continue
      return await res.json() as T
    } catch { /* try next mirror */ }
  }
  return null
}

function normalise(ch: IptvChannel, stream?: IptvStream) {
  return {
    name: ch.name || '',
    url: stream?.url || '',
    logo: ch.logo || '',
    group: ch.categories?.[0] || 'General',
    country: ch.country || '',
    languages: ch.languages || [],
    categories: ch.categories || [],
    tvgId: ch.id || '',
    website: ch.website || '',
    width: stream?.width,
    height: stream?.height,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const countryRaw = (searchParams.get('country') || 'US').toUpperCase()
  const country    = countryRaw.toLowerCase()
  const category   = (searchParams.get('category') || '').toLowerCase()
  const language   = (searchParams.get('language') || '').toLowerCase()
  const limitParam = Math.min(Number(searchParams.get('limit') || '80'), 200)

  try {
    // Fetch channel metadata and streams in parallel
    const [channels, streams] = await Promise.all([
      fetchJSON<IptvChannel[]>(mirrors('channels.json')),
      fetchJSON<IptvStream[]>(mirrors('streams.json')),
    ])

    if (!channels || !streams) {
      return NextResponse.json(
        { error: 'Failed to load channel data', channels: [], source: 'iptv-org' },
        { status: 502 },
      )
    }

    // Build stream index: channel id → stream
    const streamIndex = new Map<string, IptvStream>()
    for (const s of streams) {
      // Prefer online streams; don't overwrite an online entry with an error one
      if (!streamIndex.has(s.channel) || s.status === 'online') {
        streamIndex.set(s.channel, s)
      }
    }

    // Only keep channels that have a working stream URL
    let filtered = channels.filter(ch => {
      if (ch.is_nsfw) return false
      if (ch.is_closed) return false
      const s = streamIndex.get(ch.id)
      return s && s.url?.startsWith('http')
    })

    // Filter by country
    if (country) {
      const byCountry = filtered.filter(ch => ch.country.toLowerCase() === country)
      if (byCountry.length > 0) filtered = byCountry
    }

    // Filter by category
    if (category) {
      const byCat = filtered.filter(ch =>
        (ch.categories || []).some(c => c.toLowerCase() === category)
      )
      if (byCat.length > 0) filtered = byCat
    }

    // Filter by language
    if (language) {
      const byLang = filtered.filter(ch =>
        (ch.languages || []).some(l => l.toLowerCase() === language)
      )
      if (byLang.length > 0) filtered = byLang
    }

    // Deduplicate by name (case-insensitive)
    const seen = new Set<string>()
    filtered = filtered.filter(ch => {
      const key = ch.name.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Sort: online streams first, then by name
    filtered.sort((a, b) => {
      const sa = streamIndex.get(a.id)
      const sb = streamIndex.get(b.id)
      const aOnline = sa?.status === 'online' ? 0 : 1
      const bOnline = sb?.status === 'online' ? 0 : 1
      if (aOnline !== bOnline) return aOnline - bOnline
      return a.name.localeCompare(b.name)
    })

    const result = filtered.slice(0, limitParam).map(ch =>
      normalise(ch, streamIndex.get(ch.id))
    )

    return NextResponse.json({
      channels: result,
      total: filtered.length,
      country: countryRaw,
      category,
      language,
      source: 'iptv-org',
    })
  } catch (err) {
    console.error('[tv/route] error:', err)
    return NextResponse.json(
      { error: 'Failed to load channels', channels: [], source: 'iptv-org' },
      { status: 500 },
    )
  }
}
