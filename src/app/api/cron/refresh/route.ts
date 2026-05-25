import { NextRequest, NextResponse } from 'next/server'
import { fetchAllSources, deleteOldestArticles, getLiveFetchedArticleCount } from '@/lib/newsFetcher'

// Triggered daily at 12:30 AM CST via GitHub Actions.
// Protect by setting CRON_SECRET in Vercel environment variables.

const DB_WIPE_THRESHOLD = 9999
const DB_KEEP_AFTER_TRIM = 999

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret) {
    const authHeader = req.headers.get('authorization') ?? ''
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    const querySecret = req.nextUrl.searchParams.get('secret')
    if (bearerToken !== cronSecret && querySecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const now = new Date()

  // If DB hits 9999, delete the oldest 9000 articles and keep the newest 999
  const count = await getLiveFetchedArticleCount()
  let trimmed = 0
  if (count >= DB_WIPE_THRESHOLD) {
    trimmed = await deleteOldestArticles(DB_KEEP_AFTER_TRIM)
  }

  const result = await fetchAllSources()

  return NextResponse.json({
    success: true,
    timestamp: now.toISOString(),
    dbCountBefore: count,
    trimmed,
    ...result,
  })
}
