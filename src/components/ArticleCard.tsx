'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Bookmark, BookmarkCheck, Clock, ExternalLink, TrendingUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Article, CATEGORY_COLORS, REGION_COLORS } from '@/types'

interface ArticleCardProps {
  article: Article
  savedIds?: string[]
  onToggleSave?: (articleId: string) => void
  size?: 'default' | 'large' | 'compact'
}

export function ArticleCard({ article, savedIds = [], onToggleSave, size = 'default' }: ArticleCardProps) {
  const isSaved = savedIds.includes(article.id)
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!onToggleSave) return
    setSaving(true)
    await onToggleSave(article.id)
    setSaving(false)
  }

  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
  const isRealUrl = article.sourceUrl && !article.sourceUrl.includes('example.com')

  const SourceLink = ({ children }: { children: React.ReactNode }) =>
    isRealUrl ? (
      <a
        href={article.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className="hover:text-brand-600 hover:underline inline-flex items-center gap-0.5 transition-colors"
      >
        {children}
        <ExternalLink className="w-2.5 h-2.5 opacity-60 flex-shrink-0" />
      </a>
    ) : (
      <span>{children}</span>
    )

  if (size === 'compact') {
    return (
      <Link href={`/article/${article.id}`} className="flex gap-3 group p-3 rounded-xl hover:bg-gray-50 transition-colors">
        <div className="relative w-20 h-16 flex-shrink-0 rounded-lg overflow-hidden">
          <Image src={article.imageUrl} alt={article.title} fill className="object-cover" sizes="80px" />
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${CATEGORY_COLORS[article.category] ?? 'bg-gray-100 text-gray-700'}`}>
            {article.category}
          </span>
          <h3 className="text-sm font-semibold text-gray-900 mt-1 line-clamp-2 group-hover:text-brand-700 transition-colors">
            {article.title}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            <SourceLink>{article.sourceName}</SourceLink>
            {' · '}{timeAgo}
          </p>
        </div>
      </Link>
    )
  }

  if (size === 'large') {
    return (
      <Link href={`/article/${article.id}`} className="card group block">
        <div className="relative h-72 w-full">
          <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 50vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex gap-2 mb-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[article.category] ?? 'bg-gray-100 text-gray-700'}`}>
                {article.category}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${REGION_COLORS[article.region] ?? 'bg-gray-100 text-gray-700'}`}>
                {article.region}
              </span>
              {article.trending && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
                  <TrendingUp className="w-3 h-3" /> Trending
                </span>
              )}
            </div>
            <h2 className="text-white text-xl font-bold line-clamp-2 group-hover:text-brand-200 transition-colors">
              {article.title}
            </h2>
          </div>
        </div>
        <div className="p-5">
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{article.summary}</p>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="font-medium text-gray-600">
                <SourceLink>{article.sourceName}</SourceLink>
              </span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTime} min read</span>
              <span>{timeAgo}</span>
            </div>
            {onToggleSave && (
              <button
                onClick={handleSave}
                disabled={saving}
                className={`p-2 rounded-lg transition-colors ${isSaved ? 'text-brand-600 bg-brand-50 hover:bg-brand-100' : 'text-gray-400 hover:text-brand-600 hover:bg-brand-50'}`}
                title={isSaved ? 'Remove from saved' : 'Save story'}
              >
                {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/article/${article.id}`} className="card group block">
      <div className="relative h-48 w-full">
        <Image src={article.imageUrl} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
        {article.trending && (
          <div className="absolute top-3 left-3">
            <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-orange-500 text-white shadow-sm">
              <TrendingUp className="w-3 h-3" /> Trending
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex gap-2 mb-2 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${CATEGORY_COLORS[article.category] ?? 'bg-gray-100 text-gray-700'}`}>
            {article.category}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${REGION_COLORS[article.region] ?? 'bg-gray-100 text-gray-700'}`}>
            {article.country}
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors">
          {article.title}
        </h3>
        <p className="text-gray-500 text-sm mt-2 line-clamp-2 leading-relaxed">{article.summary}</p>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-2 text-xs text-gray-400 min-w-0">
            <span className="font-medium text-gray-600 truncate">
              <SourceLink>{article.sourceName}</SourceLink>
            </span>
            <span className="flex-shrink-0 flex items-center gap-1">
              <Clock className="w-3 h-3" />{article.readTime}m
            </span>
            <span className="flex-shrink-0">{timeAgo}</span>
          </div>
          {onToggleSave && (
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${isSaved ? 'text-brand-600 bg-brand-50' : 'text-gray-300 hover:text-brand-600 hover:bg-brand-50'}`}
              title={isSaved ? 'Remove from saved' : 'Save story'}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
