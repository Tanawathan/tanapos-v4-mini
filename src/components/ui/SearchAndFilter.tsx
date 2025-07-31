import React, { useState, useEffect } from 'react'
import { Search, X, Filter } from 'lucide-react'

interface SearchAndFilterProps {
  placeholder?: string
  onSearch: (query: string) => void
  onFilterChange?: (filters: any) => void
  filters?: Array<{
    key: string
    label: string
    options: Array<{
      value: string
      label: string
    }>
  }>
  className?: string
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  placeholder = '搜尋...',
  onSearch,
  onFilterChange,
  filters = [],
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [showFilters, setShowFilters] = useState(false)

  // 搜尋防抖
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearch(searchQuery)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, onSearch])

  // 篩選變更
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(activeFilters)
    }
  }, [activeFilters, onFilterChange])

  const handleFilterChange = (filterKey: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: value
    }))
  }

  const clearFilter = (filterKey: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[filterKey]
      return newFilters
    })
  }

  const clearAllFilters = () => {
    setActiveFilters({})
    setSearchQuery('')
  }

  const hasActiveFilters = Object.keys(activeFilters).length > 0 || searchQuery.length > 0

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 搜尋列 */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-500 dark:placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {filters.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 border rounded-lg flex items-center space-x-2 transition-colors
                       ${showFilters 
                         ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                         : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                       }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">篩選</span>
            {Object.keys(activeFilters).length > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                {Object.keys(activeFilters).length}
              </span>
            )}
          </button>
        )}

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            清除
          </button>
        )}
      </div>

      {/* 篩選區域 */}
      {showFilters && filters.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map(filter => (
              <div key={filter.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {filter.label}
                </label>
                <select
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">全部</option>
                  {filter.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 活動篩選標籤 */}
      {Object.keys(activeFilters).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([key, value]) => {
            const filter = filters.find(f => f.key === key)
            const option = filter?.options.find(o => o.value === value)
            if (!option) return null

            return (
              <span
                key={key}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm
                         bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
              >
                <span className="font-medium">{filter.label}:</span>
                <span className="ml-1">{option.label}</span>
                <button
                  onClick={() => clearFilter(key)}
                  className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SearchAndFilter
