import { prisma } from './db'
import { scorePositivity, categorizeArticle, detectRegion } from './positiveFilter'

// NewsData.io — free plan: 200 credits/day, 10 articles/request
const NEWSDATA_API_KEY = process.env.NEWSDATA_API_KEY
const NEWSDATA_BASE = 'https://newsdata.io/api/1/news'

// Category + keyword pairs that surface positive news via NewsData.io
// NewsData.io free: 200 credits/day — each request = 1 credit, returns up to 10 articles
const FETCH_CONFIGS = [
  { category: 'science',       q: 'breakthrough discovery' },
  { category: 'science',       q: 'invention innovation research' },
  { category: 'health',        q: 'cure treatment success recovery' },
  { category: 'health',        q: 'mental health wellness improved' },
  { category: 'environment',   q: 'conservation wildlife restored' },
  { category: 'environment',   q: 'renewable energy solar clean' },
  { category: 'technology',    q: 'innovation achievement milestone' },
  { category: 'technology',    q: 'new technology helps community' },
  { category: 'world',         q: 'humanitarian volunteers charity' },
  { category: 'world',         q: 'milestone achievement record success' },
  { category: 'entertainment', q: 'celebrates award achievement' },
  { category: 'sports',        q: 'champion record achievement inspires' },
]

interface NewsdataArticle {
  article_id: string
  title: string
  description: string | null
  content: string | null
  link: string
  image_url: string | null
  pubDate: string
  source_name: string
  source_url: string | null
  country: string[] | null
  category: string[] | null
}

function estimateReadTime(text: string): number {
  return Math.max(2, Math.ceil((text?.split(' ').length ?? 150) / 200))
}

function buildImageUrl(apiUrl: string | null, seed: string): string {
  if (apiUrl && apiUrl.startsWith('http')) return apiUrl
  return `https://picsum.photos/seed/${seed}/800/450`
}

export async function fetchAndStorePositiveNews(): Promise<{ fetched: number; stored: number }> {
  if (!NEWSDATA_API_KEY) {
    console.warn('[GoodNews] NEWSDATA_API_KEY not set — add it to .env.local to enable live news.')
    return { fetched: 0, stored: 0 }
  }

  const candidates: (NewsdataArticle & { score: number })[] = []
  const seenIds = new Set<string>()

  for (const config of FETCH_CONFIGS) {
    try {
      const url = new URL(NEWSDATA_BASE)
      url.searchParams.set('apikey', NEWSDATA_API_KEY)
      url.searchParams.set('language', 'en')
      url.searchParams.set('category', config.category)
      url.searchParams.set('q', config.q)

      const res = await fetch(url.toString(), { cache: 'no-store' })
      if (!res.ok) {
        console.error(`[GoodNews] NewsData.io error: ${res.status} for category=${config.category}`)
        continue
      }

      const data = await res.json()
      if (data.status !== 'success' || !Array.isArray(data.results)) continue

      for (const article of data.results as NewsdataArticle[]) {
        if (!article.title || !article.link || seenIds.has(article.article_id)) continue
        seenIds.add(article.article_id)

        const summary = article.description ?? article.title
        const score = scorePositivity(article.title, summary)
        if (score >= 50) {
          candidates.push({ ...article, score })
        }
      }
    } catch (err) {
      console.error(`[GoodNews] Fetch failed for category=${config.category}:`, err)
    }
  }

  // Sort by positivity score, take top 50
  const top50 = candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)

  let stored = 0
  for (const article of top50) {
    try {
      const summary = article.description ?? article.title
      const content = article.content ?? summary
      const category = categorizeArticle(article.title, summary)
      const loc = detectRegion(article.title, summary, article.source_name ?? '')
      const seed = article.article_id.slice(-8)
      const imageUrl = buildImageUrl(article.image_url, seed)

      await prisma.fetchedArticle.upsert({
        where: { externalId: article.link },
        update: { positivityScore: article.score, trending: article.score >= 85 },
        create: {
          externalId: article.link,
          title: article.title,
          summary,
          content,
          sourceUrl: article.link,
          sourceName: article.source_name ?? 'News Source',
          region: loc.region,
          country: loc.country,
          category,
          tags: JSON.stringify([category.toLowerCase(), loc.region.toLowerCase()]),
          publishedAt: new Date(article.pubDate ?? new Date()),
          imageUrl,
          positivityScore: article.score,
          trending: article.score >= 85,
          featured: article.score >= 92,
          readTime: estimateReadTime(content),
        },
      })
      stored++
    } catch {
      // silently skip duplicates
    }
  }

  console.log(`[GoodNews] Scored ${candidates.length} positive articles → stored ${stored}`)
  return { fetched: candidates.length, stored }
}

export async function getLastFetchTime(): Promise<Date | null> {
  const latest = await prisma.fetchedArticle.findFirst({
    orderBy: { fetchedAt: 'desc' },
    select: { fetchedAt: true },
  })
  return latest?.fetchedAt ?? null
}

export async function getLiveFetchedArticleCount(): Promise<number> {
  return prisma.fetchedArticle.count()
}
