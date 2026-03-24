'use client'

import { REGIONS, CATEGORIES, Region, Category } from '@/types'

interface FilterBarProps {
  selectedRegion: string
  selectedCategory: string
  onRegionChange: (region: string) => void
  onCategoryChange: (category: string) => void
}

export function FilterBar({ selectedRegion, selectedCategory, onRegionChange, onCategoryChange }: FilterBarProps) {
  return (
    <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row gap-3 py-3">
          {/* Region filter */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex-shrink-0">Region:</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => onRegionChange('All')}
                className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                  selectedRegion === 'All'
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {REGIONS.filter(r => r !== 'Global').map(region => (
                <button
                  key={region}
                  onClick={() => onRegionChange(region)}
                  className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                    selectedRegion === region
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px bg-gray-200 self-stretch" />

          {/* Category filter */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex-shrink-0">Category:</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => onCategoryChange('All')}
                className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                  selectedCategory === 'All'
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => onCategoryChange(category)}
                  className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                    selectedCategory === category
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
