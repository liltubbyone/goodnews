import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export const metadata: Metadata = {
  title: {
    default: 'GoodNews — Positive Stories From Around The World',
    template: '%s | GoodNews',
  },
  description:
    'GoodNews curates the best uplifting, positive news stories from around the globe every day — science breakthroughs, humanitarian efforts, community impact, and more.',
  keywords: ['positive news', 'good news', 'uplifting stories', 'world news', 'hope'],
  openGraph: {
    type: 'website',
    siteName: 'GoodNews',
    title: 'GoodNews — Positive Stories From Around The World',
    description: 'Discover uplifting news from every corner of the globe.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
