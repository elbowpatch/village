import { NextRequest, NextResponse } from 'next/server'

// Uses the famelack/famelack-data dataset — pre-validated, CORS-checked JSON
// Source: https://github.com/famelack/famelack-data (MIT License)
// Base URL pattern: tv/raw/countries/{cc}.json  |  tv/raw/categories/{cat}.json

const FAMELACK_BASE = 'https://raw.githubusercontent.com/famelack/famelack-data/main/tv/raw'

// Fallback mirrors so a single CDN hiccup doesn't break the app
const mirrors = (path: string) => [
  `${FAMELACK_BASE}/${path}`,
  `https://cdn.jsdelivr.net/gh/famelack/famelack-data@main/tv/raw/${path}`,
]

// ISO 3166-1 alpha-2 codes supported by the dataset (lowercase filenames)
const SUPPORTED_COUNTRIES = new Set([
  'ke','ng','za','gh','et','tz','ug',
  'us','gb','fr','de','in','br','jp','au',
  'ca','es','it','mx','ru','cn','kr','id',
  'eg','ma','tn','dz','sn','ci','cm',
])

// Category slugs supported in the dataset
const SUPPORTED_CATEGORIES = new Set([
  'news','sports','entertainment','music',
  'kids','documentary','business','religious','general',
])

interface FamelackChannel {
  id?: string
  name: string
  url: string
  logo?: string
  country?: string
  languages?: string[]
  categories?: string[]
  is_nsfw?: boolean
  [key: string]: unknown
}

function normalise(ch: FamelackChannel) {
  return {
    name: ch.name || '',
    url: ch.url || '',
    logo: ch.logo || '',
    group: ch.categories?.[0] || '',
    country: ch.country || '',
    languages: ch.languages || [],
    categories: ch.categories || [],
    tvgId: ch.id || ch.name || '',
  }
}

async function fetchJSON(urls: string[]): Promise<FamelackChannel[] | null> {
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'VillageApp/1.0' },
        next: { revalidate: 3600 },
      })
      if (!res.ok) continue
      const data = await res.json()
      if (Array.isArray(data)) return data as FamelackChannel[]
      if (Array.isArray(data?.channels)) return data.channels as FamelackChannel[]
    } catch { /* try next mirror */ }
  }
  return null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const countryRaw = (searchParams.get('country') || 'KE').toUpperCase()
  const country = countryRaw.toLowerCase()
  const category = (searchParams.get('category') || '').toLowerCase()

  try {
    let channels: FamelackChannel[] = []

    if (category && SUPPORTED_CATEGORIES.has(category)) {
      // 1. Try category file first
      const catData = await fetchJSON(mirrors(`categories/${category}.json`))
      if (catData) {
        channels = catData
        // Filter by country if specified
        if (country && SUPPORTED_COUNTRIES.has(country)) {
          const filtered = channels.filter(
            ch => (ch.country || '').toLowerCase() === country
          )
          if (filtered.length > 0) channels = filtered
        }
      }

      // 2. Fall back to country file filtered by category
      if (channels.length === 0 && SUPPORTED_COUNTRIES.has(country)) {
        const countryData = await fetchJSON(mirrors(`countries/${country}.json`))
        if (countryData) {
          channels = countryData.filter(ch =>
            (ch.categories || []).some(c => c.toLowerCase() === category)
          )
          if (channels.length === 0) channels = countryData
        }
      }
    } else {
      // Country-first fetch
      const cc = SUPPORTED_COUNTRIES.has(country) ? country : 'ke'
      const data = await fetchJSON(mirrors(`countries/${cc}.json`))
      if (data) channels = data
    }

    // Filter out NSFW and channels without a valid stream URL
    channels = channels.filter(ch => !ch.is_nsfw && ch.url?.startsWith('http'))

    // Deduplicate by name (case-insensitive)
    const seen = new Set<string>()
    channels = channels.filter(ch => {
      const key = (ch.name || '').toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return NextResponse.json({
      channels: channels.slice(0, 80).map(normalise),
      total: channels.length,
      country: countryRaw,
      category,
      source: 'famelack-data',
    })
  } catch (err) {
    console.error('[tv/route] error:', err)
    return NextResponse.json(
      { error: 'Failed to load channels', channels: [], source: 'famelack-data' },
      { status: 500 }
    )
  }
}
