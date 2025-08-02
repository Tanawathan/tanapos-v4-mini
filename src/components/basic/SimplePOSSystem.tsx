import React, { useEffect, useState, useRef } from 'react'
import { usePOSStore } from '../../lib/store-supabase'
import { useNotifications } from '../ui/NotificationSystem'
import { productsService } from '../../lib/api'
import ComboSelector from '../ComboSelector'
import type { Product, CartItem, Category } from '../../lib/types-unified'

interface ComboProduct {
  id: string
  name: string
  description: string
  price: number
  combo_type: 'fixed' | 'selectable'
  is_available: boolean
  preparation_time?: number
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

interface SimplePOSSystemProps {
  uiStyle?: string
}

const SimplePOSSystem: React.FC<SimplePOSSystemProps> = ({ uiStyle = 'modern' }) => {
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
    updateCartNote,
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
  const [localSelectedTable, setLocalSelectedTable] = useState<number | null>(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteModalProduct, setNoteModalProduct] = useState<Product | null>(null)
  const [editingInstanceId, setEditingInstanceId] = useState<string | null>(null)
  const [customNote, setCustomNote] = useState('')
  
  // 套餐相關狀態
  const [showComboSelector, setShowComboSelector] = useState(false)
  const [selectedCombo, setSelectedCombo] = useState<ComboProduct | null>(null)
  const [comboQuantity, setComboQuantity] = useState(1)
  
  // 響應式設計相關狀態
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  // 滾動相關狀態
  const [mainScrollProgress, setMainScrollProgress] = useState(0)
  const [cartScrollProgress, setCartScrollProgress] = useState(0)
  const [showScrollButtons, setShowScrollButtons] = useState(false)
  const mainScrollRef = useRef<HTMLDivElement>(null)
  const cartScrollRef = useRef<HTMLDivElement>(null)

  // 檢測螢幕大小
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // 初始化數據
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('🔧 檢查並修復套餐產品問題...')
        await productsService.fixComboProducts()
      } catch (error) {
        console.error('修復套餐產品失敗:', error)
      }
      
      loadProducts()
      loadCategories()
      loadTables()
    }
    
    initializeData()
  }, [loadProducts, loadCategories, loadTables])

  // 根據 UI 風格獲取主題配色
  const getThemeColors = (style: string) => {
    switch (style) {
      case 'brutalism':
        return {
          mainBg: '#000000',
          cardBg: '#000000',
          text: '#ffffff',
          primary: '#ff0080',
          secondary: '#00ffff',
          border: '#ffffff'
        }
      case 'cyberpunk':
        return {
          mainBg: 'linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #000 100%)',
          cardBg: 'linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #000 100%)',
          text: '#00ffff',
          primary: '#00ffff',
          secondary: '#ff0080',
          border: '#00ffff'
        }
      case 'dos':
        return {
          mainBg: '#0000aa',
          cardBg: '#c0c0c0',
          text: '#ffffff',
          primary: '#ffff00',
          secondary: '#c0c0c0',
          border: '#ffffff'
        }
      case 'bios':
        return {
          mainBg: 'linear-gradient(to bottom, #000040, #000080)',
          cardBg: 'linear-gradient(to bottom, #000040, #000080)',
          text: '#00ffff',
          primary: '#ffff00',
          secondary: '#008080',
          border: '#008080'
        }
      case 'code':
        return {
          mainBg: '#0D1117',
          cardBg: '#161B22',
          text: '#C9D1D9',
          primary: '#61DAFB',
          secondary: '#F7DF1E',
          border: '#21262D'
        }
      case 'neumorphism':
        return {
          mainBg: 'linear-gradient(145deg, #f0f0f3, #cacdd1)',
          cardBg: 'linear-gradient(145deg, #f0f0f3, #cacdd1)',
          text: '#555555',
          primary: '#667eea',
          secondary: '#764ba2',
          border: 'none'
        }
      case 'glassmorphism':
        return {
          mainBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          cardBg: 'rgba(255, 255, 255, 0.1)',
          text: '#ffffff',
          primary: '#ffffff',
          secondary: '#667eea',
          border: 'rgba(255, 255, 255, 0.2)'
        }
      case 'kawaii':
        return {
          mainBg: 'linear-gradient(135deg, #FFE4E1, #FFF0F5, #F8F8FF)',
          cardBg: '#FFFFFF',
          text: '#8B008B',
          primary: '#FF69B4',
          secondary: '#FFB6C1',
          border: '#FF69B4'
        }
      case 'skeuomorphism':
        return {
          mainBg: 'linear-gradient(135deg, #f5f5f5, #e8e8e8)',
          cardBg: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
          text: '#333333',
          primary: '#007AFF',
          secondary: '#5856D6',
          border: '#D1D1D6'
        }
      default: // modern
        return {
          mainBg: '#f9fafb',
          cardBg: 'white',
          text: '#333',
          primary: '#007bff',
          secondary: '#6c757d',
          border: '#ccc'
        }
    }
  }

  const themeColors = getThemeColors(uiStyle)

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

  // 處理添加到購物車 - 增強版支援套餐檢測
  // 手動測試修復函數
  const handleTestFixCombo = async () => {
    try {
      console.log('🔧 手動觸發套餐產品修復...')
      await productsService.fixComboProducts()
      notifications.success('成功', '套餐產品修復完成！')
    } catch (error) {
      console.error('修復失敗:', error)
      notifications.error('錯誤', '套餐產品修復失敗')
    }
  }

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
        name: product.name,
        description: product.description || '',
        price: product.price,
        combo_type: product.combo_type,
        is_available: product.is_available,
        preparation_time: product.preparation_time,
        combo_choices: product.combo_choices
      }
      
      // 呼叫套餐選擇處理邏輯
      handleComboSelect(combo, 1)
    } else {
      // 一般產品的處理
      console.log('一般產品，直接加入購物車')
      addToCart(product)
      notifications.success('成功', `已將 ${product.name} 加入購物車`)
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
    console.log('處理套餐確認:', combo.name)
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

  // 處理帶備註添加到購物車
  const handleAddToCartWithNote = (product: Product, note?: string) => {
    if (editingInstanceId) {
      // 編輯現有商品的備註
      updateCartNote(editingInstanceId, note || '')
      notifications.success('成功', `已更新 ${product.name} 的備註`)
    } else {
      // 添加新商品到購物車
      addToCart(product, 1, note)
      notifications.success('成功', `已將 ${product.name} 加入購物車${note ? ' (含備註)' : ''}`)
    }
    setShowNoteModal(false)
    setNoteModalProduct(null)
    setEditingInstanceId(null)
    setCustomNote('')
  }

  // 開啟備註對話框
  const openNoteModal = (product: Product, instanceId?: string) => {
    setNoteModalProduct(product)
    setEditingInstanceId(instanceId || null)
    setCustomNote('')
    setShowNoteModal(true)
  }

  // 滾動處理函數
  const handleMainScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const scrollTop = target.scrollTop
    const scrollHeight = target.scrollHeight
    const clientHeight = target.clientHeight
    const scrollPercentage = scrollHeight > clientHeight ? 
      (scrollTop / (scrollHeight - clientHeight)) * 100 : 0
    
    setMainScrollProgress(scrollPercentage)
    setShowScrollButtons(scrollHeight > clientHeight && scrollTop > 100)
  }

  const handleCartScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const scrollTop = target.scrollTop
    const scrollHeight = target.scrollHeight
    const clientHeight = target.clientHeight
    const scrollPercentage = scrollHeight > clientHeight ? 
      (scrollTop / (scrollHeight - clientHeight)) * 100 : 0
    
    setCartScrollProgress(scrollPercentage)
  }

  // 滾動到頂部/底部
  const scrollToTop = (element: HTMLDivElement | null) => {
    if (element) {
      element.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const scrollToBottom = (element: HTMLDivElement | null) => {
    if (element) {
      element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' })
    }
  }

  // 快速備註選項
  const getQuickNotes = (product: Product): string[] => {
    const category = categories.find(c => c.id === product.category_id)
    const categoryName = category?.name?.toLowerCase() || ''
    
    // 根據分類判斷商品類型
    if (categoryName.includes('飲料') || categoryName.includes('咖啡') || categoryName.includes('茶') || categoryName.includes('果汁')) {
      return [
        '熱飲', '冰飲', '常溫',
        '無糖', '少糖', '半糖', '正常糖',
        '去冰', '少冰', '正常冰', '多冰'
      ]
    } else {
      return [
        '不辣', '小辣', '中辣', '大辣', '超辣',
        '少油', '正常', '多蔥', '不加香菜'
      ]
    }
  }

  // 處理數量更新
  const handleUpdateQuantity = (instanceId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(instanceId)
      notifications.info('提示', '已從購物車移除商品')
    } else {
      updateCartQuantity(instanceId, newQuantity)
    }
  }

  // 移除商品的最後一個實例
  const handleRemoveLastInstance = (productId: string) => {
    const productInstances = cartItems.filter(item => item.id === productId)
    if (productInstances.length > 0) {
      // 移除最後一個實例
      const lastInstance = productInstances[productInstances.length - 1]
      removeFromCart(lastInstance.instanceId)
      notifications.info('提示', '已移除一份商品')
    }
  }

  // 移除商品的所有實例
  const handleRemoveAllInstances = (productId: string) => {
    const productInstances = cartItems.filter(item => item.id === productId)
    productInstances.forEach(instance => {
      removeFromCart(instance.instanceId)
    })
    notifications.info('提示', '已移除所有相同商品')
  }

  // 處理結帳
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      notifications.warning('警告', '購物車是空的')
      return
    }

    if (!localSelectedTable) {
      notifications.warning('警告', '請選擇桌號')
      return
    }

    try {
      notifications.info('處理中', '正在建立訂單...')

      const orderItems = cartItems.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        special_instructions: item.note || '',
        status: 'pending' as const
      }))

      // 建立訂單
      const newOrder = await createOrder({
        table_number: localSelectedTable,
        total_amount: cartTotal,
        subtotal: cartTotal,
        tax_amount: 0,
        status: 'pending',
        order_items: orderItems
      })

      // 更新桌台狀態為佔用
      const { updateTableStatus } = usePOSStore.getState()
      await updateTableStatus(localSelectedTable, 'occupied')

      // 清空購物車
      clearCart()
      const currentTable = localSelectedTable
      setLocalSelectedTable(null)
      
      const orderNumber = newOrder?.order_number || `ORD-${Date.now()}`
      notifications.success('成功', `訂單 ${orderNumber} 已建立！桌號 ${currentTable} 已佔用`)
    } catch (error) {
      console.error('建立訂單失敗:', error)
      notifications.error('錯誤', '建立訂單失敗，請重試')
    }
  }

  // 渲染產品卡片
  const renderProductCard = (product: Product) => {
    // 計算同一商品的所有實例總數量
    const totalQuantity = cartItems
      .filter(item => item.id === product.id)
      .reduce((sum, item) => sum + item.quantity, 0)

    return (
      <div key={product.id} style={{
        border: `1px solid ${themeColors.border}`,
        borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' : 
                     uiStyle === 'neumorphism' ? '20px' :
                     uiStyle === 'kawaii' ? '25px' : 
                     uiStyle === 'skeuomorphism' ? '12px' : '8px',
        padding: isMobile ? '12px' : '16px',
        margin: isMobile ? '4px' : '8px',
        background: themeColors.cardBg,
        color: themeColors.text,
        display: 'flex',
        flexDirection: 'column',
        minHeight: isMobile ? '180px' : '200px',
        position: 'relative',
        boxShadow: uiStyle === 'neumorphism' ? '15px 15px 30px #bebebe, -15px -15px 30px #ffffff' :
                   uiStyle === 'glassmorphism' ? '0 8px 32px 0 rgba(31, 38, 135, 0.37)' :
                   uiStyle === 'brutalism' ? '8px 8px 0px #00ffff' :
                   uiStyle === 'cyberpunk' ? '0 0 20px rgba(0, 255, 255, 0.3)' :
                   uiStyle === 'kawaii' ? '0 8px 16px rgba(255, 105, 180, 0.3)' :
                   uiStyle === 'skeuomorphism' ? '0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)' :
                   uiStyle === 'code' ? '0 0 20px rgba(97, 218, 251, 0.1)' :
                   '0 2px 8px rgba(0, 0, 0, 0.1)',
        transform: uiStyle === 'brutalism' ? 'rotate(-1deg)' :
                   uiStyle === 'kawaii' ? 'rotate(1deg)' : 'none',
        backdropFilter: uiStyle === 'glassmorphism' ? 'blur(10px)' : 'none'
      }}>
        {/* 數量徽章 */}
        {totalQuantity > 0 && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            backgroundColor: themeColors.primary,
            color: themeColors.cardBg,
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {totalQuantity}
          </div>
        )}
        
        {/* 產品信息 */}
        <div style={{ flex: 1, marginBottom: isMobile ? '12px' : '16px' }}>
          <h3 style={{
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: 'bold',
            margin: '0 0 8px 0',
            color: themeColors.text,
            lineHeight: '1.3',
            wordWrap: 'break-word',
            whiteSpace: 'normal',
            textTransform: uiStyle === 'brutalism' || uiStyle === 'dos' ? 'uppercase' : 'none',
            textShadow: uiStyle === 'brutalism' ? '4px 4px 0px #ff0080' : 'none'
          }}>
            {product.name}
          </h3>
          
          <p style={{
            fontSize: isMobile ? '12px' : '14px',
            color: uiStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.8)' : 
                   uiStyle === 'brutalism' || uiStyle === 'cyberpunk' || uiStyle === 'dos' || uiStyle === 'bios' || uiStyle === 'code' ? themeColors.text : '#666',
            margin: '0 0 12px 0',
            lineHeight: '1.4'
          }}>
            {product.description}
          </p>
          
          <div style={{
            fontSize: isMobile ? '16px' : '20px',
            fontWeight: 'bold',
            color: themeColors.primary,
            margin: isMobile ? '0 0 12px 0' : '0 0 16px 0',
            textShadow: uiStyle === 'brutalism' ? '2px 2px 0px #00ffff' : 'none'
          }}>
            NT$ {product.price}
          </div>
        </div>
        
        {/* 簡化控制按鈕 - 僅點擊加入購物車 */}
        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={() => handleAddToCart(product)}
            disabled={!product.is_available}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' :
                           uiStyle === 'kawaii' ? '25px' :
                           uiStyle === 'neumorphism' ? '15px' : '8px',
              backgroundColor: !product.is_available ? '#ccc' : themeColors.primary,
              color: !product.is_available ? '#666' : 
                     (uiStyle === 'brutalism' ? '#000000' :
                      uiStyle === 'kawaii' ? '#8B008B' :
                      uiStyle === 'modern' || uiStyle === 'glassmorphism' ? 'white' : themeColors.cardBg),
              cursor: !product.is_available ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              textTransform: uiStyle === 'brutalism' || uiStyle === 'dos' ? 'uppercase' : 'none',
              transition: 'all 0.2s ease',
              boxShadow: !product.is_available ? 'none' :
                        (uiStyle === 'brutalism' ? '4px 4px 0px #000000' :
                         uiStyle === 'neumorphism' ? '8px 8px 16px #bebebe, -8px -8px 16px #ffffff' :
                         uiStyle === 'kawaii' ? '0 4px 8px rgba(255, 105, 180, 0.3)' : 
                         '0 2px 8px rgba(0, 0, 0, 0.2)'),
              backdropFilter: uiStyle === 'glassmorphism' ? 'blur(4px)' : 'none'
            }}
          >
            {!product.is_available ? '缺貨' : '加入購物車'}
          </button>
          
          {/* 顯示購物車中的數量 */}
          {totalQuantity > 0 && (
            <div style={{
              marginTop: '8px',
              textAlign: 'center',
              fontSize: '12px',
              color: themeColors.primary,
              fontWeight: 'bold',
              padding: '4px 8px',
              backgroundColor: 'rgba(0, 123, 255, 0.1)',
              borderRadius: '12px'
            }}>
              購物車中: {totalQuantity} 件
            </div>
          )}
        </div>
      </div>
    )
  }

  // 渲染購物車項目
  const renderCartItem = (item: CartItem) => (
    <div key={item.instanceId} style={{
      border: uiStyle === 'brutalism' ? `3px solid ${themeColors.border}` :
              uiStyle === 'kawaii' ? `2px solid ${themeColors.primary}` : 
              uiStyle === 'neumorphism' ? 'none' :
              `1px solid ${themeColors.border}`,
      borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' :
                   uiStyle === 'kawaii' ? '15px' :
                   uiStyle === 'neumorphism' ? '12px' : '4px',
      padding: '12px',
      margin: '4px 0',
      backgroundColor: uiStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.1)' :
                      uiStyle === 'neumorphism' ? 'linear-gradient(145deg, #f0f0f3, #cacdd1)' :
                      themeColors.cardBg,
      color: themeColors.text,
      boxShadow: uiStyle === 'brutalism' ? '3px 3px 0px #000000' :
                uiStyle === 'cyberpunk' ? '0 0 8px rgba(0, 255, 255, 0.2)' :
                uiStyle === 'kawaii' ? '0 4px 8px rgba(255, 105, 180, 0.2)' :
                uiStyle === 'neumorphism' ? '6px 6px 12px #bebebe, -6px -6px 12px #ffffff' :
                uiStyle === 'glassmorphism' ? '0 4px 16px rgba(31, 38, 135, 0.2)' :
                uiStyle === 'skeuomorphism' ? '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)' : 'none',
      backdropFilter: uiStyle === 'glassmorphism' ? 'blur(4px)' : 'none',
      transform: uiStyle === 'brutalism' ? 'rotate(-1deg)' : 'none'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '4px'
          }}>
            <h4 style={{
              margin: '0',
              fontSize: '14px',
              fontWeight: uiStyle === 'brutalism' || uiStyle === 'dos' ? '900' : 'bold',
              color: themeColors.text,
              textTransform: uiStyle === 'brutalism' || uiStyle === 'dos' ? 'uppercase' : 'none',
              fontFamily: uiStyle === 'brutalism' ? 'Impact, "Arial Black", sans-serif' :
                         uiStyle === 'dos' || uiStyle === 'bios' ? 'monospace' :
                         uiStyle === 'code' ? 'Consolas, Monaco, "Courier New", monospace' :
                         uiStyle === 'kawaii' ? '"Comic Sans MS", "Marker Felt", cursive' : 'inherit',
              textShadow: uiStyle === 'cyberpunk' ? '0 0 5px rgba(0, 255, 255, 0.5)' : 'none'
            }}>
              {item.name}
            </h4>
            
            {/* 快速備註按鈕 */}
            <button
              onClick={() => {
                const product = products.find(p => p.id === item.id);
                if (product) {
                  openNoteModal(product, item.instanceId);
                }
              }}
              style={{
                width: '20px',
                height: '20px',
                border: `1px solid ${themeColors.primary}`,
                borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' :
                             uiStyle === 'kawaii' ? '50%' : '3px',
                backgroundColor: item.note ? themeColors.primary : 'transparent',
                color: item.note ? (uiStyle === 'brutalism' ? '#000000' : 'white') : themeColors.primary,
                cursor: 'pointer',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                boxShadow: uiStyle === 'brutalism' ? '1px 1px 0px #000000' :
                          uiStyle === 'neumorphism' ? '2px 2px 4px #bebebe, -2px -2px 4px #ffffff' : 'none'
              }}
              title={item.note ? `已有備註: ${item.note}` : '新增備註'}
            >
              📝
            </button>
          </div>
          {item.note && (
            <p style={{
              margin: '0 0 4px 0',
              fontSize: '11px',
              color: themeColors.primary,
              fontStyle: 'italic',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              padding: '2px 6px',
              borderRadius: '3px',
              display: 'inline-block'
            }}>
              📝 {item.note}
            </p>
          )}
          <p style={{
            margin: '0',
            fontSize: '12px',
            color: uiStyle === 'brutalism' || uiStyle === 'cyberpunk' || uiStyle === 'dos' || uiStyle === 'bios' || uiStyle === 'code' ? 
                   themeColors.secondary : 
                   uiStyle === 'kawaii' ? '#8B008B' : '#666',
            fontWeight: uiStyle === 'brutalism' || uiStyle === 'dos' ? '900' : 'normal',
            textTransform: uiStyle === 'brutalism' || uiStyle === 'dos' ? 'uppercase' : 'none',
            fontFamily: uiStyle === 'brutalism' ? 'Impact, "Arial Black", sans-serif' :
                       uiStyle === 'dos' || uiStyle === 'bios' ? 'monospace' :
                       uiStyle === 'code' ? 'Consolas, Monaco, "Courier New", monospace' :
                       uiStyle === 'kawaii' ? '"Comic Sans MS", "Marker Felt", cursive' : 'inherit'
          }}>
            NT$ {item.price} × {item.quantity} = NT$ {item.price * item.quantity}
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => handleUpdateQuantity(item.instanceId, item.quantity - 1)}
            style={{
              width: '28px',
              height: '28px',
              border: uiStyle === 'brutalism' ? `2px solid ${themeColors.border}` :
                     uiStyle === 'kawaii' ? `1px solid ${themeColors.primary}` : 
                     `1px solid ${themeColors.secondary}`,
              borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' :
                           uiStyle === 'kawaii' ? '50%' :
                           uiStyle === 'neumorphism' ? '6px' : '4px',
              backgroundColor: uiStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.1)' :
                              uiStyle === 'neumorphism' ? 'linear-gradient(145deg, #f0f0f3, #cacdd1)' :
                              themeColors.cardBg,
              color: themeColors.text,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: uiStyle === 'brutalism' || uiStyle === 'dos' ? '900' : 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: uiStyle === 'brutalism' ? '1px 1px 0px #000000' :
                        uiStyle === 'neumorphism' ? '3px 3px 6px #bebebe, -3px -3px 6px #ffffff' : 'none',
              backdropFilter: uiStyle === 'glassmorphism' ? 'blur(4px)' : 'none'
            }}
          >
            −
          </button>
          <span style={{ 
            fontSize: '14px', 
            minWidth: '24px', 
            textAlign: 'center',
            color: themeColors.text,
            fontWeight: uiStyle === 'brutalism' || uiStyle === 'dos' ? '900' : 'bold',
            fontFamily: uiStyle === 'brutalism' ? 'Impact, "Arial Black", sans-serif' :
                       uiStyle === 'dos' || uiStyle === 'bios' ? 'monospace' :
                       uiStyle === 'code' ? 'Consolas, Monaco, "Courier New", monospace' :
                       uiStyle === 'kawaii' ? '"Comic Sans MS", "Marker Felt", cursive' : 'inherit'
          }}>
            {item.quantity}
          </span>
          <button
            onClick={() => handleUpdateQuantity(item.instanceId, item.quantity + 1)}
            style={{
              width: '28px',
              height: '28px',
              border: uiStyle === 'brutalism' ? `2px solid ${themeColors.border}` :
                     uiStyle === 'kawaii' ? `1px solid ${themeColors.primary}` : 
                     `1px solid ${themeColors.secondary}`,
              borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' :
                           uiStyle === 'kawaii' ? '50%' :
                           uiStyle === 'neumorphism' ? '6px' : '4px',
              backgroundColor: uiStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.1)' :
                              uiStyle === 'neumorphism' ? 'linear-gradient(145deg, #f0f0f3, #cacdd1)' :
                              themeColors.cardBg,
              color: themeColors.text,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: uiStyle === 'brutalism' || uiStyle === 'dos' ? '900' : 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: uiStyle === 'brutalism' ? '1px 1px 0px #000000' :
                        uiStyle === 'neumorphism' ? '3px 3px 6px #bebebe, -3px -3px 6px #ffffff' : 'none',
              backdropFilter: uiStyle === 'glassmorphism' ? 'blur(4px)' : 'none'
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px'
      }}>
        載入中...
      </div>
    )
  }

  return (
    <div 
      className={`pos-system-container ui-${uiStyle}`}
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        height: '100vh', // 使用固定視窗高度
        fontFamily: uiStyle === 'code' ? '"Fira Code", "JetBrains Mono", monospace' : 
                    uiStyle === 'brutalism' ? 'Impact, "Arial Black", sans-serif' :
                    uiStyle === 'dos' || uiStyle === 'bios' ? '"Courier New", monospace' : 
                    'Arial, sans-serif',
        background: themeColors.mainBg,
        color: themeColors.text
      }}>
      {/* 主要內容區域 */}
      <div 
        ref={mainScrollRef}
        className="pos-main-scroll-area scroll-progress-container"
        style={{
          flex: 1,
          padding: isMobile ? '10px' : isTablet ? '15px' : '20px',
          overflow: 'auto', // 獨立滾動
          height: '100vh', // 設定固定高度讓滾動生效
          position: 'relative',
          // 自定義滾動條樣式
          scrollbarWidth: 'thin',
          scrollbarColor: `${themeColors.primary} ${themeColors.border}`,
        }}
        onScroll={handleMainScroll}
      >
        {/* 滾動進度條 */}
        <div 
          className="scroll-progress-bar"
          style={{ width: `${mainScrollProgress}%` }}
        />
        
        {/* 滾動陰影效果 */}
        <div 
          className="scroll-shadow-top"
          style={{ opacity: mainScrollProgress > 5 ? 1 : 0 }}
        />
        <div 
          className="scroll-shadow-bottom"
          style={{ opacity: mainScrollProgress < 95 ? 1 : 0 }}
        />

        {/* 滾動按鈕 */}
        {showScrollButtons && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 10
          }}>
            <button
              onClick={() => mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: `1px solid ${themeColors.primary}`,
                backgroundColor: themeColors.cardBg,
                color: themeColors.primary,
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ↑
            </button>
            <button
              onClick={() => mainScrollRef.current?.scrollTo({ top: mainScrollRef.current?.scrollHeight, behavior: 'smooth' })}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: `1px solid ${themeColors.primary}`,
                backgroundColor: themeColors.cardBg,
                color: themeColors.primary,
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ↓
            </button>
          </div>
        )}

        {/* 開發者測試區域 - 臨時添加 */}
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          padding: '10px',
          borderRadius: '5px',
          border: '1px solid red'
        }}>
          <button
            onClick={handleTestFixCombo}
            style={{
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            修復套餐
          </button>
        </div>
        
        {/* 搜尋區域 */}
        <div style={{ marginBottom: isMobile ? '15px' : '20px' }}>
          <input
            type="text"
            placeholder="搜尋商品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              maxWidth: isMobile ? '100%' : '400px',
              padding: isMobile ? '14px' : '12px',
              border: uiStyle === 'brutalism' ? `3px solid ${themeColors.text}` :
                      uiStyle === 'kawaii' ? `2px solid ${themeColors.primary}` : 
                      `1px solid ${themeColors.secondary}`,
              borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' :
                           uiStyle === 'kawaii' ? '25px' :
                           uiStyle === 'neumorphism' ? '25px' : '4px',
              backgroundColor: uiStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.1)' :
                              uiStyle === 'neumorphism' ? 'linear-gradient(145deg, #f0f0f3, #cacdd1)' :
                              themeColors.cardBg,
              color: themeColors.text,
              fontSize: '16px',
              fontWeight: uiStyle === 'brutalism' || uiStyle === 'dos' ? '900' : 'normal',
              fontFamily: uiStyle === 'dos' ? 'monospace' :
                         uiStyle === 'bios' ? 'monospace' :
                         uiStyle === 'code' ? 'Consolas, Monaco, "Courier New", monospace' : 'inherit',
              textTransform: uiStyle === 'brutalism' || uiStyle === 'dos' ? 'uppercase' : 'none',
              marginBottom: '16px',
              boxShadow: uiStyle === 'brutalism' ? '4px 4px 0px #000000' :
                        uiStyle === 'cyberpunk' ? '0 0 10px rgba(0, 255, 255, 0.3)' :
                        uiStyle === 'kawaii' ? '0 6px 12px rgba(255, 105, 180, 0.3)' :
                        uiStyle === 'neumorphism' ? 'inset 9px 9px 18px #bebebe, inset -9px -9px 18px #ffffff' :
                        uiStyle === 'glassmorphism' ? '0 8px 32px 0 rgba(31, 38, 135, 0.37)' : 'none',
              transform: uiStyle === 'brutalism' ? 'rotate(-1deg)' : 'none',
              backdropFilter: uiStyle === 'glassmorphism' ? 'blur(4px)' : 'none'
            }}
          />
          
          {/* 分類按鈕 */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: isMobile ? '6px' : '8px',
            marginBottom: isMobile ? '4px' : '0'
          }}>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                padding: isMobile ? '10px 14px' : '8px 16px',
                border: uiStyle === 'brutalism' ? `3px solid ${themeColors.text}` :
                        uiStyle === 'kawaii' ? `2px solid ${themeColors.primary}` : 
                        `1px solid ${themeColors.secondary}`,
                borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' :
                             uiStyle === 'kawaii' ? '25px' :
                             uiStyle === 'neumorphism' ? '15px' : '20px',
                backgroundColor: !selectedCategory ? themeColors.primary : 'transparent',
                color: !selectedCategory ? 
                       (uiStyle === 'brutalism' ? '#000000' :
                        uiStyle === 'kawaii' ? '#8B008B' :
                        uiStyle === 'modern' || uiStyle === 'glassmorphism' ? 'white' : themeColors.text) : 
                       themeColors.text,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: uiStyle === 'brutalism' || uiStyle === 'dos' ? '900' : 'normal',
                textTransform: uiStyle === 'brutalism' || uiStyle === 'dos' ? 'uppercase' : 'none',
                boxShadow: !selectedCategory && uiStyle === 'brutalism' ? '3px 3px 0px #000000' :
                          !selectedCategory && uiStyle === 'cyberpunk' ? '0 0 8px rgba(0, 255, 255, 0.3)' :
                          !selectedCategory && uiStyle === 'kawaii' ? '0 4px 8px rgba(255, 105, 180, 0.3)' :
                          !selectedCategory && uiStyle === 'neumorphism' ? 'inset 4px 4px 8px #bebebe, inset -4px -4px 8px #ffffff' : 'none',
                transform: uiStyle === 'brutalism' && !selectedCategory ? 'rotate(-1deg)' : 'none'
              }}
            >
              全部
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  padding: '8px 16px',
                  border: uiStyle === 'brutalism' ? `3px solid ${themeColors.text}` :
                          uiStyle === 'kawaii' ? `2px solid ${themeColors.primary}` : 
                          `1px solid ${themeColors.secondary}`,
                  borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' :
                               uiStyle === 'kawaii' ? '25px' :
                               uiStyle === 'neumorphism' ? '15px' : '20px',
                  backgroundColor: selectedCategory === category.id ? themeColors.primary : 'transparent',
                  color: selectedCategory === category.id ? 
                         (uiStyle === 'brutalism' ? '#000000' :
                          uiStyle === 'kawaii' ? '#8B008B' :
                          uiStyle === 'modern' || uiStyle === 'glassmorphism' ? 'white' : themeColors.text) : 
                         themeColors.text,
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: uiStyle === 'brutalism' || uiStyle === 'dos' ? '900' : 'normal',
                  textTransform: uiStyle === 'brutalism' || uiStyle === 'dos' ? 'uppercase' : 'none',
                  boxShadow: selectedCategory === category.id && uiStyle === 'brutalism' ? '3px 3px 0px #000000' :
                            selectedCategory === category.id && uiStyle === 'cyberpunk' ? '0 0 8px rgba(0, 255, 255, 0.3)' :
                            selectedCategory === category.id && uiStyle === 'kawaii' ? '0 4px 8px rgba(255, 105, 180, 0.3)' :
                            selectedCategory === category.id && uiStyle === 'neumorphism' ? 'inset 4px 4px 8px #bebebe, inset -4px -4px 8px #ffffff' : 'none',
                  transform: uiStyle === 'brutalism' && selectedCategory === category.id ? 'rotate(-1deg)' : 'none'
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* 產品網格 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(150px, 1fr))' : 
                              isTablet ? 'repeat(auto-fill, minmax(220px, 1fr))' :
                              'repeat(auto-fill, minmax(280px, 1fr))',
          gap: isMobile ? '12px' : '16px'
        }}>
          {filteredProducts.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '40px',
              color: themeColors.secondary
            }}>
              <p style={{ fontSize: '16px', margin: '0' }}>沒有找到商品</p>
              <p style={{ fontSize: '14px', margin: '8px 0 0 0' }}>
                請調整搜尋條件或選擇其他分類
              </p>
            </div>
          ) : (
            filteredProducts.map(renderProductCard)
          )}
        </div>
      </div>

      {/* 購物車側邊欄 */}
      <div style={{
        width: isMobile ? '100%' : isTablet ? '300px' : '350px',
        backgroundColor: uiStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.1)' :
                        uiStyle === 'neumorphism' ? 'linear-gradient(145deg, #f0f0f3, #cacdd1)' :
                        themeColors.cardBg,
        padding: isMobile ? '15px' : '20px',
        borderLeft: isMobile ? 'none' : 
                   (uiStyle === 'brutalism' ? `5px solid ${themeColors.text}` :
                   uiStyle === 'kawaii' ? `3px solid ${themeColors.primary}` : 
                   `1px solid ${themeColors.border}`),
        borderTop: isMobile ? 
                  (uiStyle === 'brutalism' ? `5px solid ${themeColors.text}` :
                   uiStyle === 'kawaii' ? `3px solid ${themeColors.primary}` : 
                   `1px solid ${themeColors.border}`) : 'none',
        overflow: 'hidden', // 父容器不滾動
        height: '100vh', // 設定固定高度
        display: 'flex', // 使用flexbox佈局
        flexDirection: 'column', // 垂直排列
        boxShadow: uiStyle === 'brutalism' ? '8px 0px 0px #000000' :
                  uiStyle === 'cyberpunk' ? '-4px 0 15px rgba(0, 255, 255, 0.2)' :
                  uiStyle === 'kawaii' ? '-4px 0 15px rgba(255, 105, 180, 0.3)' :
                  uiStyle === 'neumorphism' ? '-9px 9px 18px #bebebe, 9px -9px 18px #ffffff' :
                  uiStyle === 'glassmorphism' ? '-4px 0 15px rgba(31, 38, 135, 0.2)' : 'none',
        backdropFilter: uiStyle === 'glassmorphism' ? 'blur(10px)' : 'none'
      }}>
        {/* 購物車標題 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: uiStyle === 'brutalism' || uiStyle === 'dos' ? '900' : 'bold',
            margin: '0',
            color: themeColors.text,
            textTransform: uiStyle === 'brutalism' || uiStyle === 'dos' ? 'uppercase' : 'none',
            fontFamily: uiStyle === 'dos' ? 'monospace' :
                       uiStyle === 'bios' ? 'monospace' :
                       uiStyle === 'code' ? 'Consolas, Monaco, "Courier New", monospace' : 'inherit',
            textShadow: uiStyle === 'cyberpunk' ? '0 0 10px rgba(0, 255, 255, 0.5)' : 'none',
            transform: uiStyle === 'brutalism' ? 'rotate(-1deg)' : 'none'
          }}>
            購物車
          </h2>
          {cartItemCount > 0 && (
            <span style={{
              backgroundColor: themeColors.primary,
              color: themeColors.cardBg,
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {cartItemCount}
            </span>
          )}
        </div>

        {/* 桌號選擇 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: uiStyle === 'brutalism' || uiStyle === 'dos' ? '900' : 'bold',
            marginBottom: '8px',
            color: themeColors.text,
            textTransform: uiStyle === 'brutalism' || uiStyle === 'dos' ? 'uppercase' : 'none',
            fontFamily: uiStyle === 'dos' ? 'monospace' :
                       uiStyle === 'bios' ? 'monospace' :
                       uiStyle === 'code' ? 'Consolas, Monaco, "Courier New", monospace' : 'inherit'
          }}>
            選擇桌號:
          </label>
          <select
            value={localSelectedTable || ''}
            onChange={(e) => setLocalSelectedTable(e.target.value ? parseInt(e.target.value) : null)}
            style={{
              width: '100%',
              padding: '8px',
              border: uiStyle === 'brutalism' ? `3px solid ${themeColors.text}` :
                      uiStyle === 'kawaii' ? `2px solid ${themeColors.primary}` : 
                      `1px solid ${themeColors.secondary}`,
              borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' :
                           uiStyle === 'kawaii' ? '15px' :
                           uiStyle === 'neumorphism' ? '15px' : '4px',
              backgroundColor: uiStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.1)' :
                              uiStyle === 'neumorphism' ? 'linear-gradient(145deg, #f0f0f3, #cacdd1)' :
                              themeColors.cardBg,
              color: themeColors.text,
              fontSize: '14px',
              fontWeight: uiStyle === 'brutalism' || uiStyle === 'dos' ? '900' : 'normal',
              fontFamily: uiStyle === 'dos' ? 'monospace' :
                         uiStyle === 'bios' ? 'monospace' :
                         uiStyle === 'code' ? 'Consolas, Monaco, "Courier New", monospace' : 'inherit',
              textTransform: uiStyle === 'brutalism' || uiStyle === 'dos' ? 'uppercase' : 'none',
              boxShadow: uiStyle === 'brutalism' ? '3px 3px 0px #000000' :
                        uiStyle === 'cyberpunk' ? '0 0 8px rgba(0, 255, 255, 0.3)' :
                        uiStyle === 'kawaii' ? '0 4px 8px rgba(255, 105, 180, 0.3)' :
                        uiStyle === 'neumorphism' ? 'inset 6px 6px 12px #bebebe, inset -6px -6px 12px #ffffff' :
                        uiStyle === 'glassmorphism' ? '0 4px 16px rgba(31, 38, 135, 0.2)' : 'none',
              transform: uiStyle === 'brutalism' ? 'rotate(-1deg)' : 'none',
              backdropFilter: uiStyle === 'glassmorphism' ? 'blur(4px)' : 'none'
            }}
          >
            <option value="">請選擇桌號</option>
            {tables.map(table => (
              <option key={table.id} value={table.table_number}>
                桌號 {table.table_number} ({table.status === 'available' ? '可用' : '使用中'})
              </option>
            ))}
          </select>
        </div>

        {/* 購物車項目 */}
        <div 
          ref={cartScrollRef}
          className="pos-cart-scroll-area scroll-progress-container"
          style={{ 
            marginBottom: '20px',
            flex: 1, // 讓項目區域佔用可用空間
            overflow: 'auto', // 獨立滾動
            maxHeight: '40vh', // 限制最大高度
            position: 'relative',
            // 自定義滾動條樣式
            scrollbarWidth: 'thin',
            scrollbarColor: `${themeColors.secondary} ${themeColors.border}`,
            // 滾動區域邊框
            border: `1px solid ${themeColors.border}`,
            borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' :
                         uiStyle === 'kawaii' ? '15px' :
                         uiStyle === 'neumorphism' ? '15px' : '8px',
            // 滾動區域背景
            backgroundColor: uiStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.05)' :
                            uiStyle === 'neumorphism' ? 'linear-gradient(145deg, #f0f0f3, #e6e6e9)' :
                            'transparent',
            // 滾動動畫
            transition: 'all 0.3s ease'
          }}
          onScroll={handleCartScroll}
        >
          {/* 購物車滾動進度條 */}
          <div 
            className="scroll-progress-bar"
            style={{ 
              width: `${cartScrollProgress}%`,
              background: themeColors.secondary
            }}
          />
          
          {/* 滾動陰影效果 */}
          <div 
            className="scroll-shadow-top"
            style={{ opacity: cartScrollProgress > 5 ? 1 : 0 }}
          />
          <div 
            className="scroll-shadow-bottom"
            style={{ opacity: cartScrollProgress < 95 ? 1 : 0 }}
          />
          {cartItems.length === 0 ? (
            <p style={{
              textAlign: 'center',
              color: themeColors.secondary,
              fontSize: '14px',
              margin: '40px 0'
            }}>
              購物車是空的
            </p>
          ) : (
            cartItems.map(renderCartItem)
          )}
        </div>

        {/* 總計和結帳 */}
        {cartItems.length > 0 && (
          <div style={{
            borderTop: `1px solid ${themeColors.border}`,
            paddingTop: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <span style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: themeColors.text
              }}>
                總計:
              </span>
              <span style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: themeColors.primary
              }}>
                NT$ {cartTotal}
              </span>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={clearCart}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: uiStyle === 'kawaii' ? '#FFB6C1' : '#6c757d',
                  color: uiStyle === 'brutalism' ? '#000000' :
                         uiStyle === 'kawaii' ? '#8B008B' : 'white',
                  border: uiStyle === 'brutalism' ? `3px solid ${themeColors.text}` :
                          uiStyle === 'kawaii' ? `2px solid #FFB6C1` : 'none',
                  borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' :
                               uiStyle === 'kawaii' ? '20px' :
                               uiStyle === 'neumorphism' ? '12px' : '4px',
                  fontSize: '14px',
                  fontWeight: uiStyle === 'brutalism' || uiStyle === 'dos' ? '900' : 'bold',
                  cursor: 'pointer',
                  textTransform: uiStyle === 'brutalism' || uiStyle === 'dos' ? 'uppercase' : 'none',
                  boxShadow: uiStyle === 'brutalism' ? '3px 3px 0px #000000' :
                            uiStyle === 'cyberpunk' ? '0 0 8px rgba(128, 128, 128, 0.3)' :
                            uiStyle === 'kawaii' ? '0 4px 8px rgba(255, 182, 193, 0.3)' :
                            uiStyle === 'neumorphism' ? '6px 6px 12px #bebebe, -6px -6px 12px #ffffff' : 'none',
                  transform: uiStyle === 'brutalism' ? 'rotate(-1deg)' : 'none'
                }}
              >
                清空
              </button>
              <button
                onClick={handleCheckout}
                disabled={!localSelectedTable}
                style={{
                  flex: 2,
                  padding: '12px',
                  backgroundColor: localSelectedTable ? 
                                  (uiStyle === 'kawaii' ? themeColors.primary : themeColors.primary) : 
                                  themeColors.secondary,
                  color: localSelectedTable ? 
                         (uiStyle === 'brutalism' ? themeColors.cardBg :
                          uiStyle === 'kawaii' ? themeColors.cardBg : themeColors.cardBg) : 
                         themeColors.text,
                  border: uiStyle === 'brutalism' ? `3px solid ${localSelectedTable ? themeColors.text : themeColors.secondary}` :
                          uiStyle === 'kawaii' ? `2px solid ${localSelectedTable ? themeColors.primary : themeColors.border}` : 'none',
                  borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' :
                               uiStyle === 'kawaii' ? '20px' :
                               uiStyle === 'neumorphism' ? '12px' : '4px',
                  fontSize: '14px',
                  fontWeight: uiStyle === 'brutalism' || uiStyle === 'dos' ? '900' : 'bold',
                  cursor: localSelectedTable ? 'pointer' : 'not-allowed',
                  textTransform: uiStyle === 'brutalism' || uiStyle === 'dos' ? 'uppercase' : 'none',
                  boxShadow: localSelectedTable && uiStyle === 'brutalism' ? '3px 3px 0px #000000' :
                            localSelectedTable && uiStyle === 'cyberpunk' ? '0 0 8px rgba(40, 167, 69, 0.3)' :
                            localSelectedTable && uiStyle === 'kawaii' ? '0 4px 8px rgba(152, 251, 152, 0.3)' :
                            localSelectedTable && uiStyle === 'neumorphism' ? '6px 6px 12px #bebebe, -6px -6px 12px #ffffff' : 'none',
                  transform: localSelectedTable && uiStyle === 'brutalism' ? 'rotate(1deg)' : 'none'
                }}
              >
                結帳
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* 備註對話框 */}
      {showNoteModal && noteModalProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: themeColors.cardBg,
            padding: isMobile ? '16px' : '24px',
            borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' : '12px',
            border: uiStyle === 'brutalism' ? `3px solid ${themeColors.text}` : 'none',
            boxShadow: uiStyle === 'brutalism' ? '8px 8px 0px #000000' :
                      '0 4px 20px rgba(0, 0, 0, 0.15)',
            maxWidth: isMobile ? '95%' : '400px',
            width: isMobile ? '95%' : '90%',
            maxHeight: isMobile ? '90vh' : '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              color: themeColors.text,
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: 'bold'
            }}>
              {noteModalProduct.name} - {editingInstanceId ? '編輯備註' : '快速備註'}
            </h3>
            
            {/* 快速選項 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(auto-fit, minmax(65px, 1fr))' : 'repeat(auto-fit, minmax(80px, 1fr))',
              gap: isMobile ? '6px' : '8px',
              marginBottom: '16px'
            }}>
              {getQuickNotes(noteModalProduct).map((note, index) => (
                <button
                  key={index}
                  onClick={() => handleAddToCartWithNote(noteModalProduct, note)}
                  style={{
                    padding: isMobile ? '6px 8px' : '8px 12px',
                    backgroundColor: themeColors.secondary,
                    color: themeColors.text,
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' :
                                 uiStyle === 'kawaii' ? '20px' : '6px',
                    fontSize: isMobile ? '10px' : '12px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = themeColors.primary
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = themeColors.secondary
                    e.currentTarget.style.color = themeColors.text
                  }}
                >
                  {note}
                </button>
              ))}
            </div>
            
            {/* 自訂備註 */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: themeColors.text,
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                自訂備註:
              </label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="輸入特殊要求..."
                style={{
                  width: '100%',
                  height: '60px',
                  padding: '8px',
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' : '4px',
                  backgroundColor: themeColors.mainBg,
                  color: themeColors.text,
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>
            
            {/* 操作按鈕 */}
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '8px' : '8px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowNoteModal(false)
                  setNoteModalProduct(null)
                  setEditingInstanceId(null)
                  setCustomNote('')
                }}
                style={{
                  padding: isMobile ? '12px 16px' : '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' : '4px',
                  fontSize: isMobile ? '13px' : '14px',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              
              <button
                onClick={() => handleAddToCartWithNote(noteModalProduct)}
                style={{
                  padding: isMobile ? '12px 16px' : '8px 16px',
                  backgroundColor: themeColors.secondary,
                  color: themeColors.text,
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' : '4px',
                  fontSize: isMobile ? '13px' : '14px',
                  cursor: 'pointer'
                }}
              >
                {editingInstanceId ? '移除備註' : '無備註加入'}
              </button>
              
              {customNote && (
                <button
                  onClick={() => handleAddToCartWithNote(noteModalProduct, customNote)}
                  style={{
                    padding: isMobile ? '12px 16px' : '8px 16px',
                    backgroundColor: themeColors.primary,
                    color: uiStyle === 'brutalism' ? '#000000' :
                           uiStyle === 'kawaii' ? '#8B008B' :
                           uiStyle === 'modern' || uiStyle === 'glassmorphism' ? 'white' : themeColors.text,
                    border: 'none',
                    borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' : '4px',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {editingInstanceId ? '更新備註' : '加入購物車'}
                </button>
              )}
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

export default SimplePOSSystem
