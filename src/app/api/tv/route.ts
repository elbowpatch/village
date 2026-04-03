import { NextRequest, NextResponse } from 'next/server'

// Proxy + parse IPTV-org M3U playlists server-side to avoid CORS
// Sources tried in order until one works

interface TVChannel {
  name: string
  url: string
  logo: string
  group: string
  country: string
  languages: string[]
  categories: string[]
  tvgId: string
}

function parseM3U(text: string): TVChannel[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const channels: TVChannel[] = []
  
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('#EXTINF')) continue
    const info = lines[i]
    const url = lines[i + 1]
    if (!url || url.startsWith('#')) continue

    const nameMatch = info.match(/,(.+)$/)
    const logoMatch = info.match(/tvg-logo="([^"]*)"/)
    const groupMatch = info.match(/group-title="([^"]*)"/)
    const idMatch = info.match(/tvg-id="([^"]*)"/)
    const langMatch = info.match(/tvg-language="([^"]*)"/)
    const countryMatch = info.match(/tvg-country="([^"]*)"/)

    const name = nameMatch?.[1]?.trim() || ''
    if (!name || !url.startsWith('http')) continue

    channels.push({
      name,
      url,
      logo: logoMatch?.[1] || '',
      group: groupMatch?.[1] || '',
      country: countryMatch?.[1] || '',
      languages: langMatch?.[1] ? langMatch[1].split(';').map(l => l.trim()) : [],
      categories: groupMatch?.[1] ? [groupMatch[1].toLowerCase()] : [],
      tvgId: idMatch?.[1] || name,
    })
  }
  return channels
}

const COUNTRY_M3U: Record<string, string[]> = {
  KE: [
    'https://iptv-org.github.io/iptv/countries/ke.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/ke.m3u',
  ],
  NG: [
    'https://iptv-org.github.io/iptv/countries/ng.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/ng.m3u',
  ],
  ZA: [
    'https://iptv-org.github.io/iptv/countries/za.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/za.m3u',
  ],
  GH: [
    'https://iptv-org.github.io/iptv/countries/gh.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/gh.m3u',
  ],
  ET: [
    'https://iptv-org.github.io/iptv/countries/et.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/et.m3u',
  ],
  TZ: [
    'https://iptv-org.github.io/iptv/countries/tz.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/tz.m3u',
  ],
  UG: [
    'https://iptv-org.github.io/iptv/countries/ug.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/ug.m3u',
  ],
  US: [
    'https://iptv-org.github.io/iptv/countries/us.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/us.m3u',
  ],
  GB: [
    'https://iptv-org.github.io/iptv/countries/gb.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/gb.m3u',
  ],
  FR: [
    'https://iptv-org.github.io/iptv/countries/fr.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/fr.m3u',
  ],
  DE: [
    'https://iptv-org.github.io/iptv/countries/de.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/de.m3u',
  ],
  IN: [
    'https://iptv-org.github.io/iptv/countries/in.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/in.m3u',
  ],
  BR: [
    'https://iptv-org.github.io/iptv/countries/br.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/br.m3u',
  ],
  JP: [
    'https://iptv-org.github.io/iptv/countries/jp.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/jp.m3u',
  ],
  AU: [
    'https://iptv-org.github.io/iptv/countries/au.m3u',
    'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/au.m3u',
  ],
}

// Fallback: category-based playlists (no country filter)
const CATEGORY_M3U: Record<string, string> = {
  news: 'https://iptv-org.github.io/iptv/categories/news.m3u',
  sports: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
  entertainment: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u',
  music: 'https://iptv-org.github.io/iptv/categories/music.m3u',
  kids: 'https://iptv-org.github.io/iptv/categories/kids.m3u',
  documentary: 'https://iptv-org.github.io/iptv/categories/documentary.m3u',
  business: 'https://iptv-org.github.io/iptv/categories/business.m3u',
  religious: 'https://iptv-org.github.io/iptv/categories/religious.m3u',
}

async function fetchM3U(urls: string[]): Promise<string | null> {
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'VillageApp/1.0' },
        next: { revalidate: 3600 }, // cache 1 hour
      })
      if (res.ok) {
        const text = await res.text()
        if (text.includes('#EXTINF')) return text
      }
    } catch {}
  }
  return null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const country = (searchParams.get('country') || 'KE').toUpperCase()
  const category = (searchParams.get('category') || '').toLowerCase()

  try {
    let channels: TVChannel[] = []

    if (category && CATEGORY_M3U[category]) {
      // Fetch category playlist, then filter by country if specified
      const text = await fetchM3U([CATEGORY_M3U[category]])
      if (text) {
        channels = parseM3U(text)
        if (country) {
          channels = channels.filter(ch =>
            ch.country.toUpperCase().includes(country) ||
            ch.tvgId.toLowerCase().includes(country.toLowerCase())
          )
        }
      }
      // If country filter gave nothing, try the country playlist filtered by category
      if (channels.length === 0 && COUNTRY_M3U[country]) {
        const text2 = await fetchM3U(COUNTRY_M3U[country])
        if (text2) {
          channels = parseM3U(text2).filter(ch =>
            !category || ch.categories.some(c => c.includes(category)) || ch.group.toLowerCase().includes(category)
          )
        }
      }
    } else {
      // Country playlist
      const urls = COUNTRY_M3U[country] || COUNTRY_M3U['US']
      const text = await fetchM3U(urls)
      if (text) channels = parseM3U(text)
    }

    // Deduplicate by name
    const seen = new Set<string>()
    channels = channels.filter(ch => {
      const key = ch.name.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return NextResponse.json({
      channels: channels.slice(0, 80),
      total: channels.length,
      country,
      category,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load channels', channels: [] }, { status: 500 })
  }
}
