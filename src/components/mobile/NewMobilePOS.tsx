import React, { useState, useEffect } from 'react'
import { usePOSStore } from '../../lib/store-supabase'
import type { Product, CartItem, Table } from '../../lib/types-unified'

interface NewMobilePOSProps {
  uiStyle?: string
  themeColors?: any
}

const NewMobilePOS: React.FC<NewMobilePOSProps> = ({ uiStyle = 'modern', themeColors }) => {
  const {
    products,
    categories,
    cartItems,
    tables,
    loading,
    selectedTable,
    setSelectedTable,
    loadProducts,
    loadCategories,
    loadTables,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    createOrder,
    getCartTotal
  } = usePOSStore()

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isTableSelectorOpen, setIsTableSelectorOpen] = useState(false)
  const [note, setNote] = useState('')

  // 使用默認主題色彩
  const defaultColors = {
    primary: '#3b82f6',
    primaryText: '#ffffff',
    secondary: '#6b7280',
    text: '#1f2937',
    background: '#ffffff',
    cardBg: '#f9fafb',
    border: '#e5e7eb',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  }

  const colors = themeColors || defaultColors

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

  // 篩選產品
  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory
    return matchesCategory && product.is_available
  })

  // 處理結帳
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert('購物車是空的，請先加入商品')
      return
    }

    if (!selectedTable) {
      setIsTableSelectorOpen(true)
      return
    }

    try {
      // 找到所選桌位的資訊
      const currentTable = tables.find(t => t.id === selectedTable)
      const tableNumber = currentTable?.table_number

      // 計算總價
      const subtotal = getCartTotal()
      const taxAmount = subtotal * 0.1
      const totalAmount = subtotal + taxAmount

      // 建立訂單資料 - 使用和SimplePOS相同的格式
      const orderData = {
        table_id: selectedTable,
        table_number: tableNumber,
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

      console.log('📱 新行動POS 送出訂單資料:', orderData)

      await createOrder(orderData)
      clearCart()
      setSelectedTable(null)
      setNote('')
      setIsCartOpen(false)
      alert(`訂單已成功建立！桌號: ${tableNumber}`)
    } catch (error) {
      console.error('建立訂單失敗:', error)
      alert('建立訂單失敗，請重試')
    }
  }

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = getCartTotal()

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background
      }}>
        <div 
          style={{
            width: '2rem',
            height: '2rem',
            border: `2px solid ${colors.border}`,
            borderTop: `2px solid ${colors.primary}`,
            borderRadius: '50%',
            display: 'inline-block'
          }}
          className="tanapos-spinner"
        />
      </div>
    )
  }

  return (
    <div 
      className="new-mobile-pos controlled-zoom"
      style={{
        minHeight: '100vh',
        backgroundColor: colors.background,
        color: colors.text
      }}
    >
      {/* 頂部導航 */}
      <div 
        className="ios-safe-area"
        style={{
          backgroundColor: colors.primary,
          color: colors.primaryText,
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
          TanaPOS Mobile
        </h1>
        <button
          onClick={() => setIsCartOpen(true)}
          style={{
            position: 'relative',
            backgroundColor: 'transparent',
            border: `2px solid ${colors.primaryText}`,
            color: colors.primaryText,
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            cursor: 'pointer'
          }}
        >
          購物車 ({cartItemCount})
          {cartItemCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-0.5rem',
              right: '-0.5rem',
              backgroundColor: colors.danger,
              color: 'white',
              borderRadius: '50%',
              width: '1.5rem',
              height: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem'
            }}>
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

      {/* 分類選擇 */}
      <div style={{
        padding: '1rem',
        backgroundColor: colors.cardBg,
        borderBottom: `1px solid ${colors.border}`
      }}>
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem'
        }}>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '1rem',
              border: 'none',
              backgroundColor: !selectedCategory ? colors.primary : colors.background,
              color: !selectedCategory ? colors.primaryText : colors.text,
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            全部
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '1rem',
                border: 'none',
                backgroundColor: selectedCategory === category.id ? colors.primary : colors.background,
                color: selectedCategory === category.id ? colors.primaryText : colors.text,
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* 產品網格 */}
      <div 
        className="product-grid"
        style={{
          padding: '1rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem'
        }}
      >
        {filteredProducts.map(product => {
          const cartItem = cartItems.find(item => item.id === product.id)
          const quantity = cartItem ? cartItem.quantity : 0

          return (
            <div
              key={product.id}
              style={{
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`,
                borderRadius: '0.5rem',
                padding: '1rem',
                textAlign: 'center',
                position: 'relative'
              }}
            >
              {/* 數量徽章 */}
              {quantity > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '-0.5rem',
                  right: '-0.5rem',
                  backgroundColor: colors.primary,
                  color: colors.primaryText,
                  borderRadius: '50%',
                  width: '1.5rem',
                  height: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  {quantity}
                </div>
              )}

              <h3 style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: colors.text
              }}>
                {product.name}
              </h3>

              <p style={{
                fontSize: '0.875rem',
                color: colors.secondary,
                marginBottom: '0.5rem'
              }}>
                {product.description}
              </p>

              <div style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                color: colors.primary,
                marginBottom: '1rem'
              }}>
                NT$ {product.price}
              </div>

              {quantity > 0 ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <button
                    onClick={() => updateCartQuantity(cartItem!.instanceId, quantity - 1)}
                    style={{
                      backgroundColor: colors.secondary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      width: '2rem',
                      height: '2rem',
                      cursor: 'pointer'
                    }}
                  >
                    -
                  </button>
                  <span style={{ fontWeight: 'bold' }}>{quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(cartItem!.instanceId, quantity + 1)}
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.primaryText,
                      border: 'none',
                      borderRadius: '0.25rem',
                      width: '2rem',
                      height: '2rem',
                      cursor: 'pointer'
                    }}
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => addToCart(product, 1)}
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.primaryText,
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    width: '100%'
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
          <div 
            className="cart-modal"
            style={{
              backgroundColor: colors.background,
              width: '100%',
              maxHeight: '80vh',
              borderTopLeftRadius: '1rem',
              borderTopRightRadius: '1rem',
              padding: '1rem',
              overflowY: 'auto'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
                購物車 ({cartItemCount} 項商品)
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: colors.secondary
                }}
              >
                ×
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: colors.secondary
              }}>
                購物車是空的
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  {cartItems.map(item => (
                    <div
                      key={item.instanceId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        backgroundColor: colors.cardBg,
                        borderRadius: '0.5rem',
                        marginBottom: '0.5rem'
                      }}
                    >
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>
                          {item.name}
                        </h4>
                        <p style={{ fontSize: '0.875rem', color: colors.secondary, margin: 0 }}>
                          NT$ {item.price} × {item.quantity}
                        </p>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <button
                          onClick={() => updateCartQuantity(item.instanceId, item.quantity - 1)}
                          style={{
                            backgroundColor: colors.secondary,
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            width: '2rem',
                            height: '2rem',
                            cursor: 'pointer'
                          }}
                        >
                          -
                        </button>
                        <span style={{ minWidth: '2rem', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.instanceId, item.quantity + 1)}
                          style={{
                            backgroundColor: colors.primary,
                            color: colors.primaryText,
                            border: 'none',
                            borderRadius: '0.25rem',
                            width: '2rem',
                            height: '2rem',
                            cursor: 'pointer'
                          }}
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.instanceId)}
                          style={{
                            backgroundColor: colors.danger,
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            width: '2rem',
                            height: '2rem',
                            cursor: 'pointer',
                            marginLeft: '0.5rem'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 桌號選擇 */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem'
                  }}>
                    桌號
                  </label>
                  <select
                    value={selectedTable || ''}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '0.5rem',
                      backgroundColor: colors.background,
                      color: colors.text,
                      fontSize: '1rem'
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
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    marginBottom: '0.5rem'
                  }}>
                    備註
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="請輸入特殊要求..."
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '0.5rem',
                      backgroundColor: colors.background,
                      color: colors.text,
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* 總計 */}
                <div style={{
                  borderTop: `1px solid ${colors.border}`,
                  paddingTop: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <span>小計：</span>
                    <span>NT$ {cartTotal}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <span>稅額 (10%)：</span>
                    <span>NT$ {Math.round(cartTotal * 0.1)}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.125rem',
                    fontWeight: 'bold'
                  }}>
                    <span>總計：</span>
                    <span>NT$ {Math.round(cartTotal * 1.1)}</span>
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div style={{
                  display: 'flex',
                  gap: '1rem'
                }}>
                  <button
                    onClick={clearCart}
                    style={{
                      flex: 1,
                      backgroundColor: colors.secondary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      fontSize: '1rem',
                      cursor: 'pointer'
                    }}
                  >
                    清空購物車
                  </button>
                  <button
                    onClick={handleCheckout}
                    disabled={!selectedTable || cartItems.length === 0}
                    style={{
                      flex: 2,
                      backgroundColor: selectedTable && cartItems.length > 0 ? colors.success : colors.secondary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      fontSize: '1rem',
                      cursor: selectedTable && cartItems.length > 0 ? 'pointer' : 'not-allowed'
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

      {/* 桌號選擇彈窗 */}
      {isTableSelectorOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: colors.background,
            borderRadius: '0.5rem',
            padding: '1.5rem',
            margin: '1rem',
            maxWidth: '400px',
            width: '100%'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              請選擇桌號
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              {tables
                .filter(table => table.status === 'available')
                .map(table => (
                  <button
                    key={table.id}
                    onClick={() => {
                      setSelectedTable(table.id)
                      setIsTableSelectorOpen(false)
                    }}
                    style={{
                      padding: '1rem',
                      backgroundColor: colors.primary,
                      color: colors.primaryText,
                      border: 'none',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      textAlign: 'center'
                    }}
                  >
                    桌號 {table.table_number}
                    {table.table_name && (
                      <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
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
                padding: '0.75rem',
                backgroundColor: colors.secondary,
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default NewMobilePOS
