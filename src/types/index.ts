export interface Article {
  id: string
  title: string
  summary: string
  content: string
  sourceUrl: string
  sourceName: string
  region: string
  country: string
  category: string
  tags: string[]
  publishedAt: string
  imageUrl: string
  positivityScore: number
  trending: boolean
  featured: boolean
  readTime: number
}

export interface User {
  id: string
  name: string
  email: string
}

export type Region =
  | 'Global'
  | 'North America'
  | 'Europe'
  | 'Asia'
  | 'Africa'
  | 'Latin America'
  | 'Middle East'
  | 'Oceania'

export type Category =
  | 'Science & Tech'
  | 'Environment'
  | 'Community'
  | 'Health'
  | 'Education'
  | 'Sports'
  | 'Humanitarian'
  | 'Arts & Culture'

export const REGIONS: Region[] = [
  'Global',
  'North America',
  'Europe',
  'Asia',
  'Africa',
  'Latin America',
  'Middle East',
  'Oceania',
]

export const CATEGORIES: Category[] = [
  'Science & Tech',
  'Environment',
  'Community',
  'Health',
  'Education',
  'Sports',
  'Humanitarian',
  'Arts & Culture',
]

export const CATEGORY_COLORS: Record<string, string> = {
  'Science & Tech': 'bg-blue-100 text-blue-800',
  'Environment': 'bg-green-100 text-green-800',
  'Community': 'bg-purple-100 text-purple-800',
  'Health': 'bg-red-100 text-red-800',
  'Education': 'bg-yellow-100 text-yellow-800',
  'Sports': 'bg-orange-100 text-orange-800',
  'Humanitarian': 'bg-pink-100 text-pink-800',
  'Arts & Culture': 'bg-indigo-100 text-indigo-800',
}

export const REGION_COLORS: Record<string, string> = {
  'Global': 'bg-gray-100 text-gray-700',
  'North America': 'bg-sky-100 text-sky-700',
  'Europe': 'bg-violet-100 text-violet-700',
  'Asia': 'bg-amber-100 text-amber-700',
  'Africa': 'bg-lime-100 text-lime-700',
  'Latin America': 'bg-rose-100 text-rose-700',
  'Middle East': 'bg-orange-100 text-orange-700',
  'Oceania': 'bg-teal-100 text-teal-700',
}
