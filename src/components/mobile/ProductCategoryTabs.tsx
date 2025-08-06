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

  // 創建統一的分類系統
  const unifiedCategories = [
    { id: 'all', name: '🍽️ 全部', type: 'all' },
    { id: 'combos', name: '🍱 套餐', type: 'combos' },
    { id: 'products', name: '🍕 單品', type: 'products' },
    ...categories.map(cat => ({ id: cat.id, name: cat.name, type: 'category' }))
  ]

  const handleCategorySelect = (item: any) => {
    if (item.type === 'all') {
      setProductFilter('all')
      setSelectedCategory(null)
    } else if (item.type === 'combos') {
      setProductFilter('combos')
      setSelectedCategory(null)
    } else if (item.type === 'products') {
      setProductFilter('products')
      setSelectedCategory(null)
    } else {
      setProductFilter('all')
      setSelectedCategory(item.id)
    }
  }

  const getActiveState = (item: any) => {
    if (item.type === 'all') {
      return productFilter === 'all' && selectedCategory === null
    } else if (item.type === 'combos') {
      return productFilter === 'combos'
    } else if (item.type === 'products') {
      return productFilter === 'products'
    } else {
      return selectedCategory === item.id
    }
  }

  return (
    <div className="p-4">
      {/* 統一分類標籤 */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">選擇分類</h3>
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-1">
          {unifiedCategories.map((item) => (
            <button
              key={item.id}
              onClick={() => handleCategorySelect(item)}
              className={`flex-shrink-0 px-4 py-2 rounded-full border-2 transition-all ${
                getActiveState(item)
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <span className="text-sm font-medium">{item.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProductCategoryTabs
