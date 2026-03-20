import { NextRequest, NextResponse } from 'next/server'
import { fetchAndStorePositiveNews, getLastFetchTime } from '@/lib/newsFetcher'

// Call this endpoint to trigger a fresh news fetch.
// Set up a daily cron job to hit: GET /api/cron/refresh?secret=YOUR_CRON_SECRET
// Protect it by setting CRON_SECRET in your .env.local

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const lastFetch = await getLastFetchTime()
  const now = new Date()

  // Throttle: don't fetch more than once every 6 hours unless forced
  const force = req.nextUrl.searchParams.get('force') === '1'
  if (!force && lastFetch) {
    const hoursSince = (now.getTime() - lastFetch.getTime()) / 1000 / 60 / 60
    if (hoursSince < 6) {
      return NextResponse.json({
        message: 'Skipped — fetched recently',
        lastFetch: lastFetch.toISOString(),
        nextFetch: new Date(lastFetch.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      })
    }
  }

  const result = await fetchAndStorePositiveNews()

  return NextResponse.json({
    success: true,
    timestamp: now.toISOString(),
    ...result,
  })
}
