import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Article } from '@/types'
import articlesJson from '../../../../public/articles.json'

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
  if (idsParam) {
    const dbIds = idsParam.split(',').map(id => id.trim().replace(/^live-/, '')).filter(Boolean)
    const rows = await prisma.fetchedArticle.findMany({ where: { id: { in: dbIds } } })
    return NextResponse.json(rows.map(dbToArticle))
  }

  // Only return articles published in the last 3 months
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  // Fetch live articles from DB (most recent 100, within 3-month window)
  const dbRows = await prisma.fetchedArticle.findMany({
    where: { publishedAt: { gte: threeMonthsAgo } },
    orderBy: { publishedAt: 'desc' },
    take: 100,
  })
  let articles = dbRows.map(dbToArticle)

  // Fall back to articles.json when DB is empty (e.g. before first cron run)
  if (articles.length === 0) {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    articles = (articlesJson.results as any[])
      .filter(a => !a.pubDate || new Date(a.pubDate) >= sixMonthsAgo)
      .map((a, i): Article => ({
        id: `live-${a.article_id || i}`,
        title: a.title ?? '',
        summary: a.description ?? '',
        content: a.content ?? 'Full article available at source',
        sourceUrl: a.link ?? '',
        sourceName: a.source_name ?? 'News',
        region: a.country?.[0] === 'united states of america' ? 'North America' : 'Global',
        country: a.country?.[0] ?? 'Global',
        category: a.category?.[0] ?? 'Science',
        tags: a.keywords ?? [],
        publishedAt: a.pubDate ?? new Date().toISOString(),
        imageUrl: a.image_url || `https://picsum.photos/seed/${a.article_id}/800/450`,
        positivityScore: 75,
        trending: i < 12,
        featured: i < 4,
        readTime: 3,
      }))
  }

  if (type === 'trending') {
    return NextResponse.json(articles.filter(a => a.trending).slice(0, 12))
  }

  if (type === 'featured') {
    return NextResponse.json(articles.filter(a => a.featured).slice(0, 6))
  }

  const filtered = articles.filter(a => matchesFilters(a, query, region, category))
  return NextResponse.json(filtered)
}
