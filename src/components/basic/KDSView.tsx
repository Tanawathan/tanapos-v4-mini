import React, { useState, useEffect } from 'react'
import { usePOSStore } from '../../lib/store-supabase'
import { useUIStyle } from '../../contexts/UIStyleContext'
import type { Order, OrderItem } from '../../lib/types-unified'

// 訂單狀態類型
type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'

// 訂單項目完成狀態追蹤
interface OrderItemStatus {
  orderId: string
  itemIndex: number
  isCompleted: boolean
}

// KDS 廚房顯示系統組件
const KDSView: React.FC = () => {
  const { orders, updateOrderStatus, loadOrders, loading, categories } = usePOSStore()
  const { currentStyle } = useUIStyle()
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // 追蹤每個訂單項目的完成狀態
  const [itemStatuses, setItemStatuses] = useState<Map<string, boolean>>(new Map())

  // 組件掛載時載入訂單數據和分類數據
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🍳 KDS: 載入訂單數據...')
        await loadOrders()
        console.log('✅ KDS: 訂單數據載入完成')
      } catch (error) {
        console.error('❌ KDS: 載入訂單數據失敗:', error)
      }
    }
    
    loadData()
  }, [loadOrders])

  // 更新時間
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 切換訂單項目完成狀態
  const toggleItemStatus = (orderId: string, itemIndex: number) => {
    const key = `${orderId}-${itemIndex}`
    setItemStatuses(prev => {
      const newMap = new Map(prev)
      newMap.set(key, !prev.get(key))
      return newMap
    })
  }

  // 獲取訂單項目完成狀態
  const getItemStatus = (orderId: string, itemIndex: number): boolean => {
    const key = `${orderId}-${itemIndex}`
    return itemStatuses.get(key) || false
  }

  // 檢查訂單是否所有項目都已完成
  const areAllItemsCompleted = (order: Order): boolean => {
    return order.order_items.every((_, index) => 
      getItemStatus(order.id, index)
    )
  }

  // 檢查是否為甜點項目
  const isDessertItem = (item: OrderItem): boolean => {
    // 根據產品名稱或分類來判斷是否為甜點
    const dessertKeywords = ['甜點', '蛋糕', '布丁', '提拉米蘇', '鬆餅', '冰淇淋', '仙草', '甜品', '巧克力', '芒果']
    const itemName = item.product_name?.toLowerCase() || ''
    return dessertKeywords.some(keyword => itemName.includes(keyword))
  }

  // 分離主餐和甜點項目
  const separateOrderItems = (order: Order) => {
    const mainItems = order.order_items.filter(item => !isDessertItem(item))
    const dessertItems = order.order_items.filter(item => isDessertItem(item))
    return { mainItems, dessertItems }
  }

  // 檢查主餐項目是否全部完成
  const areAllMainItemsCompleted = (order: Order): boolean => {
    const { mainItems } = separateOrderItems(order)
    if (mainItems.length === 0) return true
    return mainItems.every((_, originalIndex) => {
      const originalIndexInOrder = order.order_items.findIndex(item => item === mainItems[originalIndex])
      return getItemStatus(order.id, originalIndexInOrder)
    })
  }

  // 檢查甜點項目是否全部完成
  const areAllDessertItemsCompleted = (order: Order): boolean => {
    const { dessertItems } = separateOrderItems(order)
    if (dessertItems.length === 0) return true
    return dessertItems.every((_, originalIndex) => {
      const originalIndexInOrder = order.order_items.findIndex(item => item === dessertItems[originalIndex])
      return getItemStatus(order.id, originalIndexInOrder)
    })
  }

  // 獲取主題顏色
  const getThemeColors = () => {
    const styles = {
      modern: {
        bg: '#f8fafc',
        cardBg: '#ffffff',
        text: '#1e293b',
        subText: '#64748b',
        border: '#e2e8f0',
        primary: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        shadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      },
      neumorphism: {
        bg: '#e6e6e6',
        cardBg: '#e6e6e6',
        text: '#333333',
        subText: '#666666',
        border: '#d1d1d1',
        primary: '#667eea',
        success: '#48bb78',
        warning: '#ed8936',
        danger: '#f56565',
        shadow: '8px 8px 16px #d1d1d1, -8px -8px 16px #ffffff'
      },
      glassmorphism: {
        bg: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
        cardBg: 'rgba(255, 255, 255, 0.25)',
        text: '#ffffff',
        subText: 'rgba(255, 255, 255, 0.8)',
        border: 'rgba(255, 255, 255, 0.18)',
        primary: '#60a5fa',
        success: '#34d399',
        warning: '#fbbf24',
        danger: '#f87171',
        shadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
      },
      brutalism: {
        bg: '#ffff00',
        cardBg: '#ffffff',
        text: '#000000',
        subText: '#333333',
        border: '#000000',
        primary: '#ff0000',
        success: '#00ff00',
        warning: '#ff8800',
        danger: '#ff0000',
        shadow: '4px 4px 0px #000000'
      },
      cyberpunk: {
        bg: '#0a0a0a',
        cardBg: '#1a1a2e',
        text: '#00ff88',
        subText: '#888888',
        border: '#00ff88',
        primary: '#00ffff',
        success: '#00ff88',
        warning: '#ffaa00',
        danger: '#ff0044',
        shadow: '0 0 10px rgba(0, 255, 136, 0.3)'
      },
      kawaii: {
        bg: '#fef7ff',
        cardBg: '#ffffff',
        text: '#92400e',
        subText: '#a78bfa',
        border: '#f3e8ff',
        primary: '#ec4899',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#f43f5e',
        shadow: '0 4px 6px rgba(236, 72, 153, 0.1)'
      },
      skeuomorphism: {
        bg: '#f0f0f0',
        cardBg: 'linear-gradient(145deg, #ffffff, #e6e6e6)',
        text: '#333333',
        subText: '#666666',
        border: '#cccccc',
        primary: '#007aff',
        success: '#34c759',
        warning: '#ff9500',
        danger: '#ff3b30',
        shadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 1px 2px rgba(0,0,0,0.1)'
      },
      dos: {
        bg: '#000080',
        cardBg: '#c0c0c0',
        text: '#000000',
        subText: '#404040',
        border: '#808080',
        primary: '#000080',
        success: '#008000',
        warning: '#808000',
        danger: '#800000',
        shadow: 'inset -1px -1px #000000, inset 1px 1px #ffffff'
      },
      bios: {
        bg: '#000000',
        cardBg: '#000080',
        text: '#ffffff',
        subText: '#c0c0c0',
        border: '#404040',
        primary: '#00ffff',
        success: '#00ff00',
        warning: '#ffff00',
        danger: '#ff0000',
        shadow: 'none'
      },
      code: {
        bg: '#1e1e1e',
        cardBg: '#2d2d30',
        text: '#d4d4d4',
        subText: '#808080',
        border: '#404040',
        primary: '#569cd6',
        success: '#4ec9b0',
        warning: '#dcdcaa',
        danger: '#f44747',
        shadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
      }
    }
    return styles[currentStyle] || styles.modern
  }

  // 獲取訂單狀態顏色
  const getStatusColors = (status: OrderStatus) => {
    const colors = getThemeColors()
    switch (status) {
      case 'pending':
        return { bg: colors.warning, text: '#ffffff' }
      case 'preparing':
        return { bg: colors.primary, text: '#ffffff' }
      case 'ready':
        return { bg: colors.success, text: '#ffffff' }
      case 'completed':
        return { bg: colors.subText, text: '#ffffff' }
      default:
        return { bg: colors.subText, text: '#ffffff' }
    }
  }

  // 獲取訂單優先級
  const getOrderPriority = (order: Order) => {
    const now = new Date()
    const orderTime = new Date(order.created_at)
    const minutesElapsed = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60))
    
    if (minutesElapsed > 30) return 'urgent'
    if (minutesElapsed > 15) return 'warning'
    return 'normal'
  }

  // 過濾活躍訂單（未完成的訂單）
  const activeOrders = orders.filter(order => 
    order.status !== 'completed' && order.status !== 'cancelled'
  )

  // 按狀態分組訂單
  const groupedOrders = {
    pending: activeOrders.filter(order => order.status === 'pending'),
    preparing: activeOrders.filter(order => order.status === 'preparing'),
    ready: activeOrders.filter(order => order.status === 'ready')
  }

  const themeColors = getThemeColors()

  // 載入狀態檢查
  if (loading && orders.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: themeColors.bg,
        color: themeColors.text,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: currentStyle === 'dos' || currentStyle === 'bios' ? 'monospace' : 'system-ui, sans-serif'
      }}>
        <div style={{
          fontSize: '2rem',
          marginBottom: '1rem'
        }}>🍳</div>
        <div style={{
          fontSize: '1.25rem',
          color: themeColors.primary
        }}>
          載入廚房數據中...
        </div>
        <div style={{
          fontSize: '0.875rem',
          color: themeColors.subText,
          marginTop: '0.5rem'
        }}>
          {orders.length > 0 ? `已載入 ${orders.length} 筆訂單` : '連接數據庫中...'}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: themeColors.bg,
      color: themeColors.text,
      padding: '1.5rem',
      fontFamily: currentStyle === 'dos' || currentStyle === 'bios' ? 'monospace' : 'system-ui, sans-serif'
    }}>
      {/* 標題區域 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        padding: '1rem',
        background: themeColors.cardBg,
        borderRadius: currentStyle === 'brutalism' ? '0' : '0.5rem',
        border: currentStyle === 'brutalism' ? `2px solid ${themeColors.border}` : `1px solid ${themeColors.border}`,
        boxShadow: themeColors.shadow
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '2rem',
          fontWeight: 'bold',
          color: themeColors.text
        }}>
          👨‍🍳 廚房顯示系統
        </h1>
        <div style={{ 
          fontSize: '1.25rem',
          color: themeColors.subText,
          fontWeight: '500'
        }}>
          {currentTime.toLocaleTimeString('zh-TW')}
        </div>
      </div>

      {/* 統計區域 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {[
          { label: '待處理', count: groupedOrders.pending.length, color: themeColors.warning },
          { label: '製作中', count: groupedOrders.preparing.length, color: themeColors.primary },
          { label: '已完成', count: groupedOrders.ready.length, color: themeColors.success },
          { label: '總計', count: activeOrders.length, color: themeColors.text }
        ].map((stat, index) => (
          <div key={index} style={{
            background: themeColors.cardBg,
            padding: '1rem',
            borderRadius: currentStyle === 'brutalism' ? '0' : '0.5rem',
            border: currentStyle === 'brutalism' ? `2px solid ${themeColors.border}` : `1px solid ${themeColors.border}`,
            boxShadow: themeColors.shadow,
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: stat.color,
              marginBottom: '0.5rem'
            }}>
              {stat.count}
            </div>
            <div style={{
              color: themeColors.subText,
              fontSize: '0.875rem'
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* 訂單區域 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '1.5rem'
      }}>
        {Object.entries(groupedOrders).map(([status, statusOrders]) => (
          <div key={status} style={{
            background: themeColors.cardBg,
            borderRadius: currentStyle === 'brutalism' ? '0' : '0.5rem',
            border: currentStyle === 'brutalism' ? `2px solid ${themeColors.border}` : `1px solid ${themeColors.border}`,
            boxShadow: themeColors.shadow,
            overflow: 'hidden'
          }}>
            {/* 列標題 */}
            <div style={{
              padding: '1rem',
              background: getStatusColors(status as OrderStatus).bg,
              color: getStatusColors(status as OrderStatus).text,
              fontWeight: 'bold',
              fontSize: '1.125rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>
                {status === 'pending' && '⏳ 待處理'}
                {status === 'preparing' && '🔥 製作中'}
                {status === 'ready' && '✅ 已完成'}
              </span>
              <span style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.25rem 0.5rem',
                borderRadius: '1rem',
                fontSize: '0.875rem'
              }}>
                {statusOrders.length}
              </span>
            </div>

            {/* 訂單列表 */}
            <div style={{ padding: '1rem', maxHeight: '70vh', overflowY: 'auto' }}>
              {statusOrders.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: themeColors.subText,
                  padding: '2rem',
                  fontSize: '0.875rem'
                }}>
                  暫無訂單
                </div>
              ) : (
                statusOrders.map(order => {
                  const priority = getOrderPriority(order)
                  const orderTime = new Date(order.created_at)
                  const minutesElapsed = Math.floor((new Date().getTime() - orderTime.getTime()) / (1000 * 60))
                  
                  return (
                    <div key={order.id} style={{
                      background: priority === 'urgent' ? 'rgba(239, 68, 68, 0.1)' : 
                                 priority === 'warning' ? 'rgba(245, 158, 11, 0.1)' : 
                                 'transparent',
                      border: `1px solid ${priority === 'urgent' ? themeColors.danger : 
                                          priority === 'warning' ? themeColors.warning : 
                                          themeColors.border}`,
                      borderRadius: currentStyle === 'brutalism' ? '0' : '0.375rem',
                      padding: '1rem',
                      marginBottom: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}>
                      {/* 訂單標題 */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem'
                      }}>
                        <div style={{
                          fontWeight: 'bold',
                          fontSize: '1.125rem',
                          color: themeColors.text
                        }}>
                          訂單 #{order.order_number || order.id.slice(-4)}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: priority === 'urgent' ? themeColors.danger : themeColors.subText,
                          fontWeight: priority === 'urgent' ? 'bold' : 'normal'
                        }}>
                          {minutesElapsed}分鐘前
                        </div>
                      </div>

                      {/* 訂單項目 - 分離主餐和甜點 */}
                      <div style={{ marginBottom: '1rem' }}>
                        {(() => {
                          const { mainItems, dessertItems } = separateOrderItems(order)
                          
                          return (
                            <>
                              {/* 主餐區域 */}
                              {mainItems.length > 0 && (
                                <div style={{ marginBottom: '1rem' }}>
                                  <div style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 'bold',
                                    color: themeColors.primary,
                                    marginBottom: '0.5rem',
                                    padding: '0.25rem 0.5rem',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    borderRadius: '0.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                  }}>
                                    🍽️ 主餐 ({mainItems.filter((_, idx) => {
                                      const originalIndex = order.order_items.findIndex(item => item === mainItems[idx])
                                      return getItemStatus(order.id, originalIndex)
                                    }).length}/{mainItems.length})
                                  </div>
                                  {mainItems.map((item, idx) => {
                                    const originalIndex = order.order_items.findIndex(orderItem => orderItem === item)
                                    const isCompleted = getItemStatus(order.id, originalIndex)
                                    return (
                                      <div 
                                        key={`main-${originalIndex}`} 
                                        onClick={() => toggleItemStatus(order.id, originalIndex)}
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          padding: '0.5rem',
                                          cursor: 'pointer',
                                          transition: 'background-color 0.2s ease',
                                          backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                          borderRadius: '0.25rem',
                                          marginBottom: '0.25rem',
                                          border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : themeColors.border}`
                                        }}
                                        onMouseEnter={(e) => {
                                          if (!isCompleted) {
                                            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)'
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
                                        }}
                                      >
                                        <div style={{
                                          flex: 1,
                                          color: themeColors.text,
                                          position: 'relative'
                                        }}>
                                          <span style={{ 
                                            fontWeight: '500',
                                            textDecoration: isCompleted ? 'line-through' : 'none',
                                            opacity: isCompleted ? 0.6 : 1,
                                            position: 'relative'
                                          }}>
                                            {isCompleted && (
                                              <span style={{
                                                marginRight: '0.5rem',
                                                color: themeColors.success,
                                                fontSize: '1rem'
                                              }}>
                                                ✓
                                              </span>
                                            )}
                                            {item.product_name || '未知商品'}
                                          </span>
                                          {item.special_instructions && (
                                            <div style={{
                                              fontSize: '0.75rem',
                                              color: themeColors.subText,
                                              marginTop: '0.25rem',
                                              textDecoration: isCompleted ? 'line-through' : 'none',
                                              opacity: isCompleted ? 0.6 : 1
                                            }}>
                                              {item.special_instructions}
                                            </div>
                                          )}
                                        </div>
                                        <div style={{
                                          background: isCompleted ? themeColors.success : themeColors.primary,
                                          color: '#ffffff',
                                          padding: '0.25rem 0.5rem',
                                          borderRadius: '1rem',
                                          fontSize: '0.875rem',
                                          fontWeight: 'bold',
                                          minWidth: '2rem',
                                          textAlign: 'center',
                                          opacity: isCompleted ? 0.8 : 1
                                        }}>
                                          {item.quantity}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {/* 甜點區域 */}
                              {dessertItems.length > 0 && (
                                <div style={{ marginBottom: '1rem' }}>
                                  <div style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 'bold',
                                    color: '#ec4899',
                                    marginBottom: '0.5rem',
                                    padding: '0.25rem 0.5rem',
                                    backgroundColor: 'rgba(236, 72, 153, 0.1)',
                                    borderRadius: '0.25rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                  }}>
                                    🍰 甜點 (主餐後上) ({dessertItems.filter((_, idx) => {
                                      const originalIndex = order.order_items.findIndex(item => item === dessertItems[idx])
                                      return getItemStatus(order.id, originalIndex)
                                    }).length}/{dessertItems.length})
                                    {!areAllMainItemsCompleted(order) && (
                                      <span style={{
                                        fontSize: '0.75rem',
                                        backgroundColor: '#f59e0b',
                                        color: 'white',
                                        padding: '0.125rem 0.5rem',
                                        borderRadius: '1rem'
                                      }}>
                                        等待主餐
                                      </span>
                                    )}
                                  </div>
                                  {dessertItems.map((item, idx) => {
                                    const originalIndex = order.order_items.findIndex(orderItem => orderItem === item)
                                    const isCompleted = getItemStatus(order.id, originalIndex)
                                    const canPrepare = areAllMainItemsCompleted(order)
                                    return (
                                      <div 
                                        key={`dessert-${originalIndex}`} 
                                        onClick={() => canPrepare && toggleItemStatus(order.id, originalIndex)}
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          padding: '0.5rem',
                                          cursor: canPrepare ? 'pointer' : 'not-allowed',
                                          transition: 'background-color 0.2s ease',
                                          backgroundColor: isCompleted ? 'rgba(236, 72, 153, 0.1)' : 'transparent',
                                          borderRadius: '0.25rem',
                                          marginBottom: '0.25rem',
                                          border: `1px solid ${isCompleted ? 'rgba(236, 72, 153, 0.3)' : '#f3e8ff'}`,
                                          opacity: canPrepare ? 1 : 0.5
                                        }}
                                        onMouseEnter={(e) => {
                                          if (!isCompleted && canPrepare) {
                                            e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.05)'
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = isCompleted ? 'rgba(236, 72, 153, 0.1)' : 'transparent'
                                        }}
                                      >
                                        <div style={{
                                          flex: 1,
                                          color: themeColors.text,
                                          position: 'relative'
                                        }}>
                                          <span style={{ 
                                            fontWeight: '500',
                                            textDecoration: isCompleted ? 'line-through' : 'none',
                                            opacity: isCompleted ? 0.6 : 1,
                                            position: 'relative'
                                          }}>
                                            {isCompleted && (
                                              <span style={{
                                                marginRight: '0.5rem',
                                                color: '#ec4899',
                                                fontSize: '1rem'
                                              }}>
                                                ✓
                                              </span>
                                            )}
                                            {item.product_name || '未知商品'}
                                          </span>
                                          {item.special_instructions && (
                                            <div style={{
                                              fontSize: '0.75rem',
                                              color: themeColors.subText,
                                              marginTop: '0.25rem',
                                              textDecoration: isCompleted ? 'line-through' : 'none',
                                              opacity: isCompleted ? 0.6 : 1
                                            }}>
                                              {item.special_instructions}
                                            </div>
                                          )}
                                        </div>
                                        <div style={{
                                          background: isCompleted ? '#ec4899' : '#f3e8ff',
                                          color: isCompleted ? '#ffffff' : '#92400e',
                                          padding: '0.25rem 0.5rem',
                                          borderRadius: '1rem',
                                          fontSize: '0.875rem',
                                          fontWeight: 'bold',
                                          minWidth: '2rem',
                                          textAlign: 'center',
                                          opacity: isCompleted ? 0.8 : 1
                                        }}>
                                          {item.quantity}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </div>

                      {/* 操作按鈕 */}
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        alignItems: 'center'
                      }}>
                        {status === 'pending' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                            style={{
                              background: themeColors.primary,
                              color: '#ffffff',
                              border: 'none',
                              padding: '0.5rem 1rem',
                              borderRadius: currentStyle === 'brutalism' ? '0' : '0.25rem',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              boxShadow: currentStyle === 'brutalism' ? `2px 2px 0px ${themeColors.border}` : 'none'
                            }}
                          >
                            開始製作
                          </button>
                        )}
                        {status === 'preparing' && (
                          <>
                            {/* 詳細進度顯示 */}
                            {(() => {
                              const { mainItems, dessertItems } = separateOrderItems(order)
                              const completedMainItems = mainItems.filter((_, idx) => {
                                const originalIndex = order.order_items.findIndex(item => item === mainItems[idx])
                                return getItemStatus(order.id, originalIndex)
                              }).length
                              const completedDessertItems = dessertItems.filter((_, idx) => {
                                const originalIndex = order.order_items.findIndex(item => item === dessertItems[idx])
                                return getItemStatus(order.id, originalIndex)
                              }).length
                              
                              return (
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.25rem',
                                  padding: '0.5rem',
                                  backgroundColor: themeColors.cardBg === '#ffffff' ? '#f9fafb' : 'rgba(255,255,255,0.05)',
                                  borderRadius: '0.5rem',
                                  border: `1px solid ${themeColors.border}`,
                                  fontSize: '0.75rem'
                                }}>
                                  {mainItems.length > 0 && (
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      color: areAllMainItemsCompleted(order) ? themeColors.success : themeColors.text
                                    }}>
                                      🍽️ 主餐: {completedMainItems}/{mainItems.length}
                                      {areAllMainItemsCompleted(order) && <span>✓</span>}
                                    </div>
                                  )}
                                  {dessertItems.length > 0 && (
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      color: areAllDessertItemsCompleted(order) ? '#ec4899' : themeColors.subText,
                                      opacity: areAllMainItemsCompleted(order) ? 1 : 0.6
                                    }}>
                                      🍰 甜點: {completedDessertItems}/{dessertItems.length}
                                      {areAllDessertItemsCompleted(order) && <span>✓</span>}
                                      {!areAllMainItemsCompleted(order) && <span style={{ color: '#f59e0b' }}>(等待主餐)</span>}
                                    </div>
                                  )}
                                  <div style={{
                                    borderTop: `1px solid ${themeColors.border}`,
                                    paddingTop: '0.25rem',
                                    marginTop: '0.25rem',
                                    fontWeight: 'bold',
                                    color: themeColors.text
                                  }}>
                                    總進度: {order.order_items.filter((_, index) => getItemStatus(order.id, index)).length}/{order.order_items.length}
                                  </div>
                                </div>
                              )
                            })()}
                            
                            <button
                              onClick={() => updateOrderStatus(order.id, 'ready')}
                              disabled={!areAllItemsCompleted(order)}
                              style={{
                                background: areAllItemsCompleted(order) ? themeColors.success : themeColors.subText,
                                color: '#ffffff',
                                border: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: currentStyle === 'brutalism' ? '0' : '0.25rem',
                                cursor: areAllItemsCompleted(order) ? 'pointer' : 'not-allowed',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                boxShadow: currentStyle === 'brutalism' ? `2px 2px 0px ${themeColors.border}` : 'none',
                                opacity: areAllItemsCompleted(order) ? 1 : 0.6
                              }}
                              title={
                                areAllItemsCompleted(order) 
                                  ? '所有餐點製作完成' 
                                  : (() => {
                                      const { mainItems, dessertItems } = separateOrderItems(order)
                                      if (!areAllMainItemsCompleted(order)) {
                                        return '請先完成所有主餐項目'
                                      } else if (!areAllDessertItemsCompleted(order)) {
                                        return '請完成甜點項目'
                                      }
                                      return '請完成所有餐點項目'
                                    })()
                              }
                            >
                              {areAllItemsCompleted(order) ? '✓ 全部完成' : '製作完成'}
                            </button>
                          </>
                        )}
                        {status === 'ready' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                            style={{
                              background: themeColors.subText,
                              color: '#ffffff',
                              border: 'none',
                              padding: '0.5rem 1rem',
                              borderRadius: currentStyle === 'brutalism' ? '0' : '0.25rem',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              boxShadow: currentStyle === 'brutalism' ? `2px 2px 0px ${themeColors.border}` : 'none'
                            }}
                          >
                            出餐完成
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 無訂單狀態 */}
      {activeOrders.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: themeColors.cardBg,
          borderRadius: currentStyle === 'brutalism' ? '0' : '0.5rem',
          border: currentStyle === 'brutalism' ? `2px solid ${themeColors.border}` : `1px solid ${themeColors.border}`,
          boxShadow: themeColors.shadow
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>
            😴
          </div>
          <h3 style={{
            margin: '0 0 0.5rem 0',
            color: themeColors.text,
            fontSize: '1.25rem'
          }}>
            目前沒有待處理訂單
          </h3>
          <p style={{
            margin: 0,
            color: themeColors.subText,
            fontSize: '0.875rem'
          }}>
            廚房可以稍作休息
          </p>
        </div>
      )}
    </div>
  )
}

export default KDSView