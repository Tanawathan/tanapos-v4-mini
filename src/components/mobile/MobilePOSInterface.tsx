import React, { useState, useEffect, useRef } from 'react'
import { usePOSStore } from '../../lib/store-supabase'
import { useUIStyle } from '../../contexts/UIStyleContext'
import { Category, Product, CartItem } from '../../lib/types-unified'
import LoadingSpinner from '../ui/LoadingSpinner'

// 手機專用產品卡片組件
const MobileProductCard: React.FC<{
  product: Product
  onAddToCart: (product: Product) => void
  uiStyle: string
  themeColors: any
}> = ({ product, onAddToCart, uiStyle, themeColors }) => {
  const [isPressed, setIsPressed] = useState(false)

  return (
    <div
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
      onClick={() => onAddToCart(product)}
      style={{
        backgroundColor: themeColors.cardBg,
        border: uiStyle === 'brutalism' ? `3px solid ${themeColors.border}` :
                uiStyle === 'kawaii' ? `2px solid ${themeColors.primary}` : 
                `1px solid ${themeColors.border}`,
        borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' :
                     uiStyle === 'kawaii' ? '16px' :
                     uiStyle === 'neumorphism' ? '12px' : '8px',
        padding: '12px',
        margin: '8px 0',
        boxShadow: isPressed ? 
                   (uiStyle === 'brutalism' ? '2px 2px 0px #000000' :
                    uiStyle === 'neumorphism' ? 'inset 4px 4px 8px #bebebe, inset -4px -4px 8px #ffffff' :
                    uiStyle === 'glassmorphism' ? '0 2px 8px rgba(31, 38, 135, 0.2)' :
                    '0 2px 6px rgba(0, 0, 0, 0.15)') :
                   (uiStyle === 'brutalism' ? '4px 4px 0px #000000' :
                    uiStyle === 'neumorphism' ? '6px 6px 12px #bebebe, -6px -6px 12px #ffffff' :
                    uiStyle === 'glassmorphism' ? '0 4px 16px rgba(31, 38, 135, 0.3)' :
                    '0 4px 12px rgba(0, 0, 0, 0.1)'),
        transition: 'all 0.15s ease',
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
        cursor: 'pointer',
        backdropFilter: uiStyle === 'glassmorphism' ? 'blur(8px)' : 'none',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 產品圖片 */}
      {product.image_url && (
        <div style={{
          width: '100%',
          height: '120px',
          backgroundColor: themeColors.imageBg || '#f8f9fa',
          borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' : '6px',
          marginBottom: '8px',
          backgroundImage: `url(${product.image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: uiStyle === 'brutalism' ? `2px solid ${themeColors.border}` : 'none'
        }}>
          {!product.image_url && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontSize: '32px',
              color: themeColors.secondary
            }}>
              🍽️
            </div>
          )}
        </div>
      )}

      {/* 產品資訊 */}
      <div>
        <h3 style={{
          fontSize: '16px',
          fontWeight: uiStyle === 'brutalism' || uiStyle === 'dos' ? '900' : 'bold',
          color: themeColors.text,
          marginBottom: '4px',
          lineHeight: '1.2',
          fontFamily: uiStyle === 'brutalism' ? 'Impact, "Arial Black", sans-serif' :
                     uiStyle === 'dos' || uiStyle === 'bios' ? 'monospace' :
                     uiStyle === 'kawaii' ? '"Comic Sans MS", cursive' : 'inherit',
          textShadow: uiStyle === 'cyberpunk' ? '0 0 8px rgba(0, 255, 255, 0.5)' : 'none'
        }}>
          {product.name}
        </h3>

        {product.description && (
          <p style={{
            fontSize: '12px',
            color: themeColors.secondary,
            marginBottom: '8px',
            lineHeight: '1.3',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {product.description}
          </p>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: themeColors.primary,
            fontFamily: uiStyle === 'brutalism' ? 'Impact, "Arial Black", sans-serif' :
                       uiStyle === 'dos' || uiStyle === 'bios' ? 'monospace' : 'inherit'
          }}>
            NT$ {product.price}
          </span>

          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' : '50%',
              backgroundColor: themeColors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: uiStyle === 'brutalism' ? '#000000' : 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: uiStyle === 'brutalism' ? '2px 2px 0px #000000' :
                        uiStyle === 'neumorphism' ? '2px 2px 4px #bebebe, -2px -2px 4px #ffffff' : 'none'
            }}
          >
            +
          </div>
        </div>
      </div>

      {/* 快速添加動畫效果 */}
      {isPressed && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 123, 255, 0.2)',
            pointerEvents: 'none',
            animation: 'ripple 0.3s ease-out'
          }}
        />
      )}
    </div>
  )
}

// 手機專用購物車組件
const MobileCart: React.FC<{
  cartItems: CartItem[]
  onUpdateQuantity: (instanceId: string, quantity: number) => void
  onRemoveItem: (instanceId: string) => void
  onCheckout: () => void
  isOpen: boolean
  onClose: () => void
  uiStyle: string
  themeColors: any
}> = ({ cartItems, onUpdateQuantity, onRemoveItem, onCheckout, isOpen, onClose, uiStyle, themeColors }) => {
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end'
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: themeColors.mainBg,
          borderTopLeftRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' : '20px',
          borderTopRightRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' : '20px',
          maxHeight: '70vh',
          padding: '20px',
          border: uiStyle === 'brutalism' ? `4px solid ${themeColors.border}` : 'none',
          boxShadow: uiStyle === 'brutalism' ? '4px 4px 0px #000000' :
                    uiStyle === 'neumorphism' ? '0 -8px 16px #bebebe, 0 8px 16px #ffffff' :
                    '0 -4px 20px rgba(0, 0, 0, 0.15)',
          backdropFilter: uiStyle === 'glassmorphism' ? 'blur(20px)' : 'none'
        }}
      >
        {/* 標題欄 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: `2px solid ${themeColors.border}`
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: uiStyle === 'brutalism' || uiStyle === 'dos' ? '900' : 'bold',
            color: themeColors.text,
            fontFamily: uiStyle === 'brutalism' ? 'Impact, "Arial Black", sans-serif' :
                       uiStyle === 'dos' || uiStyle === 'bios' ? 'monospace' :
                       uiStyle === 'kawaii' ? '"Comic Sans MS", cursive' : 'inherit'
          }}>
            🛒 購物車 ({cartItems.length})
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' : '50%',
              border: 'none',
              backgroundColor: themeColors.secondary,
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* 購物車項目 */}
        <div style={{
          maxHeight: '40vh',
          overflowY: 'auto',
          marginBottom: '16px'
        }}>
          {cartItems.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: themeColors.secondary
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛒</div>
              <p>購物車是空的</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.instanceId || item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: themeColors.cardBg,
                  borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' : '8px',
                  marginBottom: '8px',
                  border: uiStyle === 'brutalism' ? `2px solid ${themeColors.border}` : 'none'
                }}
              >
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: themeColors.text,
                    marginBottom: '4px'
                  }}>
                    {item.name}
                  </h4>
                  <p style={{
                    fontSize: '12px',
                    color: themeColors.secondary
                  }}>
                    NT$ {item.price} × {item.quantity}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => onUpdateQuantity(item.instanceId || item.id, Math.max(0, item.quantity - 1))}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' : '50%',
                      border: `1px solid ${themeColors.border}`,
                      backgroundColor: themeColors.cardBg,
                      color: themeColors.text,
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    -
                  </button>
                  
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: themeColors.text,
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {item.quantity}
                  </span>
                  
                  <button
                    onClick={() => onUpdateQuantity(item.instanceId || item.id, item.quantity + 1)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' : '50%',
                      border: 'none',
                      backgroundColor: themeColors.primary,
                      color: uiStyle === 'brutalism' ? '#000000' : 'white',
                      fontSize: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 總計與結帳 */}
        {cartItems.length > 0 && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              backgroundColor: themeColors.cardBg,
              borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' : '8px',
              marginBottom: '16px',
              border: uiStyle === 'brutalism' ? `3px solid ${themeColors.border}` : 'none'
            }}>
              <span style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: themeColors.text
              }}>
                總計:
              </span>
              <span style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: themeColors.primary
              }}>
                NT$ {total.toFixed(0)}
              </span>
            </div>

            <button
              onClick={onCheckout}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '18px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: uiStyle === 'brutalism' || uiStyle === 'dos' || uiStyle === 'bios' ? '0' : '12px',
                backgroundColor: themeColors.primary,
                color: uiStyle === 'brutalism' ? '#000000' : 'white',
                cursor: 'pointer',
                boxShadow: uiStyle === 'brutalism' ? '4px 4px 0px #000000' :
                          uiStyle === 'neumorphism' ? '6px 6px 12px #bebebe, -6px -6px 12px #ffffff' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              🎯 立即結帳
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// 主要手機點餐介面組件
const MobilePOSInterface: React.FC = () => {
  const {
    categories,
    products,
    tables,
    cartItems,
    selectedTable,
    loading,
    loadCategories,
    loadProducts,
    loadTables,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    createOrder,
    setSelectedTable,
    clearCart
  } = usePOSStore()

  const { currentStyle } = useUIStyle()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isTableSelectorOpen, setIsTableSelectorOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 載入數據
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([loadCategories(), loadProducts(), loadTables()])
      } catch (error) {
        console.error('載入數據失敗:', error)
      }
    }
    loadData()
  }, [])

  // 主題顏色配置
  const themeColors = {
    mainBg: currentStyle === 'modern' ? '#ffffff' :
           currentStyle === 'neumorphism' ? '#e0e5ec' :
           currentStyle === 'glassmorphism' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
           currentStyle === 'brutalism' ? '#ffffff' :
           currentStyle === 'cyberpunk' ? '#0a0a0a' :
           currentStyle === 'dos' ? '#000080' :
           currentStyle === 'bios' ? '#000000' :
           currentStyle === 'kawaii' ? '#fff0f5' :
           '#ffffff',
           
    cardBg: currentStyle === 'modern' ? '#f8f9fa' :
           currentStyle === 'neumorphism' ? '#e0e5ec' :
           currentStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.1)' :
           currentStyle === 'brutalism' ? '#f8f9fa' :
           currentStyle === 'cyberpunk' ? '#1a1a1a' :
           currentStyle === 'dos' ? '#0000aa' :
           currentStyle === 'bios' ? '#003366' :
           currentStyle === 'kawaii' ? '#ffffff' :
           '#f8f9fa',
           
    primary: currentStyle === 'modern' ? '#007bff' :
            currentStyle === 'neumorphism' ? '#5a67d8' :
            currentStyle === 'glassmorphism' ? '#ffffff' :
            currentStyle === 'brutalism' ? '#000000' :
            currentStyle === 'cyberpunk' ? '#00ffff' :
            currentStyle === 'dos' ? '#ffff00' :
            currentStyle === 'bios' ? '#00aaff' :
            currentStyle === 'kawaii' ? '#ff69b4' :
            '#007bff',
            
    secondary: currentStyle === 'modern' ? '#6c757d' :
              currentStyle === 'neumorphism' ? '#718096' :
              currentStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.7)' :
              currentStyle === 'brutalism' ? '#6c757d' :
              currentStyle === 'cyberpunk' ? '#ff00ff' :
              currentStyle === 'dos' ? '#00ffff' :
              currentStyle === 'bios' ? '#666666' :
              currentStyle === 'kawaii' ? '#ffa0c9' :
              '#6c757d',
              
    text: currentStyle === 'modern' ? '#333333' :
         currentStyle === 'neumorphism' ? '#2d3748' :
         currentStyle === 'glassmorphism' ? '#ffffff' :
         currentStyle === 'brutalism' ? '#000000' :
         currentStyle === 'cyberpunk' ? '#ffffff' :
         currentStyle === 'dos' ? '#ffffff' :
         currentStyle === 'bios' ? '#cccccc' :
         currentStyle === 'kawaii' ? '#333333' :
         '#333333',
         
    border: currentStyle === 'modern' ? '#dee2e6' :
           currentStyle === 'neumorphism' ? '#cbd5e0' :
           currentStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.2)' :
           currentStyle === 'brutalism' ? '#000000' :
           currentStyle === 'cyberpunk' ? '#00ffff' :
           currentStyle === 'dos' ? '#ffffff' :
           currentStyle === 'bios' ? '#666666' :
           currentStyle === 'kawaii' ? '#ffb6c1' :
           '#dee2e6'
  }

  // 處理添加到購物車
  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product)
      // 觸覺反饋 (如果支援)
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    } catch (error) {
      console.error('添加到購物車失敗:', error)
    }
  }

  // 處理結帳
  const handleCheckout = async () => {
    if (!selectedTable) {
      setIsTableSelectorOpen(true)
      return
    }

    if (cartItems.length === 0) {
      alert('購物車是空的，請先加入商品')
      return
    }

    setIsLoading(true)
    try {
      // 找到所選桌位的資訊
      const currentTable = tables.find(t => t.table_number === parseInt(selectedTable))
      const tableId = currentTable?.id
      
      // 計算總價
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const taxAmount = subtotal * 0.1
      const totalAmount = subtotal + taxAmount
      
      // 建立訂單資料
      const orderData = {
        table_id: tableId,
        table_number: parseInt(selectedTable),
        items: cartItems.map(item => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          special_instructions: item.note || ''
        })),
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        customer_name: '',
        customer_phone: '',
        notes: '',
        created_by: '行動裝置'
      }
      
      console.log('送出訂單資料:', orderData)
      
      await createOrder(orderData)
      clearCart() // 清空購物車
      setIsCartOpen(false)
      setSelectedTable(null) // 重置桌號選擇
      
      // 成功反饋
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }
      
      alert(`訂單已成功送出！桌號: ${selectedTable}${currentTable?.table_name ? ` (${currentTable.table_name})` : ''}`)
    } catch (error) {
      console.error('結帳失敗:', error)
      alert('建立訂單失敗，請重試')
    } finally {
      setIsLoading(false)
    }
  }

  // 篩選產品
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch && product.is_available
  })

  // 購物車總數量
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  if (loading && products.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: themeColors.mainBg
      }}>
        <LoadingSpinner />
        <span style={{ marginLeft: '12px', color: themeColors.text }}>載入菜單中...</span>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: themeColors.mainBg,
      color: themeColors.text,
      fontFamily: currentStyle === 'brutalism' ? 'Impact, "Arial Black", sans-serif' :
                 currentStyle === 'dos' || currentStyle === 'bios' ? 'monospace' :
                 currentStyle === 'kawaii' ? '"Comic Sans MS", cursive' : 'inherit',
      position: 'relative'
    }}>
      {/* 頂部標題欄 */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: themeColors.cardBg,
        padding: '16px',
        borderBottom: `2px solid ${themeColors.border}`,
        boxShadow: currentStyle === 'brutalism' ? '4px 4px 0px #000000' :
                  currentStyle === 'neumorphism' ? '0 4px 8px #bebebe, 0 -4px 8px #ffffff' :
                  '0 2px 8px rgba(0, 0, 0, 0.1)',
        backdropFilter: currentStyle === 'glassmorphism' ? 'blur(20px)' : 'none'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <h1 style={{
            fontSize: '20px',
            fontWeight: currentStyle === 'brutalism' || currentStyle === 'dos' ? '900' : 'bold',
            color: themeColors.primary,
            margin: 0,
            textShadow: currentStyle === 'cyberpunk' ? '0 0 10px rgba(0, 255, 255, 0.5)' : 'none'
          }}>
            📱 手機點餐
          </h1>

          <div style={{ display: 'flex', gap: '8px' }}>
            {/* 桌號選擇按鈕 */}
            <button
              onClick={() => setIsTableSelectorOpen(true)}
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                border: `1px solid ${themeColors.border}`,
                borderRadius: currentStyle === 'brutalism' || currentStyle === 'dos' || currentStyle === 'bios' ? '0' : '6px',
                backgroundColor: selectedTable ? themeColors.primary : themeColors.cardBg,
                color: selectedTable ? 
                       (currentStyle === 'brutalism' ? '#000000' : 'white') : 
                       themeColors.text,
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🪑 {selectedTable ? `桌號 ${selectedTable}` : '選擇桌號'}
            </button>

            {/* 購物車按鈕 */}
            <button
              onClick={() => setIsCartOpen(true)}
              style={{
                position: 'relative',
                padding: '8px 12px',
                fontSize: '16px',
                border: 'none',
                borderRadius: currentStyle === 'brutalism' || currentStyle === 'dos' || currentStyle === 'bios' ? '0' : '6px',
                backgroundColor: themeColors.primary,
                color: currentStyle === 'brutalism' ? '#000000' : 'white',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🛒
              {cartItemCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#ff4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 搜尋欄 */}
        <input
          type="text"
          placeholder="🔍 搜尋商品..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: `2px solid ${themeColors.border}`,
            borderRadius: currentStyle === 'brutalism' || currentStyle === 'dos' || currentStyle === 'bios' ? '0' : '8px',
            backgroundColor: themeColors.mainBg,
            color: themeColors.text,
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* 分類標籤 */}
      <div style={{
        padding: '16px',
        paddingBottom: '8px'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px'
        }}>
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              border: selectedCategory === 'all' ? 'none' : `2px solid ${themeColors.border}`,
              borderRadius: currentStyle === 'brutalism' || currentStyle === 'dos' || currentStyle === 'bios' ? '0' : '20px',
              backgroundColor: selectedCategory === 'all' ? themeColors.primary : themeColors.cardBg,
              color: selectedCategory === 'all' ? 
                     (currentStyle === 'brutalism' ? '#000000' : 'white') : 
                     themeColors.text,
              cursor: 'pointer',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              minWidth: 'fit-content'
            }}
          >
            全部
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                border: selectedCategory === category.id ? 'none' : `2px solid ${themeColors.border}`,
                borderRadius: currentStyle === 'brutalism' || currentStyle === 'dos' || currentStyle === 'bios' ? '0' : '20px',
                backgroundColor: selectedCategory === category.id ? themeColors.primary : themeColors.cardBg,
                color: selectedCategory === category.id ? 
                       (currentStyle === 'brutalism' ? '#000000' : 'white') : 
                       themeColors.text,
                cursor: 'pointer',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                minWidth: 'fit-content'
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* 產品列表 */}
      <div
        ref={scrollRef}
        style={{
          padding: '0 16px 100px 16px',
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto'
        }}
      >
        {filteredProducts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: themeColors.secondary
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🍽️</div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: themeColors.text
            }}>
              沒有找到商品
            </h3>
            <p style={{ fontSize: '14px' }}>
              {searchQuery ? `沒有符合 "${searchQuery}" 的商品` : '此分類下沒有可用商品'}
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <MobileProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              uiStyle={currentStyle}
              themeColors={themeColors}
            />
          ))
        )}
      </div>

      {/* 購物車彈出視窗 */}
      <MobileCart
        cartItems={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={handleCheckout}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        uiStyle={currentStyle}
        themeColors={themeColors}
      />

      {/* 桌號選擇彈出視窗 */}
      {isTableSelectorOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setIsTableSelectorOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: themeColors.mainBg,
              borderRadius: currentStyle === 'brutalism' || currentStyle === 'dos' || currentStyle === 'bios' ? '0' : '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px',
              maxHeight: '60vh',
              overflowY: 'auto',
              border: currentStyle === 'brutalism' ? `4px solid ${themeColors.border}` : 'none',
              boxShadow: currentStyle === 'brutalism' ? '4px 4px 0px #000000' : '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}
          >
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: themeColors.text,
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              🪑 選擇桌號
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: '12px'
            }}>
              {tables
                .filter(table => table.status === 'available')
                .map((table) => (
                  <button
                    key={table.id}
                    onClick={() => {
                      setSelectedTable(table.table_number.toString())
                      setIsTableSelectorOpen(false)
                    }}
                    style={{
                      padding: '16px 8px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      border: `2px solid ${themeColors.border}`,
                      borderRadius: currentStyle === 'brutalism' || currentStyle === 'dos' || currentStyle === 'bios' ? '0' : '8px',
                      backgroundColor: selectedTable === table.table_number.toString() ? 
                                     themeColors.primary : themeColors.cardBg,
                      color: selectedTable === table.table_number.toString() ? 
                             (currentStyle === 'brutalism' ? '#000000' : 'white') : 
                             themeColors.text,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div>桌號 {table.table_number}</div>
                    {table.table_name && (
                      <div style={{ fontSize: '12px', opacity: 0.8 }}>
                        {table.table_name}
                      </div>
                    )}
                  </button>
                ))}
            </div>

            <button
              onClick={() => setIsTableSelectorOpen(false)}
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '16px',
                fontSize: '16px',
                fontWeight: 'bold',
                border: `2px solid ${themeColors.border}`,
                borderRadius: currentStyle === 'brutalism' || currentStyle === 'dos' || currentStyle === 'bios' ? '0' : '8px',
                backgroundColor: themeColors.secondary,
                color: 'white',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 載入遮罩 */}
      {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: themeColors.mainBg,
            padding: '24px',
            borderRadius: currentStyle === 'brutalism' || currentStyle === 'dos' || currentStyle === 'bios' ? '0' : '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <LoadingSpinner />
            <span style={{ color: themeColors.text, fontWeight: 'bold' }}>處理中...</span>
          </div>
        </div>
      )}

      {/* CSS 動畫 */}
      <style>
        {`
          @keyframes ripple {
            0% {
              transform: translate(-50%, -50%) scale(0);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  )
}

export default MobilePOSInterface
