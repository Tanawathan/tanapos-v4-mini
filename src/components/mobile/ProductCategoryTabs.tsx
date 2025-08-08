import React from 'react'
import { useMobileOrderStore } from '../../stores/mobileOrderStore'

const ProductCategoryTabs: React.FC = () => {
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

  return (
    <div className="p-2 md:p-4">
      {/* 類型（不與分類重疊） */}
      <div className="mb-2">
        <h3 className="text-xs font-medium text-gray-600 mb-2">類型</h3>
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-1">
          {[
            { id: 'all', label: '🍽️ 全部' },
            { id: 'combos', label: '🍱 套餐' },
            { id: 'products', label: '🍕 單品' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => handleTypeSelect(t.id as any)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full border-2 transition-all text-sm ${
                productFilter === t.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 分類（純分類，不含「套餐/單品」） */}
      <div>
        <h3 className="text-xs font-medium text-gray-600 mb-2">分類</h3>
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => handleCategorySelect(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full border-2 transition-all text-sm ${
              selectedCategory === null ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            全分類
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full border-2 transition-all text-sm ${
                selectedCategory === cat.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProductCategoryTabs
