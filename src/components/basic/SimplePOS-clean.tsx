import React, { useEffect, useState, useRef } from 'react'
import { usePOSStore } from '../../lib/store-complete'
import { useNotifications } from '../ui/NotificationSystem'
import SearchAndFilter from '../ui/SearchAndFilter'
import { ShoppingCart, X, Move } from 'lucide-react'
import type { Product, CartItem } from '../../lib/types-unified'

const SimplePOS: React.FC = () => {
  const { 
    products, 
    categories, 
    cartItems, 
    loading, 
    loadProducts, 
    loadCategories,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart
  } = usePOSStore()
  
  const notifications = useNotifications()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [isCartExpanded, setIsCartExpanded] = useState(false)
  
  // 拖動相關狀態
  const [cartPosition, setCartPosition] = useState({ x: 20, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const cartRef = useRef<HTMLDivElement>(null)

  // 計算購物車商品總數量和總價
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)

  // 拖動控制函數
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    if (cartRef.current) {
      const rect = cartRef.current.getBoundingClientRect()
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top
      })
    }
  }

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    const newX = Math.max(0, Math.min(window.innerWidth - 300, clientX - dragOffset.x))
    const newY = Math.max(0, Math.min(window.innerHeight - 100, clientY - dragOffset.y))
    
    setCartPosition({ x: newX, y: newY })
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  // 添加商品到購物車
  const handleAddToCart = (product: Product) => {
    addToCart(product)
    notifications.success('成功', `已將 ${product.name} 加入購物車`)
  }

  // 結帳處理
  const handleCheckout = () => {
    if (cartItems.length > 0) {
      notifications.info('提示', '結帳功能開發中...')
    }
  }

  // 篩選產品
  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesCategory && matchesSearch
  })

  // 拖動事件監聽
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove)
      document.addEventListener('mouseup', handleDragEnd)
      document.addEventListener('touchmove', handleDragMove)
      document.addEventListener('touchend', handleDragEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove)
        document.removeEventListener('mouseup', handleDragEnd)
        document.removeEventListener('touchmove', handleDragMove)
        document.removeEventListener('touchend', handleDragEnd)
      }
    }
  }, [isDragging, dragOffset])

  // 載入數據
  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [loadProducts, loadCategories])

  return (
    <div className="pos-container">
      {/* 主內容區域 */}
      <div className="pos-main-mobile pos-main-tablet pos-main-desktop">
        {/* 搜尋和篩選 */}
        <div className="pos-search-area">
          <SearchAndFilter
            placeholder="搜尋商品..."
            onSearch={setSearchQuery}
            onFilterChange={setActiveFilters}
          />
          
          {/* 分類按鈕 */}
          <div className="pos-categories">
            <button
              className={`category-btn ${!selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              全部
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* 產品網格 */}
        <div className="pos-products-grid">
          {loading ? (
            <div className="pos-loading">載入中...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="pos-empty-state">
              <p>沒有找到商品</p>
            </div>
          ) : (
            filteredProducts.map(product => {
              const cartItem = cartItems.find(item => item.id === product.id)
              const quantity = cartItem ? cartItem.quantity : 0
              
              return (
                <div key={product.id} className="pos-product-card">
                  {/* 數量徽章 */}
                  {quantity > 0 && (
                    <div className="pos-quantity-badge">
                      {quantity}
                    </div>
                  )}
                  
                  {/* 產品標題 */}
                  <h3>{product.name}</h3>
                  
                  {/* 產品描述 */}
                  <p>{product.description}</p>
                  
                  {/* 價格 */}
                  <div className="price">
                    NT$ {product.price}
                  </div>
                  
                  {/* 添加按鈕 */}
                  <button 
                    className="btn-pos-primary"
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.is_available}
                  >
                    {quantity > 0 ? `已加入 ${quantity} 個` : '加入購物車'}
                  </button>
                  
                  {/* 缺貨狀態 */}
                  {!product.is_available && (
                    <div className="pos-product-unavailable">缺貨</div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 桌面版購物車 */}
      <div className="pos-cart-container">
        <div className="pos-cart">
          <h3>購物車 ({cartItems.length})</h3>
          
          {cartItems.length === 0 ? (
            <div className="pos-empty-state">
              <p>購物車是空的</p>
              <p>選擇商品開始點餐</p>
            </div>
          ) : (
            <>
              {/* 購物車項目 */}
              <div className="pos-cart-items">
                {cartItems.map(item => (
                  <div key={item.id} className="pos-cart-item">
                    <div className="pos-cart-item-info">
                      <h4>{item.name}</h4>
                      <p>NT$ {item.price}</p>
                    </div>
                    <div className="pos-cart-item-controls">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="btn-pos-secondary"
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="btn-pos-secondary"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="btn-pos-danger"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 購物車總計 */}
              <div className="pos-cart-total">
                <div className="total-row">
                  <span>總計：</span>
                  <span>NT$ {cartTotal}</span>
                </div>
                <button 
                  className="btn-pos-primary pos-checkout-btn"
                  onClick={handleCheckout}
                >
                  結帳
                </button>
                <button 
                  className="btn-pos-secondary"
                  onClick={clearCart}
                >
                  清空購物車
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 手機版浮動購物車 */}
      <div 
        ref={cartRef}
        className={`pos-cart-mobile ${isCartExpanded ? 'expanded' : ''} ${isDragging ? 'dragging' : ''}`}
        style={{
          left: `${cartPosition.x}px`,
          top: `${cartPosition.y}px`,
        }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        {/* 收縮狀態 */}
        {!isCartExpanded ? (
          <div 
            className="cart-toggle"
            onClick={() => setIsCartExpanded(true)}
          >
            <ShoppingCart size={20} />
            {cartItemCount > 0 && (
              <span className="cart-badge">{cartItemCount}</span>
            )}
          </div>
        ) : (
          /* 展開狀態 */
          <div className="pos-cart-content">
            <div className="pos-cart-header">
              <h3>購物車</h3>
              <button onClick={() => setIsCartExpanded(false)}>
                <X size={16} />
              </button>
            </div>
            
            {cartItems.length === 0 ? (
              <div className="pos-empty-state">
                <p>購物車是空的</p>
              </div>
            ) : (
              <>
                <div className="pos-cart-items">
                  {cartItems.map(item => (
                    <div key={item.id} className="pos-cart-item">
                      <div className="pos-cart-item-info">
                        <h4>{item.name}</h4>
                        <p>NT$ {item.price}</p>
                      </div>
                      <div className="pos-cart-item-controls">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pos-cart-total">
                  <div className="total-row">
                    <span>總計：</span>
                    <span>NT$ {cartTotal}</span>
                  </div>
                  <button 
                    className="pos-checkout-btn"
                    onClick={handleCheckout}
                  >
                    結帳
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SimplePOS
