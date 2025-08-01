import React, { useState, useEffect } from 'react'
import { usePOSStore } from '../../lib/store-supabase'
import { useUIStyle } from '../../contexts/UIStyleContext'
import type { Order } from '../../lib/types-unified'

// 訂單狀態類型
type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'

// KDS 廚房顯示系統組件
const KDSView: React.FC = () => {
  const { orders, updateOrderStatus, loadOrders, loading } = usePOSStore()
  const { currentStyle } = useUIStyle()
  const [currentTime, setCurrentTime] = useState(new Date())

  // 組件掛載時載入訂單數據
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

                      {/* 訂單項目 */}
                      <div style={{ marginBottom: '1rem' }}>
                        {order.order_items.map((item, index) => (
                          <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.5rem 0',
                            borderBottom: index < order.order_items.length - 1 ? `1px solid ${themeColors.border}` : 'none'
                          }}>
                            <div style={{
                              flex: 1,
                              color: themeColors.text
                            }}>
                              <span style={{ fontWeight: '500' }}>{item.product_name || '未知商品'}</span>
                              {item.special_instructions && (
                                <div style={{
                                  fontSize: '0.75rem',
                                  color: themeColors.subText,
                                  marginTop: '0.25rem'
                                }}>
                                  {item.special_instructions}
                                </div>
                              )}
                            </div>
                            <div style={{
                              background: themeColors.primary,
                              color: '#ffffff',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '1rem',
                              fontSize: '0.875rem',
                              fontWeight: 'bold',
                              minWidth: '2rem',
                              textAlign: 'center'
                            }}>
                              {item.quantity}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 操作按鈕 */}
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap'
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
                          <button
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                            style={{
                              background: themeColors.success,
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
                            製作完成
                          </button>
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