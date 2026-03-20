import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { Clock, ExternalLink, ArrowLeft, Globe, Tag } from 'lucide-react'
import { getArticleById, getRelatedArticles } from '@/lib/newsData'
import { prisma } from '@/lib/db'
import { ArticleCard } from '@/components/ArticleCard'
import { SaveButton } from '@/components/SaveButton'
import { Article, CATEGORY_COLORS, REGION_COLORS } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

async function resolveArticle(id: string): Promise<Article | undefined> {
  // Live DB articles have IDs prefixed with 'live-'
  if (id.startsWith('live-')) {
    const dbId = id.replace(/^live-/, '')
    const row = await prisma.fetchedArticle.findUnique({ where: { id: dbId } })
    if (!row) return undefined
    return {
      id,
      title: row.title,
      summary: row.summary,
      content: row.content,
      sourceUrl: row.sourceUrl,
      sourceName: row.sourceName,
      region: row.region,
      country: row.country,
      category: row.category,
      tags: JSON.parse(row.tags || '[]'),
      publishedAt: row.publishedAt.toISOString(),
      imageUrl: row.imageUrl || `https://picsum.photos/seed/${row.id}/800/450`,
      positivityScore: row.positivityScore,
      trending: row.trending,
      featured: row.featured,
      readTime: row.readTime,
    }
  }
  return getArticleById(id)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const article = await resolveArticle(id)
  if (!article) return { title: 'Story Not Found' }
  return {
    title: article.title,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      images: [article.imageUrl],
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params
  const article = await resolveArticle(id)
  if (!article) notFound()

  const related = getRelatedArticles(article)
  const formattedDate = format(new Date(article.publishedAt), 'MMMM d, yyyy')

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 mb-6 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to stories
      </Link>

      {/* Hero image */}
      <div className="relative h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden mb-8 shadow-lg">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 960px"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${CATEGORY_COLORS[article.category] ?? 'bg-gray-100 text-gray-700'}`}>
              {article.category}
            </span>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${REGION_COLORS[article.region] ?? 'bg-gray-100 text-gray-700'}`}>
              <Globe className="w-3 h-3 inline mr-1" />{article.region}
            </span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-100 text-brand-700">
              {article.positivityScore}% Positive
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-4 text-balance">
            {article.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
            {article.sourceUrl && !article.sourceUrl.includes('example.com') ? (
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-brand-700 hover:text-brand-800 hover:underline flex items-center gap-1"
              >
                {article.sourceName}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="font-semibold text-gray-800">{article.sourceName}</span>
            )}
            <span>·</span>
            <span>{formattedDate}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> {article.readTime} min read
            </span>
            <span className="ml-auto">
              <SaveButton articleId={article.id} size="md" />
            </span>
          </div>

          {/* Summary */}
          <p className="text-lg text-gray-700 font-medium leading-relaxed mb-6 bg-brand-50 border-l-4 border-brand-500 pl-4 py-3 rounded-r-xl">
            {article.summary}
          </p>

          {/* Content */}
          <div className="prose prose-gray max-w-none">
            {article.content.split('. ').reduce((acc: string[][], sentence, i) => {
              const para = Math.floor(i / 3)
              if (!acc[para]) acc[para] = []
              acc[para].push(sentence)
              return acc
            }, []).map((sentences, i) => (
              <p key={i} className="text-gray-700 leading-relaxed mb-4">
                {sentences.join('. ')}{sentences[sentences.length - 1]?.endsWith('.') ? '' : '.'}
              </p>
            ))}
          </div>

          {/* Tags */}
          <div className="mt-8 flex flex-wrap gap-2">
            <Tag className="w-4 h-4 text-gray-400 self-center" />
            {article.tags.map(tag => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="text-xs bg-gray-100 hover:bg-brand-100 hover:text-brand-700 text-gray-600 px-3 py-1 rounded-full transition-colors font-medium"
              >
                #{tag}
              </Link>
            ))}
          </div>

          {/* Source link */}
          {article.sourceUrl && !article.sourceUrl.includes('example.com') && (
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 px-5 py-3 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-xl text-sm text-brand-700 hover:text-brand-900 font-semibold transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Read original article on {article.sourceName}
            </a>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Save action */}
          <div className="bg-brand-50 rounded-xl p-5 border border-brand-100">
            <p className="text-sm text-brand-800 font-semibold mb-3">Enjoy this story?</p>
            <SaveButton articleId={article.id} size="lg" />
            <p className="text-xs text-brand-600 mt-2">Save it to read later or share with friends.</p>
          </div>

          {/* Story info */}
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Story Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Source</dt>
                <dd className="text-gray-900 font-medium">{article.sourceName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Country</dt>
                <dd className="text-gray-900 font-medium">{article.country}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Region</dt>
                <dd className="text-gray-900 font-medium">{article.region}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Published</dt>
                <dd className="text-gray-900 font-medium">{formattedDate}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Read time</dt>
                <dd className="text-gray-900 font-medium">{article.readTime} min</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Positivity</dt>
                <dd className="text-brand-600 font-bold">{article.positivityScore}%</dd>
              </div>
            </dl>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Related Stories</h3>
              <div className="space-y-1">
                {related.map(rel => (
                  <ArticleCard key={rel.id} article={rel} size="compact" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
