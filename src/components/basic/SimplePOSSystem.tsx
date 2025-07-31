import React, { useEffect, useState } from 'react'
import { usePOSStore } from '../../lib/store-complete'
import { useNotifications } from '../ui/NotificationSystem'
import type { Product, CartItem, Category } from '../../lib/types-unified'

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
  const [localSelectedTable, setLocalSelectedTable] = useState<number | null>(null)

  // 初始化數據
  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [loadProducts, loadCategories])

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

    if (!localSelectedTable) {
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
        special_instructions: item.note || '',
        status: 'pending' as const
      }))

      await createOrder({
        table_number: localSelectedTable,
        total_amount: cartTotal,
        subtotal: cartTotal,
        tax_amount: 0,
        status: 'pending',
        order_items: orderItems
      })

      clearCart()
      notifications.success('成功', '訂單已建立！')
    } catch (error) {
      console.error('建立訂單失敗:', error)
      notifications.error('錯誤', '建立訂單失敗，請重試')
    }
  }

  // 渲染產品卡片
  const renderProductCard = (product: Product) => {
    const cartItem = cartItems.find(item => item.id === product.id)
    const quantity = cartItem ? cartItem.quantity : 0

    return (
      <div key={product.id} style={{
        border: `1px solid ${themeColors.border}`,
        borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' : 
                     uiStyle === 'neumorphism' ? '20px' :
                     uiStyle === 'kawaii' ? '25px' : 
                     uiStyle === 'skeuomorphism' ? '12px' : '8px',
        padding: '16px',
        margin: '8px',
        background: themeColors.cardBg,
        color: themeColors.text,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '200px',
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
        {quantity > 0 && (
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
            {quantity}
          </div>
        )}
        
        {/* 產品信息 */}
        <div style={{ flex: 1, marginBottom: '16px' }}>
          <h3 style={{
            fontSize: '18px',
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
            fontSize: '14px',
            color: uiStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.8)' : 
                   uiStyle === 'brutalism' || uiStyle === 'cyberpunk' || uiStyle === 'dos' || uiStyle === 'bios' || uiStyle === 'code' ? themeColors.text : '#666',
            margin: '0 0 12px 0',
            lineHeight: '1.4'
          }}>
            {product.description}
          </p>
          
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: themeColors.primary,
            margin: '0 0 16px 0',
            textShadow: uiStyle === 'brutalism' ? '2px 2px 0px #00ffff' : 'none'
          }}>
            NT$ {product.price}
          </div>
        </div>
        
        {/* 控制按鈕 */}
        <div style={{ marginTop: 'auto' }}>
          {quantity > 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <button
                onClick={() => handleUpdateQuantity(product.id, quantity - 1)}
                style={{
                  width: '32px',
                  height: '32px',
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' :
                               uiStyle === 'kawaii' ? '50%' : '4px',
                  backgroundColor: themeColors.cardBg,
                  color: themeColors.text,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: uiStyle === 'brutalism' || uiStyle === 'dos' ? '900' : 'normal',
                  textTransform: uiStyle === 'brutalism' || uiStyle === 'dos' ? 'uppercase' : 'none',
                  boxShadow: uiStyle === 'brutalism' ? '4px 4px 0px #00ffff' :
                            uiStyle === 'neumorphism' ? 'inset 3px 3px 6px #bebebe, inset -3px -3px 6px #ffffff' :
                            uiStyle === 'kawaii' ? '0 4px 8px rgba(255, 105, 180, 0.3)' : 'none'
                }}
              >
                -
              </button>
              
              <span style={{
                minWidth: '32px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                {quantity}
              </span>
              
              <button
                onClick={() => handleUpdateQuantity(product.id, quantity + 1)}
                style={{
                  width: '32px',
                  height: '32px',
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: '4px',
                  backgroundColor: themeColors.cardBg,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                +
              </button>
              
              <button
                onClick={() => removeFromCart(product.id)}
                style={{
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: themeColors.secondary,
                  color: themeColors.cardBg,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <button 
              onClick={() => handleAddToCart(product)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: themeColors.primary,
                color: uiStyle === 'brutalism' ? '#000000' :
                       uiStyle === 'kawaii' ? '#8B008B' :
                       uiStyle === 'modern' || uiStyle === 'glassmorphism' ? 'white' : themeColors.text,
                border: uiStyle === 'brutalism' ? `3px solid ${themeColors.cardBg}` :
                        uiStyle === 'kawaii' ? `2px solid ${themeColors.primary}` : 'none',
                borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' :
                             uiStyle === 'kawaii' ? '25px' :
                             uiStyle === 'neumorphism' ? '15px' : 
                             uiStyle === 'skeuomorphism' ? '8px' : '4px',
                fontSize: '14px',
                fontWeight: uiStyle === 'brutalism' || uiStyle === 'dos' ? '900' : 'bold',
                cursor: 'pointer',
                textTransform: uiStyle === 'brutalism' || uiStyle === 'dos' ? 'uppercase' : 'none',
                boxShadow: uiStyle === 'brutalism' ? '4px 4px 0px #000000' :
                          uiStyle === 'cyberpunk' ? '0 0 10px rgba(0, 255, 255, 0.3)' :
                          uiStyle === 'kawaii' ? '0 6px 12px rgba(255, 105, 180, 0.4)' :
                          uiStyle === 'neumorphism' ? '9px 9px 18px #bebebe, -9px -9px 18px #ffffff' : 
                          uiStyle === 'skeuomorphism' ? '0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.4)' : 'none',
                transform: uiStyle === 'brutalism' ? 'rotate(-2deg)' :
                          uiStyle === 'kawaii' ? 'rotate(1deg)' : 'none'
              }}
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
    <div key={item.id} style={{
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
          <h4 style={{
            margin: '0 0 4px 0',
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
          gap: '4px'
        }}>
          <button
            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
            style={{
              width: '24px',
              height: '24px',
              border: uiStyle === 'brutalism' ? `2px solid ${themeColors.border}` :
                     uiStyle === 'kawaii' ? `1px solid ${themeColors.primary}` : 
                     `1px solid ${themeColors.secondary}`,
              borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' :
                           uiStyle === 'kawaii' ? '50%' :
                           uiStyle === 'neumorphism' ? '6px' : '2px',
              backgroundColor: uiStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.1)' :
                              uiStyle === 'neumorphism' ? 'linear-gradient(145deg, #f0f0f3, #cacdd1)' :
                              themeColors.cardBg,
              color: themeColors.text,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: uiStyle === 'brutalism' || uiStyle === 'dos' ? '900' : 'normal',
              boxShadow: uiStyle === 'brutalism' ? '1px 1px 0px #000000' :
                        uiStyle === 'neumorphism' ? '3px 3px 6px #bebebe, -3px -3px 6px #ffffff' : 'none',
              backdropFilter: uiStyle === 'glassmorphism' ? 'blur(4px)' : 'none'
            }}
          >
            -
          </button>
          <span style={{ 
            fontSize: '12px', 
            minWidth: '20px', 
            textAlign: 'center',
            color: themeColors.text,
            fontWeight: uiStyle === 'brutalism' || uiStyle === 'dos' ? '900' : 'normal',
            fontFamily: uiStyle === 'brutalism' ? 'Impact, "Arial Black", sans-serif' :
                       uiStyle === 'dos' || uiStyle === 'bios' ? 'monospace' :
                       uiStyle === 'code' ? 'Consolas, Monaco, "Courier New", monospace' :
                       uiStyle === 'kawaii' ? '"Comic Sans MS", "Marker Felt", cursive' : 'inherit'
          }}>
            {item.quantity}
          </span>
          <button
            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
            style={{
              width: '24px',
              height: '24px',
              border: uiStyle === 'brutalism' ? `2px solid ${themeColors.border}` :
                     uiStyle === 'kawaii' ? `1px solid ${themeColors.primary}` : 
                     `1px solid ${themeColors.secondary}`,
              borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' :
                           uiStyle === 'kawaii' ? '50%' :
                           uiStyle === 'neumorphism' ? '6px' : '2px',
              backgroundColor: uiStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.1)' :
                              uiStyle === 'neumorphism' ? 'linear-gradient(145deg, #f0f0f3, #cacdd1)' :
                              themeColors.cardBg,
              color: themeColors.text,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: uiStyle === 'brutalism' || uiStyle === 'dos' ? '900' : 'normal',
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
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: uiStyle === 'code' ? '"Fira Code", "JetBrains Mono", monospace' : 
                  uiStyle === 'brutalism' ? 'Impact, "Arial Black", sans-serif' :
                  uiStyle === 'dos' || uiStyle === 'bios' ? '"Courier New", monospace' : 
                  'Arial, sans-serif',
      background: themeColors.mainBg,
      color: themeColors.text
    }}>
      {/* 主要內容區域 */}
      <div style={{
        flex: 1,
        padding: '20px',
        overflow: 'auto'
      }}>
        {/* 標題 */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: themeColors.text
        }}>
          點餐系統 (無樣式版本)
        </h1>

        {/* 搜尋區域 */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="搜尋商品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '12px',
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
            gap: '8px'
          }}>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                padding: '8px 16px',
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px'
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
        width: '350px',
        backgroundColor: uiStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.1)' :
                        uiStyle === 'neumorphism' ? 'linear-gradient(145deg, #f0f0f3, #cacdd1)' :
                        themeColors.cardBg,
        padding: '20px',
        borderLeft: uiStyle === 'brutalism' ? `5px solid ${themeColors.text}` :
                   uiStyle === 'kawaii' ? `3px solid ${themeColors.primary}` : 
                   `1px solid ${themeColors.border}`,
        overflow: 'auto',
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
        <div style={{ marginBottom: '20px' }}>
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
    </div>
  )
}

export default SimplePOSSystem
