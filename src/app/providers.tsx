'use client'

import { SessionProvider } from 'next-auth/react'
import { HeartbeatPing } from '@/components/HeartbeatPing'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <HeartbeatPing />
      {children}
    </SessionProvider>
  )
}
