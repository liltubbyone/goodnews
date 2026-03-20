'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Bookmark, BookmarkCheck } from 'lucide-react'

interface SaveButtonProps {
  articleId: string
  initialSaved?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function SaveButton({ articleId, initialSaved = false, size = 'md' }: SaveButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [saved, setSaved] = useState(initialSaved)
  const [loading, setLoading] = useState(false)

  const sizeClasses = {
    sm: 'p-1.5 text-sm',
    md: 'p-2.5 text-base',
    lg: 'px-5 py-2.5 text-base gap-2',
  }

  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-5 h-5' : 'w-5 h-5'

  const handleClick = async () => {
    if (!session) {
      router.push('/auth/login')
      return
    }

    setLoading(true)
    try {
      const method = saved ? 'DELETE' : 'POST'
      const res = await fetch('/api/saved', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      })
      if (res.ok) setSaved(!saved)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`
        flex items-center rounded-lg font-medium transition-all duration-200
        ${sizeClasses[size]}
        ${saved
          ? 'bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200'
          : 'bg-white text-gray-500 hover:text-brand-700 hover:bg-brand-50 border border-gray-200'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      title={saved ? 'Remove from saved' : 'Save this story'}
    >
      {saved ? <BookmarkCheck className={iconSize} /> : <Bookmark className={iconSize} />}
      {size === 'lg' && <span>{saved ? 'Saved' : 'Save Story'}</span>}
    </button>
  )
}
