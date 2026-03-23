import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Article } from '@/types'
import { scorePositivity } from '@/lib/positiveFilter'

// GET /api/local?city=St.+Louis&state=Missouri
// Returns positive articles relevant to the user's city and state.
// Searches the DB first, then optionally fetches live from NewsData.io.

function threeMonthsAgo(): Date {
  const d = new Date()
  d.setMonth(d.getMonth() - 3)
  return d
}

function dbRowToArticle(a: {
  id: string; title: string; summary: string; content: string
  sourceUrl: string; sourceName: string; region: string; country: string
  category: string; tags: string; publishedAt: Date; imageUrl: string
  positivityScore: number; trending: boolean; featured: boolean; readTime: number
}): Article {
  return {
    id: `live-${a.id}`,
    title: a.title,
    summary: a.summary,
    content: a.content,
    sourceUrl: a.sourceUrl,
    sourceName: a.sourceName,
    region: a.region,
    country: a.country,
    category: a.category,
    tags: JSON.parse(a.tags || '[]'),
    publishedAt: a.publishedAt.toISOString(),
    imageUrl: a.imageUrl || `https://picsum.photos/seed/${a.id}/800/450`,
    positivityScore: a.positivityScore,
    trending: a.trending,
    featured: a.featured,
    readTime: a.readTime,
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const city = (searchParams.get('city') ?? '').trim()
  const state = (searchParams.get('state') ?? '').trim()

  if (!city && !state) {
    return NextResponse.json([])
  }

  const cutoff = threeMonthsAgo()

  // Build OR conditions to search city/state mentions in text fields
  const terms = [city, state].filter(Boolean)
  const orConditions = terms.flatMap(term => [
    { title:     { contains: term, mode: 'insensitive' as const } },
    { summary:   { contains: term, mode: 'insensitive' as const } },
    { country:   { contains: term, mode: 'insensitive' as const } },
    { sourceName:{ contains: term, mode: 'insensitive' as const } },
  ])

  const dbRows = await prisma.fetchedArticle.findMany({
    where: {
      publishedAt: { gte: cutoff },
      OR: orConditions,
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  })

  const dbArticles: Article[] = dbRows.map(dbRowToArticle)

  // If we have an API key, fetch live local news from NewsData.io
  const liveArticles: Article[] = []
  const apiKey = process.env.NEWSDATA_API_KEY

  if (apiKey && city) {
    try {
      const query = [city, state].filter(Boolean).join(' ')
      const url = new URL('https://newsdata.io/api/1/news')
      url.searchParams.set('apikey', apiKey)
      url.searchParams.set('language', 'en')
      url.searchParams.set('q', query)

      const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
      if (res.ok) {
        const data = await res.json()
        if (data.status === 'success' && Array.isArray(data.results)) {
          for (const a of data.results.slice(0, 15)) {
            if (!a.title || !a.link) continue

            // 3-month filter
            if (a.pubDate) {
              const pub = new Date(a.pubDate)
              if (!isNaN(pub.getTime()) && pub < cutoff) continue
            }

            const summary = a.description || a.title
            const score = scorePositivity(a.title, summary)
            if (score < 50) continue

            liveArticles.push({
              id: `local-${a.article_id || Math.random()}`,
              title: a.title,
              summary,
              content: a.content || 'Full article available at source.',
              sourceUrl: a.link,
              sourceName: a.source_name || 'Local News',
              region: 'North America',
              country: state || city,
              category: 'Community',
              tags: a.keywords || [city.toLowerCase(), state.toLowerCase()].filter(Boolean),
              publishedAt: a.pubDate || new Date().toISOString(),
              imageUrl: a.image_url || `https://picsum.photos/seed/${a.article_id}/800/450`,
              positivityScore: score,
              trending: false,
              featured: false,
              readTime: 3,
            })
          }
        }
      }
    } catch (err) {
      console.error('[GoodNews] Local news fetch error:', err)
    }
  }

  // Merge live first, then DB results; deduplicate by sourceUrl
  const seen = new Set<string>()
  const merged: Article[] = []
  for (const a of [...liveArticles, ...dbArticles]) {
    if (!seen.has(a.sourceUrl)) {
      seen.add(a.sourceUrl)
      merged.push(a)
    }
  }

  return NextResponse.json(merged.slice(0, 20))
}
