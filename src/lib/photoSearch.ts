/**
 * Server-side only. Fetches a relevant photo URL from Unsplash.
 * Returns null if UNSPLASH_ACCESS_KEY is not set or the request fails.
 */
export async function fetchUnsplashPhoto(query: string): Promise<string | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key) return null
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${key}`
    const res = await fetch(url, { next: { revalidate: 86400 } }) // cache 24h
    if (!res.ok) return null
    const data = await res.json()
    const photo = data.results?.[0]
    if (!photo) return null
    return `${photo.urls.raw}&w=800&h=450&fit=crop&auto=format`
  } catch {
    return null
  }
}
