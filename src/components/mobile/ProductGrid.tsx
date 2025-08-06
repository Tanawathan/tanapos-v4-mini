import React from 'react'
import { useMobileOrderStore, type MenuItem } from '../../stores/mobileOrderStore'
import ProductCard from './ProductCard'

const ProductGrid: React.FC = () => {
  const { products, selectedCategory, productFilter, loading } = useMobileOrderStore()

  // 根據選擇的商品類型和分類過濾商品
  const filteredProducts: MenuItem[] = React.useMemo(() => {
    let filtered = products

    // 首先過濾掉暫停供應的商品
    filtered = filtered.filter(item => item.is_available !== false)

    // 然後根據商品類型過濾
    if (productFilter === 'products') {
      filtered = filtered.filter(item => item.type === 'product')
    } else if (productFilter === 'combos') {
      filtered = filtered.filter(item => item.type === 'combo')
    }

    // 最後根據分類過濾
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category_id === selectedCategory)
    }

    return filtered
  }, [products, selectedCategory, productFilter])

  // 調試用：顯示載入的資料統計
  React.useEffect(() => {
    if (products.length > 0) {
      const productCount = products.filter(item => item.type === 'product').length
      const comboCount = products.filter(item => item.type === 'combo').length
      console.log('📋 ProductGrid 資料統計:', {
        總數: products.length,
        產品數: productCount,
        套餐數: comboCount,
        當前商品類型過濾: productFilter,
        當前分類: selectedCategory,
        過濾後數量: filteredProducts.length
      })
    }
  }, [products, selectedCategory, productFilter, filteredProducts.length])

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
        {/* 調試資訊 */}
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-xs">
          <p>調試資訊:</p>
          <p>總商品數: {products.length}</p>
          <p>商品類型過濾: {productFilter}</p>
          <p>選擇分類: {selectedCategory || '無'}</p>
          <p>商品類型分布: {products.map(p => p.type).join(', ')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {filteredProducts.map((item) => (
        <ProductCard key={item.id} product={item} />
      ))}
    </div>
  )
}

export default ProductGrid
