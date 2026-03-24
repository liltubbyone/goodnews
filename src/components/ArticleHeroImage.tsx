'use client'

import Image from 'next/image'
import { useState } from 'react'
import { buildArticleFallbackUrl } from '@/lib/imageFallback'

interface ArticleHeroImageProps {
  src: string
  alt: string
  category: string
  tags: string[]
  title: string
}

export function ArticleHeroImage({ src, alt, category, tags, title }: ArticleHeroImageProps) {
  const fallback = buildArticleFallbackUrl(category, tags, title)
  const [imgSrc, setImgSrc] = useState(src || fallback)
  const [usedFallback, setUsedFallback] = useState(!src)

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      priority
      className="object-cover"
      sizes="(max-width: 1024px) 100vw, 960px"
      onError={() => {
        if (!usedFallback) {
          setUsedFallback(true)
          setImgSrc(fallback)
        }
      }}
    />
  )
}
