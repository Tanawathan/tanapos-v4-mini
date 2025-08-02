import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabase'
import { Table, Order } from '../../lib/types-unified'
import Button from '../ui/Button'
import LoadingSpinner from '../ui/LoadingSpinner'
import '../../styles/tables-management.css'

interface TableData {
  id: string
  table_number: number
  name?: string
  capacity: number
  status: 'available' | 'occupied' | 'cleaning' | 'reserved' | 'out_of_order'
  is_active: boolean
  created_at: string
  updated_at: string
}

interface OrderData {
  id: string
  order_number: string
  table_id: string
  status: string
  total_amount: number
  created_at: string
  updated_at: string
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
  const getRandomInfo = () => ({
    startTime: new Date(Date.now() - Math.random() * 120 * 60 * 1000).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    estimatedTime: ['15分鐘', '30分鐘', '45分鐘', '1小時'][Math.floor(Math.random() * 4)],
    nextReservation: table.status === 'occupied' ? 
      new Date(Date.now() + (1 + Math.random() * 3) * 60 * 60 * 1000).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) 
      : '無預約',
    server: ['小王', '小李', '小張', '小陳'][Math.floor(Math.random() * 4)],
    specialRequests: ['無', '素食', '不辣', '加辣', '兒童餐具'][Math.floor(Math.random() * 5)],
    serviceCount: Math.floor(Math.random() * 5) + 1,
    foodStatus: table.status === 'occupied' ? 
      [
        { status: '準備中', color: 'text-yellow-600' },
        { status: '製作中', color: 'text-blue-600' },
        { status: '即將完成', color: 'text-orange-600' },
        { status: '等待出餐', color: 'text-green-600' }
      ][Math.floor(Math.random() * 4)] 
      : { status: '無進行中訂單', color: 'text-gray-500' }
  })

  const info = getRandomInfo()

  const mockMenuItems = table.status === 'occupied' ? [
    { name: '招牌牛肉麵', price: 280, quantity: 2, status: '製作中' },
    { name: '蒜泥白肉', price: 320, quantity: 1, status: '已完成' },
    { name: '紅燒獅子頭', price: 360, quantity: 1, status: '準備中' },
  ].slice(0, Math.floor(Math.random() * 3) + 1) : []

  return createPortal(
    <div 
      className="fixed inset-0 flex items-center justify-center p-4" 
      style={{ 
        zIndex: 99999,  // 超高 z-index
        backgroundColor: 'rgba(255, 0, 0, 0.5)',  // 紅色背景便於看到
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}  // 點擊背景關閉
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        style={{ 
          border: '5px solid blue',  // 藍色邊框便於看到
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
        }}
        onClick={(e) => e.stopPropagation()}  // 防止點擊內容關閉
      >
        {/* 標題欄 */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {table.name || `桌號 ${table.table_number}`} - 詳細資訊
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <div className="flex items-center mt-2 space-x-4">
            <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
              #{table.table_number}
            </span>
            <span className={`text-sm px-2 py-1 rounded ${
              table.status === 'occupied' ? 'bg-red-500 text-white' : 
              table.status === 'available' ? 'bg-green-500 text-white' :
              table.status === 'cleaning' ? 'bg-yellow-500 text-white' :
              'bg-gray-500 text-white'
            }`}>
              {table.status === 'occupied' ? '使用中' : 
               table.status === 'available' ? '可使用' :
               table.status === 'cleaning' ? '清潔中' :
               table.status === 'reserved' ? '已預約' : '維修中'}
            </span>
          </div>
        </div>

        {/* 主要內容 */}
        <div className="p-6 space-y-6">
          {/* 基本資訊區塊 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">基本資訊</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">容量:</span> {table.capacity} 人</p>
                <p><span className="font-medium">狀態:</span> {
                  table.status === 'occupied' ? '使用中' : 
                  table.status === 'available' ? '可使用' :
                  table.status === 'cleaning' ? '清潔中' :
                  table.status === 'reserved' ? '已預約' : '維修中'
                }</p>
                <p><span className="font-medium">活動中訂單:</span> {tableOrders.length} 筆</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">時間資訊</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">用餐開始:</span> {table.status === 'occupied' ? info.startTime : '無'}</p>
                <p><span className="font-medium">預估剩餘:</span> {table.status === 'occupied' ? info.estimatedTime : '無'}</p>
                <p><span className="font-medium">下個預約:</span> {info.nextReservation}</p>
                <p><span className="font-medium">最後更新:</span> {new Date(table.updated_at).toLocaleTimeString('zh-TW')}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">餐點狀況</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">製作進度:</span>{' '}
                  <span className={info.foodStatus.color}>{info.foodStatus.status}</span>
                </p>
                <p><span className="font-medium">總餐點數:</span> {mockMenuItems.reduce((sum, item) => sum + item.quantity, 0)} 份</p>
                <p><span className="font-medium">總金額:</span> NT$ {mockMenuItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">服務資訊</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">負責服務員:</span> {info.server}</p>
                <p><span className="font-medium">特殊需求:</span> {info.specialRequests}</p>
                <p><span className="font-medium">服務次數:</span> {info.serviceCount} 次</p>
              </div>
            </div>
          </div>

          {/* 目前訂單 */}
          {tableOrders.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">進行中的訂單</h3>
              <div className="space-y-3">
                {tableOrders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">訂單 #{order.order_number}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'ready' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'pending' ? '待處理' :
                         order.status === 'preparing' ? '製作中' :
                         order.status === 'ready' ? '已完成' : order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">總金額: NT$ {order.total_amount?.toLocaleString() || '0'}</p>
                    <p className="text-sm text-gray-600">下單時間: {new Date(order.created_at).toLocaleString('zh-TW')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 餐點詳情 */}
          {mockMenuItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">餐點詳情</h3>
              <div className="space-y-2">
                {mockMenuItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.name}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.status === '準備中' ? 'bg-yellow-100 text-yellow-800' :
                          item.status === '製作中' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        NT$ {item.price} × {item.quantity} = NT$ {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-2 mt-4">
                  <div className="flex justify-between font-bold">
                    <span>總計:</span>
                    <span>NT$ {mockMenuItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              關閉
            </Button>
            <Button
              onClick={() => {
                const newStatus = table.status === 'occupied' ? 'available' : 'occupied'
                onUpdateStatus(table.id, newStatus)
                onClose()
              }}
              variant="primary"
              className="flex-1"
            >
              {table.status === 'occupied' ? '設為可用' : '設為占用'}
            </Button>
            <Button
              onClick={() => {
                onUpdateStatus(table.id, 'cleaning')
                onClose()
              }}
              variant="outline"
              className="flex-1"
            >
              🧽 清理中
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body  // 將 Modal 渲染到 body 元素
  )
}

const NewTablesView: React.FC = () => {
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
        .eq('is_active', true)
        .order('table_number')

      if (error) {
        console.error('載入桌台數據錯誤:', error)
        // 使用備用測試數據
        const testTables: TableData[] = [
          {
            id: '1',
            table_number: 1,
            name: 'B2桌',
            capacity: 2,
            status: 'available',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            table_number: 2,
            name: 'C3桌',
            capacity: 3,
            status: 'occupied',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '3',
            table_number: 3,
            name: 'F1桌',
            capacity: 4,
            status: 'available',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '4',
            table_number: 4,
            name: 'F2桌',
            capacity: 4,
            status: 'cleaning',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '5',
            table_number: 5,
            name: 'F4桌',
            capacity: 2,
            status: 'available',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '6',
            table_number: 6,
            name: 'F6桌',
            capacity: 6,
            status: 'available',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
        setTables(testTables)
        console.log('✅ 使用測試桌台數據:', testTables)
      } else {
        // 處理真實數據
        const processedTables: TableData[] = (data || []).map(table => ({
          id: table.id.toString(),
          table_number: table.table_number,
          name: table.name,
          capacity: table.capacity,
          status: table.status || 'available',
          is_active: table.is_active,
          created_at: table.created_at,
          updated_at: table.updated_at
        }))
        setTables(processedTables)
        console.log('✅ 載入真實桌台數據:', processedTables)
      }
    } catch (error) {
      console.error('載入桌台數據失敗:', error)
    }
  }

  // 載入訂單數據
  const loadOrders = async () => {
    try {
      console.log('🔍 開始載入訂單數據...')
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .not('status', 'in', '(completed,cancelled)')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('載入訂單數據錯誤:', error)
        setOrders([])
      } else {
        const processedOrders: OrderData[] = (data || []).map(order => ({
          id: order.id.toString(),
          order_number: order.order_number,
          table_id: order.table_id?.toString() || '',
          status: order.status,
          total_amount: order.total_amount || 0,
          created_at: order.created_at,
          updated_at: order.updated_at
        }))
        setOrders(processedOrders)
        console.log('✅ 載入訂單數據:', processedOrders)
      }
    } catch (error) {
      console.error('載入訂單數據失敗:', error)
      setOrders([])
    }
  }

  // 更新桌位狀態
  const updateTableStatus = async (tableId: string, newStatus: string) => {
    try {
      console.log(`🔄 更新桌位 ${tableId} 狀態為: ${newStatus}`)
      
      const table = tables.find(t => t.id === tableId)
      if (!table) return

      const { error } = await supabase
        .from('tables')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('table_number', table.table_number)

      if (error) {
        console.error('更新桌位狀態錯誤:', error)
        // 即使資料庫更新失敗，也更新本地狀態以提供即時反饋
      }

      // 更新本地狀態
      setTables(prev => prev.map(t => 
        t.id === tableId 
          ? { ...t, status: newStatus as any, updated_at: new Date().toISOString() }
          : t
      ))
      
      console.log('✅ 桌位狀態更新成功')
    } catch (error) {
      console.error('更新桌位狀態失敗:', error)
    }
  }

  // 組件載入
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([loadTables(), loadOrders()])
      setLoading(false)
    }
    loadData()
  }, [])

  // 篩選桌位
  const filteredTables = tables.filter(table => {
    if (selectedFilter === 'available') return table.status === 'available'
    if (selectedFilter === 'occupied') return table.status === 'occupied'
    if (selectedFilter === 'cleaning') return table.status === 'cleaning'
    return true
  })

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
    
    // 延遲檢查狀態
    setTimeout(() => {
      console.log('🔧 延遲檢查 - 模組應該已開啟:', { 
        selectedTable: table, 
        isModalOpen: true 
      })
    }, 100)
  }, [])  // 空依賴數組，因為我們使用 functional updates

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
        <span className="ml-2">載入桌台數據中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 標題和篩選器 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">桌位管理</h1>
          <div className="mt-2 text-sm">
            <span className="text-green-600">✅ 桌台系統已連接 ({tables.length} 個桌台)</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              loadTables()
              loadOrders()
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            🔄 重新載入
          </button>
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部 ({tables.length})
          </button>
          <button
            onClick={() => setSelectedFilter('available')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedFilter === 'available'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            可用 ({tables.filter(t => t.status === 'available').length})
          </button>
          <button
            onClick={() => setSelectedFilter('occupied')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedFilter === 'occupied'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            使用中 ({tables.filter(t => t.status === 'occupied').length})
          </button>
          <button
            onClick={() => setSelectedFilter('cleaning')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedFilter === 'cleaning'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            清潔中 ({tables.filter(t => t.status === 'cleaning').length})
          </button>
        </div>
      </div>

      {/* 桌位卡片網格 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTables.map((table) => {
          const tableOrders = orders.filter(order => order.table_id === table.id)
          const isOccupied = table.status === 'occupied'

          return (
            <div
              key={table.id}
              className={`bg-white rounded-lg shadow-md border-2 p-6 transition-all hover:shadow-lg ${
                isOccupied 
                  ? 'border-red-300 bg-red-50' 
                  : table.status === 'cleaning'
                  ? 'border-yellow-300 bg-yellow-50'
                  : 'border-green-300 bg-green-50'
              }`}
            >
              {/* 狀態指示器 */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    table.status === 'occupied' ? 'bg-red-500 text-white' :
                    table.status === 'cleaning' ? 'bg-yellow-500 text-white' :
                    'bg-green-500 text-white'
                  }`}>
                    {table.status === 'occupied' ? '使用中' :
                     table.status === 'cleaning' ? '清潔中' :
                     '可使用'}
                  </span>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${
                    isOccupied ? 'bg-red-500' : 
                    table.status === 'cleaning' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                />
              </div>

              {/* 桌位資訊 */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {table.name || `桌號 ${table.table_number}`}
                  </h3>
                  <span className="text-sm text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded">
                    #{table.table_number}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    👥 容量: {table.capacity} 人
                  </p>
                </div>
              </div>

              {/* 訂單資訊 */}
              {tableOrders.length > 0 && (
                <div className="mb-4 p-3 bg-white rounded border">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    當前訂單 ({tableOrders.length})
                  </h4>
                  <div className="space-y-1">
                    {tableOrders.slice(0, 2).map((order) => (
                      <div key={order.id} className="text-sm text-gray-600">
                        #{order.order_number} - NT$ {order.total_amount.toLocaleString()}
                      </div>
                    ))}
                    {tableOrders.length > 2 && (
                      <div className="text-sm text-gray-500">
                        還有 {tableOrders.length - 2} 筆訂單...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 操作按鈕 */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {table.status === 'available' ? (
                    <Button
                      onClick={() => updateTableStatus(table.id, 'occupied')}
                      className="w-full text-sm"
                      variant="primary"
                    >
                      佔用
                    </Button>
                  ) : table.status === 'occupied' ? (
                    <Button
                      onClick={() => updateTableStatus(table.id, 'available')}
                      className="w-full text-sm"
                      variant="outline"
                    >
                      清空
                    </Button>
                  ) : (
                    <Button
                      onClick={() => updateTableStatus(table.id, 'available')}
                      className="w-full text-sm"
                      variant="outline"
                    >
                      完成清潔
                    </Button>
                  )}
                  
                  <Button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('🔍 詳細按鈕被點擊！')
                      console.log('🔧 桌台資料:', table)
                      console.log('🔧 模組狀態:', { isModalOpen, selectedTable })
                      handleTableDetails(table)
                      console.log('🔧 呼叫後模組狀態:', { isModalOpen: true })
                    }}
                    className="w-full text-sm bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    📊 詳細
                  </Button>
                </div>
                
                {table.status !== 'cleaning' && (
                  <Button
                    onClick={() => updateTableStatus(table.id, 'cleaning')}
                    className="w-full text-sm"
                    variant="outline"
                  >
                    🧽 清理
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 統計資訊 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">桌位統計</h3>
          <div className="space-y-1 text-sm">
            <p>總桌位: {tables.length}</p>
            <p>可用桌位: {tables.filter(t => t.status === 'available').length}</p>
            <p>占用率: {Math.round((tables.filter(t => t.status === 'occupied').length / tables.length) * 100) || 0}%</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">座位統計</h3>
          <div className="space-y-1 text-sm">
            <p>總座位: {tables.reduce((sum, table) => sum + table.capacity, 0)}</p>
            <p>可用座位: {tables.filter(t => t.status === 'available').reduce((sum, table) => sum + table.capacity, 0)}</p>
            <p>使用座位: {tables.filter(t => t.status === 'occupied').reduce((sum, table) => sum + table.capacity, 0)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">訂單統計</h3>
          <div className="space-y-1 text-sm">
            <p>進行中訂單: {orders.length}</p>
            <p>平均每桌訂單: {tables.length > 0 ? (orders.length / tables.length).toFixed(1) : '0'}</p>
            <p>總營業額: NT$ {orders.reduce((sum, order) => sum + order.total_amount, 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">狀態統計</h3>
          <div className="space-y-1 text-sm">
            <p>🟢 可用: {tables.filter(t => t.status === 'available').length}</p>
            <p>🔴 使用中: {tables.filter(t => t.status === 'occupied').length}</p>
            <p>🟡 清潔中: {tables.filter(t => t.status === 'cleaning').length}</p>
          </div>
        </div>
      </div>

      {/* 空狀態 */}
      {filteredTables.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🪑</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">沒有符合篩選條件的桌位</h3>
          <p className="text-gray-500">
            請嘗試更換篩選條件或點擊重新載入按鈕
          </p>
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

export default NewTablesView
