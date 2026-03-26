import { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { Article } from '@/types'
import fs from 'fs'
import path from 'path'
import { ArticleCard } from '@/components/ArticleCard'
import { TrendingUp, Flame } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Trending Good News' }

function dbToArticle(a: any): Article {
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

export default async function TrendingPage() {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const rows = await prisma.fetchedArticle.findMany({
    where: { publishedAt: { gte: threeMonthsAgo } },
    orderBy: { publishedAt: 'desc' },
    take: 100,
  })
  let allArticles = rows.map(dbToArticle)
  if (allArticles.length === 0) {
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const filePath = path.join(process.cwd(), 'public', 'articles.json')
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    allArticles = (raw.results as any[])
      .filter(a => !a.pubDate || new Date(a.pubDate) >= sixMonthsAgo)
      .map((a, i): Article => ({
        id: `live-${a.article_id || i}`,
        title: a.title ?? '', summary: a.description ?? '',
        content: a.content ?? 'Full article available at source',
        sourceUrl: a.link ?? '', sourceName: a.source_name ?? 'News',
        region: a.country?.[0] === 'united states of america' ? 'North America' : 'Global',
        country: a.country?.[0] ?? 'Global', category: a.category?.[0] ?? 'Science',
        tags: a.keywords ?? [], publishedAt: a.pubDate ?? new Date().toISOString(),
        imageUrl: a.image_url || `https://picsum.photos/seed/${a.article_id}/800/450`,
        positivityScore: 75, trending: i < 12, featured: i < 4, readTime: 3,
      }))
  }
  const trending = allArticles.filter(a => a.trending).slice(0, 20)
  const highScore = allArticles
    .filter(a => !a.trending)
    .sort((a, b) => b.positivityScore - a.positivityScore)
    .slice(0, 8)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Trending Good News</h1>
          <p className="text-gray-500 mt-0.5">The stories everyone is reading and sharing right now</p>
        </div>
      </div>

      {/* Trending now */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-5">
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl font-bold text-gray-900">Trending Now</h2>
          <span className="ml-2 text-sm bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full font-semibold">
            {trending.length} stories
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {trending.map((article, i) => (
            <div key={article.id} className="relative">
              {i < 3 && (
                <div className="absolute -top-2 -left-2 z-10 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                  #{i + 1}
                </div>
              )}
              <ArticleCard article={article} size={i === 0 ? 'large' : 'default'} />
            </div>
          ))}
        </div>
      </section>

      {/* Highest positivity scores */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl">✨</span>
          <h2 className="text-xl font-bold text-gray-900">Highest Positivity Scores</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {highScore.map(article => (
            <div key={article.id} className="relative">
              <ArticleCard article={article} />
              <div className="absolute top-3 right-3 bg-brand-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                {article.positivityScore}% positive
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
