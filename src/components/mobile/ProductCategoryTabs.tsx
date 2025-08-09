import React from 'react'
import { useMobileOrderStore } from '../../stores/mobileOrderStore'

interface Props { compact?: boolean }

const ProductCategoryTabs: React.FC<Props> = ({ compact = false }) => {
  const { 
    categories, 
    selectedCategory, 
    productFilter,
    setSelectedCategory,
    setProductFilter
  } = useMobileOrderStore()

  const handleTypeSelect = (type: 'all' | 'combos' | 'products') => {
    setProductFilter(type)
    if (type !== 'all') {
      setSelectedCategory(null)
    }
  }

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId)
    // 選分類時，類型回到 all，避免重複概念
    setProductFilter('all')
  }

  const typeButtons = [
    { id: 'all', label: compact ? '全部' : '🍽️ 全部' },
    { id: 'combos', label: compact ? '套餐' : '🍱 套餐' },
    { id: 'products', label: compact ? '單品' : '🍕 單品' }
  ]

  return (
    <div className={compact ? 'space-y-1' : 'p-2 md:p-4'}>
      <div className={`flex overflow-x-auto scrollbar-hide pb-1 ${compact ? 'gap-1' : 'space-x-2 mb-2'}`}>
        {typeButtons.map(t => (
          <button
            key={t.id}
            onClick={() => handleTypeSelect(t.id as any)}
            className={`flex-shrink-0 ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} rounded-full border transition-all ${
              productFilter === t.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className={`flex overflow-x-auto scrollbar-hide pb-1 ${compact ? 'gap-1' : 'space-x-2'}`}>
        <button
          onClick={() => handleCategorySelect(null)}
          className={`flex-shrink-0 ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} rounded-full border transition-all ${
            selectedCategory === null ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          全分類
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategorySelect(cat.id)}
            className={`flex-shrink-0 ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} rounded-full border transition-all ${
              selectedCategory === cat.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ProductCategoryTabs
