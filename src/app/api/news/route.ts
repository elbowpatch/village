import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Primary: Google News RSS — real-time, free, no key needed
// Fallback: Newsdata.io
const NEWSDATA_KEY = 'pub_18acd4915c114d97b073acbb1170fb83'
const NEWSDATA_BASE = 'https://newsdata.io/api/1/news'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const CATEGORY_MAP: Record<string, string> = {
  Technology: 'technology',
  Business: 'business',
  Sports: 'sports',
  Entertainment: 'entertainment',
  Politics: 'politics',
  Art: 'art',
  Science: 'science',
  Health: 'health',
}

// Google News RSS curated topic IDs (stable, category-level feeds)
const GOOGLE_TOPIC_MAP: Record<string, string | null> = {
  Technology: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB',
  Business:   'CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB',
  Sports:     'CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB',
  Entertainment: 'CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtVnVHZ0pWVXlnQVAB',
  Science:    'CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVHZ0pWVXlnQVAB',
  Health:     'CAAqIQgKIhtDQkFTRGdvSUwyMHZNR3QwTlRFU0FtVnVJQUFQAQ',
  Politics:   null,
  Art:        null,
}

const CATEGORY_ICONS: Record<string, string> = {
  Technology: 'zap',
  Business: 'briefcase',
  Sports: 'trophy',
  Entertainment: 'tv',
  Politics: 'globe',
  Art: 'palette',
  Science: 'rocket',
  Health: 'heart',
}

interface NewsdataArticle {
  article_id: string
  title: string
  description: string | null
  content: string | null
  link: string
  image_url: string | null
  pubDate: string
  source_id: string
  category: string[]
  country: string[]
  language: string
}

// ── Google News RSS (primary, real-time) ─────────────────────────────────────
async function fetchFromGoogleRSS(category: string): Promise<any[]> {
  const topicId = GOOGLE_TOPIC_MAP[category]
  const rssUrl = topicId
    ? `https://news.google.com/rss/topics/${topicId}?hl=en-US&gl=US&ceid=US:en`
    : `https://news.google.com/rss/search?q=${encodeURIComponent(CATEGORY_MAP[category] || category)}&hl=en-US&gl=US&ceid=US:en`

  const res = await fetch(rssUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
    next: { revalidate: 1800 },
  })
  if (!res.ok) throw new Error(`Google RSS error: ${res.status}`)
  const text = await res.text()

  const items: any[] = []
  const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/g)
  for (const match of itemMatches) {
    const item = match[1]
    const title = (
      item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
      item.match(/<title>(.*?)<\/title>/)?.[1] || ''
    ).replace(/ - [^-]+$/, '').trim()
    const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
    const source = item.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || 'Google News'
    const description = (
      item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
      item.match(/<description>(.*?)<\/description>/)?.[1] || ''
    ).replace(/<[^>]+>/g, '').substring(0, 300)
    const image = item.match(/<media:content[^>]+url="([^"]+)"/)?.[1] || null

    if (title && link) {
      items.push({ title, description, url: link, image, publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(), source: { name: source } })
    }
    if (items.length >= 7) break
  }
  return items
}

// ── Newsdata.io (fallback) ────────────────────────────────────────────────────
async function fetchFromNewsdata(category: string, country?: string): Promise<NewsdataArticle[]> {
  const ndCategory = CATEGORY_MAP[category] || 'top'
  const countryParam = country ? `&country=${country}` : ''
  const url = `${NEWSDATA_BASE}?apikey=${NEWSDATA_KEY}&category=${ndCategory}&language=en${countryParam}&size=5`
  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Newsdata error: ${res.status}`)
  const data = await res.json()
  if (data.status !== 'success') throw new Error(data.message || 'Newsdata error')
  return data.results || []
}

// ── Kenya/Africa supplement ───────────────────────────────────────────────────
async function fetchAfricaNews(category: string): Promise<any[]> {
  const query = `${CATEGORY_MAP[category] || category} Kenya Africa`
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-KE&gl=KE&ceid=KE:en`
  try {
    const res = await fetch(rssUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 1800 } })
    if (!res.ok) return []
    const text = await res.text()
    const items: any[] = []
    const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/g)
    for (const match of itemMatches) {
      const item = match[1]
      const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || '').replace(/ - [^-]+$/, '').trim()
      const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
      const source = item.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || 'Google News'
      const description = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || '').replace(/<[^>]+>/g, '').substring(0, 300)
      if (title && link) items.push({ title, description, url: link, image: null, publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(), source: { name: source } })
      if (items.length >= 3) break
    }
    return items
  } catch { return [] }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const refresh = searchParams.get('refresh') === 'true'
    const searchQuery = searchParams.get('q') || ''
    const categoryFilter = searchParams.get('category') || 'All'

    if (searchQuery && !refresh) {
      const supabase = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data } = await supabase.from('news_articles').select('*').or(`title.ilike.%${searchQuery}%,preview.ilike.%${searchQuery}%`).order('published_at', { ascending: false }).limit(20)
      return NextResponse.json({ articles: data || [], source: 'cache' })
    }

    // Serve from DB cache if fresh (< 30 min)
    if (!refresh) {
      const supabase = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      let query = supabase.from('news_articles').select('*').order('published_at', { ascending: false })
      if (categoryFilter !== 'All') query = query.eq('category', categoryFilter)
      const { data } = await query.limit(30)
      if (data && data.length > 0) {
        const newest = new Date(data[0].published_at)
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000)
        if (newest > thirtyMinAgo) return NextResponse.json({ articles: data, source: 'cache' })
      }
    }

    if (!SUPABASE_SERVICE_KEY) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 500 })

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const categories = Object.keys(CATEGORY_MAP)
    const allArticles: any[] = []

    for (const category of categories) {
      try {
        let articles: any[] = []

        // Primary: Google News RSS
        try {
          articles = await fetchFromGoogleRSS(category)
        } catch (googleErr) {
          console.warn(`Google RSS failed for ${category}, falling back to Newsdata:`, googleErr)
          try {
            const ndArticles = await fetchFromNewsdata(category)
            articles = ndArticles.map(a => ({ title: (a.title || '').substring(0, 200), description: (a.description || a.content || '').replace(/<[^>]+>/g, '').substring(0, 300), url: a.link || '', image: a.image_url || null, publishedAt: a.pubDate || new Date().toISOString(), source: { name: a.source_id || 'Newsdata' } }))
          } catch {}
        }

        // Africa supplement
        const africaArticles = await fetchAfricaNews(category)
        articles = [...articles, ...africaArticles.slice(0, 2)]

        for (const article of articles.slice(0, 7)) {
          allArticles.push({ title: article.title?.substring(0, 200) || 'Untitled', category, source: article.source?.name || 'Unknown', emoji: CATEGORY_ICONS[category] || 'globe', preview: (article.description || '').replace(/<[^>]+>/g, '').substring(0, 300), url: article.url || '', image_url: article.image || null, is_featured: false, published_at: article.publishedAt || new Date().toISOString() })
        }
      } catch (err) {
        console.error(`Error fetching ${category}:`, err)
      }
    }

    if (allArticles.length === 0) return NextResponse.json({ error: 'No articles fetched', articles: [] }, { status: 200 })

    const featuredIdx = allArticles.findIndex(a => a.category === 'Technology')
    if (featuredIdx >= 0) allArticles[featuredIdx].is_featured = true

    const { error } = await supabaseAdmin.from('news_articles').upsert(allArticles, { onConflict: 'url', ignoreDuplicates: false })
    if (error) console.error('Upsert error:', error)

    const { data: fresh } = await supabaseAdmin.from('news_articles').select('*').order('published_at', { ascending: false }).limit(30)
    return NextResponse.json({ articles: fresh || allArticles, source: 'google-news-rss', count: allArticles.length })
  } catch (error: any) {
    console.error('News API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
