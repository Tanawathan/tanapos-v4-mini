import React, { useEffect, useState, useRef } from 'react'
import { usePOSStore } from '../../lib/store-complete'
import { useNotifications } from '../ui/NotificationSystem'
import { ShoppingCart, Search, Filter, X, Plus, Minus, Move } from 'lucide-react'
import type { Product, CartItem, Category } from '../../lib/types-unified'

interface NewPOSSystemProps {
  uiStyle?: string
}

const NewPOSSystem: React.FC<NewPOSSystemProps> = ({ uiStyle = 'modern' }) => {
  const { 
    products, 
    categories, 
    cartItems, 
    loading, 
    loadProducts, 
    loadCategories,
    loadTables,
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
  
  // 狀態管理
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  // 手機版拖動購物車
  const [cartPosition, setCartPosition] = useState({ x: 20, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const cartRef = useRef<HTMLDivElement>(null)

  // 初始化數據
  useEffect(() => {
    loadProducts()
    loadCategories()
    loadTables()
  }, [loadProducts, loadCategories, loadTables])

  // 計算總計
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)

  // 篩選產品
  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesCategory && matchesSearch && product.is_available
  })

  // 處理添加到購物車
  const handleAddToCart = (product: Product) => {
    addToCart(product)
    notifications.success('成功', `已將 ${product.name} 加入購物車`)
  }

  // 處理數量更新
  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      notifications.info('提示', '已從購物車移除商品')
    } else {
      updateCartQuantity(productId, newQuantity)
    }
  }

  // 處理結帳
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      notifications.warning('警告', '購物車是空的')
      return
    }

    if (!selectedTable) {
      notifications.warning('警告', '請選擇桌號')
      return
    }

    try {
      const orderItems = cartItems.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        special_instructions: item.note,
        status: 'pending' as const
      }))

      await createOrder({
        table_number: parseInt(selectedTable),
        subtotal: cartTotal,
        tax_amount: cartTotal * 0.05, // 5% 稅
        total_amount: cartTotal * 1.05,
        status: 'pending',
        order_items: orderItems
      })
      
      clearCart()
      notifications.success('成功', '訂單已提交')
      setIsCartOpen(false)
    } catch (error) {
      notifications.error('錯誤', '訂單提交失敗')
    }
  }

  // 拖動處理（手機版）
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

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove)
      document.addEventListener('mouseup', handleDragEnd)
      document.addEventListener('touchmove', handleDragMove)
      document.addEventListener('touchend', handleDragEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
      document.removeEventListener('touchmove', handleDragMove)
      document.removeEventListener('touchend', handleDragEnd)
    }
  }, [isDragging])

  // 渲染產品卡片
  const renderProductCard = (product: Product) => {
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
        
        {/* 產品信息 */}
        <div className="pos-product-info">
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <div className="price">NT$ {product.price}</div>
        </div>
        
        {/* 控制按鈕 */}
        <div className="pos-product-actions">
          {quantity > 0 ? (
            <div className="pos-quantity-controls">
              <button
                className="btn-pos-secondary quantity-btn"
                onClick={() => handleUpdateQuantity(product.id, quantity - 1)}
              >
                <Minus size={16} />
              </button>
              <span className="quantity-display">{quantity}</span>
              <button
                className="btn-pos-secondary quantity-btn"
                onClick={() => handleUpdateQuantity(product.id, quantity + 1)}
              >
                <Plus size={16} />
              </button>
              <button
                className="btn-pos-danger"
                onClick={() => removeFromCart(product.id)}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button 
              className="btn-pos-primary"
              onClick={() => handleAddToCart(product)}
            >
              加入購物車
            </button>
          )}
        </div>
      </div>
    )
  }

  // 渲染購物車項目
  const renderCartItem = (item: CartItem) => (
    <div key={item.id} className="pos-cart-item">
      <div className="pos-cart-item-info">
        <h4>{item.name}</h4>
        <p>NT$ {item.price} × {item.quantity}</p>
        {item.note && <p className="item-note">備註: {item.note}</p>}
      </div>
      <div className="pos-cart-item-controls">
        <button
          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
          className="quantity-btn"
        >
          <Minus size={14} />
        </button>
        <span>{item.quantity}</span>
        <button
          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
          className="quantity-btn"
        >
          <Plus size={14} />
        </button>
        <button
          onClick={() => removeFromCart(item.id)}
          className="btn-pos-danger-small"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )

  // 渲染桌面版購物車
  const renderDesktopCart = () => (
    <div className="pos-cart-desktop">
      <div className="pos-cart-header">
        <h3>購物車 ({cartItemCount})</h3>
      </div>
      
      <div className="pos-cart-content">
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <ShoppingCart size={48} />
            <p>購物車是空的</p>
            <p>選擇商品開始點餐</p>
          </div>
        ) : (
          <>
            <div className="pos-cart-items">
              {cartItems.map(renderCartItem)}
            </div>
            
            <div className="pos-cart-footer">
              {/* 桌號選擇 */}
              <div className="table-selection">
                <label>桌號:</label>
                <select 
                  value={selectedTable || ''} 
                  onChange={(e) => setSelectedTable(e.target.value)}
                >
                  <option value="">請選擇桌號</option>
                  {tables.map(table => (
                    <option key={table.id} value={table.table_number}>
                      桌號 {table.table_number}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* 總計 */}
              <div className="pos-cart-total">
                <div className="total-amount">
                  總計: NT$ {cartTotal.toFixed(0)}
                </div>
              </div>
              
              {/* 操作按鈕 */}
              <div className="pos-cart-actions">
                <button 
                  onClick={clearCart}
                  className="btn-pos-secondary"
                >
                  清空購物車
                </button>
                <button 
                  onClick={handleCheckout}
                  className="btn-pos-primary checkout-btn"
                  disabled={cartItems.length === 0 || !selectedTable}
                >
                  下單
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )

  // 渲染手機版購物車
  const renderMobileCart = () => (
    <div 
      ref={cartRef}
      className={`pos-cart-mobile ${isDragging ? 'dragging' : ''}`}
      style={{ 
        transform: `translate(${cartPosition.x}px, ${cartPosition.y}px)` 
      }}
    >
      <div 
        className="pos-cart-handle"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <Move size={16} />
        <span>購物車 ({cartItemCount})</span>
        <button
          onClick={() => setIsCartOpen(!isCartOpen)}
          className="cart-toggle"
        >
          {isCartOpen ? <X size={16} /> : <ShoppingCart size={16} />}
        </button>
      </div>
      
      {isCartOpen && (
        <div className="pos-cart-content">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <p>購物車是空的</p>
            </div>
          ) : (
            <>
              <div className="pos-cart-items">
                {cartItems.map(renderCartItem)}
              </div>
              
              <div className="pos-cart-footer">
                {/* 桌號選擇 */}
                <select 
                  value={selectedTable || ''} 
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="table-select"
                >
                  <option value="">選擇桌號</option>
                  {tables.map(table => (
                    <option key={table.id} value={table.table_number}>
                      桌號 {table.table_number}
                    </option>
                  ))}
                </select>
                
                {/* 總計 */}
                <div className="cart-total-highlight">
                  <span>總計:</span>
                  <span>NT$ {cartTotal.toFixed(0)}</span>
                </div>
                
                {/* 操作按鈕 */}
                <div className="cart-actions">
                  <button onClick={clearCart} className="btn-secondary">
                    清空
                  </button>
                  <button 
                    onClick={handleCheckout}
                    className="btn-primary"
                    disabled={cartItems.length === 0 || !selectedTable}
                  >
                    結帳
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="pos-loading">
        <div className="loading-spinner"></div>
        <p>載入中...</p>
      </div>
    )
  }

  return (
    <div className={`new-pos-system ui-style-${uiStyle}`}>
      {/* 桌面版佈局 */}
      <div className="pos-layout-desktop">
        {/* 主內容區域 */}
        <div className="pos-main-content">
          {/* 搜尋和篩選區域 */}
          <div className="pos-search-section">
            <div className="search-container">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="搜尋商品..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            
            {/* 分類篩選 */}
            <div className="categories-container">
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
          <div className="pos-products-section">
            <div className="pos-products-grid">
              {filteredProducts.length === 0 ? (
                <div className="pos-empty-state">
                  <Filter size={48} />
                  <p>沒有找到商品</p>
                  <p>請調整搜尋條件或選擇其他分類</p>
                </div>
              ) : (
                filteredProducts.map(renderProductCard)
              )}
            </div>
          </div>
        </div>

        {/* 桌面版購物車 */}
        <div className="pos-cart-sidebar">
          {renderDesktopCart()}
        </div>
      </div>

      {/* 手機版佈局 */}
      <div className="pos-layout-mobile">
        {/* 主內容 */}
        <div className="pos-main-mobile">
          {/* 搜尋區域 */}
          <div className="pos-search-mobile">
            <input
              type="text"
              placeholder="搜尋商品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-mobile"
            />
            
            {/* 分類滾動 */}
            <div className="categories-scroll">
              <button
                className={`category-btn-mobile ${!selectedCategory ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
              >
                全部
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`category-btn-mobile ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* 產品網格 */}
          <div className="pos-products-mobile">
            {filteredProducts.length === 0 ? (
              <div className="pos-empty-state">
                <Filter size={48} />
                <p>沒有找到商品</p>
              </div>
            ) : (
              filteredProducts.map(renderProductCard)
            )}
          </div>
        </div>

        {/* 浮動購物車 */}
        {renderMobileCart()}
      </div>
    </div>
  )
}

export default NewPOSSystem
