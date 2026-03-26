import { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { Article } from '@/types'
import { ArticleHeroImage } from '@/components/ArticleHeroImage'
import { extractKeyPoints } from '@/lib/articleUtils'
import { Globe, Star, CheckCircle2, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { CATEGORY_COLORS, REGION_COLORS } from '@/types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Global Highlights' }

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

export default async function HighlightsPage() {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  const rows = await prisma.fetchedArticle.findMany({
    where: { publishedAt: { gte: threeMonthsAgo } },
    orderBy: [{ positivityScore: 'desc' }, { publishedAt: 'desc' }],
    take: 100,
  })
  let allArticles = rows.map(dbToArticle)
  const featured = allArticles.filter(a => a.featured).slice(0, 4)
  const topStory = featured[0]
  const restFeatured = featured.slice(1)
  const moreStories = allArticles.filter(a => !a.featured).sort((a, b) => b.positivityScore - a.positivityScore).slice(0, 20)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
          <Globe className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Global Highlights</h1>
          <p className="text-gray-500 mt-0.5">The most impactful positive stories from around the world</p>
        </div>
      </div>

      {/* Top story */}
      {topStory && (() => {
        const keyPoints = extractKeyPoints(topStory.title, topStory.summary, topStory.content)
        return (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
            {/* Hero image */}
            <Link href={`/article/${topStory.id}`} className="group block relative h-72 sm:h-96">
              <ArticleHeroImage
                src={topStory.imageUrl}
                alt={topStory.title}
                category={topStory.category}
                tags={topStory.tags}
                title={topStory.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute top-5 left-5">
                <span className="flex items-center gap-1.5 bg-brand-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow whitespace-nowrap">
                  <Star className="w-3 h-3 fill-white flex-shrink-0" /> Editor&apos;s Top Pick
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[topStory.category] ?? ''}`}>{topStory.category}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${REGION_COLORS[topStory.region] ?? ''}`}>{topStory.region}</span>
                </div>
                <h2 className="text-white text-2xl md:text-3xl font-bold max-w-3xl group-hover:text-brand-200 transition-colors">{topStory.title}</h2>
              </div>
            </Link>

            {/* Summary + key insights panel */}
            <div className="bg-white p-6 grid md:grid-cols-2 gap-6">
              {/* Summary */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Summary</p>
                <p className="text-gray-700 leading-relaxed line-clamp-3">{topStory.summary}</p>
                <div className="mt-4 text-xs text-gray-400">
                  {topStory.sourceName} · {formatDistanceToNow(new Date(topStory.publishedAt), { addSuffix: true })}
                </div>
                <Link
                  href={`/article/${topStory.id}`}
                  className="inline-block mt-4 text-sm font-semibold text-brand-600 hover:text-brand-800"
                >
                  Read full story →
                </Link>
              </div>

              {/* Key insights */}
              {keyPoints.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-brand-100 rounded-lg flex items-center justify-center">
                      <Lightbulb className="w-3.5 h-3.5 text-brand-600" />
                    </div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Key Insights</p>
                  </div>
                  <ul className="space-y-2.5">
                    {keyPoints.map((point, i) => (
                      <li key={i} className="flex gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm leading-relaxed">{point}.</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Featured grid */}
      {restFeatured.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" /> Featured Stories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {restFeatured.map(article => (
                <div key={article.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                  {/* Image */}
                  <Link href={`/article/${article.id}`} className="group relative h-44 block flex-shrink-0">
                    <ArticleHeroImage
                      src={article.imageUrl}
                      alt={article.title}
                      category={article.category}
                      tags={article.tags}
                      title={article.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex gap-1.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[article.category] ?? ''}`}>{article.category}</span>
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <Link href={`/article/${article.id}`} className="group">
                      <h3 className="font-bold text-gray-900 leading-snug mb-2 group-hover:text-brand-700 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                    </Link>

                    {/* Summary */}
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-3">{article.summary}</p>

                    <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-400">{article.sourceName} · {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
                      <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full whitespace-nowrap">{article.positivityScore}% ✦</span>
                    </div>
                  </div>
                </div>
          ))}
          </div>
        </section>
      )}

      {/* More stories */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">More Great Stories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {moreStories.map(article => (
              <div key={article.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                {/* Image */}
                <Link href={`/article/${article.id}`} className="group relative h-40 block flex-shrink-0">
                  <ArticleHeroImage
                    src={article.imageUrl}
                    alt={article.title}
                    category={article.category}
                    tags={article.tags}
                    title={article.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex gap-1.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[article.category] ?? ''}`}>{article.category}</span>
                  </div>
                </Link>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <Link href={`/article/${article.id}`} className="group">
                    <h3 className="font-bold text-gray-900 leading-snug mb-2 group-hover:text-brand-700 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                  </Link>

                  {/* Summary */}
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-3">{article.summary}</p>

                  <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-gray-400">{article.sourceName} · {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}</span>
                    <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full whitespace-nowrap">{article.positivityScore}% ✦</span>
                  </div>
                </div>
              </div>
          ))}
        </div>
      </section>
    </div>
  )
}
