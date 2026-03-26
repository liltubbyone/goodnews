'use client'

import { useState, useEffect } from 'react'
import { MapPin, Loader2, LocateFixed, AlertCircle } from 'lucide-react'
import { ArticleCard } from '@/components/ArticleCard'
import { REGIONS, REGION_COLORS, Article } from '@/types'

const REGION_EMOJIS: Record<string, string> = {
  'Global': '🌍',
  'North America': '🌎',
  'Europe': '🇪🇺',
  'Asia': '🌏',
  'Africa': '🌍',
  'Latin America': '🌎',
  'Middle East': '🕌',
  'Oceania': '🦘',
}

type LocationStatus = 'idle' | 'detecting' | 'found' | 'denied' | 'error' | 'unavailable'

export default function RegionalPage() {
  const [selectedRegion, setSelectedRegion] = useState<string>('All')
  const [articles, setArticles] = useState<Article[]>([])
  const [regionCounts, setRegionCounts] = useState<Record<string, number>>({})

  // Geolocation + local news state
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle')
  const [userCity, setUserCity] = useState('')
  const [userState, setUserState] = useState('')
  const [localArticles, setLocalArticles] = useState<Article[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('unavailable')
      return
    }

    setLocationStatus('detecting')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          // Free reverse geocoding via OpenStreetMap Nominatim — no API key required
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const geoData = await geoRes.json()
          const addr = geoData.address ?? {}

          const city  = addr.city || addr.town || addr.village || addr.suburb || ''
          const state = addr.state || ''
          setUserCity(city)
          setUserState(state)

          // Fetch local articles from our API
          const params = new URLSearchParams()
          if (city)  params.set('city', city)
          if (state) params.set('state', state)
          const artRes = await fetch(`/api/local?${params.toString()}`)
          const arts: Article[] = await artRes.json()
          setLocalArticles(arts)
          setLocationStatus('found')
        } catch {
          setLocationStatus('error')
        }
      },
      () => setLocationStatus('denied')
    )
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedRegion !== 'All') params.set('region', selectedRegion)
    fetch(`/api/news?${params.toString()}`)
      .then(r => r.json())
      .then((data: Article[]) => {
        setArticles(data)
        if (selectedRegion === 'All') {
          const counts: Record<string, number> = {}
          REGIONS.forEach(r => { counts[r] = data.filter(a => a.region === r).length })
          setRegionCounts(counts)
        }
      })
      .catch(() => {})
  }, [selectedRegion])

  const locationLabel = [userCity, userState].filter(Boolean).join(', ')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Near You ── */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
            <LocateFixed className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Near You</h2>
            <p className="text-gray-500 text-sm mt-0.5">Good news from your city and state</p>
          </div>
        </div>

        {(locationStatus === 'idle' || locationStatus === 'detecting') && (
          <div className="flex items-center gap-3 py-8 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Detecting your location…</span>
          </div>
        )}

        {locationStatus === 'denied' && (
          <div className="flex items-center gap-3 py-5 px-4 bg-amber-50 text-amber-700 rounded-xl">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">Location access was denied. Allow location in your browser settings to see local news.</p>
          </div>
        )}

        {(locationStatus === 'error' || locationStatus === 'unavailable') && (
          <div className="flex items-center gap-3 py-5 px-4 bg-gray-50 text-gray-500 rounded-xl">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">Could not determine your location. Showing global news below.</p>
          </div>
        )}

        {locationStatus === 'found' && localArticles.length === 0 && (
          <div className="py-5 px-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500">
              No recent positive stories found near <strong>{locationLabel}</strong>. New local articles are added every night at 12:30 AM CST.
            </p>
          </div>
        )}

        {locationStatus === 'found' && localArticles.length > 0 && (
          <>
            <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-700 text-sm font-semibold px-3 py-1.5 rounded-full mb-4">
              <MapPin className="w-4 h-4" />
              {locationLabel}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {localArticles.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </>
        )}
      </section>

      <hr className="border-gray-100 mb-10" />

      {/* ── Global Regional ── */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <MapPin className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Regional News</h1>
          <p className="text-gray-500 mt-0.5">Explore positive stories from every corner of the world</p>
        </div>
      </div>

      {/* Region selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-2 mb-8">
        <button
          onClick={() => setSelectedRegion('All')}
          className={`flex flex-col items-center gap-1 py-4 px-2 rounded-xl border-2 transition-all text-center ${
            selectedRegion === 'All'
              ? 'border-brand-500 bg-brand-50 text-brand-700'
              : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span className="text-2xl">🌐</span>
          <span className="text-xs font-semibold">All</span>
        </button>

        {REGIONS.map(region => (
          <button
            key={region}
            onClick={() => setSelectedRegion(region)}
            className={`flex flex-col items-center gap-1 py-4 px-2 rounded-xl border-2 transition-all text-center ${
              selectedRegion === region
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className="text-2xl">{REGION_EMOJIS[region] ?? '🌍'}</span>
            <span className="text-xs font-semibold leading-tight">{region}</span>
            <span className="text-xs text-gray-400">{regionCounts[region] ?? ''}</span>
          </button>
        ))}
      </div>

      {/* Region header */}
      {selectedRegion !== 'All' && (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-6 text-sm font-semibold ${REGION_COLORS[selectedRegion] ?? 'bg-gray-100 text-gray-700'}`}>
          <span>{REGION_EMOJIS[selectedRegion]}</span>
          {selectedRegion} — {articles.length} {articles.length === 1 ? 'story' : 'stories'}
        </div>
      )}

      {/* Articles */}
      {articles.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No stories for this region yet</p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}
