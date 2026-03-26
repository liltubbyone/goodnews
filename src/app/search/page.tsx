'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { ArticleCard } from '@/components/ArticleCard'
import { Article, REGIONS, CATEGORIES } from '@/types'

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [region, setRegion] = useState(searchParams.get('region') ?? 'All')
  const [category, setCategory] = useState(searchParams.get('category') ?? 'All')
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [results, setResults] = useState<Article[]>([])

  useEffect(() => {
    if (session) {
      fetch('/api/saved').then(r => r.json()).then(ids => setSavedIds(Array.isArray(ids) ? ids : [])).catch(() => {})
    }
  }, [session])

  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (region !== 'All') params.set('region', region)
    if (category !== 'All') params.set('category', category)
    fetch(`/api/news?${params.toString()}`)
      .then(r => r.json())
      .then(setResults)
      .catch(() => {})
  }, [query, region, category])

  const updateUrl = useCallback((q: string, r: string, c: string) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (r !== 'All') params.set('region', r)
    if (c !== 'All') params.set('category', c)
    router.replace(`/search?${params.toString()}`, { scroll: false })
  }, [router])

  const handleQueryChange = (val: string) => {
    setQuery(val)
    updateUrl(val, region, category)
  }

  const handleRegionChange = (val: string) => {
    setRegion(val)
    updateUrl(query, val, category)
  }

  const handleCategoryChange = (val: string) => {
    setCategory(val)
    updateUrl(query, region, val)
  }

  const clearAll = () => {
    setQuery('')
    setRegion('All')
    setCategory('All')
    router.replace('/search')
  }

  const handleToggleSave = async (articleId: string) => {
    if (!session) return
    const isSaved = savedIds.includes(articleId)
    await fetch('/api/saved', {
      method: isSaved ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId }),
    })
    setSavedIds(prev => isSaved ? prev.filter(id => id !== articleId) : [...prev, articleId])
  }

  const hasFilters = query || region !== 'All' || category !== 'All'

  return (
    <div>
      {/* Search input */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Search for stories, topics, countries..."
            className="input pl-12 h-12 text-base"
            autoFocus
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 h-12 rounded-lg border font-medium text-sm transition-colors ${
            showFilters || region !== 'All' || category !== 'All'
              ? 'bg-brand-50 border-brand-300 text-brand-700'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {(region !== 'All' || category !== 'All') && (
            <span className="bg-brand-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {(region !== 'All' ? 1 : 0) + (category !== 'All' ? 1 : 0)}
            </span>
          )}
        </button>
        {hasFilters && (
          <button onClick={clearAll} className="flex items-center gap-1.5 px-4 h-12 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 text-sm transition-colors">
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="mb-6 p-5 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Region</label>
            <div className="flex flex-wrap gap-2">
              {['All', ...REGIONS].map(r => (
                <button
                  key={r}
                  onClick={() => handleRegionChange(r)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                    region === r ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {['All', ...CATEGORIES].map(c => (
                <button
                  key={c}
                  onClick={() => handleCategoryChange(c)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                    category === c ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results count + active filters */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          {hasFilters
            ? `${results.length} ${results.length === 1 ? 'result' : 'results'} found`
            : `${results.length} stories available`}
        </p>
        {hasFilters && (
          <div className="flex gap-2 flex-wrap">
            {query && (
              <span className="text-xs bg-brand-100 text-brand-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                &ldquo;{query}&rdquo;
                <button onClick={() => handleQueryChange('')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {region !== 'All' && (
              <span className="text-xs bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                {region}
                <button onClick={() => handleRegionChange('All')}><X className="w-3 h-3" /></button>
              </span>
            )}
            {category !== 'All' && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                {category}
                <button onClick={() => handleCategoryChange('All')}><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="text-center py-20">
          <Search className="w-12 h-12 mx-auto mb-4 text-gray-200" />
          <p className="text-lg font-semibold text-gray-700">No stories found</p>
          <p className="text-gray-400 mt-1">Try different keywords or clear your filters</p>
          <button onClick={clearAll} className="mt-4 btn-secondary text-sm">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {results.map(article => (
            <ArticleCard
              key={article.id}
              article={article}
              savedIds={savedIds}
              onToggleSave={session ? handleToggleSave : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Search Stories</h1>
      <Suspense fallback={
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
        </div>
      }>
        <SearchContent />
      </Suspense>
    </div>
  )
}
