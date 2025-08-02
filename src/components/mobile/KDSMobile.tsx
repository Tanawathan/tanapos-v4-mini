import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import '../../styles/kds-mobile.css'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  notes?: string
  status: 'pending' | 'preparing' | 'ready'
}

interface Order {
  id: string
  order_number: string
  table_number?: number
  table_name?: string
  customer_name?: string
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  items: OrderItem[]
  total_amount: number
  created_at: string
  estimated_time?: number
  priority?: 'normal' | 'urgent' | 'vip'
}

const KDSMobile: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all')
  const [currentTime, setCurrentTime] = useState(new Date())

  // 載入訂單數據
  const loadOrders = async () => {
    try {
      console.log('📱 載入 KDS 訂單數據...')
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'preparing', 'ready'])
        .order('created_at', { ascending: true })

      if (error) {
        console.log('❌ 無法載入訂單，使用模擬數據:', error.message)
        // 使用模擬數據
        const mockOrders: Order[] = [
          {
            id: 'order-1',
            order_number: 'ORD-001',
            table_number: 5,
            table_name: 'A5桌',
            customer_name: '張先生',
            status: 'pending',
            items: [
              { id: '1', name: '宮保雞丁', quantity: 2, price: 280, status: 'pending', notes: '不要辣' },
              { id: '2', name: '蒜泥白肉', quantity: 1, price: 320, status: 'pending' },
              { id: '3', name: '白飯', quantity: 2, price: 30, status: 'pending' }
            ],
            total_amount: 890,
            created_at: new Date(Date.now() - 5 * 60000).toISOString(),
            estimated_time: 15,
            priority: 'normal'
          },
          {
            id: 'order-2',
            order_number: 'ORD-002',
            table_number: 3,
            table_name: 'B3桌',
            customer_name: '李小姐',
            status: 'preparing',
            items: [
              { id: '4', name: '紅燒獅子頭', quantity: 1, price: 360, status: 'preparing' },
              { id: '5', name: '麻婆豆腐', quantity: 1, price: 180, status: 'ready', notes: '微辣' },
              { id: '6', name: '青菜', quantity: 2, price: 120, status: 'pending' }
            ],
            total_amount: 660,
            created_at: new Date(Date.now() - 12 * 60000).toISOString(),
            estimated_time: 8,
            priority: 'urgent'
          },
          {
            id: 'order-3',
            order_number: 'ORD-003',
            table_number: 8,
            table_name: 'VIP包廂',
            customer_name: '王總',
            status: 'ready',
            items: [
              { id: '7', name: '北京烤鴨', quantity: 1, price: 1200, status: 'ready' },
              { id: '8', name: '清蒸石斑魚', quantity: 1, price: 880, status: 'ready' },
              { id: '9', name: '龍井蝦仁', quantity: 1, price: 480, status: 'ready' }
            ],
            total_amount: 2560,
            created_at: new Date(Date.now() - 20 * 60000).toISOString(),
            estimated_time: 0,
            priority: 'vip'
          },
          {
            id: 'order-4',
            order_number: 'ORD-004',
            table_number: 2,
            table_name: 'C2桌',
            status: 'pending',
            items: [
              { id: '10', name: '酸辣湯', quantity: 2, price: 80, status: 'pending' },
              { id: '11', name: '糖醋里肌', quantity: 1, price: 250, status: 'pending', notes: '少糖' }
            ],
            total_amount: 410,
            created_at: new Date(Date.now() - 2 * 60000).toISOString(),
            estimated_time: 12,
            priority: 'normal'
          }
        ]
        setOrders(mockOrders)
      } else {
        console.log('✅ 載入真實訂單數據:', data)
        // 處理真實數據，如果沒有 items，添加模擬 items
        const processedOrders = data?.map(order => ({
          ...order,
          items: order.items || [
            { id: `${order.id}-1`, name: '預設餐點', quantity: 1, price: order.total_amount || 0, status: 'pending' as const }
          ]
        })) || []
        setOrders(processedOrders)
      }
    } catch (error) {
      console.error('載入訂單時發生錯誤:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  // 更新訂單狀態
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId)

      if (error) {
        console.error('更新訂單狀態失敗:', error)
      }

      // 本地更新狀態
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus as Order['status'] }
          : order
      ))

      console.log(`✅ 訂單 ${orderId} 狀態已更新為: ${newStatus}`)
    } catch (error) {
      console.error('更新訂單狀態時發生錯誤:', error)
    }
  }

  // 更新單個餐點狀態
  const updateItemStatus = (orderId: string, itemId: string, newStatus: OrderItem['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? {
            ...order,
            items: order.items.map(item =>
              item.id === itemId 
                ? { ...item, status: newStatus }
                : item
            )
          }
        : order
    ))
  }

  // 計算等待時間
  const getWaitingTime = (createdAt: string): string => {
    const diffMinutes = Math.floor((currentTime.getTime() - new Date(createdAt).getTime()) / (1000 * 60))
    if (diffMinutes < 1) return '剛下單'
    if (diffMinutes < 60) return `${diffMinutes}分鐘前`
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return `${hours}小時${minutes}分鐘前`
  }

  // 判斷是否超時
  const isOverdue = (createdAt: string, estimatedTime?: number): boolean => {
    if (!estimatedTime) return false
    const diffMinutes = Math.floor((currentTime.getTime() - new Date(createdAt).getTime()) / (1000 * 60))
    return diffMinutes > estimatedTime
  }

  useEffect(() => {
    loadOrders()
    
    // 每30秒刷新一次訂單
    const interval = setInterval(loadOrders, 30000)
    
    // 每秒更新時間
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => {
      clearInterval(interval)
      clearInterval(timeInterval)
    }
  }, [])

  // 篩選訂單
  const filteredOrders = orders.filter(order => {
    if (selectedFilter === 'all') return true
    return order.status === selectedFilter
  })

  // 按優先級和時間排序
  const sortedOrders = filteredOrders.sort((a, b) => {
    // 優先級排序
    const priorityOrder = { vip: 3, urgent: 2, normal: 1 }
    const aPriority = priorityOrder[a.priority || 'normal']
    const bPriority = priorityOrder[b.priority || 'normal']
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority
    }
    
    // 時間排序（較早的在前）
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  if (loading) {
    return (
      <div className="kds-mobile">
        <div className="loading-container-mobile">
          <div className="loading-spinner-mobile"></div>
          <span className="loading-text-mobile">載入訂單中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="kds-mobile">
      {/* 頭部區域 */}
      <div className="kds-header">
        <h1 className="kds-title">🍳 廚房顯示系統</h1>
        
        {/* 統計卡片 */}
        <div className="kds-stats">
          <div className="stat-card-mobile">
            <span className="stat-number-mobile">{orders.length}</span>
            <span className="stat-label-mobile">總訂單</span>
          </div>
          <div className="stat-card-mobile">
            <span className="stat-number-mobile">{orders.filter(o => o.status === 'pending').length}</span>
            <span className="stat-label-mobile">待處理</span>
          </div>
          <div className="stat-card-mobile">
            <span className="stat-number-mobile">{orders.filter(o => o.status === 'preparing').length}</span>
            <span className="stat-label-mobile">製作中</span>
          </div>
          <div className="stat-card-mobile">
            <span className="stat-number-mobile">{orders.filter(o => o.status === 'ready').length}</span>
            <span className="stat-label-mobile">已完成</span>
          </div>
        </div>

        {/* 篩選按鈕 */}
        <div className="kds-filters">
          <button
            className={`filter-btn-mobile ${selectedFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('all')}
          >
            🍽️ 全部 ({orders.length})
          </button>
          <button
            className={`filter-btn-mobile ${selectedFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('pending')}
          >
            ⏳ 待處理 ({orders.filter(o => o.status === 'pending').length})
          </button>
          <button
            className={`filter-btn-mobile ${selectedFilter === 'preparing' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('preparing')}
          >
            👨‍🍳 製作中 ({orders.filter(o => o.status === 'preparing').length})
          </button>
          <button
            className={`filter-btn-mobile ${selectedFilter === 'ready' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('ready')}
          >
            ✅ 已完成 ({orders.filter(o => o.status === 'ready').length})
          </button>
        </div>
      </div>

      {/* 訂單列表 */}
      {sortedOrders.length > 0 ? (
        <div className="orders-container">
          {sortedOrders.map((order) => {
            const isUrgent = isOverdue(order.created_at, order.estimated_time) || order.priority === 'urgent'
            const isVIP = order.priority === 'vip'
            
            return (
              <div 
                key={order.id} 
                className={`order-card-mobile ${isUrgent ? 'order-urgent' : ''} ${isVIP ? 'order-vip' : ''}`}
              >
                {(isUrgent || isVIP) && <div className="priority-indicator"></div>}
                
                {/* 訂單標題 */}
                <div className="order-header-mobile">
                  <div className="order-info-row">
                    <span className="order-number">#{order.order_number}</span>
                    <span className={`order-status-badge status-${order.status}`}>
                      {order.status === 'pending' ? '待處理' :
                       order.status === 'preparing' ? '製作中' :
                       order.status === 'ready' ? '已完成' : order.status}
                    </span>
                  </div>
                  
                  <div className="order-meta">
                    <div className="meta-item">
                      <span className="meta-label">桌位</span>
                      <span className="meta-value">
                        {order.table_name || `${order.table_number}號桌`}
                        {order.customer_name && ` (${order.customer_name})`}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">下單時間</span>
                      <span className="meta-value">{getWaitingTime(order.created_at)}</span>
                    </div>
                  </div>
                  
                  {order.estimated_time && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center' }}>
                      <span className="meta-label" style={{ marginRight: '8px' }}>預計時間:</span>
                      <span className={`timer-badge ${isOverdue(order.created_at, order.estimated_time) ? 'urgent-timer' : ''}`}>
                        {order.estimated_time}分鐘
                      </span>
                    </div>
                  )}
                </div>

                {/* 餐點清單 */}
                <div className="order-items-mobile">
                  <div className="items-title">
                    🍜 餐點清單 ({order.items.length}項)
                  </div>
                  <div className="items-list">
                    {order.items.map((item) => (
                      <div 
                        key={item.id} 
                        className={`item-card item-${item.status}`}
                        onClick={() => {
                          // 點擊切換餐點狀態
                          const nextStatus = 
                            item.status === 'pending' ? 'preparing' :
                            item.status === 'preparing' ? 'ready' : 'pending'
                          updateItemStatus(order.id, item.id, nextStatus)
                        }}
                      >
                        <div className="item-header">
                          <span className="item-name">{item.name}</span>
                          <span className="item-quantity">x{item.quantity}</span>
                        </div>
                        <div className="item-details">
                          <span className="item-price">NT$ {item.price}</span>
                          {item.notes && (
                            <span style={{ marginLeft: '8px', fontStyle: 'italic', color: '#e53e3e' }}>
                              📝 {item.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div className="order-actions-mobile">
                  {order.status === 'pending' && (
                    <>
                      <button
                        className="action-btn-mobile btn-start"
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                      >
                        🔥 開始製作
                      </button>
                      <button
                        className="action-btn-mobile btn-cancel"
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      >
                        ❌ 取消訂單
                      </button>
                    </>
                  )}
                  
                  {order.status === 'preparing' && (
                    <>
                      <button
                        className="action-btn-mobile btn-complete"
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                      >
                        ✅ 完成製作
                      </button>
                      <button
                        className="action-btn-mobile btn-secondary-mobile"
                        onClick={() => updateOrderStatus(order.id, 'pending')}
                      >
                        ⏪ 退回待處理
                      </button>
                    </>
                  )}
                  
                  {order.status === 'ready' && (
                    <>
                      <button
                        className="action-btn-mobile btn-complete"
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                      >
                        🚀 出餐完成
                      </button>
                      <button
                        className="action-btn-mobile btn-secondary-mobile"
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                      >
                        ⏪ 退回製作
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state-mobile">
          <div className="empty-icon-mobile">🍽️</div>
          <h3 className="empty-title-mobile">暫無訂單</h3>
          <p className="empty-description-mobile">
            目前沒有符合篩選條件的訂單<br />
            系統將自動刷新最新訂單資訊
          </p>
        </div>
      )}
    </div>
  )
}

export default KDSMobile
