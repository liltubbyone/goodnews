import { Article } from '@/types'

const defaultArticles: Article[] = [
  // ... your existing articles here (keep all 35 articles as is)
]

let fetchedArticles: Article[] = []

// Load articles from the API JSON file
async function loadFetchedArticles() {
  try {
    const response = await fetch('/articles.json')
    if (response.ok) {
      const data = await response.json()
      if (data.results && Array.isArray(data.results)) {
        // Transform API articles to match Article type
        fetchedArticles = data.results.slice(0, 50).map((apiArticle: any, index: number) => ({
          id: `live-${apiArticle.article_id || index}`,
          title: apiArticle.title,
          summary: apiArticle.description || '',
          content: apiArticle.content || 'Full article available at source',
          sourceUrl: apiArticle.link,
          sourceName: apiArticle.source_name || 'News',
          region: apiArticle.country?.[0] === 'united states of america' ? 'North America' : 'Global',
          country: apiArticle.country?.[0] || 'Global',
          category: apiArticle.category?.[0] || 'News',
          tags: apiArticle.keywords || [],
          publishedAt: apiArticle.pubDate || new Date().toISOString(),
          imageUrl: apiArticle.image_url || `https://picsum.photos/seed/${apiArticle.article_id}/800/450`,
          positivityScore: 75,
          trending: false,
          featured: false,
          readTime: 3,
        }))
      }
    }
  } catch (error) {
    console.error('Failed to load fetched articles:', error)
  }
}

// Call this on module load
loadFetchedArticles()

export const articles: Article[] = []

// Combined getter that includes both types
export function getAllArticles(): Article[] {
  return [...fetchedArticles, ...defaultArticles]
}

export function getFeaturedArticles(): Article[] {
  return getAllArticles().filter(a => a.featured).slice(0, 4)
}

export function getTrendingArticles(): Article[] {
  return getAllArticles().filter(a => a.trending).slice(0, 20)
}

export function getArticleById(id: string): Article | undefined {
  return getAllArticles().find(a => a.id === id)
}

export function getArticlesByRegion(region: string): Article[] {
  if (region === 'All') return getAllArticles()
  return getAllArticles().filter(a => a.region === region)
}

export function getArticlesByCategory(category: string): Article[] {
  if (category === 'All') return getAllArticles()
  return getAllArticles().filter(a => a.category === category)
}

export function searchArticles(query: string, region?: string, category?: string): Article[] {
  let results = getAllArticles()

  if (region && region !== 'All') {
    results = results.filter(a => a.region === region)
  }

  if (category && category !== 'All') {
    results = results.filter(a => a.category === category)
  }

  if (query) {
    const q = query.toLowerCase()
    results = results.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.tags.some(t => t.toLowerCase().includes(q)) ||
      a.country.toLowerCase().includes(q) ||
      a.sourceName.toLowerCase().includes(q)
    )
  }

  return results
}

export function getRelatedArticles(article: Article, limit = 3): Article[] {
  return getAllArticles()
    .filter(a => a.id !== article.id && (a.category === article.category || a.region === article.region))
    .slice(0, limit)
}

export function getArticlesByIds(ids: string[]): Article[] {
  return getAllArticles().filter(a => ids.includes(a.id))
}
