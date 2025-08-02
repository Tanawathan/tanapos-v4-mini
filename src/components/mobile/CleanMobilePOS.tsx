import React, { useEffect, useState } from 'react'
import { usePOSStore } from '../../lib/store-complete'
import type { Product, CartItem } from '../../lib/types-unified'

const CleanMobilePOS: React.FC = () => {
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
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [note, setNote] = useState('')

  // 載入數據
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          loadProducts(),
          loadCategories(),
          loadTables()
        ])
      } catch (error) {
        console.error('載入數據失敗:', error)
      }
    }
    loadData()
  }, [])

  // 計算購物車數據
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)

  // 篩選產品
  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory
    return matchesCategory && product.is_available
  })

  // 處理結帳 - 使用和 SimplePOS 相同的格式
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert('購物車是空的，請先加入商品')
      return
    }

    if (!selectedTable) {
      alert('請選擇桌號')
      return
    }

    try {
      const subtotal = cartTotal
      const taxAmount = subtotal * 0.1
      const totalAmount = subtotal + taxAmount

      const orderData = {
        table_id: selectedTable,
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
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

      console.log('📱 乾淨手機版 POS 送出訂單資料:', orderData)

      await createOrder(orderData)
      clearCart()
      setSelectedTable(null)
      setNote('')
      setIsCartOpen(false)
      alert('訂單已成功建立！')
    } catch (error) {
      console.error('建立訂單失敗:', error)
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
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* 頂部標題欄 */}
      <div style={{
        backgroundColor: '#3b82f6',
        color: 'white',
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          margin: 0
        }}>
          TanaPOS Mobile
        </h1>
        <button
          onClick={() => setIsCartOpen(true)}
          style={{
            position: 'relative',
            backgroundColor: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🛒 購物車 ({cartItemCount})
          {cartItemCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

      {/* 分類選擇 */}
      <div style={{
        padding: '16px',
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px'
        }}>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: !selectedCategory ? '#3b82f6' : '#f3f4f6',
              color: !selectedCategory ? 'white' : '#374151',
              fontSize: '14px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              fontWeight: !selectedCategory ? 'bold' : 'normal'
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
                borderRadius: '20px',
                border: 'none',
                backgroundColor: selectedCategory === category.id ? '#3b82f6' : '#f3f4f6',
                color: selectedCategory === category.id ? 'white' : '#374151',
                fontSize: '14px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                fontWeight: selectedCategory === category.id ? 'bold' : 'normal'
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* 產品列表 */}
      <div style={{
        padding: '16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '16px'
      }}>
        {filteredProducts.map(product => {
          const cartItem = cartItems.find(item => item.id === product.id)
          const quantity = cartItem ? cartItem.quantity : 0

          return (
            <div
              key={product.id}
              style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                position: 'relative',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              {/* 數量徽章 */}
              {quantity > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
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

              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  color: '#111827',
                  lineHeight: '1.4'
                }}>
                  {product.name}
                </h3>

                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '12px',
                  lineHeight: '1.4'
                }}>
                  {product.description}
                </p>

                <div style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#3b82f6',
                  marginBottom: '16px'
                }}>
                  NT$ {product.price}
                </div>
              </div>

              {/* 操作按鈕 */}
              {quantity > 0 ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}>
                  <button
                    onClick={() => updateCartQuantity(cartItem!.instanceId, quantity - 1)}
                    style={{
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      width: '36px',
                      height: '36px',
                      cursor: 'pointer',
                      fontSize: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    -
                  </button>
                  <span style={{ 
                    fontWeight: 'bold',
                    fontSize: '16px',
                    minWidth: '24px',
                    textAlign: 'center'
                  }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => updateCartQuantity(cartItem!.instanceId, quantity + 1)}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      width: '36px',
                      height: '36px',
                      cursor: 'pointer',
                      fontSize: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => addToCart(product)}
                  style={{
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    width: '100%',
                    fontWeight: 'bold'
                  }}
                >
                  加入購物車
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* 購物車彈窗 */}
      {isCartOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-end'
        }}>
          <div style={{
            backgroundColor: 'white',
            width: '100%',
            maxHeight: '85vh',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            padding: '20px',
            overflowY: 'auto'
          }}>
            {/* 標題欄 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                margin: 0,
                color: '#111827'
              }}>
                購物車 ({cartItemCount} 項商品)
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
                <p style={{ fontSize: '16px', margin: 0 }}>購物車是空的</p>
              </div>
            ) : (
              <>
                {/* 商品列表 */}
                <div style={{ marginBottom: '20px' }}>
                  {cartItems.map(item => (
                    <div
                      key={item.instanceId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        marginBottom: '12px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h4 style={{ 
                          fontSize: '16px', 
                          fontWeight: 'bold', 
                          margin: '0 0 4px 0',
                          color: '#111827'
                        }}>
                          {item.name}
                        </h4>
                        <p style={{ 
                          fontSize: '14px', 
                          color: '#6b7280', 
                          margin: 0 
                        }}>
                          NT$ {item.price} × {item.quantity} = NT$ {item.price * item.quantity}
                        </p>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <button
                          onClick={() => updateCartQuantity(item.instanceId, item.quantity - 1)}
                          style={{
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            fontSize: '16px'
                          }}
                        >
                          -
                        </button>
                        <span style={{ 
                          minWidth: '32px', 
                          textAlign: 'center',
                          fontWeight: 'bold'
                        }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.instanceId, item.quantity + 1)}
                          style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            fontSize: '16px'
                          }}
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.instanceId)}
                          style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            marginLeft: '8px'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 桌號選擇 */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: '#374151'
                  }}>
                    桌號
                  </label>
                  <select
                    value={selectedTable || ''}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      color: '#111827',
                      fontSize: '16px'
                    }}
                  >
                    <option value="">請選擇桌號</option>
                    {tables
                      .filter(table => table.status === 'available')
                      .map(table => (
                        <option key={table.id} value={table.id}>
                          {table.table_number}號桌 ({table.capacity}人)
                          {table.table_name && ` - ${table.table_name}`}
                        </option>
                      ))}
                  </select>
                </div>

                {/* 備註 */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: '#374151'
                  }}>
                    備註
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="請輸入特殊要求..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      color: '#111827',
                      fontSize: '16px',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>

                {/* 總計 */}
                <div style={{
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    <span>小計：</span>
                    <span>NT$ {cartTotal}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    <span>稅額 (10%)：</span>
                    <span>NT$ {Math.round(cartTotal * 0.1)}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#111827'
                  }}>
                    <span>總計：</span>
                    <span>NT$ {Math.round(cartTotal * 1.1)}</span>
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div style={{
                  display: 'flex',
                  gap: '12px'
                }}>
                  <button
                    onClick={clearCart}
                    style={{
                      flex: 1,
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '16px',
                      fontSize: '16px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    清空購物車
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={!selectedTable || cartItems.length === 0}
                    style={{
                      flex: 2,
                      backgroundColor: selectedTable && cartItems.length > 0 ? '#10b981' : '#9ca3af',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '16px',
                      fontSize: '16px',
                      cursor: selectedTable && cartItems.length > 0 ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold'
                    }}
                  >
                    送出訂單
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CleanMobilePOS
