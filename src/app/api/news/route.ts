import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Primary: Newsdata.io — real-time news API with African coverage
// Key: pub_18acd4915c114d97b073acbb1170fb83

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
  Art: 'entertainment',
  Science: 'science',
  Health: 'health',
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

async function fetchFromGoogleRSS(category: string): Promise<any[]> {
  const query = CATEGORY_MAP[category] || category.toLowerCase()
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`
  const res = await fetch(rssUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`RSS error: ${res.status}`)
  const text = await res.text()
  const items: any[] = []
  const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/g)
  for (const match of itemMatches) {
    const item = match[1]
    const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || ''
    const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
    const source = item.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || 'Google News'
    const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || item.match(/<description>(.*?)<\/description>/)?.[1] || ''
    if (title && link) items.push({ title: title.replace(/ - .*$/, '').trim(), description: description.replace(/<[^>]+>/g, '').substring(0, 200), url: link, image: null, publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(), source: { name: source, url: '' } })
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

    if (searchQuery && !refresh) {
      const supabase = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data } = await supabase.from('news_articles').select('*').or(`title.ilike.%${searchQuery}%,preview.ilike.%${searchQuery}%`).order('published_at', { ascending: false }).limit(20)
      return NextResponse.json({ articles: data || [], source: 'cache' })
    }

    if (!refresh) {
      const supabase = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      let query = supabase.from('news_articles').select('*').order('published_at', { ascending: false })
      if (categoryFilter !== 'All') query = query.eq('category', categoryFilter)
      const { data } = await query.limit(30)
      if (data && data.length > 0) {
        const newest = new Date(data[0].published_at)
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
        if (newest > hourAgo) return NextResponse.json({ articles: data, source: 'cache' })
      }
    }

    if (!SUPABASE_SERVICE_KEY) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 500 })

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const categories = Object.keys(CATEGORY_MAP)
    const allArticles: any[] = []

    for (const category of categories) {
      try {
        let articles: any[] = []
        try {
          const ndArticles = await fetchFromNewsdata(category)
          articles = ndArticles.map(a => ({ title: (a.title || '').substring(0, 200), description: (a.description || a.content || '').replace(/<[^>]+>/g, '').substring(0, 300), url: a.link || '', image: a.image_url || null, publishedAt: a.pubDate || new Date().toISOString(), source: { name: a.source_id || 'Newsdata', url: '' } }))
        } catch {
          articles = await fetchFromGoogleRSS(category)
        }

        // African region supplement
        try {
          const africaArticles = await fetchFromNewsdata(category, 'ke,ng,za')
          for (const a of africaArticles.slice(0, 2)) {
            articles.push({ title: (a.title || '').substring(0, 200), description: (a.description || a.content || '').replace(/<[^>]+>/g, '').substring(0, 300), url: a.link || '', image: a.image_url || null, publishedAt: a.pubDate || new Date().toISOString(), source: { name: a.source_id || 'Newsdata', url: '' } })
          }
        } catch {}

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
    return NextResponse.json({ articles: fresh || allArticles, source: 'newsdata.io', count: allArticles.length })
  } catch (error: any) {
    console.error('News API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
