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
    clearCart,
    selectedTable,
    setSelectedTable,
    tables,
    createOrder
  } = usePOSStore()
  
  const notifications = useNotifications()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [isCartExpanded, setIsCartExpanded] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [note, setNote] = useState('')
  
  // 拖動相關狀態
  const [cartPosition, setCartPosition] = useState({ x: 20, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const cartRef = useRef<HTMLDivElement>(null)

  // 計算購物車商品總數量和總價
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)

  // 處理添加商品到購物車
  const handleAddToCart = (product: Product) => {
    addToCart(product)
    notifications.success('成功', `已將 ${product.name} 加入購物車`)
  }

  // 處理更新購物車商品數量
  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      updateCartQuantity(productId, quantity)
    }
  }

  // 處理清空購物車
  const handleClearCart = () => {
    if (cartItems.length > 0) {
      clearCart()
      notifications.info('提示', '購物車已清空')
    }
  }

  // 處理結帳
  const handleCheckout = async () => {
    if (!selectedTable) {
      notifications.error('錯誤', '請選擇桌號')
      return
    }

    if (cartItems.length === 0) {
      notifications.error('錯誤', '購物車是空的')
      return
    }

    try {
      const orderData = {
        table_id: selectedTable,
        table_number: tables.find(t => t.id === selectedTable)?.table_number,
        subtotal: cartTotal,
        tax_amount: cartTotal * 0.1,
        total_amount: cartTotal * 1.1,
        status: 'pending' as const,
        notes: note,
        order_items: cartItems.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          status: 'pending' as const,
          special_instructions: item.note
        }))
      }

      await createOrder(orderData)
      clearCart()
      setSelectedTable(null)
      setNote('')
      notifications.success('成功', `訂單已建立，總金額: NT$ ${Math.round(cartTotal * 1.1)}`)
    } catch (error) {
      console.error('建立訂單失敗:', error)
      notifications.error('錯誤', '建立訂單失敗，請稍後再試')
    }
  }

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
    console.log('SimplePOS: 開始載入數據')
    loadProducts()
    loadCategories()
  }, [loadProducts, loadCategories])

  // 調試用 - 監控數據變化
  useEffect(() => {
    console.log('SimplePOS: products數量:', products.length)
    console.log('SimplePOS: products:', products)
  }, [products])

  useEffect(() => {
    console.log('SimplePOS: categories數量:', categories.length)
    console.log('SimplePOS: categories:', categories)
  }, [categories])

  useEffect(() => {
    console.log('SimplePOS: loading狀態:', loading)
  }, [loading])

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
                <div 
                  key={product.id} 
                  className="pos-product-card"
                >
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
                  
                  {/* 控制按鈕 */}
                  {quantity > 0 ? (
                    <div className="pos-product-controls">
                      <button
                        className="btn-pos-secondary"
                        onClick={() => handleUpdateQuantity(product.id, quantity - 1)}
                        disabled={quantity <= 1}
                      >
                        −
                      </button>
                      <span>{quantity}</span>
                      <button
                        className="btn-pos-secondary"
                        onClick={() => handleUpdateQuantity(product.id, quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        className="btn-pos-danger"
                        onClick={() => removeFromCart(product.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="btn-pos-primary"
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.is_available}
                    >
                      加入購物車
                    </button>
                  )}
                  
                  {/* 缺貨狀態 */}
                  {!product.is_available && (
                    <div className="pos-product-unavailable">缺貨</div>
                  )}

                  {/* 商品詳情按鈕 */}
                  <button
                    className="btn-pos-text"
                    onClick={() => setSelectedProduct(product)}
                  >
                    商品詳情
                  </button>
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

              {/* 桌號選擇 */}
              <div className="pos-table-select">
                <label>桌號</label>
                <select 
                  value={selectedTable || ''} 
                  onChange={(e) => setSelectedTable(e.target.value)}
                >
                  <option value="">請選擇桌號</option>
                  {tables
                    .filter(table => table.status === 'available')
                    .map(table => (
                      <option key={table.id} value={table.id}>
                        {table.table_number}號桌 ({table.capacity}人)
                      </option>
                    ))}
                </select>
              </div>

              {/* 備註 */}
              <div className="pos-note">
                <label>備註</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="請輸入特殊要求..."
                  rows={2}
                />
              </div>

              {/* 購物車總計 */}
              <div className="pos-cart-total">
                <div className="pos-subtotal-row">
                  <span>小計：</span>
                  <span>NT$ {cartTotal}</span>
                </div>
                <div className="pos-tax-row">
                  <span>稅額 (10%)：</span>
                  <span>NT$ {Math.round(cartTotal * 0.1)}</span>
                </div>
                <div className="pos-total-row">
                  <span>總計：</span>
                  <span>NT$ {Math.round(cartTotal * 1.1)}</span>
                </div>
                <button 
                  className="btn-pos-primary pos-checkout-btn"
                  onClick={handleCheckout}
                  disabled={!selectedTable || cartItems.length === 0}
                >
                  結帳
                </button>
                <button 
                  className="btn-pos-secondary"
                  onClick={handleClearCart}
                  disabled={cartItems.length === 0}
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

      {/* 商品詳情對話框 */}
      {selectedProduct && (
        <div className="pos-modal">
          <div className="pos-modal-content">
            <div className="pos-modal-header">
              <h3>{selectedProduct.name}</h3>
              <button onClick={() => setSelectedProduct(null)}>✕</button>
            </div>
            <div className="pos-modal-body">
              {selectedProduct.image_url && (
                <img 
                  src={selectedProduct.image_url} 
                  alt={selectedProduct.name}
                  className="pos-product-image"
                />
              )}
              <p className="pos-product-description">
                {selectedProduct.description || '暫無商品說明'}
              </p>
              <div className="pos-product-info">
                <div className="info-row">
                  <span>價格：</span>
                  <span>NT$ {selectedProduct.price}</span>
                </div>
                <div className="info-row">
                  <span>庫存狀態：</span>
                  <span className={selectedProduct.is_available ? 'text-success' : 'text-danger'}>
                    {selectedProduct.is_available ? '有現貨' : '缺貨中'}
                  </span>
                </div>
                {selectedProduct.preparation_time && (
                  <div className="info-row">
                    <span>製作時間：</span>
                    <span>{selectedProduct.preparation_time} 分鐘</span>
                  </div>
                )}
              </div>
              <div className="pos-modal-footer">
                <button
                  className="btn-pos-primary"
                  onClick={() => {
                    handleAddToCart(selectedProduct)
                    setSelectedProduct(null)
                  }}
                  disabled={!selectedProduct.is_available}
                >
                  加入購物車
                </button>
                <button
                  className="btn-pos-secondary"
                  onClick={() => setSelectedProduct(null)}
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SimplePOS
