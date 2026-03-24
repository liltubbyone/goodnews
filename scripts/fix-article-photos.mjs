/**
 * One-time script: updates every static article in newsData.ts with a real
 * Unsplash photo fetched by keyword.
 *
 * Usage:
 *   UNSPLASH_ACCESS_KEY=your_key node scripts/fix-article-photos.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const KEY = process.env.UNSPLASH_ACCESS_KEY

if (!KEY) {
  console.error('Set UNSPLASH_ACCESS_KEY env var first.')
  process.exit(1)
}

async function fetchUnsplashPhoto(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${KEY}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    const photo = data.results?.[0]
    if (photo) {
      // Use the raw URL with size params so next/image can optimize it
      return `${photo.urls.raw}&w=800&h=450&fit=crop&auto=format`
    }
  } catch (e) {
    console.error(`  fetch failed for "${query}":`, e.message)
  }
  return null
}

// Extract all article blocks: id + tags + title + current imageUrl
const filePath = path.join(__dirname, '../src/lib/newsData.ts')
let content = fs.readFileSync(filePath, 'utf-8')

const articlePattern = /id: '([^']+)'[\s\S]*?title: '([^']*)'[\s\S]*?tags: \[([^\]]*)\][\s\S]*?imageUrl: '([^']*)'/g

const articles = []
let match
while ((match = articlePattern.exec(content)) !== null) {
  const [, id, title, tagsRaw, imageUrl] = match
  const tags = tagsRaw.split(',').map(t => t.trim().replace(/['"]/g, '')).filter(Boolean)
  articles.push({ id, title, tags, imageUrl })
}

console.log(`Found ${articles.length} articles. Fetching photos...\n`)

for (const article of articles) {
  // Build a focused query: first 2 tags + title words
  const query = article.tags.slice(0, 2).join(' ') || article.title.split(' ').slice(0, 4).join(' ')
  process.stdout.write(`[${article.id}] "${query}" ... `)

  const photoUrl = await fetchUnsplashPhoto(query)

  if (photoUrl) {
    // Replace just this article's imageUrl
    const escaped = article.imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Match imageUrl line that follows this article's id (within ~30 lines)
    // Use a targeted approach: replace the specific old URL with new one
    content = content.replace(article.imageUrl, photoUrl)
    console.log('✓')
  } else {
    console.log('✗ (kept original)')
  }

  // Unsplash free tier: 50 req/hour → ~72ms between requests is fine, add small delay
  await new Promise(r => setTimeout(r, 300))
}

fs.writeFileSync(filePath, content)
console.log('\nDone. Review the diff then commit.')
