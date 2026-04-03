import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Uses Google News RSS (no API key needed) + GNews API (free tier) as fallback
// Set GNEWS_API_KEY in env for authenticated requests (100 req/day free)
// https://gnews.io/

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const CATEGORY_QUERIES: Record<string, string> = {
  Technology: 'technology',
  Business: 'business',
  Sports: 'sports',
  Entertainment: 'entertainment',
  Politics: 'politics',
  Art: 'art culture',
  Science: 'science',
  Health: 'health',
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Technology: 'zap',
  Business: 'briefcase',
  Sports: 'trophy',
  Entertainment: 'film',
  Politics: 'globe',
  Art: 'palette',
  Science: 'rocket',
  Health: 'heart',
}

interface GNewsArticle {
  title: string
  description: string
  content: string
  url: string
  image: string | null
  publishedAt: string
  source: { name: string; url: string }
}

async function fetchFromGNews(category: string, apiKey: string, country?: string): Promise<GNewsArticle[]> {
  const query = CATEGORY_QUERIES[category] || category.toLowerCase()
  const lang = 'en'
  const countryParam = country ? `&country=${country}` : ''
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=${lang}${countryParam}&max=5&sortby=publishedAt&apikey=${apiKey}`

  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`GNews error: ${res.status}`)
  const data = await res.json()
  return data.articles || []
}

async function fetchFromGoogleRSS(category: string): Promise<any[]> {
  // Google News RSS - free, no key needed
  const query = CATEGORY_QUERIES[category] || category.toLowerCase()
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`

  const res = await fetch(rssUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    next: { revalidate: 3600 }
  })
  if (!res.ok) throw new Error(`RSS error: ${res.status}`)

  const text = await res.text()
  const items: any[] = []

  // Simple RSS XML parse
  const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/g)
  for (const match of itemMatches) {
    const item = match[1]
    const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
                  item.match(/<title>(.*?)<\/title>/)?.[1] || ''
    const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
    const source = item.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || 'Google News'
    const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
                        item.match(/<description>(.*?)<\/description>/)?.[1] || ''

    if (title && link) {
      items.push({
        title: title.replace(/ - .*$/, '').trim(), // strip " - Source Name" suffix
        description: description.replace(/<[^>]+>/g, '').substring(0, 200),
        url: link,
        image: null,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source: { name: source, url: '' }
      })
    }

    if (items.length >= 5) break
  }

  return items
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const refresh = searchParams.get('refresh') === 'true'
    const searchQuery = searchParams.get('q') || ''
    const categoryFilter = searchParams.get('category') || 'All'

    // For search queries, use Supabase full-text search on existing articles
    if (searchQuery && !refresh) {
      const supabase = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data } = await supabase
        .from('news_articles')
        .select('*')
        .or(`title.ilike.%${searchQuery}%,preview.ilike.%${searchQuery}%`)
        .order('published_at', { ascending: false })
        .limit(20)
      return NextResponse.json({ articles: data || [], source: 'cache' })
    }

    // Return cached articles for normal browsing
    if (!refresh) {
      const supabase = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      let query = supabase.from('news_articles').select('*').order('published_at', { ascending: false })
      if (categoryFilter !== 'All') query = query.eq('category', categoryFilter)
      const { data } = await query.limit(30)

      // If we have articles less than 1 hour old, return them
      if (data && data.length > 0) {
        const newest = new Date(data[0].published_at)
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
        if (newest > hourAgo) {
          return NextResponse.json({ articles: data, source: 'cache' })
        }
      }
    }

    // Fetch fresh articles
    if (!SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 500 })
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const apiKey = process.env.GNEWS_API_KEY || ''
    const categories = Object.keys(CATEGORY_QUERIES)
    const allArticles: any[] = []

    for (const category of categories) {
      try {
        let articles: any[]

        if (apiKey) {
          // Use GNews API if key available
          articles = await fetchFromGNews(category, apiKey)
          // Also try regional if location context provided
          if (process.env.NEWS_COUNTRY_CODE) {
            const regional = await fetchFromGNews(category, apiKey, process.env.NEWS_COUNTRY_CODE)
            articles = [...articles, ...regional.slice(0, 2)]
          }
        } else {
          // Fallback to Google News RSS (free, no key)
          articles = await fetchFromGoogleRSS(category)
        }

        for (const article of articles.slice(0, 5)) {
          allArticles.push({
            title: article.title?.substring(0, 200) || 'Untitled',
            category,
            source: article.source?.name || 'Unknown',
            emoji: CATEGORY_EMOJIS[category] || 'globe',
            preview: (article.description || '').replace(/<[^>]+>/g, '').substring(0, 300),
            url: article.url || '',
            image_url: article.image || null,
            is_featured: false,
            published_at: article.publishedAt || new Date().toISOString(),
          })
        }
      } catch (err) {
        console.error(`Error fetching ${category}:`, err)
      }
    }

    if (allArticles.length === 0) {
      return NextResponse.json({ error: 'No articles fetched', articles: [] }, { status: 200 })
    }

    // Mark first tech article as featured
    const featuredIdx = allArticles.findIndex(a => a.category === 'Technology')
    if (featuredIdx >= 0) allArticles[featuredIdx].is_featured = true

    // Upsert into Supabase (dedupe by URL)
    const { error } = await supabaseAdmin
      .from('news_articles')
      .upsert(allArticles, { onConflict: 'url', ignoreDuplicates: false })

    if (error) console.error('Upsert error:', error)

    // Return fresh data
    const { data: fresh } = await supabaseAdmin
      .from('news_articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(30)

    return NextResponse.json({ articles: fresh || allArticles, source: 'fresh', count: allArticles.length })
  } catch (error: any) {
    console.error('News API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
