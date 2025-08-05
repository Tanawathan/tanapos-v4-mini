import React from 'react'
import { useMobileOrderStore } from '../../stores/mobileOrderStore'

const ProductCategoryTabs: React.FC = () => {
  const { categories, selectedCategory, setSelectedCategory } = useMobileOrderStore()

  return (
    <div className="p-4">
      <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
        {/* 全部分類 */}
        <button
          onClick={() => setSelectedCategory(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-full border-2 transition-all ${
            selectedCategory === null
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
          }`}
        >
          <span className="text-sm font-medium">🍽️ 全部</span>
        </button>

        {/* 分類標籤 */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full border-2 transition-all ${
              selectedCategory === category.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
            }`}
          >
            <span className="text-sm font-medium">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ProductCategoryTabs
