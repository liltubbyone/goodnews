import Link from 'next/link'
import { Sparkles, Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-brand-700">
              <Sparkles className="w-6 h-6 text-brand-500" />
              GoodNews
            </Link>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              Curating the world&apos;s most uplifting and inspiring stories every day.
            </p>
          </div>

          {/* Sections */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">Browse</h4>
            <ul className="space-y-2">
              {[
                { href: '/', label: 'Home' },
                { href: '/highlights', label: 'Global Highlights' },
                { href: '/regional', label: 'Regional News' },
                { href: '/trending', label: 'Trending' },
                { href: '/search', label: 'Search Stories' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-500 hover:text-brand-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">Categories</h4>
            <ul className="space-y-2">
              {['Science & Tech', 'Environment', 'Health', 'Education', 'Community', 'Humanitarian'].map(cat => (
                <li key={cat}>
                  <Link
                    href={`/search?category=${encodeURIComponent(cat)}`}
                    className="text-sm text-gray-500 hover:text-brand-600 transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">Account</h4>
            <ul className="space-y-2">
              {[
                { href: '/auth/signup', label: 'Create Account' },
                { href: '/auth/login', label: 'Sign In' },
                { href: '/saved', label: 'Saved Stories' },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-gray-500 hover:text-brand-600 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} GoodNews. Spreading positivity, one story at a time.
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> for a better world
          </p>
        </div>
      </div>
    </footer>
  )
}
