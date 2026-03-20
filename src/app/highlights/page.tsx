import { Metadata } from 'next'
import { getFeaturedArticles, getAllArticles } from '@/lib/newsData'
import { ArticleCard } from '@/components/ArticleCard'
import { Globe, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { CATEGORY_COLORS, REGION_COLORS } from '@/types'

export const metadata: Metadata = { title: 'Global Highlights' }

export default function HighlightsPage() {
  const featured = getFeaturedArticles()
  const allArticles = getAllArticles()
  const topStory = featured[0]
  const restFeatured = featured.slice(1)
  const moreStories = allArticles.filter(a => !a.featured).slice(0, 12)

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
      {topStory && (
        <Link href={`/article/${topStory.id}`} className="group block relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow mb-8 min-h-[360px]">
          <Image
            src={topStory.imageUrl}
            alt={topStory.title}
            fill
            priority
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute top-5 left-5">
            <span className="flex items-center gap-1.5 bg-brand-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow">
              <Star className="w-3.5 h-3.5 fill-white" /> Editor&apos;s Top Pick
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="flex gap-2 mb-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[topStory.category] ?? ''}`}>{topStory.category}</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${REGION_COLORS[topStory.region] ?? ''}`}>{topStory.region}</span>
            </div>
            <h2 className="text-white text-2xl md:text-3xl font-bold max-w-3xl group-hover:text-brand-200 transition-colors">{topStory.title}</h2>
            <p className="text-gray-200 mt-2 max-w-2xl text-sm line-clamp-2">{topStory.summary}</p>
            <div className="mt-4 text-xs text-gray-300">
              {topStory.sourceName} · {formatDistanceToNow(new Date(topStory.publishedAt), { addSuffix: true })}
            </div>
          </div>
        </Link>
      )}

      {/* Featured grid */}
      {restFeatured.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" /> Featured Stories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {restFeatured.map(article => (
              <ArticleCard key={article.id} article={article} size="large" />
            ))}
          </div>
        </section>
      )}

      {/* More stories */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">More Great Stories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {moreStories.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>
    </div>
  )
}
