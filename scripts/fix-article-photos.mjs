/**
 * Updates every static article in newsData.ts with a real Unsplash photo.
 * Usage: UNSPLASH_ACCESS_KEY=xxx node scripts/fix-article-photos.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const KEY = process.env.UNSPLASH_ACCESS_KEY

if (!KEY) { console.error('Set UNSPLASH_ACCESS_KEY env var first.'); process.exit(1) }

async function fetchUnsplashPhoto(query) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${KEY}`
  try {
    const res = await fetch(url)
    const data = await res.json()
    const photo = data.results?.[0]
    if (photo) return `${photo.urls.raw}&w=800&h=450&fit=crop&auto=format`
  } catch (e) {
    console.error(`  fetch failed for "${query}":`, e.message)
  }
  return null
}

const filePath = path.join(__dirname, '../src/lib/newsData.ts')
const lines = fs.readFileSync(filePath, 'utf-8').split('\n')

// Line-by-line pass: track current article context, replace imageUrl lines
let currentId = ''
let currentTitle = ''
let currentTags = []
let inTagsBlock = false
const tagAccum = []

const newLines = []
let updated = 0
let kept = 0

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]

  // Track article id
  const idMatch = line.match(/id:\s*['"]([^'"]+)['"]/)
  if (idMatch) {
    currentId = idMatch[1]
    currentTitle = ''
    currentTags = []
  }

  // Track title (grab everything between first and last quote on the line)
  if (/title:/.test(line)) {
    const m = line.match(/title:\s*['"](.+?)['"],?\s*$/)
    if (m) currentTitle = m[1]
  }

  // Track tags array (may span multiple lines)
  if (/tags:\s*\[/.test(line)) {
    inTagsBlock = true
    tagAccum.length = 0
  }
  if (inTagsBlock) {
    const tagMatches = [...line.matchAll(/['"]([^'"]+)['"]/g)]
    tagMatches.forEach(m => tagAccum.push(m[1]))
    if (line.includes(']')) {
      currentTags = [...tagAccum]
      inTagsBlock = false
    }
  }

  // When we hit an imageUrl line, fetch a new photo
  if (/imageUrl:/.test(line) && currentId && !currentId.startsWith('live-')) {
    const urlMatch = line.match(/imageUrl:\s*'([^']+)'/)
    if (urlMatch) {
      const oldUrl = urlMatch[1]
      const query = currentTags.slice(0, 2).join(' ') || currentTitle.split(' ').slice(0, 4).join(' ')
      process.stdout.write(`[${currentId}] "${query}" ... `)

      const newUrl = await fetchUnsplashPhoto(query)
      if (newUrl && newUrl !== oldUrl) {
        newLines.push(line.replace(oldUrl, newUrl))
        console.log('✓')
        updated++
      } else {
        newLines.push(line)
        console.log(newUrl ? '= (same)' : '✗ (kept)')
        kept++
      }
      await new Promise(r => setTimeout(r, 350))
      continue
    }
  }

  newLines.push(line)
}

fs.writeFileSync(filePath, newLines.join('\n'))
console.log(`\nDone. Updated: ${updated}, kept: ${kept}`)
