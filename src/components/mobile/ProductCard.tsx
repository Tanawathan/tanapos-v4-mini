import React from 'react'
import { useMobileOrderStore, type MenuItem } from '../../stores/mobileOrderStore'

interface ProductCardProps {
  product: MenuItem
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, openComboSelector, cartItems, updateCartQuantity, removeFromCart } = useMobileOrderStore()

  const current = React.useMemo(() => cartItems.find(ci => ci.id === product.id), [cartItems, product.id])

  const handleAddToCart = () => {
    // 檢查是否為可選擇的套餐
    if (product.type === 'combo' && product.combo_type === 'selectable') {
      // 打開套餐選擇器
      openComboSelector(product)
    } else {
      // 直接加入購物車（普通產品或固定套餐）
      addToCart(product)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex p-3">
        {/* 商品資訊：移除圖片，專注文字與價格 */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-gray-800 truncate">
              {product.name}
            </h3>
            {/* 套餐標識 */}
            {product.type === 'combo' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                🍱 套餐
              </span>
            )}
          </div>
      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {product.description || (product.type === 'combo' ? '精選套餐組合' : '經典美味料理')}
          </p>
      <div className="flex items-center justify-between">
            <div className="flex items-center">
        <span className="text-lg font-bold text-gray-800">
                💰 NT${product.price}
              </span>
            </div>
            {current ? (
              <div className="flex items-center gap-2">
                <button onClick={() => updateCartQuantity(current.instanceId, current.quantity - 1)} className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 grid place-items-center">-</button>
                <span className="min-w-[1.5rem] text-center text-sm">{current.quantity}</span>
                <button onClick={() => updateCartQuantity(current.instanceId, current.quantity + 1)} className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 grid place-items-center">+</button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors min-w-[72px] active:scale-95 text-sm"
              >
                {product.type === 'combo' && product.combo_type === 'selectable' 
                  ? '選擇' 
                  : '+ 加入'
                }
              </button>
            )}
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
