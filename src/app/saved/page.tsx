'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookmarkCheck, Sparkles, Trash2 } from 'lucide-react'
import { ArticleCard } from '@/components/ArticleCard'
import { getArticlesByIds } from '@/lib/newsData'
import { Article } from '@/types'

export default function SavedPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetch('/api/saved')
        .then(r => r.json())
        .then(ids => {
          setSavedIds(Array.isArray(ids) ? ids : [])
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [session])

  const handleToggleSave = async (articleId: string) => {
    const isSaved = savedIds.includes(articleId)
    const method = isSaved ? 'DELETE' : 'POST'
    await fetch('/api/saved', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId }),
    })
    setSavedIds(prev => isSaved ? prev.filter(id => id !== articleId) : [...prev, articleId])
  }

  const handleClearAll = async () => {
    if (!confirm('Remove all saved stories?')) return
    await Promise.all(
      savedIds.map(id =>
        fetch('/api/saved', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ articleId: id }),
        })
      )
    )
    setSavedIds([])
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
        <p className="text-gray-400 mt-4">Loading your saved stories...</p>
      </div>
    )
  }

  const savedArticles = getArticlesByIds(savedIds)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
            <BookmarkCheck className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Saved Stories</h1>
            <p className="text-gray-500 mt-0.5">
              {savedArticles.length === 0
                ? 'Your bookmark collection'
                : `${savedArticles.length} saved ${savedArticles.length === 1 ? 'story' : 'stories'}`}
            </p>
          </div>
        </div>
        {savedArticles.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {savedArticles.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <BookmarkCheck className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">No saved stories yet</h2>
          <p className="text-gray-400 mb-6">
            Browse stories and click the bookmark icon to save them here.
          </p>
          <Link href="/" className="btn-primary">
            Discover Stories
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {savedArticles.map(article => (
            <ArticleCard
              key={article.id}
              article={article}
              savedIds={savedIds}
              onToggleSave={handleToggleSave}
            />
          ))}
        </div>
      )}

      {savedArticles.length > 0 && (
        <div className="mt-10 text-center">
          <Link href="/" className="btn-outline">
            <Sparkles className="w-4 h-4 inline mr-2" />
            Discover More Stories
          </Link>
        </div>
      )}
    </div>
  )
}
