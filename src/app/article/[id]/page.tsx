import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { Clock, ExternalLink, ArrowLeft, Globe, Tag, CheckCircle2, Lightbulb, BookOpen } from 'lucide-react'
import { getArticleById, getRelatedArticles } from '@/lib/newsData'
import { prisma } from '@/lib/db'
import { ArticleCard } from '@/components/ArticleCard'
import { SaveButton } from '@/components/SaveButton'
import { Article, CATEGORY_COLORS, REGION_COLORS } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

async function resolveArticle(id: string): Promise<Article | undefined> {
  // Try DB lookup for live- prefixed IDs first
  if (id.startsWith('live-')) {
    const dbId = id.replace(/^live-/, '')
    const row = await prisma.fetchedArticle.findUnique({ where: { id: dbId } })
    if (row) {
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
    // DB lookup missed (article came from JSON file, not DB) — fall through to in-memory lookup
  }
  // Covers static defaultArticles AND JSON-loaded fetchedArticles
  return getArticleById(id)
}

// Strip paywall placeholder text from API content
function cleanContent(raw: string): string {
  return raw
    .replace(/ONLY AVAILABLE IN (PAID|PROFESSIONAL|CORPORATE) PLANS?\.?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Pull the most information-dense sentences to form key points
function extractKeyPoints(title: string, summary: string, content: string): string[] {
  const cleaned = cleanContent(content)
  const allText = `${summary}. ${cleaned}`
  const sentences = allText
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 50 && s.length < 260 && !/^(the|a|an|this|that|it|in|on|at)\s/i.test(s))

  // Score by presence of numbers, percentages, named entities, or strong verbs
  const scored = sentences.map(s => ({
    text: s.replace(/\.$/, ''),
    score:
      (s.match(/\d[\d,.]*/g)?.length ?? 0) * 3 +
      (s.match(/%|million|billion|thousand|percent/gi)?.length ?? 0) * 2 +
      (s.match(/\b(first|record|historic|largest|breakthrough|surpass|double|triple|achieve|save|protect|restore)\b/gi)?.length ?? 0) * 2,
  }))

  const top = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(s => s.text)
    .filter(Boolean)

  // Fallback: just take first 3 sentences if scoring finds nothing good
  if (top.length === 0) {
    return sentences.slice(0, 3).map(s => s.replace(/\.$/, ''))
  }
  return top
}

// Split cleaned content into readable paragraphs (3 sentences each)
function buildParagraphs(raw: string, summary: string): string[] {
  const cleaned = cleanContent(raw)
  // If content is basically the same as summary or too short, return empty
  if (!cleaned || cleaned.length < 80 || cleaned.toLowerCase().trim() === summary.toLowerCase().trim()) {
    return []
  }
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 10)
  const paragraphs: string[] = []
  for (let i = 0; i < sentences.length; i += 3) {
    const chunk = sentences.slice(i, i + 3).join(' ').trim()
    if (chunk) paragraphs.push(chunk)
  }
  return paragraphs
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
  const keyPoints = extractKeyPoints(article.title, article.summary, article.content)
  const paragraphs = buildParagraphs(article.content, article.summary)
  const hasRealContent = paragraphs.length > 0
  const hasSourceUrl = article.sourceUrl && !article.sourceUrl.includes('example.com')

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
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
        {/* ── Main content ── */}
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-4">
            {article.title}
          </h1>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
            {hasSourceUrl ? (
              <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="font-semibold text-brand-700 hover:text-brand-800 hover:underline flex items-center gap-1">
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

          {/* Summary highlight */}
          <div className="bg-brand-50 border-l-4 border-brand-500 pl-4 py-4 pr-4 rounded-r-xl mb-6">
            <p className="text-base text-gray-800 font-medium leading-relaxed">
              {article.summary}
            </p>
          </div>

          {/* Key points */}
          {keyPoints.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-brand-100 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-brand-600" />
                </div>
                <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Key Insights</h2>
              </div>
              <ul className="space-y-3">
                {keyPoints.map((point, i) => (
                  <li key={i} className="flex gap-3">
                    <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm leading-relaxed">{point}.</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full article body (when we have real content) */}
          {hasRealContent && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-gray-400" />
                <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Full Story</h2>
              </div>
              <div className="space-y-4">
                {paragraphs.map((para, i) => (
                  <p key={i} className="text-gray-700 leading-relaxed text-[15px]">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Read original CTA — prominent */}
          {hasSourceUrl && (
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-4 mt-6 px-6 py-5 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 rounded-2xl text-white font-semibold transition-all shadow-md hover:shadow-lg group"
            >
              <div>
                <p className="text-white/80 text-xs font-medium mb-0.5">Continue reading on</p>
                <p className="text-lg font-bold">{article.sourceName}</p>
              </div>
              <ExternalLink className="w-6 h-6 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </a>
          )}

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2 items-center">
              <Tag className="w-4 h-4 text-gray-400" />
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
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          {/* Save */}
          <div className="bg-brand-50 rounded-xl p-5 border border-brand-100">
            <p className="text-sm text-brand-800 font-semibold mb-3">Enjoy this story?</p>
            <SaveButton articleId={article.id} size="lg" />
            <p className="text-xs text-brand-600 mt-2">Save it to read later or share with friends.</p>
          </div>

          {/* Story details */}
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-wider text-gray-500">Story Details</h3>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Source</dt>
                <dd className="text-gray-900 font-medium text-right">{article.sourceName}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Country</dt>
                <dd className="text-gray-900 font-medium text-right">{article.country}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Region</dt>
                <dd className="text-gray-900 font-medium text-right">{article.region}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Category</dt>
                <dd className="text-gray-900 font-medium text-right">{article.category}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Published</dt>
                <dd className="text-gray-900 font-medium text-right">{formattedDate}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-500">Read time</dt>
                <dd className="text-gray-900 font-medium text-right">{article.readTime} min</dd>
              </div>
              <div className="flex justify-between gap-2 pt-1 border-t border-gray-50">
                <dt className="text-gray-500">Positivity</dt>
                <dd className="text-brand-600 font-bold text-right">{article.positivityScore}%</dd>
              </div>
            </dl>
          </div>

          {/* About this category */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-2">{article.category}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Browse more {article.category} stories from {article.region} and around the world.
            </p>
            <Link
              href={`/search?category=${encodeURIComponent(article.category)}&region=${encodeURIComponent(article.region)}`}
              className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-brand-600 hover:text-brand-800"
            >
              View more stories →
            </Link>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-sm">Related Stories</h3>
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
