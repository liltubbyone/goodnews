import { Metadata } from 'next'
import { getTrendingArticles, getAllArticles } from '@/lib/newsData'
import { ArticleCard } from '@/components/ArticleCard'
import { TrendingUp, Flame } from 'lucide-react'

export const metadata: Metadata = { title: 'Trending Good News' }

export default function TrendingPage() {
  const trending = getTrendingArticles()
  const allArticles = getAllArticles()
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
