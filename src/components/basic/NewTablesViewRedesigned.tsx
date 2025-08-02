import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabase'
import { useUIStyle } from '../../contexts/UIStyleContext'
import { Table, Order } from '../../lib/types-unified'
import '../../styles/tables-management.css'

interface TableData {
  id: string
  table_number: number
  name?: string
  capacity: number
  status: 'available' | 'occupied' | 'cleaning' | 'reserved' | 'maintenance'
}

interface OrderData {
  id: string
  table_id: string
  order_number: string
  status: string
  total_amount: number
  created_at: string
}

interface TableDetailsModalProps {
  table: TableData | null
  orders: OrderData[]
  isOpen: boolean
  onClose: () => void
  onUpdateStatus: (tableId: string, newStatus: string) => void
}

const TableDetailsModal: React.FC<TableDetailsModalProps> = ({ 
  table, 
  orders, 
  isOpen, 
  onClose,
  onUpdateStatus
}) => {
  console.log('🎭 TableDetailsModal 渲染中:', { table, isOpen, hasOrders: orders.length })
  
  if (!isOpen || !table) {
    console.log('🎭 Modal 不顯示 - isOpen:', isOpen, 'table:', !!table)
    return null
  }

  console.log('🎭 Modal 應該顯示！')

  const tableOrders = orders.filter(order => 
    order.table_id === table.id && 
    !['completed', 'cancelled'].includes(order.status)
  )

  // 模擬數據函數
  const mockMenuItems = tableOrders.length > 0 ? [
    { name: '宮保雞丁', price: 280, quantity: 2, status: '製作中' },
    { name: '蒜泥白肉', price: 320, quantity: 1, status: '已完成' },
    { name: '紅燒獅子頭', price: 360, quantity: 1, status: '準備中' },
  ].slice(0, Math.floor(Math.random() * 3) + 1) : []

  const modalContent = (
    <div className="modern-card" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }} onClick={onClose}>
      <div className="modern-card" style={{
        maxWidth: '800px',
        maxHeight: '80vh',
        overflow: 'auto',
        width: '100%',
        padding: '2rem'
      }} onClick={(e) => e.stopPropagation()}>
        {/* 模組標題欄 */}
        <div className="modern-card-header" style={{ marginBottom: '1.5rem' }}>
          <h2 className="modern-card-title">
            {table.name || `桌號 ${table.table_number}`} - 詳細資訊
          </h2>
          <button 
            className="modern-btn modern-btn-secondary" 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              width: '40px',
              height: '40px',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}
          >
            ×
          </button>
        </div>

        {/* 模組內容 */}
        <div style={{ marginBottom: '2rem' }}>
          {/* 基本資訊區塊 */}
          <div className="modern-grid modern-grid-2" style={{ gap: '1rem', marginBottom: '2rem' }}>
            <div className="modern-card">
              <h3 className="modern-card-title">基本資訊</h3>
              <div className="modern-card-subtitle">
                <p><strong>容量:</strong> {table.capacity} 人</p>
                <p><strong>狀態:</strong> {
                  table.status === 'occupied' ? '使用中' : 
                  table.status === 'available' ? '可使用' :
                  table.status === 'cleaning' ? '清潔中' :
                  table.status === 'reserved' ? '已預約' : '維修中'
                }</p>
                <p><strong>活動中訂單:</strong> {tableOrders.length} 筆</p>
              </div>
            </div>

            <div className="modern-card">
              <h3 className="modern-card-title">時間資訊</h3>
              <div className="modern-card-subtitle">
                <p><strong>最後更新:</strong> {new Date().toLocaleString('zh-TW')}</p>
                <p><strong>使用時長:</strong> {Math.floor(Math.random() * 120)} 分鐘</p>
                <p><strong>預計清理:</strong> 15 分鐘</p>
              </div>
            </div>

            <div className="modern-card">
              <h3 className="modern-card-title">營收資訊</h3>
              <div className="modern-card-subtitle">
                <p><strong>今日營收:</strong> NT$ {(Math.random() * 5000 + 1000).toFixed(0)}</p>
                <p><strong>本週營收:</strong> NT$ {(Math.random() * 20000 + 5000).toFixed(0)}</p>
                <p><strong>翻桌率:</strong> {(Math.random() * 3 + 1).toFixed(1)} 次/日</p>
              </div>
            </div>

            <div className="modern-card">
              <h3 className="modern-card-title">服務資訊</h3>
              <div className="modern-card-subtitle">
                <p><strong>負責服務員:</strong> 張小明</p>
                <p><strong>特殊需求:</strong> 無</p>
                <p><strong>服務次數:</strong> {Math.floor(Math.random() * 10 + 1)} 次</p>
              </div>
            </div>
          </div>

          {/* 目前訂單 */}
          {tableOrders.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 className="modern-card-title" style={{ marginBottom: '1rem' }}>進行中的訂單</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {tableOrders.map((order) => (
                  <div key={order.id} className="modern-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span className="modern-card-title">訂單 #{order.order_number}</span>
                      <span className={`modern-badge ${
                        order.status === 'pending' ? 'modern-badge-warning' :
                        order.status === 'preparing' ? 'modern-badge-primary' :
                        order.status === 'ready' ? 'modern-badge-success' : 'modern-badge-secondary'
                      }`}>
                        {order.status === 'pending' ? '待處理' :
                         order.status === 'preparing' ? '製作中' :
                         order.status === 'ready' ? '已完成' : order.status}
                      </span>
                    </div>
                    <p className="modern-card-subtitle">
                      總金額: NT$ {order.total_amount?.toLocaleString() || '0'}
                    </p>
                    <p className="modern-card-subtitle">
                      下單時間: {new Date(order.created_at).toLocaleString('zh-TW')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 餐點詳情 */}
          {mockMenuItems.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 className="modern-card-title" style={{ marginBottom: '1rem' }}>餐點詳情</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {mockMenuItems.map((item, index) => (
                  <div key={index} className="modern-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="modern-card-title">{item.name}</span>
                          <span className={`modern-badge ${
                            item.status === '製作中' ? 'modern-badge-primary' :
                            item.status === '已完成' ? 'modern-badge-success' : 'modern-badge-warning'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="modern-card-subtitle">
                          數量: {item.quantity} | 單價: NT$ {item.price}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="modern-grid modern-grid-3" style={{ gap: '1rem' }}>
            <button
              onClick={onClose}
              className="modern-btn modern-btn-secondary"
            >
              關閉
            </button>
            <button
              onClick={() => {
                const newStatus = table.status === 'occupied' ? 'available' : 'occupied'
                onUpdateStatus(table.id, newStatus)
                onClose()
              }}
              className="modern-btn modern-btn-primary"
            >
              {table.status === 'occupied' ? '設為可用' : '設為占用'}
            </button>
            <button
              onClick={() => {
                onUpdateStatus(table.id, 'cleaning')
                onClose()
              }}
              className="modern-btn modern-btn-warning"
            >
              🧽 清理中
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

const NewTablesViewRedesigned: React.FC = () => {
  const { currentStyle, styleConfig } = useUIStyle()
  const [tables, setTables] = useState<TableData[]>([])
  const [orders, setOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'available' | 'occupied' | 'cleaning'>('all')
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 載入桌台數據
  const loadTables = async () => {
    try {
      console.log('🔍 開始載入桌台數據...')
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('table_number')

      if (error) {
        console.log('❌ 無法從資料庫載入桌台，使用測試數據:', error.message)
        // 使用測試數據
        const testTables: TableData[] = [
          { id: 'test-1', table_number: 1, name: 'B2桌', capacity: 2, status: 'available' },
          { id: 'test-2', table_number: 2, name: 'C3桌', capacity: 4, status: 'occupied' },
          { id: 'test-3', table_number: 3, name: 'F1桌', capacity: 6, status: 'cleaning' },
          { id: 'test-4', table_number: 4, name: 'A5桌', capacity: 8, status: 'available' },
          { id: 'test-5', table_number: 5, name: 'D4桌', capacity: 2, status: 'occupied' },
          { id: 'test-6', table_number: 6, name: 'E6桌', capacity: 4, status: 'available' },
        ]
        setTables(testTables)
      } else {
        console.log('✅ 載入真實桌台數據:', data)
        const formattedTables = data.map(table => ({
          id: table.id,
          table_number: table.table_number,
          name: table.name || `桌號 ${table.table_number}`,
          capacity: table.capacity,
          status: table.status as TableData['status']
        }))
        setTables(formattedTables)
      }
    } catch (error) {
      console.error('載入桌台時發生錯誤:', error)
      // 後備測試數據
      const fallbackTables: TableData[] = [
        { id: 'fallback-1', table_number: 1, name: 'B2桌', capacity: 2, status: 'available' },
        { id: 'fallback-2', table_number: 2, name: 'C3桌', capacity: 4, status: 'occupied' },
        { id: 'fallback-3', table_number: 3, name: 'F1桌', capacity: 6, status: 'cleaning' },
      ]
      setTables(fallbackTables)
    }
  }

  // 載入訂單數據
  const loadOrders = async () => {
    try {
      console.log('🔍 開始載入訂單數據...')
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'preparing', 'ready'])
        .order('created_at', { ascending: false })

      if (error) {
        console.log('❌ 無法載入訂單:', error.message)
        setOrders([])
      } else {
        console.log('✅ 載入訂單數據:', data)
        setOrders(data || [])
      }
    } catch (error) {
      console.error('載入訂單時發生錯誤:', error)
      setOrders([])
    }
  }

  // 更新桌台狀態
  const updateTableStatus = async (tableId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tables')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', tableId)

      if (error) {
        console.error('更新桌台狀態失敗:', error)
        return
      }

      // 本地更新狀態
      setTables(prev => prev.map(table => 
        table.id === tableId 
          ? { ...table, status: newStatus as TableData['status'] }
          : table
      ))

      console.log(`✅ 桌台 ${tableId} 狀態已更新為: ${newStatus}`)
    } catch (error) {
      console.error('更新桌台狀態時發生錯誤:', error)
    }
  }

  // 打開詳細資訊
  const handleTableDetails = React.useCallback((table: TableData) => {
    console.log('🔍 handleTableDetails 被呼叫')
    console.log('🔧 桌位資料:', table)
    console.log('🔧 當前狀態:', { isModalOpen, selectedTable })
    
    // 使用 functional updates 確保狀態正確更新
    setSelectedTable(prevTable => {
      console.log('🔧 設置 selectedTable from:', prevTable, 'to:', table)
      return table
    })
    
    setIsModalOpen(prevOpen => {
      console.log('🔧 設置 isModalOpen from:', prevOpen, 'to:', true)
      return true
    })
    
    console.log('🔧 狀態已更新，應該打開模組')
  }, [])

  // 關閉詳細資訊
  const handleCloseModal = React.useCallback(() => {
    console.log('🔧 關閉模組')
    setIsModalOpen(false)
    setSelectedTable(null)
  }, [])

  // Debug: 監控 modal 狀態變化
  React.useEffect(() => {
    console.log('🔄 Modal state changed - isModalOpen:', isModalOpen, 'selectedTable:', selectedTable)
  }, [isModalOpen, selectedTable])

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true)
      await Promise.all([loadTables(), loadOrders()])
      setLoading(false)
    }

    initializeData()
  }, [])

  // 篩選桌台
  const filteredTables = tables.filter(table => {
    if (selectedFilter === 'all') return true
    return table.status === selectedFilter
  })

  if (loading) {
    return (
      <div className="modern-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div className="modern-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h3 className="modern-card-title">載入桌台數據中...</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="modern-container" style={{ padding: '1.5rem', minHeight: '100vh' }}>
      {/* 頭部區域 */}
      <div className="modern-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
        <h1 className="modern-page-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>🍽️ 桌台管理中心</h1>
        
        {/* 統計卡片 */}
        <div className="modern-grid modern-grid-4" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="modern-card modern-interactive" style={{ textAlign: 'center' }}>
            <div className="modern-card-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{tables.length}</div>
            <div className="modern-card-subtitle">總桌台數</div>
          </div>
          <div className="modern-card modern-interactive" style={{ textAlign: 'center' }}>
            <div className="modern-card-title" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--modern-dark-accent)' }}>{tables.filter(t => t.status === 'available').length}</div>
            <div className="modern-card-subtitle">可用桌台</div>
          </div>
          <div className="modern-card modern-interactive" style={{ textAlign: 'center' }}>
            <div className="modern-card-title" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--modern-dark-danger)' }}>{tables.filter(t => t.status === 'occupied').length}</div>
            <div className="modern-card-subtitle">使用中</div>
          </div>
          <div className="modern-card modern-interactive" style={{ textAlign: 'center' }}>
            <div className="modern-card-title" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--modern-dark-primary)' }}>{orders.length}</div>
            <div className="modern-card-subtitle">進行中訂單</div>
          </div>
        </div>

        {/* 篩選按鈕 */}
        <div className="modern-grid modern-grid-4" style={{ gap: '1rem', justifyContent: 'center' }}>
          <button
            className={`modern-btn ${selectedFilter === 'all' ? 'modern-btn-primary' : 'modern-btn-secondary'}`}
            onClick={() => setSelectedFilter('all')}
          >
            🏠 全部 ({tables.length})
          </button>
          <button
            className={`modern-btn ${selectedFilter === 'available' ? 'modern-btn-primary' : 'modern-btn-secondary'}`}
            onClick={() => setSelectedFilter('available')}
          >
            ✅ 可用 ({tables.filter(t => t.status === 'available').length})
          </button>
          <button
            className={`modern-btn ${selectedFilter === 'occupied' ? 'modern-btn-primary' : 'modern-btn-secondary'}`}
            onClick={() => setSelectedFilter('occupied')}
          >
            🔴 使用中 ({tables.filter(t => t.status === 'occupied').length})
          </button>
          <button
            className={`modern-btn ${selectedFilter === 'cleaning' ? 'modern-btn-primary' : 'modern-btn-secondary'}`}
            onClick={() => setSelectedFilter('cleaning')}
          >
            🧽 清潔中 ({tables.filter(t => t.status === 'cleaning').length})
          </button>
        </div>
      </div>

      {/* 桌台網格 */}
      {filteredTables.length > 0 ? (
        <div className="modern-grid modern-grid-3" style={{ gap: '1.5rem' }}>
          {filteredTables.map((table) => {
            const tableOrders = orders.filter(order => order.table_id === table.id)
            
            return (
              <div key={table.id} className="modern-card modern-interactive">
                <div className="modern-card-header" style={{ marginBottom: '1rem' }}>
                  <h3 className="modern-card-title">{table.name || `桌號 ${table.table_number}`}</h3>
                  <span className="modern-badge modern-badge-secondary">#{table.table_number}</span>
                </div>

                <div className="modern-grid modern-grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="modern-card-subtitle">容量</div>
                    <div className="modern-card-title">{table.capacity} 人</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div className="modern-card-subtitle">訂單數</div>
                    <div className="modern-card-title">{tableOrders.length}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                  <span className={`modern-badge ${
                    table.status === 'available' ? 'modern-badge-success' :
                    table.status === 'occupied' ? 'modern-badge-danger' :
                    table.status === 'cleaning' ? 'modern-badge-warning' :
                    'modern-badge-primary'
                  }`}>
                    {table.status === 'available' ? '✅ 可使用' :
                     table.status === 'occupied' ? '🔴 使用中' :
                     table.status === 'cleaning' ? '🧽 清潔中' :
                     table.status === 'reserved' ? '📅 已預約' : '🔧 維修中'}
                  </span>
                </div>

                <div className="modern-grid modern-grid-2" style={{ gap: '0.75rem' }}>
                  {table.status === 'available' ? (
                    <button
                      className="modern-btn modern-btn-secondary"
                      onClick={() => updateTableStatus(table.id, 'occupied')}
                    >
                      🪑 入座
                    </button>
                  ) : table.status === 'occupied' ? (
                    <button
                      className="modern-btn modern-btn-warning"
                      onClick={() => updateTableStatus(table.id, 'cleaning')}
                    >
                      🧽 清理
                    </button>
                  ) : (
                    <button
                      className="modern-btn modern-btn-success"
                      onClick={() => updateTableStatus(table.id, 'available')}
                    >
                      ✅ 完成
                    </button>
                  )}
                  
                  <button
                    className="modern-btn modern-btn-primary"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('🔍 詳細按鈕被點擊！')
                      console.log('🔧 桌台資料:', table)
                      console.log('🔧 模組狀態:', { isModalOpen, selectedTable })
                      handleTableDetails(table)
                      console.log('🔧 呼叫後模組狀態:', { isModalOpen: true })
                    }}
                  >
                    📊 詳細
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="modern-card" style={{ 
          padding: '3rem', 
          textAlign: 'center' 
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🪑</div>
          <h3 className="modern-card-title" style={{ marginBottom: '1rem' }}>沒有符合篩選條件的桌位</h3>
          <p className="modern-card-subtitle">請嘗試更換篩選條件或重新載入資料</p>
        </div>
      )}

      {/* 桌位詳細資訊模組 */}
      <TableDetailsModal
        table={selectedTable}
        orders={orders}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdateStatus={updateTableStatus}
      />
    </div>
  )
}

export default NewTablesViewRedesigned
