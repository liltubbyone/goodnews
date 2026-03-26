'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Sparkles, Globe, Zap, PenLine } from 'lucide-react'
import { HeroSection } from '@/components/HeroSection'
import { ArticleCard } from '@/components/ArticleCard'
import { FilterBar } from '@/components/FilterBar'
import { Article, CATEGORIES, CATEGORY_COLORS } from '@/types'

const STATS = [
  { label: 'Stories Today', value: '35+' },
  { label: 'Countries Covered', value: '40+' },
  { label: 'Happy Readers', value: '2M+' },
  { label: 'Positivity Score', value: '98%' },
]

export default function HomePage() {
  const { data: session } = useSession()
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [selectedRegion, setSelectedRegion] = useState('All')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([])
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([])
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([])

  const featuredHero = featuredArticles[0]
  const heroSide = featuredArticles.slice(1, 4)

  useEffect(() => {
    fetch('/api/news?type=featured').then(r => r.json()).then(setFeaturedArticles).catch(() => {})
    fetch('/api/news?type=featured').then(r => r.json()).then(setTrendingArticles).catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedRegion !== 'All') params.set('region', selectedRegion)
    if (selectedCategory !== 'All') params.set('category', selectedCategory)
    fetch(`/api/news?${params.toString()}`).then(r => r.json()).then(setFilteredArticles).catch(() => {})
  }, [selectedRegion, selectedCategory])

  useEffect(() => {
    if (session) {
      fetch('/api/saved')
        .then(r => r.json())
        .then(ids => setSavedIds(ids))
        .catch(() => {})
    }
  }, [session])

  const handleToggleSave = async (articleId: string) => {
    if (!session) return
    const isSaved = savedIds.includes(articleId)
    const method = isSaved ? 'DELETE' : 'POST'
    await fetch('/api/saved', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId }),
    })
    setSavedIds(prev => isSaved ? prev.filter(id => id !== articleId) : [...prev, articleId])
  }

  return (
    <div>
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            Curated daily with AI filtering
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            The world is full of good news.
          </h1>
          <p className="text-brand-100 text-lg max-w-xl mx-auto mb-8">
            We find the stories of hope, progress, and human kindness you won&apos;t see in the headlines.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {STATS.map(stat => (
              <div key={stat.label} className="bg-white/10 rounded-xl py-3 px-4">
                <div className="text-2xl font-extrabold">{stat.value}</div>
                <div className="text-brand-200 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hero section */}
      {featuredHero && <HeroSection featuredArticle={featuredHero} sideArticles={heroSide} />}

      {/* Featured writers strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <PenLine className="w-5 h-5 text-brand-500" />
            <h2 className="font-bold text-gray-900 text-lg">Independent Voices</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4 ml-7">Spotlighting independent journalists &amp; writers making a difference</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trendingArticles.slice(0, 3).map(article => (
              <ArticleCard
                key={article.id}
                article={article}
                size="compact"
                savedIds={savedIds}
                onToggleSave={session ? handleToggleSave : undefined}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Category quick links */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-brand-500" />
          <h2 className="section-title">Browse by Category</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {CATEGORIES.map(cat => (
            <Link
              key={cat}
              href={`/search?category=${encodeURIComponent(cat)}`}
              className={`text-center py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-80 transition-opacity cursor-pointer ${CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-700'}`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* Filter bar + feed */}
      <FilterBar
        selectedRegion={selectedRegion}
        selectedCategory={selectedCategory}
        onRegionChange={setSelectedRegion}
        onCategoryChange={setSelectedCategory}
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Globe className="w-5 h-5 text-brand-500" />
          <h2 className="section-title">Latest Stories</h2>
          {(selectedRegion !== 'All' || selectedCategory !== 'All') && (
            <span className="ml-2 text-sm text-gray-500">
              {filteredArticles.length} results
            </span>
          )}
        </div>

        {filteredArticles.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No stories found</p>
            <p className="text-sm mt-1">Try changing your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredArticles.slice(0, 50).map(article => (
              <ArticleCard
                key={article.id}
                article={article}
                savedIds={savedIds}
                onToggleSave={session ? handleToggleSave : undefined}
              />
            ))}
          </div>
        )}
      </section>

      {/* CTA for non-signed-in */}
      {!session && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-8 text-center text-white">
            <Sparkles className="w-10 h-10 mx-auto mb-4 text-brand-200" />
            <h2 className="text-2xl font-bold mb-2">Save your favorite stories</h2>
            <p className="text-brand-200 mb-6 max-w-md mx-auto">
              Create a free account to bookmark articles, personalize your feed, and never miss an uplifting story.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/auth/signup" className="bg-white text-brand-700 hover:bg-brand-50 font-semibold px-6 py-3 rounded-xl transition-colors">
                Create Free Account
              </Link>
              <Link href="/auth/login" className="border border-white/40 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-xl transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
