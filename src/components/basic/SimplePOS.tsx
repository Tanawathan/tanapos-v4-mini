import React, { useEffect, useState, useRef } from 'react'
import { usePOSStore } from '../../lib/store-complete'
import { useNotifications } from '../ui/NotificationSystem'
import { useUIStyle } from '../../contexts/UIStyleContext'
import SearchAndFilter from '../ui/SearchAndFilter'
import ComboSelector from '../ComboSelector'
import { ShoppingCart, X, Move } from 'lucide-react'
import type { Product, CartItem } from '../../lib/types-unified'
import { supabase } from '../../lib/supabase'

interface ComboProduct {
  id: string
  name: string
  description: string
  price: number
  combo_type: 'fixed' | 'selectable'
  is_available: boolean
  preparation_time: number
  combo_choices?: Array<{
    id: string
    category_id: string
    min_selections: number
    max_selections: number
    sort_order: number
    categories: {
      id: string
      name: string
    }
  }>
}

const SimplePOS: React.FC = () => {
  const { currentStyle, styleConfig } = useUIStyle()
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [isCartExpanded, setIsCartExpanded] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [note, setNote] = useState('')
  
  // 套餐相關狀態
  const [combos, setCombos] = useState<ComboProduct[]>([])
  const [selectedCombo, setSelectedCombo] = useState<ComboProduct | null>(null)
  const [comboQuantity, setComboQuantity] = useState(1)
  const [showComboSelector, setShowComboSelector] = useState(false)
  const [viewMode, setViewMode] = useState<'products' | 'combos'>('products')
  
  // 拖動相關狀態
  const [cartPosition, setCartPosition] = useState({ x: 20, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const cartRef = useRef<HTMLDivElement>(null)

  // 計算購物車商品總數量和總價
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)

  // 處理添加商品到購物車 - 增強版支援套餐檢測
  const handleAddToCart = async (product: Product) => {
    console.log('handleAddToCart 被調用，產品:', product.name)
    console.log('產品類型 combo_type:', product.combo_type)
    console.log('產品選擇規則:', product.combo_choices?.length || 0)
    
    // 檢查是否為套餐產品（透過 combo_type 屬性判斷）
    if (product.combo_type) {
      console.log('檢測到套餐產品，類型:', product.combo_type)
      
      // 轉換為 ComboProduct 格式
      const combo: ComboProduct = {
        id: product.id,
        name: product.name.replace('🍽️ ', ''), // 移除圖標前綴
        description: product.description || '',
        price: product.price,
        combo_type: product.combo_type,
        is_available: product.is_available,
        preparation_time: product.preparation_time || 15,
        combo_choices: product.combo_choices || []
      }
      
      console.log('轉換後的套餐資料:', combo)
      console.log('套餐類型:', combo.combo_type)
      console.log('選擇規則數量:', combo.combo_choices?.length)
      
      // 使用現有的套餐處理邏輯
      handleComboSelect(combo, 1)
    } else {
      // 一般產品的處理
      console.log('一般產品，直接加入購物車')
      addToCart(product)
      notifications.success('成功', `已將 ${product.name} 加入購物車`)
    }
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

  // 載入套餐資料 - 增強版本，檢查選擇規則
  const loadCombos = async () => {
    try {
      console.log('開始載入套餐資料...')
      
      // 載入套餐和其選擇規則
      const { data: combosData, error: combosError } = await supabase
        .from('combo_products')
        .select(`
          *,
          combo_choices (
            id,
            category_id,
            min_selections,
            max_selections,
            sort_order,
            categories (
              id,
              name
            )
          )
        `)
        .eq('is_available', true)
        .order('name')
      
      if (combosError) {
        console.error('載入套餐錯誤:', combosError)
        throw combosError
      }
      
      console.log('載入的套餐資料:', combosData)
      
      // 過濾出有完整設定的套餐
      const validCombos = combosData?.filter(combo => {
        if (combo.combo_type === 'fixed') return true // 固定套餐不需要選擇規則
        return combo.combo_choices && combo.combo_choices.length > 0 // 可選套餐需要選擇規則
      }) || []
      
      console.log('有效套餐數量:', validCombos.length)
      if (validCombos.length !== combosData?.length) {
        console.warn('部分套餐因缺少選擇規則被過濾掉')
        notifications.warning('提醒', `${(combosData?.length || 0) - validCombos.length} 個套餐因缺少選擇規則無法顯示，請到管理介面設定`)
      }
      
      setCombos(validCombos)
    } catch (error) {
      console.error('載入套餐失敗:', error)
      notifications.error('錯誤', '載入套餐失敗')
    }
  }

  // 處理套餐選擇
  const handleComboSelect = (combo: ComboProduct, quantity: number = 1) => {
    console.log('處理套餐選擇:', combo.name, '類型:', combo.combo_type)
    console.log('套餐選擇規則:', combo.combo_choices?.length || 0)
    
    if (combo.combo_type === 'fixed') {
      // 固定套餐直接加入購物車
      console.log('固定套餐，直接加入購物車')
      const comboCartItem: CartItem = {
        id: combo.id,
        instanceId: `combo_${combo.id}_${Date.now()}`,
        name: combo.name,
        price: combo.price,
        quantity: quantity,
        type: 'combo',
        combo_type: 'fixed'
      }
      addToCart(comboCartItem as any)
      notifications.success('成功', `已將 ${combo.name} 加入購物車`)
    } else {
      // 可選擇套餐需要打開選擇器
      console.log('可選套餐，打開選擇器')
      console.log('設定 selectedCombo:', combo)
      console.log('設定 comboQuantity:', quantity)
      console.log('設定 showComboSelector: true')
      
      setSelectedCombo(combo)
      setComboQuantity(quantity)
      setShowComboSelector(true)
    }
  }

  // 處理套餐確認
  const handleComboConfirm = (combo: ComboProduct, selections: any, totalPrice: number) => {
    const comboCartItem: CartItem = {
      id: combo.id,
      instanceId: `combo_${combo.id}_${Date.now()}`,
      name: combo.name,
      price: totalPrice / comboQuantity,
      quantity: comboQuantity,
      type: 'combo',
      combo_type: 'selectable',
      combo_selections: selections
    }
    addToCart(comboCartItem as any)
    notifications.success('成功', `已將 ${combo.name} 加入購物車`)
    setShowComboSelector(false)
    setSelectedCombo(null)
  }

  // 載入數據
  useEffect(() => {
    console.log('SimplePOS: 開始載入數據')
    loadProducts()
    loadCategories()
    loadTables()
    loadCombos()
  }, [loadProducts, loadCategories, loadTables])

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

  useEffect(() => {
    console.log('SimplePOS: tables數量:', tables.length)
    console.log('SimplePOS: tables:', tables)
  }, [tables])

  // 新增：監控套餐資料變化
  useEffect(() => {
    console.log('SimplePOS: combos數量:', combos.length)
    console.log('SimplePOS: combos:', combos)
  }, [combos])

  // 組件掛載時載入數據
  useEffect(() => {
    console.log('SimplePOS 組件掛載，載入數據...')
    loadProducts()
    loadCategories()
    loadTables()
    loadCombos() // 載入套餐數據
  }, [])

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
          
          {/* 產品/套餐切換 */}
          <div className="view-mode-toggle" style={{ marginBottom: '1rem' }}>
            <button
              className={`view-mode-btn ${viewMode === 'products' ? 'active' : ''}`}
              onClick={() => setViewMode('products')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: viewMode === 'products' ? '#3b82f6' : '#f3f4f6',
                color: viewMode === 'products' ? 'white' : '#374151',
                border: 'none',
                borderRadius: '0.375rem 0 0 0.375rem',
                cursor: 'pointer'
              }}
            >
              🍔 單點商品
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'combos' ? 'active' : ''}`}
              onClick={() => setViewMode('combos')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: viewMode === 'combos' ? '#3b82f6' : '#f3f4f6',
                color: viewMode === 'combos' ? 'white' : '#374151',
                border: 'none',
                borderRadius: '0 0.375rem 0.375rem 0',
                cursor: 'pointer'
              }}
            >
              🍽️ 套餐組合 ({combos.length})
            </button>
          </div>
          
          {/* 分類按鈕 - 只在單點模式顯示 */}
          {viewMode === 'products' && (
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
          )}
        </div>

        {/* 產品/套餐網格 */}
        <div className="pos-products-grid">
          {loading ? (
            <div className="pos-loading">載入中...</div>
          ) : viewMode === 'products' ? (
            // 單點商品模式
            filteredProducts.length === 0 ? (
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
            )
          ) : (
            // 套餐模式
            combos.length === 0 ? (
              <div className="pos-empty-state">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍽️</div>
                <h3>暫無可用套餐</h3>
                <p className="text-sm text-gray-500 mb-4">請選擇以下操作：</p>
                <div className="space-y-2">
                  <button 
                    className="btn-pos-primary"
                    onClick={() => window.open('/admin', '_blank')}
                    style={{ display: 'block', width: '100%', marginBottom: '0.5rem' }}
                  >
                    📝 前往管理介面創建套餐
                  </button>
                  <button 
                    className="btn-pos-secondary"
                    onClick={loadCombos}
                    style={{ display: 'block', width: '100%' }}
                  >
                    🔄 重新載入套餐
                  </button>
                </div>
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  backgroundColor: '#fef3c7', 
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#92400e'
                }}>
                  💡 <strong>提示：</strong>套餐需要設定選擇規則才能顯示。
                  <br />請確認已在管理介面中完成套餐配置。
                </div>
              </div>
            ) : (
              combos.map(combo => {
                // 檢查套餐是否有完整設定
                const hasChoices = combo.combo_type === 'fixed' || 
                  (combo.combo_choices && combo.combo_choices.length > 0)
                
                return (
                  <div 
                    key={combo.id} 
                    className={`pos-product-card combo-card ${!hasChoices ? 'combo-incomplete' : ''}`}
                    style={{ 
                      borderColor: hasChoices ? '#f59e0b' : '#ef4444',
                      opacity: hasChoices ? 1 : 0.7
                    }}
                  >
                    {/* 套餐標識 */}
                    <div className="combo-badge" style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      backgroundColor: hasChoices ? '#f59e0b' : '#ef4444',
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {combo.combo_type === 'fixed' ? '固定套餐' : '可選套餐'}
                      {!hasChoices && ' ⚠️'}
                    </div>
                    
                    {/* 套餐標題 */}
                    <h3>{combo.name}</h3>
                    
                    {/* 套餐描述 */}
                    <p>{combo.description}</p>
                    
                    {/* 價格 */}
                    <div className="price" style={{ color: hasChoices ? '#f59e0b' : '#ef4444' }}>
                      NT$ {combo.price}
                      {combo.combo_type === 'selectable' && (
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}> 起</span>
                      )}
                    </div>
                    
                    {/* 製作時間 */}
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      ⏱️ 約 {combo.preparation_time} 分鐘
                    </div>
                    
                    {/* 選擇規則狀態 */}
                    {combo.combo_type === 'selectable' && (
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: hasChoices ? '#059669' : '#dc2626',
                        marginBottom: '0.5rem',
                        fontWeight: '500'
                      }}>
                        {hasChoices ? 
                          `✅ ${combo.combo_choices?.length || 0} 個選擇分類` : 
                          '⚠️ 尚未設定選擇規則'
                        }
                      </div>
                    )}
                    
                    {/* 套餐按鈕 */}
                    <button 
                      className="btn-pos-primary"
                      style={{ 
                        backgroundColor: hasChoices ? '#f59e0b' : '#6b7280',
                        cursor: hasChoices ? 'pointer' : 'not-allowed'
                      }}
                      onClick={() => hasChoices ? handleComboSelect(combo, 1) : null}
                      disabled={!hasChoices}
                    >
                      {hasChoices ? 
                        (combo.combo_type === 'fixed' ? '加入購物車' : '選擇套餐內容') :
                        '需要設定選擇規則'
                      }
                    </button>
                    
                    {/* 不完整套餐的提示 */}
                    {!hasChoices && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        backgroundColor: '#fef2f2',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        color: '#dc2626',
                        textAlign: 'center'
                      }}>
                        請到管理介面完成套餐設定
                      </div>
                    )}
                  </div>
                )
              })
            )
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
                  下單
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
                    下單
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

      {/* 套餐選擇器 */}
      {showComboSelector && selectedCombo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2>選擇套餐內容：{selectedCombo.name}</h2>
            <ComboSelector
              combo={selectedCombo}
              quantity={comboQuantity}
              onConfirm={handleComboConfirm}
              onCancel={() => {
                console.log('取消套餐選擇')
                setShowComboSelector(false)
                setSelectedCombo(null)
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default SimplePOS
