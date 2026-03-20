import { NextRequest, NextResponse } from 'next/server'
import { getAllArticles } from '@/lib/newsData'
import { prisma } from '@/lib/db'
import { Article } from '@/types'

function dbToArticle(a: {
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

function matchesFilters(a: Article, query: string, region: string, category: string): boolean {
  if (region !== 'All' && a.region !== region) return false
  if (category !== 'All' && a.category !== category) return false
  if (query) {
    const q = query.toLowerCase()
    return (
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.tags.some((t: string) => t.toLowerCase().includes(q)) ||
      a.country.toLowerCase().includes(q) ||
      a.sourceName.toLowerCase().includes(q)
    )
  }
  return true
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') ?? ''
  const region = searchParams.get('region') ?? 'All'
  const category = searchParams.get('category') ?? 'All'
  const type = searchParams.get('type')

  // Fetch live articles from DB (most recent 100)
  const dbRows = await prisma.fetchedArticle.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 100,
  })
  const liveArticles = dbRows.map(dbToArticle)

  // Static curated articles as fallback / supplement
  const staticArticles = getAllArticles()

  // Live articles first, then static (live IDs won't conflict since prefixed with 'live-')
  const all = [...liveArticles, ...staticArticles]

  if (type === 'trending') {
    return NextResponse.json(all.filter(a => a.trending).slice(0, 12))
  }

  if (type === 'featured') {
    return NextResponse.json(all.filter(a => a.featured).slice(0, 6))
  }

  const filtered = all.filter(a => matchesFilters(a, query, region, category))
  return NextResponse.json(filtered)
}
