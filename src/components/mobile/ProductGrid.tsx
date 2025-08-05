import React from 'react'
import { useMobileOrderStore } from '../../stores/mobileOrderStore'
import ProductCard from './ProductCard'

const ProductGrid: React.FC = () => {
  const { products, selectedCategory, loading } = useMobileOrderStore()

  // 根據選擇的分類過濾商品
  const filteredProducts = selectedCategory
    ? products.filter(product => product.category_id === selectedCategory)
    : products

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg border animate-pulse">
            <div className="flex p-4">
              <div className="w-20 h-20 bg-gray-200 rounded-lg mr-4"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🍽️</div>
        <p className="text-gray-600 text-lg">暫無商品</p>
        <p className="text-gray-500 text-sm mt-2">
          {selectedCategory ? '該分類下暫無商品' : '請先載入商品資料'}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {filteredProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export default ProductGrid
