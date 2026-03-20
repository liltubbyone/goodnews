'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { ArticleCard } from '@/components/ArticleCard'
import { getArticlesByRegion } from '@/lib/newsData'
import { REGIONS, REGION_COLORS } from '@/types'

const REGION_EMOJIS: Record<string, string> = {
  'Global': '🌍',
  'North America': '🌎',
  'Europe': '🇪🇺',
  'Asia': '🌏',
  'Africa': '🌍',
  'Latin America': '🌎',
  'Middle East': '🕌',
  'Oceania': '🦘',
}

export default function RegionalPage() {
  const [selectedRegion, setSelectedRegion] = useState<string>('All')

  const articles = selectedRegion === 'All'
    ? REGIONS.flatMap(r => getArticlesByRegion(r)).filter((a, i, arr) => arr.findIndex(x => x.id === a.id) === i)
    : getArticlesByRegion(selectedRegion)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <MapPin className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Regional News</h1>
          <p className="text-gray-500 mt-0.5">Explore positive stories from every corner of the world</p>
        </div>
      </div>

      {/* Region selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-2 mb-8">
        <button
          onClick={() => setSelectedRegion('All')}
          className={`flex flex-col items-center gap-1 py-4 px-2 rounded-xl border-2 transition-all text-center ${
            selectedRegion === 'All'
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span className="text-2xl">🌐</span>
          <span className="text-xs font-semibold">All</span>
        </button>

        {REGIONS.map(region => (
          <button
            key={region}
            onClick={() => setSelectedRegion(region)}
            className={`flex flex-col items-center gap-1 py-4 px-2 rounded-xl border-2 transition-all text-center ${
              selectedRegion === region
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className="text-2xl">{REGION_EMOJIS[region] ?? '🌍'}</span>
            <span className="text-xs font-semibold leading-tight">{region}</span>
            <span className="text-xs text-gray-400">{getArticlesByRegion(region).length}</span>
          </button>
        ))}
      </div>

      {/* Region header */}
      {selectedRegion !== 'All' && (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-6 text-sm font-semibold ${REGION_COLORS[selectedRegion] ?? 'bg-gray-100 text-gray-700'}`}>
          <span>{REGION_EMOJIS[selectedRegion]}</span>
          {selectedRegion} — {articles.length} {articles.length === 1 ? 'story' : 'stories'}
        </div>
      )}

      {/* Articles */}
      {articles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No stories for this region yet</p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}
