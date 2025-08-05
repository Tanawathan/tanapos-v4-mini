import React from 'react'
import { useMobileOrderStore } from '../../stores/mobileOrderStore'
import type { Product } from '../../lib/types'

interface ProductCardProps {
  product: Product
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useMobileOrderStore()

  const handleAddToCart = () => {
    addToCart(product)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex p-4">
        {/* 商品圖片 */}
        <div className="w-20 h-20 flex-shrink-0 mr-4">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                // 圖片載入失敗時顯示預設圖示
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div className={`w-full h-full bg-gray-100 rounded-lg flex items-center justify-center ${product.image_url ? 'hidden' : ''}`}>
            <span className="text-gray-400 text-2xl">🍽️</span>
          </div>
        </div>

        {/* 商品資訊 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {product.description || '經典美味料理'}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-800">
                💰 NT${product.price}
              </span>
            </div>
            <button
              onClick={handleAddToCart}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors min-w-[80px] active:scale-95"
            >
              + 加入
            </button>
          </div>
        </div>
      </div>

      {/* 商品可用性指示 */}
      {!product.is_available && (
        <div className="px-4 pb-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            ⏸️ 暫停供應
          </span>
        </div>
      )}
    </div>
  )
}

export default ProductCard
