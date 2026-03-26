import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Article } from '@/types'

export const dynamic = 'force-dynamic'

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
  const idsParam = searchParams.get('ids')

  // Batch lookup by IDs (for saved page)
  const noCache = { headers: { 'Cache-Control': 'no-store' } }

  if (idsParam) {
    const dbIds = idsParam.split(',').map(id => id.trim().replace(/^live-/, '')).filter(Boolean)
    const rows = await prisma.fetchedArticle.findMany({ where: { id: { in: dbIds } } })
    return NextResponse.json(rows.map(dbToArticle), noCache)
  }

  // Fetch top 50 articles from DB ordered by positivity score
  const dbRows = await prisma.fetchedArticle.findMany({
    orderBy: [{ positivityScore: 'desc' }, { publishedAt: 'desc' }],
    take: 50,
  })
  // Deduplicate by title in case the DB has pre-existing duplicates
  const seenTitles = new Set<string>()
  let articles = dbRows.map(dbToArticle).filter(a => {
    const key = a.title.toLowerCase().trim()
    if (seenTitles.has(key)) return false
    seenTitles.add(key)
    return true
  })

  if (type === 'trending') {
    return NextResponse.json(articles.filter(a => a.trending).slice(0, 12), noCache)
  }

  if (type === 'featured') {
    return NextResponse.json(articles.filter(a => a.featured).slice(0, 6), noCache)
  }

  const filtered = articles.filter(a => matchesFilters(a, query, region, category))
  return NextResponse.json(filtered, noCache)
}
