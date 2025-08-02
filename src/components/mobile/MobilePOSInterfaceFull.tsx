import React, { useState, useEffect } from 'react'
import { usePOSStore } from '../../lib/store-supabase'
import { useUIStyle } from '../../contexts/UIStyleContext'
import { Category, Product, CartItem, Table } from '../../lib/types-unified'
import LoadingSpinner from '../ui/LoadingSpinner'

// 手機專用緊湊型產品卡片
const CompactProductCard: React.FC<{
  product: Product
  onAddToCart: (product: Product, note?: string) => void
  uiStyle: string
  themeColors: any
}> = ({ product, onAddToCart, uiStyle, themeColors }) => {
  const [isPressed, setIsPressed] = useState(false)
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [note, setNote] = useState('')

  const handleAddWithNote = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (note.trim()) {
      onAddToCart(product, note.trim())
      setNote('')
      setShowNoteInput(false)
    } else {
      onAddToCart(product)
    }
  }

  const handleNoteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowNoteInput(true)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onTouchCancel={() => setIsPressed(false)}
        onClick={() => onAddToCart(product)}
        style={{
          backgroundColor: themeColors.cardBg,
          border: `1px solid ${themeColors.border}`,
          borderRadius: '6px',
          padding: '8px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '6px',
          minHeight: '60px',
          boxShadow: isPressed ? 
                     '0 1px 3px rgba(0, 0, 0, 0.1)' :
                     '0 2px 6px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.15s ease',
          transform: isPressed ? 'scale(0.98)' : 'scale(1)',
          cursor: 'pointer',
          position: 'relative'
        }}
      >
        {/* 產品圖片 - 小尺寸 */}
        {product.image_url && (
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '4px',
            backgroundImage: `url(${product.image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            flexShrink: 0
          }} />
        )}
        
        {/* 產品資訊 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: themeColors.text,
            marginBottom: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {product.name}
          </h4>
          <p style={{
            fontSize: '12px',
            color: themeColors.secondary,
            marginBottom: '0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {product.description}
          </p>
        </div>

        {/* 價格和按鈕 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '4px',
          flexShrink: 0
        }}>
          <span style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: themeColors.primary
          }}>
            NT$ {product.price}
          </span>
          <div style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center'
          }}>
            {/* 備註按鈕 */}
            <button
              onClick={handleNoteClick}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '12px',
                backgroundColor: themeColors.secondary,
                color: themeColors.primaryText,
                border: 'none',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="添加備註"
            >
              📝
            </button>
            {/* 加入按鈕 */}
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '14px',
              backgroundColor: themeColors.primary,
              color: themeColors.primaryText,
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              +
            </div>
          </div>
        </div>
      </div>

      {/* 備註輸入彈窗 */}
      {showNoteInput && (
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
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: themeColors.background,
            borderRadius: '8px',
            padding: '20px',
            width: '100%',
            maxWidth: '320px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: themeColors.text,
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              為 {product.name} 添加備註
            </h3>
            
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="請輸入備註信息..."
              style={{
                width: '100%',
                height: '80px',
                padding: '8px',
                border: `1px solid ${themeColors.border}`,
                borderRadius: '4px',
                backgroundColor: themeColors.cardBg,
                color: themeColors.text,
                fontSize: '14px',
                resize: 'none',
                boxSizing: 'border-box',
                marginBottom: '12px'
              }}
              autoFocus
            />
            
            <div style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowNoteInput(false)
                  setNote('')
                }}
                style={{
                  padding: '8px 16px',
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: '4px',
                  backgroundColor: themeColors.cardBg,
                  color: themeColors.text,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={handleAddWithNote}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: themeColors.primary,
                  color: themeColors.primaryText,
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                加入購物車
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 手機專用緊湊型購物車項目
const CompactCartItem: React.FC<{
  item: CartItem & { note?: string }
  onUpdateQuantity: (instanceId: string, quantity: number) => void
  onUpdateNote: (instanceId: string, note: string) => void
  onRemove: (instanceId: string) => void
  uiStyle: string
  themeColors: any
}> = ({ item, onUpdateQuantity, onUpdateNote, onRemove, uiStyle, themeColors }) => {
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [note, setNote] = useState(item.note || '')

  const handleSaveNote = () => {
    onUpdateNote(item.instanceId || item.id, note)
    setShowNoteInput(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px',
        backgroundColor: themeColors.cardBg,
        borderRadius: '6px',
        marginBottom: '6px',
        border: `1px solid ${themeColors.border}`
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{
            fontSize: '13px',
            fontWeight: '600',
            color: themeColors.text,
            marginBottom: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {item.name}
            {item.note && (
              <span style={{
                fontSize: '11px',
                color: themeColors.warning,
                marginLeft: '4px'
              }}>
                📝
              </span>
            )}
          </h4>
          <p style={{
            fontSize: '11px',
            color: themeColors.secondary,
            margin: '0'
          }}>
            NT$ {item.price} × {item.quantity}
          </p>
          {item.note && (
            <p style={{
              fontSize: '10px',
              color: themeColors.warning,
              margin: '2px 0 0 0',
              fontStyle: 'italic',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              備註: {item.note}
            </p>
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          {/* 備註按鈕 */}
          <button
            onClick={() => setShowNoteInput(true)}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: item.note ? themeColors.warning : themeColors.secondary,
              color: 'white',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={item.note ? '編輯備註' : '添加備註'}
          >
            📝
          </button>

          <button
            onClick={() => onUpdateQuantity(item.instanceId || item.id, Math.max(0, item.quantity - 1))}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '12px',
              border: `1px solid ${themeColors.border}`,
              backgroundColor: themeColors.background,
              color: themeColors.text,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            -
          </button>
          
          <span style={{
            fontSize: '13px',
            fontWeight: 'bold',
            color: themeColors.text,
            minWidth: '16px',
            textAlign: 'center'
          }}>
            {item.quantity}
          </span>
          
          <button
            onClick={() => onUpdateQuantity(item.instanceId || item.id, item.quantity + 1)}
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '12px',
              backgroundColor: themeColors.primary,
              color: themeColors.primaryText,
              border: 'none',
              fontSize: '12px',
              fontWeight: 'bold',
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

      {/* 備註編輯彈窗 */}
      {showNoteInput && (
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
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: themeColors.background,
            borderRadius: '8px',
            padding: '20px',
            width: '100%',
            maxWidth: '320px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: themeColors.text,
              marginBottom: '8px',
              textAlign: 'center'
            }}>
              編輯備註 - {item.name}
            </h3>
            
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="請輸入備註信息..."
              style={{
                width: '100%',
                height: '80px',
                padding: '8px',
                border: `1px solid ${themeColors.border}`,
                borderRadius: '4px',
                backgroundColor: themeColors.cardBg,
                color: themeColors.text,
                fontSize: '14px',
                resize: 'none',
                boxSizing: 'border-box',
                marginBottom: '12px'
              }}
              autoFocus
            />
            
            <div style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowNoteInput(false)
                  setNote(item.note || '')
                }}
                style={{
                  padding: '8px 16px',
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: '4px',
                  backgroundColor: themeColors.cardBg,
                  color: themeColors.text,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              {item.note && (
                <button
                  onClick={() => {
                    onUpdateNote(item.instanceId || item.id, '')
                    setNote('')
                    setShowNoteInput(false)
                  }}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    backgroundColor: themeColors.danger,
                    color: 'white',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  清除
                </button>
              )}
              <button
                onClick={handleSaveNote}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: themeColors.primary,
                  color: themeColors.primaryText,
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                儲存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 主要的手機專用POS介面
const MobilePOSInterfaceFull: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<number>(0)
  const [cartNotes, setCartNotes] = useState<Record<string, string>>({})

  const { currentStyle } = useUIStyle()
  
  const {
    products,
    categories,
    tables,
    cartItems,
    loading,
    loadCategories,
    loadProducts,
    loadTables,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    createOrder,
    setSelectedTable: setStoreSelectedTable
  } = usePOSStore()

  // 主題顏色配置
  const themeColors = {
    background: currentStyle === 'modern' ? '#ffffff' :
               currentStyle === 'neumorphism' ? '#e0e5ec' :
               currentStyle === 'glassmorphism' ? 'rgba(15, 23, 42, 0.9)' :
               currentStyle === 'brutalism' ? '#ffffff' :
               currentStyle === 'cyberpunk' ? '#0a0a0a' :
               currentStyle === 'dos' ? '#0000aa' :
               currentStyle === 'bios' ? '#003366' :
               currentStyle === 'kawaii' ? '#ffe0f0' :
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
            
    primaryText: currentStyle === 'modern' ? '#ffffff' :
                currentStyle === 'neumorphism' ? '#ffffff' :
                currentStyle === 'glassmorphism' ? '#000000' :
                currentStyle === 'brutalism' ? '#ffffff' :
                currentStyle === 'cyberpunk' ? '#000000' :
                currentStyle === 'dos' ? '#0000aa' :
                currentStyle === 'bios' ? '#ffffff' :
                currentStyle === 'kawaii' ? '#ffffff' :
                '#ffffff',
                
    text: currentStyle === 'modern' ? '#212529' :
         currentStyle === 'neumorphism' ? '#2d3748' :
         currentStyle === 'glassmorphism' ? '#ffffff' :
         currentStyle === 'brutalism' ? '#000000' :
         currentStyle === 'cyberpunk' ? '#00ffff' :
         currentStyle === 'dos' ? '#ffffff' :
         currentStyle === 'bios' ? '#ffffff' :
         currentStyle === 'kawaii' ? '#ff1493' :
         '#212529',
         
    secondary: currentStyle === 'modern' ? '#6c757d' :
              currentStyle === 'neumorphism' ? '#718096' :
              currentStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.7)' :
              currentStyle === 'brutalism' ? '#333333' :
              currentStyle === 'cyberpunk' ? '#666666' :
              currentStyle === 'dos' ? '#cccccc' :
              currentStyle === 'bios' ? '#cccccc' :
              currentStyle === 'kawaii' ? '#ff6eb4' :
              '#6c757d',
              
    border: currentStyle === 'modern' ? '#dee2e6' :
           currentStyle === 'neumorphism' ? '#cbd5e0' :
           currentStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.2)' :
           currentStyle === 'brutalism' ? '#000000' :
           currentStyle === 'cyberpunk' ? '#00ffff' :
           currentStyle === 'dos' ? '#ffffff' :
           currentStyle === 'bios' ? '#666666' :
           currentStyle === 'kawaii' ? '#ffb6c1' :
           '#dee2e6',
           
    warning: currentStyle === 'modern' ? '#f59e0b' :
            currentStyle === 'neumorphism' ? '#ed8936' :
            currentStyle === 'glassmorphism' ? '#fbbf24' :
            currentStyle === 'brutalism' ? '#ffff00' :
            currentStyle === 'cyberpunk' ? '#ffff00' :
            currentStyle === 'dos' ? '#ffff00' :
            currentStyle === 'bios' ? '#ffaa00' :
            currentStyle === 'kawaii' ? '#ffc0cb' :
            '#f59e0b',
            
    danger: currentStyle === 'modern' ? '#ef4444' :
           currentStyle === 'neumorphism' ? '#f56565' :
           currentStyle === 'glassmorphism' ? '#f87171' :
           currentStyle === 'brutalism' ? '#ff0000' :
           currentStyle === 'cyberpunk' ? '#ff0080' :
           currentStyle === 'dos' ? '#ff0000' :
           currentStyle === 'bios' ? '#ff6666' :
           currentStyle === 'kawaii' ? '#ff69b4' :
           '#ef4444'
  }

  useEffect(() => {
    loadCategories()
    loadProducts()
    loadTables()
  }, [loadCategories, loadProducts, loadTables])

  useEffect(() => {
    setStoreSelectedTable(selectedTable.toString())
  }, [selectedTable, setStoreSelectedTable])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory
    return matchesSearch && matchesCategory && product.is_available
  })

  // 創建測試桌位數據（如果沒有真實數據）
  const createTestTables = () => {
    return [
      {
        id: '1',
        table_number: 1,
        table_name: '窗邊雅座',
        capacity: 2,
        status: 'available' as const,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        table_number: 2,
        table_name: 'VIP包廂A',
        capacity: 4,
        status: 'occupied' as const,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        table_number: 3,
        table_name: '中央圓桌',
        capacity: 6,
        status: 'available' as const,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '4',
        table_number: 4,
        table_name: '露台座位',
        capacity: 4,
        status: 'available' as const,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '5',
        table_number: 5,
        table_name: '二樓包廂',
        capacity: 8,
        status: 'cleaning' as const,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
  }

  // 獲取當前桌位數據（優先使用真實數據）
  const currentTables = tables.length > 0 ? tables : (loading ? [] : createTestTables())

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const handleAddToCart = (product: Product, note?: string) => {
    addToCart(product, 1)
    if (note) {
      // 使用產品ID和時間戳創建唯一的實例ID來儲存備註
      const instanceId = `${product.id}_${Date.now()}`
      setCartNotes(prev => ({
        ...prev,
        [instanceId]: note
      }))
    }
  }

  const handleUpdateNote = (instanceId: string, note: string) => {
    setCartNotes(prev => ({
      ...prev,
      [instanceId]: note
    }))
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert('購物車是空的，請先加入商品')
      return
    }
    if (!selectedTable || selectedTable === 0) {
      alert('請選擇桌號')
      return
    }
    
    try {
      // 找到所選桌位的資訊
      const currentTable = currentTables.find(t => t.table_number === selectedTable)
      const tableId = currentTable?.id
      
      // 計算總價
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const taxAmount = subtotal * 0.1
      const totalAmount = subtotal + taxAmount
      
      // 建立訂單資料
      const orderData = {
        table_id: tableId,
        table_number: selectedTable,
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
      setSelectedTable(0) // 重置桌號選擇
      alert(`訂單已成功送出！桌號: ${selectedTable}${currentTable?.table_name ? ` (${currentTable.table_name})` : ''}`)
    } catch (error) {
      console.error('建立訂單錯誤:', error)
      alert('建立訂單失敗，請重試')
    }
  }

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: themeColors.background
      }}>
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div style={{
      height: '100vh',
      backgroundColor: themeColors.background,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      touchAction: 'pan-y'
    }}>
      {/* 頂部標題欄 */}
      <div style={{
        backgroundColor: themeColors.primary,
        color: themeColors.primaryText,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '13px',
            fontWeight: '500'
          }}>
            桌號:
          </span>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#333',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            <option value={0}>請選擇桌號</option>
            {currentTables.length > 0 ? (
              currentTables.map(table => (
                <option key={table.id} value={table.table_number}>
                  桌號 {table.table_number}
                  {table.table_name ? ` - ${table.table_name}` : ''}
                  {table.status === 'occupied' ? ' (使用中)' : ''}
                </option>
              ))
            ) : (
              Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>桌號 {num}</option>
              ))
            )}
          </select>
        </div>
        
        <button
          onClick={() => setIsCartOpen(true)}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: themeColors.primaryText,
            border: 'none',
            borderRadius: '20px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          🛒 {totalItems}
        </button>
      </div>

      {/* 搜尋欄 */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: themeColors.background
      }}>
        <input
          type="text"
          placeholder="搜尋餐點..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: `1px solid ${themeColors.border}`,
            borderRadius: '6px',
            backgroundColor: themeColors.cardBg,
            color: themeColors.text,
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* 分類標籤 */}
      <div style={{
        padding: '8px 16px',
        backgroundColor: themeColors.background,
        borderBottom: `1px solid ${themeColors.border}`
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}>
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '6px 12px',
              border: 'none',
              borderRadius: '16px',
              backgroundColor: selectedCategory === 'all' ? themeColors.primary : themeColors.cardBg,
              color: selectedCategory === 'all' ? themeColors.primaryText : themeColors.text,
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            全部
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '16px',
                backgroundColor: selectedCategory === category.id ? themeColors.primary : themeColors.cardBg,
                color: selectedCategory === category.id ? themeColors.primaryText : themeColors.text,
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* 產品列表 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 16px',
        paddingBottom: totalItems > 0 ? '80px' : '12px'
      }}>
        {filteredProducts.map(product => (
          <CompactProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
            uiStyle={currentStyle}
            themeColors={themeColors}
          />
        ))}
        
        {filteredProducts.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: themeColors.secondary
          }}>
            <p>沒有找到相關產品</p>
          </div>
        )}
      </div>

      {/* 底部購物車摘要 */}
      {totalItems > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: themeColors.primary,
          color: themeColors.primaryText,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
          zIndex: 20
        }}>
          <div>
            <p style={{
              fontSize: '12px',
              margin: '0 0 2px 0',
              opacity: 0.9
            }}>
              {totalItems} 項商品
            </p>
            <p style={{
              fontSize: '16px',
              fontWeight: 'bold',
              margin: '0'
            }}>
              NT$ {totalAmount.toLocaleString()}
            </p>
          </div>
          
          <button
            onClick={() => setIsCartOpen(true)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: themeColors.primaryText,
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            查看購物車
          </button>
        </div>
      )}

      {/* 購物車彈窗 */}
      {isCartOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'flex-end',
          zIndex: 50
        }}>
          <div style={{
            width: '100%',
            maxHeight: '80vh',
            backgroundColor: themeColors.background,
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* 購物車標題 */}
            <div style={{
              padding: '16px',
              borderBottom: `1px solid ${themeColors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: themeColors.text,
                margin: '0'
              }}>
                購物車 ({totalItems})
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '14px',
                  border: 'none',
                  backgroundColor: themeColors.secondary,
                  color: 'white',
                  fontSize: '16px',
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
              flex: 1,
              overflowY: 'auto',
              padding: '12px 16px'
            }}>
              {cartItems.map(item => {
                const itemWithNote = {
                  ...item,
                  note: cartNotes[item.instanceId || item.id] || ''
                }
                return (
                  <CompactCartItem
                    key={item.instanceId || item.id}
                    item={itemWithNote}
                    onUpdateQuantity={updateCartQuantity}
                    onUpdateNote={handleUpdateNote}
                    onRemove={removeFromCart}
                    uiStyle={currentStyle}
                    themeColors={themeColors}
                  />
                )
              })}
            </div>

            {/* 結帳按鈕 */}
            <div style={{
              padding: '16px',
              borderTop: `1px solid ${themeColors.border}`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: themeColors.text
                }}>
                  總計: NT$ {totalAmount.toLocaleString()}
                </span>
                <button
                  onClick={clearCart}
                  style={{
                    padding: '6px 12px',
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: '6px',
                    backgroundColor: themeColors.background,
                    color: themeColors.secondary,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  清空
                </button>
              </div>
              
              <button
                onClick={handleCheckout}
                disabled={cartItems.length === 0}
                style={{
                  width: '100%',
                  padding: '14px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: cartItems.length === 0 ? themeColors.secondary : themeColors.primary,
                  color: themeColors.primaryText,
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: cartItems.length === 0 ? 0.6 : 1
                }}
              >
                確認訂單
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MobilePOSInterfaceFull
