'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

const INTERVAL_MS = 30_000 // ping every 30 seconds

function getOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem('gn_session_id')
    if (existing) return existing
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem('gn_session_id', id)
    return id
  } catch {
    return `${Date.now()}-fallback`
  }
}

export function HeartbeatPing() {
  const { data: session } = useSession()

  useEffect(() => {
    const sessionId = getOrCreateSessionId()
    const userId = (session?.user as { id?: string } | undefined)?.id ?? null

    const ping = () => {
      fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId }),
      }).catch(() => {})
    }

    ping()
    const timer = setInterval(ping, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [session])

  return null
}
