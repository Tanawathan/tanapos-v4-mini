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

  return (
    <div className="p-4">
      {/* 商品類型過濾器 */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">商品類型</h3>
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setProductFilter('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full border-2 transition-all ${
              productFilter === 'all'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
            }`}
          >
            <span className="text-sm font-medium">🍽️ 全部</span>
          </button>
          
          <button
            onClick={() => setProductFilter('products')}
            className={`flex-shrink-0 px-4 py-2 rounded-full border-2 transition-all ${
              productFilter === 'products'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
            }`}
          >
            <span className="text-sm font-medium">🍕 單品</span>
          </button>
          
          <button
            onClick={() => setProductFilter('combos')}
            className={`flex-shrink-0 px-4 py-2 rounded-full border-2 transition-all ${
              productFilter === 'combos'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
            }`}
          >
            <span className="text-sm font-medium">🍱 套餐</span>
          </button>
        </div>
      </div>

      {/* 分類過濾器 */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">商品分類</h3>
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          {/* 全部分類 */}
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full border-2 transition-all ${
              selectedCategory === null
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
            }`}
          >
            <span className="text-sm font-medium">📋 全部分類</span>
          </button>

          {/* 分類標籤 */}
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full border-2 transition-all ${
                selectedCategory === category.id
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
              }`}
            >
              <span className="text-sm font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProductCategoryTabs
