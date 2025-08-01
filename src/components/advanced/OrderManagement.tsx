import React, { useState, useEffect } from 'react'
import { usePOSStore } from '../../lib/store-supabase'
import { useUIStyle } from '../../contexts/UIStyleContext'
import type { Order } from '../../lib/types-unified'

// 訂單狀態類型
type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'

// 訂單管理組件
export default function OrderManagement() {
  const { orders, updateOrderStatus, loadOrders, loading } = usePOSStore()
  const { currentStyle } = useUIStyle()
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | OrderStatus>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // 組件掛載時載入訂單數據
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('📋 訂單管理: 載入訂單數據...')
        await loadOrders()
        console.log('✅ 訂單管理: 訂單數據載入完成')
      } catch (error) {
        console.error('❌ 訂單管理: 載入訂單數據失敗:', error)
      }
    }
    
    loadData()
  }, [loadOrders])

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
        shadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        hover: '#f1f5f9'
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
        shadow: '8px 8px 16px #d1d1d1, -8px -8px 16px #ffffff',
        hover: '#f0f0f0'
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
        shadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
        hover: 'rgba(255, 255, 255, 0.1)'
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
        shadow: '4px 4px 0px #000000',
        hover: '#f0f0f0'
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
        shadow: '0 0 10px rgba(0, 255, 136, 0.3)',
        hover: '#16213e'
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
        shadow: '0 4px 6px rgba(236, 72, 153, 0.1)',
        hover: '#fdf4ff'
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
        shadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 1px 2px rgba(0,0,0,0.1)',
        hover: '#f5f5f5'
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
        shadow: 'inset -1px -1px #000000, inset 1px 1px #ffffff',
        hover: '#d0d0d0'
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
        shadow: 'none',
        hover: '#000040'
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
        shadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        hover: '#383838'
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
      case 'confirmed':
        return { bg: colors.primary, text: '#ffffff' }
      case 'preparing':
        return { bg: '#f97316', text: '#ffffff' }
      case 'ready':
        return { bg: colors.success, text: '#ffffff' }
      case 'served':
      case 'completed':
        return { bg: colors.subText, text: '#ffffff' }
      case 'cancelled':
        return { bg: colors.danger, text: '#ffffff' }
      default:
        return { bg: colors.subText, text: '#ffffff' }
    }
  }

  // 獲取狀態標籤
  const getStatusLabel = (status: OrderStatus) => {
    const labels = {
      pending: '等待確認',
      confirmed: '已確認',
      preparing: '製作中',
      ready: '待取餐',
      served: '已完成',
      completed: '已完成',
      cancelled: '已取消'
    }
    return labels[status] || status
  }

  // 過濾訂單
  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'all' || order.status === activeTab
    const matchesSearch = !searchTerm || 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.table_number?.toString().includes(searchTerm)
    return matchesTab && matchesSearch
  })

  // 按狀態統計訂單
  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => o.status === 'completed' || o.status === 'served').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
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
        }}>📋</div>
        <div style={{
          fontSize: '1.25rem',
          color: themeColors.primary
        }}>
          載入訂單數據中...
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
        marginBottom: '2rem'
      }}>
        <h1 style={{
          margin: '0 0 1rem 0',
          fontSize: '2rem',
          fontWeight: 'bold',
          color: themeColors.text
        }}>
          📋 訂單管理系統
        </h1>

        {/* 統計卡片 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {[
            { label: '總訂單', count: orderStats.total, color: themeColors.text },
            { label: '等待確認', count: orderStats.pending, color: themeColors.warning },
            { label: '製作中', count: orderStats.preparing, color: '#f97316' },
            { label: '待取餐', count: orderStats.ready, color: themeColors.success },
            { label: '已完成', count: orderStats.completed, color: themeColors.subText }
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
      </div>

      {/* 搜尋和篩選 */}
      <div style={{
        marginBottom: '1.5rem'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* 搜尋框 */}
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="搜尋訂單編號、客戶名稱或桌號..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${themeColors.border}`,
                borderRadius: currentStyle === 'brutalism' ? '0' : '0.5rem',
                background: themeColors.cardBg,
                color: themeColors.text,
                fontSize: '1rem',
                outline: 'none',
                boxShadow: currentStyle === 'brutalism' ? `2px 2px 0px ${themeColors.border}` : 'none'
              }}
            />
          </div>

          {/* 狀態篩選按鈕 */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem'
          }}>
            {[
              { key: 'all', label: '全部' },
              { key: 'pending', label: '等待確認' },
              { key: 'confirmed', label: '已確認' },
              { key: 'preparing', label: '製作中' },
              { key: 'ready', label: '待取餐' },
              { key: 'completed', label: '已完成' },
              { key: 'cancelled', label: '已取消' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  borderRadius: currentStyle === 'brutalism' ? '0' : '0.5rem',
                  border: currentStyle === 'brutalism' ? `2px solid ${themeColors.border}` : 'none',
                  background: activeTab === tab.key ? themeColors.primary : themeColors.cardBg,
                  color: activeTab === tab.key ? '#ffffff' : themeColors.text,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: currentStyle === 'brutalism' ? `2px 2px 0px ${themeColors.border}` : 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.key) {
                    e.currentTarget.style.background = themeColors.hover
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.key) {
                    e.currentTarget.style.background = themeColors.cardBg
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 主要內容區域 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem',
        minHeight: '600px'
      }}>
        {/* 訂單列表 */}
        <div style={{
          background: themeColors.cardBg,
          borderRadius: currentStyle === 'brutalism' ? '0' : '0.5rem',
          border: currentStyle === 'brutalism' ? `2px solid ${themeColors.border}` : `1px solid ${themeColors.border}`,
          boxShadow: themeColors.shadow,
          overflow: 'hidden'
        }}>
          {/* 列表標題 */}
          <div style={{
            padding: '1rem',
            borderBottom: `1px solid ${themeColors.border}`,
            background: currentStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '1.125rem',
              fontWeight: '600',
              color: themeColors.text
            }}>
              訂單列表 ({filteredOrders.length})
            </h2>
          </div>

          {/* 訂單項目 */}
          <div style={{
            maxHeight: '600px',
            overflowY: 'auto'
          }}>
            {filteredOrders.length === 0 ? (
              <div style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                color: themeColors.subText
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>沒有找到訂單</div>
                <div style={{ fontSize: '0.875rem' }}>請嘗試調整搜尋條件或篩選器</div>
              </div>
            ) : (
              filteredOrders.map(order => {
                const statusColors = getStatusColors(order.status as OrderStatus)
                const isSelected = selectedOrder?.id === order.id
                
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    style={{
                      padding: '1rem',
                      borderBottom: `1px solid ${themeColors.border}`,
                      cursor: 'pointer',
                      background: isSelected ? themeColors.hover : 'transparent',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = themeColors.hover
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    {/* 訂單標題行 */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem'
                    }}>
                      <div>
                        <div style={{
                          fontWeight: '500',
                          color: themeColors.text,
                          marginBottom: '0.25rem'
                        }}>
                          {order.order_number}
                        </div>
                        <div style={{
                          fontSize: '0.875rem',
                          color: themeColors.subText
                        }}>
                          桌號: {order.table_number} | 項目: {order.order_items?.length || 0}
                          {order.customer_name && (
                            <span> | {order.customer_name}</span>
                          )}
                        </div>
                      </div>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        borderRadius: currentStyle === 'brutalism' ? '0' : '1rem',
                        background: statusColors.bg,
                        color: statusColors.text,
                        border: currentStyle === 'brutalism' ? `1px solid ${themeColors.border}` : 'none'
                      }}>
                        {getStatusLabel(order.status as OrderStatus)}
                      </span>
                    </div>

                    {/* 訂單詳情行 */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.875rem'
                    }}>
                      <div style={{ color: themeColors.subText }}>
                        {new Date(order.created_at).toLocaleString('zh-TW')}
                      </div>
                      <div style={{
                        fontWeight: '500',
                        color: themeColors.text
                      }}>
                        ${order.total_amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* 訂單詳情 */}
        <div style={{
          background: themeColors.cardBg,
          borderRadius: currentStyle === 'brutalism' ? '0' : '0.5rem',
          border: currentStyle === 'brutalism' ? `2px solid ${themeColors.border}` : `1px solid ${themeColors.border}`,
          boxShadow: themeColors.shadow
        }}>
          {!selectedOrder ? (
            <div style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              color: themeColors.subText,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👈</div>
              <div style={{ fontSize: '1.125rem' }}>選擇一個訂單查看詳情</div>
            </div>
          ) : (
            <div>
              {/* 詳情標題 */}
              <div style={{
                padding: '1rem',
                borderBottom: `1px solid ${themeColors.border}`,
                background: currentStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h2 style={{
                    margin: 0,
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: themeColors.text
                  }}>
                    訂單詳情
                  </h2>
                  {(() => {
                    const statusColors = getStatusColors(selectedOrder.status as OrderStatus)
                    return (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        borderRadius: currentStyle === 'brutalism' ? '0' : '1rem',
                        background: statusColors.bg,
                        color: statusColors.text,
                        border: currentStyle === 'brutalism' ? `1px solid ${themeColors.border}` : 'none'
                      }}>
                        {getStatusLabel(selectedOrder.status as OrderStatus)}
                      </span>
                    )
                  })()}
                </div>
              </div>

              {/* 詳情內容 */}
              <div style={{ padding: '1rem' }}>
                {/* 基本資訊 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{
                    margin: '0 0 0.75rem 0',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: themeColors.text
                  }}>
                    基本資訊
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    fontSize: '0.875rem'
                  }}>
                    <div>
                      <span style={{ color: themeColors.subText }}>訂單編號: </span>
                      <span style={{ color: themeColors.text, fontWeight: '500' }}>
                        {selectedOrder.order_number}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: themeColors.subText }}>桌號: </span>
                      <span style={{ color: themeColors.text, fontWeight: '500' }}>
                        {selectedOrder.table_number}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: themeColors.subText }}>下單時間: </span>
                      <span style={{ color: themeColors.text, fontWeight: '500' }}>
                        {new Date(selectedOrder.created_at).toLocaleString('zh-TW')}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: themeColors.subText }}>總金額: </span>
                      <span style={{ color: themeColors.text, fontWeight: '500' }}>
                        ${selectedOrder.total_amount.toFixed(2)}
                      </span>
                    </div>
                    {selectedOrder.customer_name && (
                      <div>
                        <span style={{ color: themeColors.subText }}>客戶姓名: </span>
                        <span style={{ color: themeColors.text, fontWeight: '500' }}>
                          {selectedOrder.customer_name}
                        </span>
                      </div>
                    )}
                    {selectedOrder.customer_phone && (
                      <div>
                        <span style={{ color: themeColors.subText }}>聯絡電話: </span>
                        <span style={{ color: themeColors.text, fontWeight: '500' }}>
                          {selectedOrder.customer_phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 訂單項目 */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{
                    margin: '0 0 0.75rem 0',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: themeColors.text
                  }}>
                    訂單項目
                  </h3>
                  <div style={{
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: currentStyle === 'brutalism' ? '0' : '0.375rem',
                    overflow: 'hidden'
                  }}>
                    {selectedOrder.order_items?.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '0.75rem',
                          borderBottom: index < selectedOrder.order_items.length - 1 ? `1px solid ${themeColors.border}` : 'none',
                          background: index % 2 === 0 ? 'transparent' : themeColors.hover
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{
                              fontWeight: '500',
                              color: themeColors.text,
                              marginBottom: '0.25rem'
                            }}>
                              {item.product_name}
                            </div>
                            {item.special_instructions && (
                              <div style={{
                                fontSize: '0.75rem',
                                color: themeColors.subText
                              }}>
                                備註: {item.special_instructions}
                              </div>
                            )}
                          </div>
                          <div style={{
                            textAlign: 'right'
                          }}>
                            <div style={{
                              fontWeight: '500',
                              color: themeColors.text
                            }}>
                              x{item.quantity}
                            </div>
                            <div style={{
                              fontSize: '0.875rem',
                              color: themeColors.subText
                            }}>
                              ${item.total_price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  flexWrap: 'wrap'
                }}>
                  {selectedOrder.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
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
                      確認訂單
                    </button>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'preparing')}
                      style={{
                        background: '#f97316',
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
                  {selectedOrder.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'ready')}
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
                  {selectedOrder.status === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
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
                      完成出餐
                    </button>
                  )}
                  {(selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed') && (
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                      style={{
                        background: themeColors.danger,
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
                      取消訂單
                    </button>
                  )}
                </div>

                {/* 備註 */}
                {selectedOrder.notes && (
                  <div style={{
                    marginTop: '1.5rem',
                    padding: '0.75rem',
                    background: themeColors.hover,
                    borderRadius: currentStyle === 'brutalism' ? '0' : '0.375rem',
                    border: currentStyle === 'brutalism' ? `1px solid ${themeColors.border}` : 'none'
                  }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: themeColors.text,
                      marginBottom: '0.25rem'
                    }}>
                      備註:
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: themeColors.subText
                    }}>
                      {selectedOrder.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
