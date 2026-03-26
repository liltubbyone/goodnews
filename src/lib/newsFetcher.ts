import { prisma } from './db'
import { scorePositivity, categorizeArticle, detectRegion } from './positiveFilter'
import { cleanContent } from './articleUtils'
import { fetchUnsplashPhoto } from './photoSearch'

// ── API keys ────────────────────────────────────────────────────────────────
const NEWSDATA_API_KEY   = process.env.NEWSDATA_API_KEY    // newsdata.io
const GUARDIAN_API_KEY   = process.env.GUARDIAN_API_KEY    // open-platform.theguardian.com
const GNEWS_API_KEY      = process.env.GNEWS_API_KEY       // gnews.io
const NEWSAPI_API_KEY    = process.env.news_api_api_key    // newsapi.org

// Articles older than 3 months are excluded everywhere
function threeMonthsAgo(): Date {
  const d = new Date()
  d.setMonth(d.getMonth() - 3)
  return d
}

// Only fetch articles published in the last 49 hours for daily runs
function oneDayAgo(): Date {
  return new Date(Date.now() - 49 * 60 * 60 * 1000)
}

function estimateReadTime(text: string): number {
  return Math.max(2, Math.ceil((text?.split(' ').length ?? 150) / 200))
}

// Returns a unique image URL — uses the article's original photo first,
// falls back to Unsplash if missing or already in use, then picsum.
async function resolveUniqueImageUrl(
  apiUrl: string | null | undefined,
  uniqueSeed: string,
  keywords: string,
): Promise<string> {
  // 1. Use the article's original photo if it exists and isn't already stored
  if (apiUrl && apiUrl.startsWith('http')) {
    const taken = await prisma.fetchedArticle.findFirst({
      where: { imageUrl: apiUrl },
      select: { id: true },
    }).catch(() => null)
    if (!taken) return apiUrl
  }
  // 2. Fetch a relevant Unsplash photo using article title keywords
  const unsplash = await fetchUnsplashPhoto(keywords)
  if (unsplash) return unsplash
  // 3. Final fallback: unique picsum seed per article
  return `https://picsum.photos/seed/${encodeURIComponent(uniqueSeed)}/800/450`
}

// Shared upsert — all three fetchers funnel articles through here.
// Returns 'new' | 'skipped' (duplicate title or photo) | 'error'
async function upsertArticle(a: {
  externalId: string
  title: string
  summary: string
  content: string
  sourceUrl: string
  sourceName: string
  imageUrl: string | null | undefined
  pubDate: Date
  score: number
}): Promise<'new' | 'skipped' | 'error'> {
  try {
    // Skip if a title duplicate already exists (catches syndicated press releases)
    const dupTitle = await prisma.fetchedArticle.findFirst({
      where: { title: { equals: cleanContent(a.title), mode: 'insensitive' } },
      select: { id: true },
    }).catch(() => null)
    if (dupTitle) return 'skipped'

    // Skip if this exact URL was already stored
    const dupId = await prisma.fetchedArticle.findUnique({
      where: { externalId: a.externalId },
      select: { id: true },
    }).catch(() => null)
    if (dupId) return 'skipped'

    const category = categorizeArticle(a.title, a.summary)
    const loc      = detectRegion(a.title, a.summary, a.sourceName)
    // Use the first 6 words of the title as Unsplash search keywords for relevance
    const keywords = cleanContent(a.title).split(' ').slice(0, 6).join(' ')
    const imageUrl = await resolveUniqueImageUrl(a.imageUrl, a.externalId, keywords)

    await prisma.fetchedArticle.create({
      data: {
        externalId:      a.externalId,
        title:           cleanContent(a.title),
        summary:         cleanContent(a.summary),
        content:         cleanContent(a.content),
        sourceUrl:       a.sourceUrl,
        sourceName:      a.sourceName,
        region:          loc.region,
        country:         loc.country,
        category,
        tags:            JSON.stringify([category.toLowerCase(), loc.region.toLowerCase()]),
        publishedAt:     a.pubDate,
        imageUrl,
        positivityScore: a.score,
        trending:        a.score >= 75,
        featured:        a.score >= 92,
        readTime:        estimateReadTime(a.content),
      },
    })
    return 'new'
  } catch {
    return 'error'
  }
}

// ── NewsData.io ──────────────────────────────────────────────────────────────
const NEWSDATA_BASE = 'https://newsdata.io/api/1/news'

const NEWSDATA_CONFIGS = [
  { category: 'science',       q: 'breakthrough discovery' },
  { category: 'science',       q: 'invention innovation research' },
  { category: 'science',       q: 'space mission success launch' },
  { category: 'science',       q: 'new study finds benefit' },
  { category: 'health',        q: 'cure treatment success recovery' },
  { category: 'health',        q: 'mental health wellness improved' },
  { category: 'health',        q: 'vaccine medicine approved helps' },
  { category: 'health',        q: 'hospital saves lives new therapy' },
  { category: 'environment',   q: 'conservation wildlife restored' },
  { category: 'environment',   q: 'renewable energy solar clean' },
  { category: 'environment',   q: 'forest ocean rewilding protected' },
  { category: 'environment',   q: 'species recovery habitat restored' },
  { category: 'technology',    q: 'innovation achievement milestone' },
  { category: 'technology',    q: 'new technology helps community' },
  { category: 'technology',    q: 'ai robot helps people' },
  { category: 'technology',    q: 'startup solution clean energy' },
  { category: 'world',         q: 'humanitarian volunteers charity' },
  { category: 'world',         q: 'milestone achievement record success' },
  { category: 'world',         q: 'peace agreement diplomacy cooperation' },
  { category: 'world',         q: 'community empowerment positive change' },
  { category: 'entertainment', q: 'celebrates award achievement' },
  { category: 'entertainment', q: 'artist inspires raises awareness' },
  { category: 'sports',        q: 'champion record achievement inspires' },
  { category: 'sports',        q: 'athlete overcomes wins gold' },
  { category: 'business',      q: 'jobs growth investment community' },
  { category: 'business',      q: 'social enterprise helps local economy' },
]

async function fetchFromNewsdata(): Promise<{ fetched: number; stored: number }> {
  if (!NEWSDATA_API_KEY) return { fetched: 0, stored: 0 }

  const cutoff  = oneDayAgo()
  const seenIds = new Set<string>()
  const candidates: Array<{ title: string; summary: string; content: string; link: string; source_name: string; image_url: string | null; pubDate: string; article_id: string; score: number }> = []

  for (const config of NEWSDATA_CONFIGS) {
    try {
      const url = new URL(NEWSDATA_BASE)
      url.searchParams.set('apikey', NEWSDATA_API_KEY)
      url.searchParams.set('language', 'en')
      url.searchParams.set('category', config.category)
      url.searchParams.set('q', config.q)

      const res = await fetch(url.toString(), { cache: 'no-store' })
      if (!res.ok) continue
      const data = await res.json()
      if (data.status !== 'success' || !Array.isArray(data.results)) continue

      for (const a of data.results) {
        if (!a.title || !a.link || seenIds.has(a.article_id)) continue
        // Only keep articles from the last 48 hours
        if (a.pubDate && new Date(a.pubDate) < cutoff) continue
        seenIds.add(a.article_id)
        const summary = a.description ?? a.title
        const score   = scorePositivity(a.title, summary)
        if (score >= 40) candidates.push({ ...a, summary, score })
      }
    } catch (err) {
      console.error(`[GoodNews/NewsData] category=${config.category}:`, err)
    }
  }

  const top = candidates.sort((a, b) => b.score - a.score).slice(0, 120)
  let stored = 0
  for (const a of top) {
    const result = await upsertArticle({
      externalId: a.link,
      title:      a.title,
      summary:    a.summary,
      content:    a.content ?? a.summary,
      sourceUrl:  a.link,
      sourceName: a.source_name ?? 'News Source',
      imageUrl:   a.image_url,
      pubDate:    a.pubDate ? new Date(a.pubDate) : new Date(),
      score:      a.score,
    })
    if (result === 'new') stored++
  }

  console.log(`[GoodNews/NewsData] ${candidates.length} candidates → ${stored} new`)
  return { fetched: candidates.length, stored }
}

// ── The Guardian ─────────────────────────────────────────────────────────────
const GUARDIAN_BASE = 'https://content.guardianapis.com/search'

const GUARDIAN_QUERIES = [
  { q: 'conservation wildlife recovery',     section: 'environment' },
  { q: 'renewable energy breakthrough',      section: 'environment' },
  { q: 'rewilding nature restored',          section: 'environment' },
  { q: 'climate solution progress',          section: 'environment' },
  { q: 'medical breakthrough treatment',     section: 'science' },
  { q: 'space discovery research',           section: 'science' },
  { q: 'new research benefit discovery',     section: 'science' },
  { q: 'community volunteers charity',       section: 'society' },
  { q: 'mental health wellbeing support',    section: 'society' },
  { q: 'poverty reduction social progress',  section: 'society' },
  { q: 'innovation technology achievement',  section: 'technology' },
  { q: 'record milestone achievement',       section: 'world' },
  { q: 'aid relief humanitarian success',    section: 'world' },
  { q: 'education school success',           section: 'education' },
  { q: 'arts culture celebration award',     section: 'culture' },
  { q: 'sport champion inspiring record',    section: 'sport' },
]

async function fetchFromGuardian(): Promise<{ fetched: number; stored: number }> {
  if (!GUARDIAN_API_KEY) return { fetched: 0, stored: 0 }

  const cutoff   = oneDayAgo()
  const seenUrls = new Set<string>()
  const candidates: Array<{ webTitle: string; webUrl: string; webPublicationDate: string; fields?: { trailText?: string; bodyText?: string; thumbnail?: string; publication?: string }; score: number }> = []

  for (const config of GUARDIAN_QUERIES) {
    try {
      const url = new URL(GUARDIAN_BASE)
      url.searchParams.set('api-key',    GUARDIAN_API_KEY)
      url.searchParams.set('q',          config.q)
      url.searchParams.set('section',    config.section)
      url.searchParams.set('lang',       'en')
      url.searchParams.set('page-size',  '20')
      url.searchParams.set('show-fields','trailText,bodyText,thumbnail,publication')
      url.searchParams.set('order-by',   'newest')

      const res = await fetch(url.toString(), { cache: 'no-store' })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.error(`[GoodNews/Guardian] HTTP ${res.status} q=${config.q}: ${body.slice(0, 300)}`)
        continue
      }
      const data = await res.json()
      if (data.response?.status !== 'ok') {
        console.error(`[GoodNews/Guardian] API error q=${config.q}:`, JSON.stringify(data).slice(0, 300))
        continue
      }

      const results = data.response.results ?? []
      console.log(`[GoodNews/Guardian] q="${config.q}" → ${results.length} raw results`)
      for (const a of results) {
        if (!a.webTitle || !a.webUrl || seenUrls.has(a.webUrl)) continue
        seenUrls.add(a.webUrl)
        const summary = a.fields?.trailText ?? a.webTitle
        const score   = scorePositivity(a.webTitle, summary)
        if (score >= 40) candidates.push({ ...a, score })
      }
    } catch (err) {
      console.error(`[GoodNews/Guardian] q=${config.q}:`, err)
    }
  }

  const top = candidates.sort((a, b) => b.score - a.score).slice(0, 120)
  let stored = 0
  for (const a of top) {
    const result = await upsertArticle({
      externalId: a.webUrl,
      title:      a.webTitle,
      summary:    a.fields?.trailText ?? a.webTitle,
      content:    a.fields?.bodyText  ?? a.fields?.trailText ?? a.webTitle,
      sourceUrl:  a.webUrl,
      sourceName: a.fields?.publication ?? 'The Guardian',
      imageUrl:   a.fields?.thumbnail,
      pubDate:    new Date(a.webPublicationDate),
      score:      a.score,
    })
    if (result === 'new') stored++
  }

  console.log(`[GoodNews/Guardian] ${candidates.length} candidates → ${stored} new`)
  return { fetched: candidates.length, stored }
}

// ── GNews ────────────────────────────────────────────────────────────────────
const GNEWS_BASE = 'https://gnews.io/api/v4/search'

const GNEWS_QUERIES = [
  'conservation wildlife success',
  'renewable energy solar record',
  'medical cure breakthrough treatment',
  'mental health wellbeing improved',
  'community volunteers achievement',
  'technology innovation milestone',
  'education school success award',
  'award honor celebration achievement',
  'humanitarian relief charity help',
  'science discovery research benefit',
  'environment protected restored nature',
  'sport champion record inspiring',
]

async function fetchFromGnews(): Promise<{ fetched: number; stored: number }> {
  if (!GNEWS_API_KEY) return { fetched: 0, stored: 0 }

  const cutoff   = oneDayAgo()
  const seenUrls = new Set<string>()
  const candidates: Array<{ title: string; description: string; content: string; url: string; image: string | null; publishedAt: string; source: { name: string }; score: number }> = []

  for (const q of GNEWS_QUERIES) {
    try {
      const url = new URL(GNEWS_BASE)
      url.searchParams.set('apikey',  GNEWS_API_KEY)
      url.searchParams.set('q',       q)
      url.searchParams.set('lang',    'en')
      url.searchParams.set('max',     '10')
      url.searchParams.set('sortby',  'publishedAt')

      const res = await fetch(url.toString(), { cache: 'no-store' })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.error(`[GoodNews/GNews] HTTP ${res.status} q=${q}: ${body.slice(0, 300)}`)
        continue
      }
      const data = await res.json()
      if (!Array.isArray(data.articles)) {
        console.error(`[GoodNews/GNews] Unexpected response q=${q}:`, JSON.stringify(data).slice(0, 300))
        continue
      }

      console.log(`[GoodNews/GNews] q="${q}" → ${data.articles.length} raw results`)
      for (const a of data.articles) {
        if (!a.title || !a.url || seenUrls.has(a.url)) continue
        seenUrls.add(a.url)
        const summary = a.description ?? a.title
        const score   = scorePositivity(a.title, summary)
        if (score >= 40) candidates.push({ ...a, score })
      }
    } catch (err) {
      console.error(`[GoodNews/GNews] q=${q}:`, err)
    }
  }

  const top = candidates.sort((a, b) => b.score - a.score).slice(0, 80)
  let stored = 0
  for (const a of top) {
    const result = await upsertArticle({
      externalId: a.url,
      title:      a.title,
      summary:    a.description ?? a.title,
      content:    a.content     ?? a.description ?? a.title,
      sourceUrl:  a.url,
      sourceName: a.source?.name ?? 'GNews',
      imageUrl:   a.image,
      pubDate:    new Date(a.publishedAt),
      score:      a.score,
    })
    if (result === 'new') stored++
  }

  console.log(`[GoodNews/GNews] ${candidates.length} candidates → ${stored} new`)
  return { fetched: candidates.length, stored }
}

// ── NewsAPI.org ───────────────────────────────────────────────────────────────
const NEWSAPI_BASE = 'https://newsapi.org/v2/everything'

const NEWSAPI_QUERIES = [
  'conservation wildlife recovery',
  'renewable energy breakthrough',
  'medical breakthrough cure treatment',
  'mental health wellbeing improved',
  'community volunteers charity achievement',
  'technology innovation milestone',
  'education school success award',
  'humanitarian relief charity',
  'science discovery research benefit',
  'space mission success launch',
  'environment protected restored nature',
  'sport champion record inspiring',
  'peace diplomacy cooperation',
  'startup solution social impact',
]

async function fetchFromNewsApi(): Promise<{ fetched: number; stored: number }> {
  if (!NEWSAPI_API_KEY) return { fetched: 0, stored: 0 }

  const cutoff   = oneDayAgo()
  const seenUrls = new Set<string>()
  const candidates: Array<{ title: string; description: string; content: string; url: string; urlToImage: string | null; publishedAt: string; source: { name: string }; score: number }> = []

  for (const q of NEWSAPI_QUERIES) {
    try {
      const url = new URL(NEWSAPI_BASE)
      url.searchParams.set('apiKey',   NEWSAPI_API_KEY)
      url.searchParams.set('q',        q)
      url.searchParams.set('language', 'en')
      url.searchParams.set('sortBy',   'publishedAt')
      url.searchParams.set('pageSize', '20')

      const res = await fetch(url.toString(), { cache: 'no-store' })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        console.error(`[GoodNews/NewsAPI] HTTP ${res.status} q=${q}: ${body.slice(0, 300)}`)
        continue
      }
      const data = await res.json()
      if (data.status !== 'ok' || !Array.isArray(data.articles)) {
        console.error(`[GoodNews/NewsAPI] Error q=${q}:`, JSON.stringify(data).slice(0, 300))
        continue
      }

      console.log(`[GoodNews/NewsAPI] q="${q}" → ${data.articles.length} raw results`)
      for (const a of data.articles) {
        if (!a.title || !a.url || a.title === '[Removed]' || seenUrls.has(a.url)) continue
        if (a.publishedAt && new Date(a.publishedAt) < cutoff) continue
        seenUrls.add(a.url)
        const summary = a.description ?? a.title
        const score   = scorePositivity(a.title, summary)
        if (score >= 40) candidates.push({ ...a, score })
      }
    } catch (err) {
      console.error(`[GoodNews/NewsAPI] q=${q}:`, err)
    }
  }

  const top = candidates.sort((a, b) => b.score - a.score).slice(0, 80)
  let stored = 0
  for (const a of top) {
    const result = await upsertArticle({
      externalId: a.url,
      title:      a.title,
      summary:    a.description ?? a.title,
      content:    a.content     ?? a.description ?? a.title,
      sourceUrl:  a.url,
      sourceName: a.source?.name ?? 'NewsAPI',
      imageUrl:   a.urlToImage,
      pubDate:    new Date(a.publishedAt),
      score:      a.score,
    })
    if (result === 'new') stored++
  }

  console.log(`[GoodNews/NewsAPI] ${candidates.length} candidates → ${stored} new`)
  return { fetched: candidates.length, stored }
}

// ── Public exports ───────────────────────────────────────────────────────────

export async function fetchAndStorePositiveNews(): Promise<{ fetched: number; stored: number }> {
  return fetchFromNewsdata()
}

export async function fetchAllSources(): Promise<{
  newsdata: { fetched: number; stored: number }
  guardian: { fetched: number; stored: number }
  gnews:    { fetched: number; stored: number }
  newsapi:  { fetched: number; stored: number }
  total:    { fetched: number; stored: number }
}> {
  const [newsdata, guardian, gnews, newsapi] = await Promise.allSettled([
    fetchFromNewsdata(),
    fetchFromGuardian(),
    fetchFromGnews(),
    fetchFromNewsApi(),
  ])

  const nd = newsdata.status === 'fulfilled' ? newsdata.value : { fetched: 0, stored: 0 }
  const gu = guardian.status === 'fulfilled' ? guardian.value : { fetched: 0, stored: 0 }
  const gn = gnews.status    === 'fulfilled' ? gnews.value    : { fetched: 0, stored: 0 }
  const na = newsapi.status  === 'fulfilled' ? newsapi.value  : { fetched: 0, stored: 0 }

  if (newsdata.status === 'rejected') console.error('[GoodNews] NewsData source failed:', newsdata.reason)
  if (guardian.status === 'rejected') console.error('[GoodNews] Guardian source failed:', guardian.reason)
  if (gnews.status    === 'rejected') console.error('[GoodNews] GNews source failed:',    gnews.reason)
  if (newsapi.status  === 'rejected') console.error('[GoodNews] NewsAPI source failed:',  newsapi.reason)

  return {
    newsdata: nd,
    guardian: gu,
    gnews:    gn,
    newsapi:  na,
    total: {
      fetched: nd.fetched + gu.fetched + gn.fetched + na.fetched,
      stored:  nd.stored  + gu.stored  + gn.stored  + na.stored,
    },
  }
}

// Wipe the entire articles table — used when ?replace=1 is passed to the cron
export async function wipeAllArticles(): Promise<number> {
  const result = await prisma.fetchedArticle.deleteMany({})
  console.log(`[GoodNews] Wiped all ${result.count} articles from DB`)
  return result.count
}

// Remove articles older than 49 hours from the database so each daily
// run replaces yesterday's batch with a fresh one.
export async function cleanupOldArticles(): Promise<number> {
  const cutoff = new Date(Date.now() - 49 * 60 * 60 * 1000)
  const result = await prisma.fetchedArticle.deleteMany({
    where: { publishedAt: { lt: cutoff } },
  })
  if (result.count > 0) {
    console.log(`[GoodNews] Cleaned up ${result.count} articles older than 48 hours`)
  }
  return result.count
}

// Remove duplicate articles keeping only the highest-scoring copy per title
export async function deduplicateArticles(): Promise<number> {
  const all = await prisma.fetchedArticle.findMany({
    select: { id: true, title: true, positivityScore: true },
    orderBy: { positivityScore: 'desc' },
  })
  const seen = new Map<string, string>() // normalizedTitle → id to keep
  const toDelete: string[] = []
  for (const a of all) {
    const key = a.title.toLowerCase().trim()
    if (seen.has(key)) {
      toDelete.push(a.id)
    } else {
      seen.set(key, a.id)
    }
  }
  if (toDelete.length > 0) {
    await prisma.fetchedArticle.deleteMany({ where: { id: { in: toDelete } } })
    console.log(`[GoodNews] Removed ${toDelete.length} duplicate articles`)
  }
  return toDelete.length
}

export async function getLastFetchTime(): Promise<Date | null> {
  const latest = await prisma.fetchedArticle.findFirst({
    orderBy: { fetchedAt: 'desc' },
    select:  { fetchedAt: true },
  })
  return latest?.fetchedAt ?? null
}

export async function getLiveFetchedArticleCount(): Promise<number> {
  return prisma.fetchedArticle.count()
}
