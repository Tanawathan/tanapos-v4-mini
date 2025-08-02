import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useUIStyle } from '../contexts/UIStyleContext'

// 類型定義
interface Product {
  id: string
  name: string
  description?: string
  price: number
  category_id: string
  image_url?: string
  is_available: boolean
}

interface ComboProduct {
  id: string
  name: string
  description?: string
  price: number
  category_id: string
  image_url?: string
  is_available: boolean
  combo_type: 'fixed' | 'selectable'
}

interface ComboChoice {
  id: string
  combo_id: string
  category_id: string
  category_name: string
  min_selections: number
  max_selections: number
}

interface CartItem {
  id: string
  instanceId: string
  name: string
  price: number
  quantity: number
  type: 'product' | 'combo'
  combo_selections?: any
}

interface Table {
  id: string
  table_number: number
  table_name?: string
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance'
  capacity: number
  location?: string
}

interface Category {
  id: string
  name: string
}

const NewPOSSystem: React.FC = () => {
  const { currentStyle, styleConfig } = useUIStyle()
  
  // 響應式狀態
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  // 狀態管理
  const [products, setProducts] = useState<Product[]>([])
  const [combos, setCombos] = useState<ComboProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null) // 改為字符串 UUID
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  // 套餐選擇器狀態
  const [showComboSelector, setShowComboSelector] = useState(false)
  const [selectedCombo, setSelectedCombo] = useState<ComboProduct | null>(null)
  const [comboChoices, setComboChoices] = useState<ComboChoice[]>([])
  const [comboSelections, setComboSelections] = useState<{[categoryId: string]: Product[]}>({})

  // 響應式監聽器
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 載入數據
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // 首先確保基本數據存在
      await ensureBasicData()
      
      // 載入分類
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      // 載入桌台數據（從資料庫）
      let tablesData: Table[] = []
      try {
        const { data: dbTables, error: tablesError } = await supabase
          .from('tables')
          .select('*')
          .order('table_number')

        if (tablesError) {
          console.warn('無法載入桌台資料，使用靜態資料:', tablesError.message)
          // 如果資料庫中沒有桌台資料，創建靜態桌台數據作為備用
          tablesData = [
            { id: 'table-1', table_number: 1, table_name: '桌號 1', status: 'available', capacity: 4 },
            { id: 'table-2', table_number: 2, table_name: '桌號 2', status: 'available', capacity: 4 },
            { id: 'table-3', table_number: 3, table_name: '桌號 3', status: 'available', capacity: 6 },
            { id: 'table-4', table_number: 4, table_name: '桌號 4', status: 'available', capacity: 4 },
            { id: 'table-5', table_number: 5, table_name: '桌號 5', status: 'available', capacity: 2 },
            { id: 'table-6', table_number: 6, table_name: '桌號 6', status: 'available', capacity: 4 },
            { id: 'table-7', table_number: 7, table_name: '桌號 7', status: 'available', capacity: 6 },
            { id: 'table-8', table_number: 8, table_name: '桌號 8', status: 'available', capacity: 4 },
            { id: 'table-9', table_number: 9, table_name: '桌號 9', status: 'available', capacity: 8 },
            { id: 'table-10', table_number: 10, table_name: '桌號 10', status: 'available', capacity: 4 }
          ]
        } else {
          tablesData = dbTables || []
        }
      } catch (tablesError) {
        console.warn('載入桌台資料時發生錯誤，使用靜態資料:', tablesError)
        // 使用靜態資料作為備用
        tablesData = [
          { id: 'table-1', table_number: 1, table_name: '桌號 1', status: 'available', capacity: 4 },
          { id: 'table-2', table_number: 2, table_name: '桌號 2', status: 'available', capacity: 4 },
          { id: 'table-3', table_number: 3, table_name: '桌號 3', status: 'available', capacity: 6 },
          { id: 'table-4', table_number: 4, table_name: '桌號 4', status: 'available', capacity: 4 },
          { id: 'table-5', table_number: 5, table_name: '桌號 5', status: 'available', capacity: 2 },
          { id: 'table-6', table_number: 6, table_name: '桌號 6', status: 'available', capacity: 4 },
          { id: 'table-7', table_number: 7, table_name: '桌號 7', status: 'available', capacity: 6 },
          { id: 'table-8', table_number: 8, table_name: '桌號 8', status: 'available', capacity: 4 },
          { id: 'table-9', table_number: 9, table_name: '桌號 9', status: 'available', capacity: 8 },
          { id: 'table-10', table_number: 10, table_name: '桌號 10', status: 'available', capacity: 4 }
        ]
      }

      // 載入一般產品
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('is_available', true)
        .order('name')

      // 載入套餐產品
      const { data: combosData } = await supabase
        .from('combo_products')
        .select('*')
        .eq('is_available', true)
        .order('name')

      setCategories(categoriesData || [])
      setTables(tablesData)
      setProducts(productsData || [])
      setCombos(combosData || [])
    } catch (error) {
      console.error('載入數據失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  // 確保基本數據存在
  const ensureBasicData = async () => {
    try {
      // 檢查是否有分類
      const { data: categories } = await supabase
        .from('categories')
        .select('*')

      if (!categories || categories.length === 0) {
        console.log('初始化基本分類...')
        await supabase.from('categories').insert([
          { id: 'cat-1', name: '主餐', description: '主要餐點' },
          { id: 'cat-2', name: '配菜', description: '配菜類' },
          { id: 'cat-3', name: '飲品', description: '飲料類' },
          { id: 'cat-4', name: '甜點', description: '甜點類' },
          { id: 'cat-5', name: '前菜', description: '開胃菜' }
        ])
      }

      // 檢查是否有產品
      const { data: products } = await supabase
        .from('products')
        .select('*')

      if (!products || products.length < 5) {
        console.log('初始化基本產品...')
        await supabase.from('products').insert([
          { id: 'prod-1', name: '經典漢堡', description: '牛肉漢堡配生菜番茄', price: 120, category_id: 'cat-1', is_available: true },
          { id: 'prod-2', name: '薯條', description: '酥脆黃金薯條', price: 60, category_id: 'cat-2', is_available: true },
          { id: 'prod-3', name: '可樂', description: '冰涼可樂', price: 35, category_id: 'cat-3', is_available: true },
          { id: 'prod-4', name: '雞塊', description: '酥脆雞塊 6 塊', price: 80, category_id: 'cat-2', is_available: true },
          { id: 'prod-5', name: '沙拉', description: '新鮮蔬菜沙拉', price: 90, category_id: 'cat-2', is_available: true },
          { id: 'prod-6', name: '奶昔', description: '香草奶昔', price: 65, category_id: 'cat-3', is_available: true },
          { id: 'prod-7', name: '冰淇淋', description: '香草冰淇淋', price: 45, category_id: 'cat-4', is_available: true },
          { id: 'prod-8', name: '雞翅', description: '烤雞翅 3 隻', price: 95, category_id: 'cat-1', is_available: true }
        ])
      }

      // 確保有基本桌台數據（移除資料庫操作，使用靜態數據）
      console.log('使用靜態桌台數據')

      // 同步套餐到 products 表
      const { data: combos } = await supabase
        .from('combo_products')
        .select('*')

      if (combos && combos.length > 0) {
        console.log('同步套餐到 products 表...')
        for (const combo of combos) {
          await supabase
            .from('products')
            .upsert({
              id: combo.id,
              name: combo.name,
              description: combo.description,
              price: combo.price,
              category_id: combo.category_id,
              image_url: combo.image_url,
              is_available: combo.is_available
            })
        }
      }
    } catch (error) {
      console.error('初始化基本數據失敗:', error)
    }
  }

  // 載入套餐選擇規則
  const loadComboChoices = async (comboId: string) => {
    try {
      const { data } = await supabase
        .from('combo_choices')
        .select(`
          *,
          categories!inner(name)
        `)
        .eq('combo_id', comboId)

      const choicesWithCategoryName = data?.map(choice => ({
        ...choice,
        category_name: choice.categories.name
      })) || []

      setComboChoices(choicesWithCategoryName)
    } catch (error) {
      console.error('載入套餐選擇規則失敗:', error)
    }
  }

  // 添加產品到購物車
  const addToCart = (product: Product) => {
    const instanceId = `${product.id}_${Date.now()}`
    const newItem: CartItem = {
      id: product.id,
      instanceId,
      name: product.name,
      price: product.price,
      quantity: 1,
      type: 'product'
    }
    setCartItems(prev => [...prev, newItem])
  }

  // 添加套餐到購物車
  const addComboToCart = (combo: ComboProduct, selections: any) => {
    const instanceId = `combo_${combo.id}_${Date.now()}`
    const newItem: CartItem = {
      id: combo.id,
      instanceId,
      name: combo.name,
      price: combo.price, // 套餐統一價格
      quantity: 1,
      type: 'combo',
      combo_selections: selections
    }
    setCartItems(prev => [...prev, newItem])
    setShowComboSelector(false)
    setSelectedCombo(null)
    setComboSelections({})
  }

  // 處理套餐點擊
  const handleComboClick = async (combo: ComboProduct) => {
    if (combo.combo_type === 'fixed') {
      // 固定套餐直接加入購物車
      addComboToCart(combo, null)
    } else {
      // 可選套餐打開選擇器
      setSelectedCombo(combo)
      await loadComboChoices(combo.id)
      setShowComboSelector(true)
    }
  }

  // 更新購物車數量
  const updateQuantity = (instanceId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => prev.filter(item => item.instanceId !== instanceId))
    } else {
      setCartItems(prev => prev.map(item =>
        item.instanceId === instanceId ? { ...item, quantity } : item
      ))
    }
  }

  // 計算總金額
  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  // 結帳
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert('購物車是空的')
      return
    }
    if (!selectedTable) {
      alert('請選擇桌號')
      return
    }

    try {
      console.log('開始結帳，購物車項目:', cartItems)
      
      // 生成訂單號
      const orderNumber = `ORD-${Date.now()}`
      const totalAmount = getTotalAmount()
      
      // 找到選擇的桌台信息
      const selectedTableInfo = tables.find(table => table.id === selectedTable)
      if (!selectedTableInfo) {
        alert('找不到選擇的桌台信息')
        return
      }
      
      // 創建訂單
      const orderData = {
        order_number: orderNumber,
        table_number: selectedTableInfo.table_number,
        table_id: selectedTable, // 使用 UUID
        total_amount: totalAmount,
        subtotal: totalAmount,
        tax_amount: 0,
        status: 'pending',
        payment_method: null,
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('訂單數據:', orderData)

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single()

      if (orderError) {
        console.error('創建訂單失敗:', orderError)
        alert(`創建訂單失敗: ${orderError.message}`)
        return
      }

      console.log('訂單創建成功:', order)

      // 創建訂單項目
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        special_instructions: item.combo_selections ? JSON.stringify(item.combo_selections) : '',
        status: 'pending'
      }))

      console.log('訂單項目:', orderItems)

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('創建訂單項目失敗:', itemsError)
        // 如果訂單項目創建失敗，刪除已創建的訂單
        await supabase.from('orders').delete().eq('id', order.id)
        alert(`創建訂單項目失敗: ${itemsError.message}`)
        return
      }

      console.log('訂單項目創建成功')
      alert(`訂單建立成功！訂單號: ${order.order_number}`)
      setCartItems([])
      setSelectedTable(null)
      
    } catch (error) {
      console.error('結帳過程發生錯誤:', error)
      alert('結帳失敗，請重試')
    }
  }

  // 套餐選擇器組件
  const ComboSelector = () => {
    if (!selectedCombo || !showComboSelector) return null

    const handleSelectionToggle = (categoryId: string, product: Product) => {
      const choice = comboChoices.find(c => c.category_id === categoryId)
      if (!choice) return

      const currentSelections = comboSelections[categoryId] || []
      const isSelected = currentSelections.some(p => p.id === product.id)

      if (isSelected) {
        // 移除選擇
        setComboSelections(prev => ({
          ...prev,
          [categoryId]: currentSelections.filter(p => p.id !== product.id)
        }))
      } else {
        // 添加選擇
        if (currentSelections.length < choice.max_selections) {
          setComboSelections(prev => ({
            ...prev,
            [categoryId]: [...currentSelections, product]
          }))
        }
      }
    }

    const canConfirm = () => {
      return comboChoices.every(choice => {
        const selections = comboSelections[choice.category_id] || []
        return selections.length >= choice.min_selections && selections.length <= choice.max_selections
      })
    }

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div className="modern-card" style={{
          maxWidth: '800px',
          maxHeight: '80vh',
          overflow: 'auto',
          width: '100%',
          padding: '2rem'
        }}>
          <h2 className="modern-card-title" style={{ marginBottom: '1.25rem' }}>
            選擇套餐內容：{selectedCombo.name}
          </h2>
          <p className="modern-card-subtitle" style={{ marginBottom: '1.25rem' }}>
            套餐價格：NT$ {selectedCombo.price}
          </p>

          {comboChoices.map(choice => (
            <div key={choice.id} style={{ marginBottom: '2rem' }}>
              <h3 className="modern-card-title" style={{ marginBottom: '1rem' }}>
                {choice.category_name} 
                <span className="modern-card-subtitle" style={{ fontSize: '14px', marginLeft: '10px' }}>
                  (請選擇 {choice.min_selections}-{choice.max_selections} 項)
                </span>
              </h3>
              
              <div className="modern-grid modern-grid-3" style={{ gap: '0.75rem' }}>
                {products
                  .filter(p => p.category_id === choice.category_id)
                  .map(product => {
                    const isSelected = (comboSelections[choice.category_id] || []).some(p => p.id === product.id)
                    return (
                      <div
                        key={product.id}
                        onClick={() => handleSelectionToggle(choice.category_id, product)}
                        className={`modern-card modern-interactive ${isSelected ? 'modern-btn-primary' : ''}`}
                        style={{
                          cursor: 'pointer',
                          border: isSelected ? '2px solid var(--modern-dark-primary)' : '1px solid var(--modern-dark-border)',
                          backgroundColor: isSelected ? 'var(--modern-dark-primary)' : 'transparent'
                        }}
                      >
                        <div className="modern-card-title" style={{ marginBottom: '0.5rem' }}>
                          {product.name}
                        </div>
                        <div className="modern-card-subtitle" style={{ fontSize: '12px' }}>
                          原價: NT$ {product.price}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}

          <div className="modern-grid modern-grid-2" style={{ gap: '1rem', marginTop: '2rem' }}>
            <button
              onClick={() => {
                setShowComboSelector(false)
                setSelectedCombo(null)
                setComboSelections({})
              }}
              className="modern-btn modern-btn-secondary"
              style={{
                padding: '15px',
                fontSize: '16px'
              }}
            >
              取消
            </button>
            <button
              onClick={() => addComboToCart(selectedCombo, comboSelections)}
              disabled={!canConfirm()}
              className={`modern-btn ${canConfirm() ? 'modern-btn-primary' : 'modern-btn-secondary'}`}
              style={{
                padding: '15px',
                fontSize: '16px',
                cursor: canConfirm() ? 'pointer' : 'not-allowed'
              }}
            >
              確認加入購物車
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="modern-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div className="modern-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h3 className="modern-card-title">載入中...</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="modern-container" style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      height: isMobile ? 'auto' : '100vh',
      minHeight: isMobile ? '100vh' : 'auto',
      gap: '1rem'
    }}>
      {/* 左側 - 產品區域 */}
      <div className="modern-card" style={{
        flex: isMobile ? 'none' : 2,
        width: isMobile ? '100%' : 'auto',
        padding: isMobile ? '1rem' : '1.5rem',
        overflow: 'auto',
        order: isMobile ? 2 : 1
      }}>
        <h1 className="modern-page-title" style={{ 
          marginBottom: '1.5rem',
          fontSize: isMobile ? '20px' : '24px',
          textAlign: isMobile ? 'center' : 'left'
        }}>TanaPOS 點餐系統</h1>

        {/* 分類選擇 */}
        <div className="modern-grid modern-grid-4" style={{ 
          marginBottom: '1.5rem',
          gap: isMobile ? '0.5rem' : '0.75rem',
          justifyContent: isMobile ? 'center' : 'flex-start'
        }}>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`modern-btn ${selectedCategory === 'all' ? 'modern-btn-primary' : 'modern-btn-secondary'}`}
            style={{
              padding: isMobile ? '8px 12px' : '10px 15px',
              fontSize: isMobile ? '14px' : '16px',
              whiteSpace: 'nowrap'
            }}
          >
            全部
          </button>
          <button
            onClick={() => setSelectedCategory('combo')}
            className={`modern-btn ${selectedCategory === 'combo' ? 'modern-btn-primary' : 'modern-btn-secondary'}`}
            style={{
              padding: isMobile ? '8px 12px' : '10px 15px',
              fontSize: isMobile ? '14px' : '16px',
              whiteSpace: 'nowrap'
            }}
          >
            套餐
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`modern-btn ${selectedCategory === category.id ? 'modern-btn-primary' : 'modern-btn-secondary'}`}
              style={{
                padding: isMobile ? '8px 12px' : '10px 15px',
                fontSize: isMobile ? '14px' : '16px',
                whiteSpace: 'nowrap'
              }}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* 產品列表 */}
        <div className="modern-grid modern-grid-3" style={{
          gap: isMobile ? '0.75rem' : '1.25rem'
        }}>
          {/* 套餐產品 */}
          {(selectedCategory === 'all' || selectedCategory === 'combo') &&
            combos.map(combo => (
              <div
                key={combo.id}
                onClick={() => handleComboClick(combo)}
                className="modern-card modern-interactive"
                style={{
                  cursor: 'pointer',
                  border: '2px solid var(--modern-dark-warning)',
                  minHeight: isMobile ? '140px' : 'auto'
                }}
              >
                <h3 className="modern-card-title" style={{ 
                  fontSize: isMobile ? '14px' : '16px',
                  lineHeight: '1.3',
                  color: 'var(--modern-dark-warning)'
                }}>
                  🍽️ {combo.name}
                </h3>
                <p className="modern-card-subtitle" style={{ 
                  fontSize: isMobile ? '12px' : '14px',
                  lineHeight: '1.4',
                  display: isMobile ? '-webkit-box' : 'block',
                  WebkitLineClamp: isMobile ? 2 : 'none',
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  marginBottom: '0.75rem'
                }}>
                  {combo.description}
                </p>
                <div style={{ 
                  fontSize: isMobile ? '16px' : '18px', 
                  fontWeight: 'bold',
                  marginBottom: '4px'
                }}>
                  NT$ {combo.price}
                </div>
                <span className="modern-badge modern-badge-warning" style={{ 
                  fontSize: isMobile ? '10px' : '12px'
                }}>
                  {combo.combo_type === 'fixed' ? '固定套餐' : '可選套餐'}
                </span>
              </div>
            ))}

          {/* 一般產品 */}
          {products
            .filter(product => 
              selectedCategory === 'all' || 
              (selectedCategory !== 'combo' && product.category_id === selectedCategory)
            )
            .map(product => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="modern-card modern-interactive"
                style={{
                  cursor: 'pointer',
                  minHeight: isMobile ? '140px' : 'auto'
                }}
              >
                <h3 className="modern-card-title" style={{ 
                  fontSize: isMobile ? '14px' : '16px',
                  lineHeight: '1.3'
                }}>
                  {product.name}
                </h3>
                <p className="modern-card-subtitle" style={{ 
                  fontSize: isMobile ? '12px' : '14px',
                  lineHeight: '1.4',
                  display: isMobile ? '-webkit-box' : 'block',
                  WebkitLineClamp: isMobile ? 2 : 'none',
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  marginBottom: '0.75rem'
                }}>
                  {product.description}
                </p>
                <div style={{ 
                  fontSize: isMobile ? '16px' : '18px', 
                  fontWeight: 'bold',
                  color: 'var(--modern-dark-primary)'
                }}>
                  NT$ {product.price}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* 右側 - 購物車 */}
      <div className="modern-card" style={{
        flex: isMobile ? 'none' : 1,
        width: isMobile ? '100%' : 'auto',
        padding: isMobile ? '1rem' : '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        order: isMobile ? 1 : 2,
        maxHeight: isMobile ? '50vh' : 'none',
        position: isMobile ? 'sticky' : 'static',
        top: isMobile ? '0' : 'auto',
        zIndex: isMobile ? 10 : 'auto'
      }}>
        <h2 className="modern-card-title" style={{ 
          marginBottom: isMobile ? '1rem' : '1.25rem',
          fontSize: isMobile ? '18px' : '20px',
          textAlign: isMobile ? 'center' : 'left'
        }}>購物車</h2>

        {/* 桌號選擇 */}
        <div style={{ marginBottom: isMobile ? '1rem' : '1.25rem' }}>
          <label className="modern-card-subtitle" style={{ 
            display: 'block', 
            marginBottom: '0.75rem',
            fontSize: isMobile ? '14px' : '16px'
          }}>
            選擇桌號:
          </label>
          <select
            value={selectedTable || ''}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="modern-btn modern-btn-secondary"
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              fontSize: isMobile ? '14px' : '16px',
              textAlign: 'left'
            }}
          >
            <option value="">請選擇桌號</option>
            {tables.map(table => (
              <option key={table.id} value={table.id}>
                {isMobile 
                  ? `桌號 ${table.table_number}` 
                  : `${table.table_name || `桌號 ${table.table_number}`} (容納 ${table.capacity} 人) - ${table.status === 'available' ? '可用' : table.status === 'occupied' ? '佔用' : table.status}`
                }
              </option>
            ))}
          </select>
        </div>

        {/* 購物車項目 */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          marginBottom: isMobile ? '1rem' : '1.25rem',
          maxHeight: isMobile ? '25vh' : 'none'
        }}>
          {cartItems.length === 0 ? (
            <p className="modern-card-subtitle" style={{ 
              textAlign: 'center',
              fontSize: isMobile ? '14px' : '16px'
            }}>購物車是空的</p>
          ) : (
            cartItems.map(item => (
              <div
                key={item.instanceId}
                className="modern-card"
                style={{
                  padding: isMobile ? '0.75rem' : '1rem',
                  marginBottom: isMobile ? '0.5rem' : '0.75rem',
                  backgroundColor: item.type === 'combo' ? 'var(--modern-dark-warning)' : 'var(--modern-dark-surface)',
                  border: item.type === 'combo' ? '1px solid var(--modern-dark-warning)' : 'none'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  flexWrap: isMobile ? 'wrap' : 'nowrap',
                  gap: isMobile ? '8px' : '0'
                }}>
                  <div style={{ 
                    flex: isMobile ? '1 1 100%' : '1',
                    minWidth: isMobile ? '100%' : 'auto'
                  }}>
                    <h4 style={{ 
                      margin: '0 0 5px 0', 
                      color: '#333',
                      fontSize: isMobile ? '14px' : '16px'
                    }}>
                      {item.type === 'combo' ? '🍽️ ' : ''}{item.name}
                    </h4>
                    <div style={{ 
                      fontSize: isMobile ? '12px' : '14px', 
                      color: '#666' 
                    }}>
                      NT$ {item.price} x {item.quantity}
                    </div>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: isMobile ? '8px' : '10px',
                    flex: isMobile ? '0 0 auto' : 'none'
                  }}>
                    <button
                      onClick={() => updateQuantity(item.instanceId, item.quantity - 1)}
                      style={{
                        width: isMobile ? '28px' : '30px',
                        height: isMobile ? '28px' : '30px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        fontSize: isMobile ? '14px' : '16px'
                      }}
                    >
                      -
                    </button>
                    <span style={{ 
                      minWidth: '20px', 
                      textAlign: 'center',
                      fontSize: isMobile ? '14px' : '16px'
                    }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.instanceId, item.quantity + 1)}
                      style={{
                        width: isMobile ? '28px' : '30px',
                        height: isMobile ? '28px' : '30px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        fontSize: isMobile ? '14px' : '16px'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div style={{ 
                  fontSize: isMobile ? '14px' : '16px', 
                  fontWeight: 'bold', 
                  color: '#007bff', 
                  marginTop: '8px',
                  textAlign: isMobile ? 'right' : 'left'
                }}>
                  小計: NT$ {item.price * item.quantity}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 總金額和結帳 */}
        <div style={{ 
          borderTop: '2px solid var(--modern-dark-border)', 
          paddingTop: isMobile ? '1rem' : '1.25rem'
        }}>
          <div className="modern-card-title" style={{ 
            fontSize: isMobile ? '18px' : '20px', 
            fontWeight: 'bold', 
            marginBottom: isMobile ? '1rem' : '1.25rem',
            textAlign: isMobile ? 'center' : 'left'
          }}>
            總金額: NT$ {getTotalAmount()}
          </div>
          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0 || !selectedTable}
            className={`modern-btn ${(cartItems.length > 0 && selectedTable) ? 'modern-btn-success' : 'modern-btn-secondary'}`}
            style={{
              width: '100%',
              padding: isMobile ? '12px' : '15px',
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: 'bold',
              cursor: (cartItems.length > 0 && selectedTable) ? 'pointer' : 'not-allowed'
            }}
          >
            {isMobile ? '下單' : '結帳'}
          </button>
        </div>
      </div>

      {/* 套餐選擇器 */}
      <ComboSelector />
    </div>
  )
}

export default NewPOSSystem
