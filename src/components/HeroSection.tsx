import Link from 'next/link'
import Image from 'next/image'
import { TrendingUp, ArrowRight, Globe } from 'lucide-react'
import { Article, CATEGORY_COLORS, REGION_COLORS } from '@/types'
import { formatDistanceToNow } from 'date-fns'

interface HeroSectionProps {
  featuredArticle: Article
  sideArticles: Article[]
}

export function HeroSection({ featuredArticle, sideArticles }: HeroSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main hero card */}
        <Link href={`/article/${featuredArticle.id}`} className="lg:col-span-2 group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 block min-h-[420px]">
          <Image
            src={featuredArticle.imageUrl}
            alt={featuredArticle.title}
            fill
            priority
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 1024px) 100vw, 66vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          <div className="absolute top-4 left-4 flex gap-2">
            <span className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-brand-500 text-white shadow">
              <Globe className="w-3 h-3" /> Featured
            </span>
            {featuredArticle.trending && (
              <span className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-orange-500 text-white shadow">
                <TrendingUp className="w-3 h-3" /> Trending
              </span>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex gap-2 mb-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[featuredArticle.category] ?? 'bg-gray-100 text-gray-700'}`}>
                {featuredArticle.category}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${REGION_COLORS[featuredArticle.region] ?? 'bg-gray-100 text-gray-700'}`}>
                {featuredArticle.region}
              </span>
            </div>
            <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight mb-3 group-hover:text-brand-200 transition-colors text-balance">
              {featuredArticle.title}
            </h1>
            <p className="text-gray-200 text-sm line-clamp-2 leading-relaxed">{featuredArticle.summary}</p>
            <div className="flex items-center gap-3 mt-4 text-gray-300 text-xs">
              <span className="font-medium text-white">{featuredArticle.sourceName}</span>
              <span>·</span>
              <span>{formatDistanceToNow(new Date(featuredArticle.publishedAt), { addSuffix: true })}</span>
              <span className="flex items-center gap-1 ml-auto text-brand-300 font-semibold">
                Read story <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </Link>

        {/* Side articles */}
        <div className="flex flex-col gap-4">
          {sideArticles.slice(0, 3).map(article => (
            <Link
              key={article.id}
              href={`/article/${article.id}`}
              className="group flex gap-3 bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="relative w-24 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="96px"
                />
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${CATEGORY_COLORS[article.category] ?? 'bg-gray-100 text-gray-700'}`}>
                  {article.category}
                </span>
                <h3 className="text-sm font-semibold text-gray-900 mt-1 line-clamp-2 group-hover:text-brand-700 transition-colors leading-snug">
                  {article.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {article.sourceName} · {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
