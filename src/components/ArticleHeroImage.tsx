'use client'

import Image from 'next/image'
import { useState } from 'react'

// Curated keyword → Unsplash photo ID map for relevant fallback images
const KEYWORD_PHOTOS: Record<string, string> = {
  // Nature / Environment
  rainforest: 'photo-1448375240586-992e47ae5ad5',
  forest: 'photo-1441974231531-c6227db76b6e',
  ocean: 'photo-1518020382113-a7e8fc38eac9',
  coral: 'photo-1518020382113-a7e8fc38eac9',
  reef: 'photo-1518020382113-a7e8fc38eac9',
  wildlife: 'photo-1561731216-c3a4d99437d5',
  tiger: 'photo-1561731216-c3a4d99437d5',
  elephant: 'photo-1474511320723-9a56873867b5',
  whale: 'photo-1559827260-dc66d52bef19',
  bird: 'photo-1444464666168-49d633b86797',
  tree: 'photo-1448375240586-992e47ae5ad5',
  climate: 'photo-1466611653911-0265b48800aa',
  renewable: 'photo-1509391366360-2e959784a276',
  solar: 'photo-1509391366360-2e959784a276',
  wind: 'photo-1466611653911-0265b48800aa',
  conservation: 'photo-1441974231531-c6227db76b6e',
  biodiversity: 'photo-1441974231531-c6227db76b6e',
  environment: 'photo-1441974231531-c6227db76b6e',
  river: 'photo-1470770841072-f978cf4d019e',
  mountain: 'photo-1464822759023-fed622ff2c3b',
  park: 'photo-1441974231531-c6227db76b6e',
  // Science & Tech
  science: 'photo-1518770660439-4636190af475',
  technology: 'photo-1518770660439-4636190af475',
  ai: 'photo-1620712943543-bcc4688e7485',
  robot: 'photo-1485827404703-89b55fcc595e',
  space: 'photo-1446776811953-b23d57bd21aa',
  medical: 'photo-1576091160550-2173dba999ef',
  gene: 'photo-1576091160550-2173dba999ef',
  research: 'photo-1507413245164-6160d8298b31',
  innovation: 'photo-1451187580459-43490279c0fa',
  // Health
  health: 'photo-1505751172876-fa1923c5c528',
  hospital: 'photo-1576091160550-2173dba999ef',
  vaccine: 'photo-1584308666744-24d5c474f2ae',
  cancer: 'photo-1576091160550-2173dba999ef',
  medicine: 'photo-1584308666744-24d5c474f2ae',
  mental: 'photo-1493836512294-502baa1986e2',
  fitness: 'photo-1517836357463-d25dfeac3438',
  nutrition: 'photo-1490645935967-10de6ba17061',
  // Community / Humanitarian
  community: 'photo-1529156069898-49953e39b3ac',
  volunteer: 'photo-1469571486292-0ba58a3f068b',
  humanitarian: 'photo-1469571486292-0ba58a3f068b',
  charity: 'photo-1469571486292-0ba58a3f068b',
  children: 'photo-1488521787991-ed7bbaae773c',
  education: 'photo-1503676260728-1c00da094a0b',
  school: 'photo-1503676260728-1c00da094a0b',
  // Arts & Culture
  art: 'photo-1460661419201-fd4cecdf8a8b',
  music: 'photo-1511671782779-c97d3d27a1d4',
  culture: 'photo-1460661419201-fd4cecdf8a8b',
  museum: 'photo-1554907984-15263bfd63bd',
  // Sports
  sports: 'photo-1461896836934-ffe607ba8211',
  athletics: 'photo-1461896836934-ffe607ba8211',
  olympics: 'photo-1461896836934-ffe607ba8211',
  // Economy / Business
  economy: 'photo-1611974789855-9c2a0a7236a3',
  business: 'photo-1507679799987-c73779587ccf',
}

// Per-category fallback photo IDs
const CATEGORY_PHOTOS: Record<string, string> = {
  'Environment':   'photo-1441974231531-c6227db76b6e',
  'Science & Tech':'photo-1518770660439-4636190af475',
  'Health':        'photo-1505751172876-fa1923c5c528',
  'Community':     'photo-1529156069898-49953e39b3ac',
  'Humanitarian':  'photo-1469571486292-0ba58a3f068b',
  'Education':     'photo-1503676260728-1c00da094a0b',
  'Sports':        'photo-1461896836934-ffe607ba8211',
  'Arts & Culture':'photo-1460661419201-fd4cecdf8a8b',
}

function buildFallbackUrl(category: string, tags: string[]): string {
  // Try to match a tag keyword first
  for (const tag of tags) {
    const lower = tag.toLowerCase()
    for (const [kw, photoId] of Object.entries(KEYWORD_PHOTOS)) {
      if (lower.includes(kw)) {
        return `https://images.unsplash.com/${photoId}?w=800&h=450&fit=crop&auto=format`
      }
    }
  }
  // Fall back to category photo
  const photoId = CATEGORY_PHOTOS[category] ?? 'photo-1441974231531-c6227db76b6e'
  return `https://images.unsplash.com/${photoId}?w=800&h=450&fit=crop&auto=format`
}

interface ArticleHeroImageProps {
  src: string
  alt: string
  category: string
  tags: string[]
}

export function ArticleHeroImage({ src, alt, category, tags }: ArticleHeroImageProps) {
  const fallback = buildFallbackUrl(category, tags)
  const [imgSrc, setImgSrc] = useState(src)
  const [usedFallback, setUsedFallback] = useState(false)

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
