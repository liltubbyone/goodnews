import { NextRequest, NextResponse } from 'next/server'
import { fetchAllSources, getLastFetchTime, cleanupOldArticles } from '@/lib/newsFetcher'

// Triggered daily at 12:30 AM CST via vercel.json cron schedule.
// Protect by setting CRON_SECRET in Vercel environment variables.

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret) {
    // Vercel crons pass: Authorization: Bearer <CRON_SECRET>
    const authHeader = req.headers.get('authorization') ?? ''
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    // Also accept ?secret= for manual triggering
    const querySecret = req.nextUrl.searchParams.get('secret')
    if (bearerToken !== cronSecret && querySecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const lastFetch = await getLastFetchTime()
  const now = new Date()

  // Throttle: don't fetch more than once every 23 hours unless forced
  const force = req.nextUrl.searchParams.get('force') === '1'
  if (!force && lastFetch) {
    const hoursSince = (now.getTime() - lastFetch.getTime()) / 1000 / 60 / 60
    if (hoursSince < 23) {
      return NextResponse.json({
        message: 'Skipped — fetched recently',
        lastFetch: lastFetch.toISOString(),
        nextFetch: new Date(lastFetch.getTime() + 23 * 60 * 60 * 1000).toISOString(),
      })
    }
  }

  // Remove articles older than 3 months before adding new ones
  const cleaned = await cleanupOldArticles()

  const result = await fetchAllSources()

  return NextResponse.json({
    success: true,
    timestamp: now.toISOString(),
    cleaned,
    ...result,
  })
}
