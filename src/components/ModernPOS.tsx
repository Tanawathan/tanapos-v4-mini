import React, { useEffect, useState } from 'react'
import { usePOSStore } from '../../lib/store-complete'
import { useNotifications } from '../ui/NotificationSystem'
import SearchAndFilter from '../ui/SearchAndFilter'
import type { Product, CartItem } from '../../lib/types-unified'

const ModernPOS: React.FC = () => {
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

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [loadProducts, loadCategories])

  // 篩選產品
  const filteredProducts = products.filter(product => {
    if (selectedCategory && product.category_id !== selectedCategory) {
      return false
    }
    
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    
    if (activeFilters.availability === 'available' && !product.is_available) {
      return false
    }
    if (activeFilters.availability === 'unavailable' && product.is_available) {
      return false
    }
    
    return true
  })

  // 計算購物車總計
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const handleAddToCart = (product: Product) => {
    addToCart(product)
    notifications.addNotification({
      id: Date.now().toString(),
      message: `已將 ${product.name} 加入購物車`,
      type: 'success'
    })
  }

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      notifications.addNotification({
        id: Date.now().toString(),
        message: '購物車是空的',
        type: 'warning'
      })
      return
    }

    // 這裡可以添加結帳邏輯
    notifications.addNotification({
      id: Date.now().toString(),
      message: `訂單已建立，總金額 NT$ ${cartTotal}`,
      type: 'success'
    })
    clearCart()
  }

  if (loading) {
    return (
      <div className="modern-container" style={{ paddingTop: '3rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px' 
        }}>
          <div className="modern-loading" style={{ width: '40px', height: '40px' }}></div>
          <span style={{ marginLeft: '1rem', color: 'var(--color-gray-600)' }}>載入中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="modern-container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {/* 頁面標題 */}
      <div className="modern-page-header">
        <h1 className="modern-page-title">點餐系統</h1>
        <p className="modern-page-subtitle">選擇商品並加入購物車</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
        {/* 左側：商品區域 */}
        <div>
          {/* 搜尋與篩選 */}
          <div className="modern-card" style={{ marginBottom: '1.5rem' }}>
            <SearchAndFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilters={activeFilters}
              onFiltersChange={setActiveFilters}
              availableFilters={{
                availability: {
                  label: '可用性',
                  options: [
                    { value: 'all', label: '全部' },
                    { value: 'available', label: '可用' },
                    { value: 'unavailable', label: '不可用' }
                  ]
                }
              }}
            />
          </div>

          {/* 分類選擇 */}
          <div className="modern-card" style={{ marginBottom: '1.5rem' }}>
            <div className="modern-card-header">
              <h3 className="modern-card-title">商品分類</h3>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className={`modern-btn ${selectedCategory === null ? 'modern-btn-primary' : 'modern-btn-ghost'}`}
                onClick={() => setSelectedCategory(null)}
              >
                全部分類
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`modern-btn ${selectedCategory === category.id ? 'modern-btn-primary' : 'modern-btn-ghost'}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* 商品列表 */}
          <div className="modern-grid modern-grid-3">
            {filteredProducts.map(product => (
              <div key={product.id} className="modern-card modern-interactive">
                <div style={{ marginBottom: '1rem' }}>
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '1rem'
                      }}
                    />
                  )}
                  <h4 style={{ 
                    fontSize: 'var(--font-size-lg)', 
                    fontWeight: '600', 
                    margin: '0 0 0.5rem 0',
                    color: 'var(--color-gray-900)'
                  }}>
                    {product.name}
                  </h4>
                  {product.description && (
                    <p style={{ 
                      fontSize: 'var(--font-size-sm)', 
                      color: 'var(--color-gray-600)', 
                      margin: '0 0 1rem 0',
                      lineHeight: '1.4'
                    }}>
                      {product.description}
                    </p>
                  )}
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  borderTop: '1px solid var(--color-gray-200)',
                  paddingTop: '1rem'
                }}>
                  <span style={{ 
                    fontSize: 'var(--font-size-xl)', 
                    fontWeight: '700', 
                    color: 'var(--color-primary)' 
                  }}>
                    NT$ {product.price}
                  </span>
                  <button
                    className={`modern-btn ${product.is_available ? 'modern-btn-primary' : 'modern-btn-secondary'}`}
                    onClick={() => product.is_available && handleAddToCart(product)}
                    disabled={!product.is_available}
                  >
                    {product.is_available ? '加入購物車' : '暫不供應'}
                  </button>
                </div>

                {!product.is_available && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <span className="modern-badge modern-badge-warning">
                      暫不供應
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="modern-card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h3 style={{ color: 'var(--color-gray-600)', margin: '0 0 0.5rem 0' }}>
                沒有找到商品
              </h3>
              <p style={{ color: 'var(--color-gray-500)', margin: '0' }}>
                請嘗試調整搜尋條件或選擇其他分類
              </p>
            </div>
          )}
        </div>

        {/* 右側：購物車 */}
        <div style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
          <div className="modern-card">
            <div className="modern-card-header">
              <h3 className="modern-card-title">
                購物車 
                {cartItemCount > 0 && (
                  <span className="modern-badge modern-badge-info" style={{ marginLeft: '0.5rem' }}>
                    {cartItemCount}
                  </span>
                )}
              </h3>
            </div>

            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-gray-500)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🛒</div>
                <p>購物車是空的</p>
              </div>
            ) : (
              <>
                <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1rem' }}>
                  {cartItems.map(item => (
                    <div 
                      key={item.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '1rem 0',
                        borderBottom: '1px solid var(--color-gray-200)'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h5 style={{ 
                          margin: '0 0 0.25rem 0', 
                          fontSize: 'var(--font-size-base)',
                          fontWeight: '500'
                        }}>
                          {item.name}
                        </h5>
                        <p style={{ 
                          margin: '0', 
                          fontSize: 'var(--font-size-sm)', 
                          color: 'var(--color-gray-600)' 
                        }}>
                          NT$ {item.price} × {item.quantity}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          className="modern-btn modern-btn-ghost"
                          style={{ padding: '0.25rem 0.5rem', minHeight: 'auto' }}
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span style={{ minWidth: '2rem', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          className="modern-btn modern-btn-ghost"
                          style={{ padding: '0.25rem 0.5rem', minHeight: 'auto' }}
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                        <button
                          className="modern-btn modern-btn-danger"
                          style={{ padding: '0.25rem 0.5rem', minHeight: 'auto' }}
                          onClick={() => removeFromCart(item.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <hr className="modern-divider" />

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: '600' }}>
                    總計
                  </span>
                  <span style={{ 
                    fontSize: 'var(--font-size-xl)', 
                    fontWeight: '700', 
                    color: 'var(--color-primary)' 
                  }}>
                    NT$ {cartTotal}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="modern-btn modern-btn-secondary"
                    style={{ flex: 1 }}
                    onClick={clearCart}
                  >
                    清空
                  </button>
                  <button
                    className="modern-btn modern-btn-primary"
                    style={{ flex: 2 }}
                    onClick={handleCheckout}
                  >
                    結帳
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModernPOS
