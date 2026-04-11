import { NextRequest, NextResponse } from 'next/server'

// Radio Browser API — community-driven, open-source, 30 000+ stations worldwide
// Docs: https://api.radio-browser.info/
// No auth required. Uses round-robin DNS to pick a healthy server.

const RB_BASE = 'https://de1.api.radio-browser.info/json'

const HEADERS = {
  'User-Agent': 'VillageApp/1.0 (https://village.app)',
  'Accept': 'application/json',
}

async function rbFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${RB_BASE}${path}`, {
    ...init,
    headers: { ...HEADERS, ...(init?.headers || {}) },
    next: { revalidate: 1800 },
  })
  if (!res.ok) throw new Error(`RadioBrowser ${res.status}: ${path}`)
  return res.json()
}

function normalise(s: any) {
  return {
    stationuuid: s.stationuuid ?? s.id ?? '',
    name: s.name ?? '',
    url: s.url_resolved || s.url || '',
    url_resolved: s.url_resolved || s.url || '',
    favicon: s.favicon ?? '',
    tags: s.tags ?? '',
    country: s.country ?? '',
    countrycode: s.countrycode ?? '',
    language: s.language ?? '',
    votes: s.votes ?? 0,
    codec: s.codec ?? '',
    bitrate: s.bitrate ?? 0,
    clickcount: s.clickcount ?? 0,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'trending'
  const query  = searchParams.get('q') || ''
  const country = searchParams.get('country') || ''
  const tag    = searchParams.get('tag') || ''
  const limit  = Math.min(Number(searchParams.get('limit') || '40'), 100)

  try {
    switch (action) {

      // ── Trending: top stations by click count globally ───────────────────
      case 'trending': {
        const params = new URLSearchParams({
          limit: String(limit),
          order: 'clickcount',
          reverse: 'true',
          hidebroken: 'true',
        })
        if (country) params.set('countrycode', country.toUpperCase())
        const data = await rbFetch(`/stations/search?${params}`)
        return NextResponse.json({ stations: (data as any[]).map(normalise) })
      }

      // ── Top voted stations (most community-endorsed) ─────────────────────
      case 'topvoted': {
        const params = new URLSearchParams({
          limit: String(limit),
          order: 'votes',
          reverse: 'true',
          hidebroken: 'true',
        })
        if (country) params.set('countrycode', country.toUpperCase())
        const data = await rbFetch(`/stations/search?${params}`)
        return NextResponse.json({ stations: (data as any[]).map(normalise) })
      }

      // ── Search by station name ───────────────────────────────────────────
      case 'search': {
        if (!query) return NextResponse.json({ stations: [] })
        const params = new URLSearchParams({
          name: query,
          limit: String(limit),
          order: 'votes',
          reverse: 'true',
          hidebroken: 'true',
        })
        const data = await rbFetch(`/stations/search?${params}`)
        return NextResponse.json({ stations: (data as any[]).map(normalise) })
      }

      // ── Browse by tag / genre (e.g. jazz, pop, news) ─────────────────────
      case 'bytag': {
        if (!tag) return NextResponse.json({ stations: [] })
        const params = new URLSearchParams({
          tag,
          limit: String(limit),
          order: 'clickcount',
          reverse: 'true',
          hidebroken: 'true',
        })
        const data = await rbFetch(`/stations/search?${params}`)
        return NextResponse.json({ stations: (data as any[]).map(normalise) })
      }

      // ── Browse by country code (ISO 3166-1 alpha-2) ──────────────────────
      case 'bycountry': {
        const cc = (country || 'KE').toUpperCase()
        const params = new URLSearchParams({
          countrycode: cc,
          limit: String(limit),
          order: 'clickcount',
          reverse: 'true',
          hidebroken: 'true',
        })
        const data = await rbFetch(`/stations/search?${params}`)
        return NextResponse.json({ stations: (data as any[]).map(normalise), country: cc })
      }

      // ── List available countries ─────────────────────────────────────────
      case 'countries': {
        const data = await rbFetch('/countries?order=stationcount&reverse=true')
        const countries = (data as any[]).map(c => ({
          name: c.name,
          iso_3166_1: c.iso_3166_1,
          stationcount: c.stationcount,
        }))
        return NextResponse.json({ countries })
      }

      // ── List popular tags / genres ───────────────────────────────────────
      case 'tags': {
        const data = await rbFetch('/tags?order=stationcount&reverse=true&limit=50')
        const tags = (data as any[]).map(t => ({
          name: t.name,
          stationcount: t.stationcount,
        }))
        return NextResponse.json({ tags })
      }

      // ── Record a click (contributes to community stats) ──────────────────
      case 'click': {
        const uuid = searchParams.get('uuid')
        if (!uuid) return NextResponse.json({ ok: false })
        await fetch(`${RB_BASE}/url/${uuid}`, { method: 'GET', headers: HEADERS })
        return NextResponse.json({ ok: true })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (err) {
    console.error('[radio/route]', err)
    return NextResponse.json({ error: 'Failed to load radio data', stations: [] }, { status: 500 })
  }
}
