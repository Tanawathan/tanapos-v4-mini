import { useState, useEffect } from 'react'
import usePOSStore from '../lib/store'
import { Table } from '../lib/types'

interface TableManagementPageProps {
  onBack: () => void
}

export default function TableManagementPage({ onBack }: TableManagementPageProps) {
  // 使用 selector 模式避免無限渲染
  const tables = usePOSStore(state => state.tables)
  const orders = usePOSStore(state => state.orders)
  const orderItems = usePOSStore(state => state.orderItems)
  const loading = usePOSStore(state => state.loading)
  const error = usePOSStore(state => state.error)
  const tablesLoaded = usePOSStore(state => state.tablesLoaded)
  const ordersLoaded = usePOSStore(state => state.ordersLoaded)
  const loadTables = usePOSStore(state => state.loadTables)
  const loadOrders = usePOSStore(state => state.loadOrders)
  const updateTableStatus = usePOSStore(state => state.updateTableStatus)

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)

  useEffect(() => {
    // 只在還沒載入過時才載入，避免無限循環
    if (!tablesLoaded) {
      loadTables()
    }
    if (!ordersLoaded) {
      loadOrders()
    }
  }, []) // 移除依賴項，避免無限循環

  // 過濾桌台
  const filteredTables = tables.filter(table => {
    if (statusFilter === 'all') return true
    return table.status === statusFilter
  })

  // 取得桌台相關的訂單
  const getTableOrder = (tableId: string) => {
    return orders.find(order => 
      order.table_id === tableId && 
      ['pending', 'confirmed', 'preparing', 'ready', 'served'].includes(order.status || '')
    )
  }

  // 取得訂單的項目
  const getOrderItems = (orderId: string) => {
    return orderItems.filter(item => item.order_id === orderId)
  }

  // 狀態顏色映射
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'reserved':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cleaning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'maintenance':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // 狀態文字映射
  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return '可用'
      case 'occupied':
        return '佔用中'
      case 'reserved':
        return '已預約'
      case 'cleaning':
        return '清潔中'
      case 'maintenance':
        return '維護中'
      default:
        return '未知'
    }
  }

  // 狀態圖示映射
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return '✅'
      case 'occupied':
        return '👥'
      case 'reserved':
        return '📅'
      case 'cleaning':
        return '🧹'
      case 'maintenance':
        return '🔧'
      default:
        return '❓'
    }
  }

  // 開啟狀態變更模態框
  const openStatusModal = (table: Table) => {
    setSelectedTable(table)
    setShowStatusModal(true)
  }

  // 關閉狀態變更模態框
  const closeStatusModal = () => {
    setSelectedTable(null)
    setShowStatusModal(false)
  }

  // 變更桌台狀態
  const changeTableStatus = async (newStatus: string) => {
    if (!selectedTable) return

    try {
      const metadata: any = {}
      
      // 根據新狀態設定相關資訊
      switch (newStatus) {
        case 'available':
          // 清空所有相關資訊
          metadata.sessionId = null
          break
        case 'cleaning':
          // 清潔狀態不需要額外 metadata，資料庫欄位會自動處理
          break
        case 'maintenance':
          // 維護狀態不需要額外 metadata，資料庫欄位會自動處理
          break
        case 'reserved':
          // 預約狀態不需要額外 metadata，資料庫欄位會自動處理
          break
        case 'occupied':
          // 可以設定 session ID 如果有的話
          if (metadata.sessionId) {
            metadata.sessionId = metadata.sessionId
          }
          break
      }

      await updateTableStatus(selectedTable.id, newStatus as Table['status'], metadata)
      closeStatusModal()
      
      console.log(`🪑 桌台 ${selectedTable.table_number} 狀態已更新為: ${getStatusText(newStatus)}`)
    } catch (error) {
      console.error('❌ 更新桌台狀態失敗:', error)
      // 錯誤已經在 store 中處理，這裡不需要額外處理
    }
  }

  // 開啟訂單詳情模態框
  const openOrderModal = (order: any) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  // 關閉訂單詳情模態框
  const closeOrderModal = () => {
    setSelectedOrder(null)
    setShowOrderModal(false)
  }

  // 統計資訊
  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
    cleaning: tables.filter(t => t.status === 'cleaning').length,
    maintenance: tables.filter(t => t.status === 'maintenance').length
  }

  return (
    <div className="min-h-screen bg-ui-secondary">
      {/* 頂部導航 */}
      <header className="bg-ui-primary shadow-sm border-b border-ui sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* 左側：返回按鈕和標題 */}
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-ui-muted hover:text-ui-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>返回</span>
              </button>
              <h1 className="text-2xl font-bold text-ui-primary">🪑 桌台管理</h1>
            </div>

            {/* 右側：重新整理按鈕 */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  // 強制重新載入
                  usePOSStore.setState({ tablesLoaded: false, ordersLoaded: false })
                  loadTables()
                  loadOrders()
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>重新整理</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 錯誤提示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 font-medium">載入錯誤：{error}</span>
            </div>
          </div>
        )}
        {/* 統計卡片 - 可點擊篩選 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <button 
            onClick={() => setStatusFilter('all')}
            className={`rounded-lg p-4 shadow-sm border border-ui transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 ${
              statusFilter === 'all'
                ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                : 'bg-ui-primary hover:bg-ui-secondary'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">總桌數</div>
            </div>
          </button>
          <button 
            onClick={() => setStatusFilter('available')}
            className={`bg-green-50 rounded-lg p-4 shadow-sm border border-green-200 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 ${
              statusFilter === 'available'
                ? 'ring-2 ring-green-300 bg-green-100'
                : 'hover:bg-green-100'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-green-800">{stats.available}</div>
              <div className="text-sm text-green-600">可用</div>
            </div>
          </button>
          <button 
            onClick={() => setStatusFilter('occupied')}
            className={`bg-red-50 rounded-lg p-4 shadow-sm border border-red-200 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 ${
              statusFilter === 'occupied'
                ? 'ring-2 ring-red-300 bg-red-100'
                : 'hover:bg-red-100'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-red-800">{stats.occupied}</div>
              <div className="text-sm text-red-600">佔用中</div>
            </div>
          </button>
          <button 
            onClick={() => setStatusFilter('reserved')}
            className={`bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-200 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 ${
              statusFilter === 'reserved'
                ? 'ring-2 ring-blue-300 bg-blue-100'
                : 'hover:bg-blue-100'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-800">{stats.reserved}</div>
              <div className="text-sm text-blue-600">已預約</div>
            </div>
          </button>
          <button 
            onClick={() => setStatusFilter('cleaning')}
            className={`bg-yellow-50 rounded-lg p-4 shadow-sm border border-yellow-200 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 ${
              statusFilter === 'cleaning'
                ? 'ring-2 ring-yellow-300 bg-yellow-100'
                : 'hover:bg-yellow-100'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-800">{stats.cleaning}</div>
              <div className="text-sm text-yellow-600">清潔中</div>
            </div>
          </button>
          <button 
            onClick={() => setStatusFilter('maintenance')}
            className={`bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1 ${
              statusFilter === 'maintenance'
                ? 'ring-2 ring-gray-300 bg-gray-100'
                : 'hover:bg-gray-100'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{stats.maintenance}</div>
              <div className="text-sm text-gray-600">維護中</div>
            </div>
          </button>
        </div>

        {/* 桌台列表 */}
        <div className="bg-ui-primary rounded-lg shadow-sm border border-ui p-4">
          <h3 className="text-lg font-semibold mb-4 text-ui-primary">桌台列表</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">載入桌台資訊中...</p>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">沒有符合條件的桌台</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTables.map(table => {
                const tableOrder = getTableOrder(table.id)
                
                return (
                  <div
                    key={table.id}
                    className={`border-2 rounded-xl p-4 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${getStatusColor(table.status || 'available')}`}
                  >
                    <div className="text-center">
                      {/* 桌台圖示和狀態 */}
                      <div className="text-4xl mb-3">
                        {getStatusIcon(table.status || 'available')}
                      </div>
                      
                      {/* 桌台基本資訊 */}
                      <div className="font-bold text-lg text-gray-900 mb-1">
                        桌號 {table.table_number}
                      </div>
                      
                      {table.name && (
                        <div className="text-sm text-gray-600 mb-2">
                          ({table.name})
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-700 mb-3">
                        {table.capacity} 人座
                      </div>
                      
                      {/* 狀態標籤 */}
                      <div className={`inline-block text-xs px-3 py-1 rounded-full font-semibold mb-3 border ${getStatusColor(table.status || 'available')}`}>
                        {getStatusText(table.status || 'available')}
                      </div>
                      
                      {/* 訂單資訊（如果有） */}
                      {tableOrder && (
                        <button
                          onClick={() => openOrderModal(tableOrder)}
                          className="w-full bg-white bg-opacity-70 hover:bg-opacity-90 rounded-lg p-3 mb-3 text-left transition-all duration-200 hover:shadow-md border border-transparent hover:border-blue-200"
                        >
                          <div className="text-xs font-semibold text-gray-800 mb-1">
                            📋 {tableOrder.order_number}
                          </div>
                          <div className="text-xs text-gray-600">
                            總額: NT$ {(tableOrder.total_amount || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600">
                            狀態: {tableOrder.status}
                          </div>
                          {table.last_occupied_at && (
                            <div className="text-xs text-gray-600">
                              最後佔用: {new Date(table.last_occupied_at).toLocaleTimeString()}
                            </div>
                          )}
                          <div className="text-xs text-blue-600 font-medium mt-1">
                            👆 點擊查看詳情
                          </div>
                        </button>
                      )}
                      
                      {/* 管理按鈕 */}
                      <button
                        onClick={() => openStatusModal(table)}
                        className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        變更狀態
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 狀態變更模態框 */}
      {showStatusModal && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-ui-primary rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">變更桌台狀態</h3>
                <p className="text-gray-600 mt-1">桌號 {selectedTable.table_number}</p>
              </div>
              <button
                onClick={closeStatusModal}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => changeTableStatus('available')}
                className="w-full p-4 text-left rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <div className="font-semibold text-green-800">設為可用</div>
                    <div className="text-sm text-green-600">桌台準備就緒，可接受新客人</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => changeTableStatus('occupied')}
                className="w-full p-4 text-left rounded-lg border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">👥</span>
                  <div>
                    <div className="font-semibold text-red-800">設為佔用</div>
                    <div className="text-sm text-red-600">客人正在使用中</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => changeTableStatus('reserved')}
                className="w-full p-4 text-left rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📅</span>
                  <div>
                    <div className="font-semibold text-blue-800">設為預約</div>
                    <div className="text-sm text-blue-600">桌台已被預約</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => changeTableStatus('cleaning')}
                className="w-full p-4 text-left rounded-lg border-2 border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🧹</span>
                  <div>
                    <div className="font-semibold text-yellow-800">設為清潔中</div>
                    <div className="text-sm text-yellow-600">正在清理桌台</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => changeTableStatus('maintenance')}
                className="w-full p-4 text-left rounded-lg border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🔧</span>
                  <div>
                    <div className="font-semibold text-gray-800">設為維護中</div>
                    <div className="text-sm text-gray-600">桌台需要維修</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 訂單詳情模態框 */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-ui-primary rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">訂單詳情</h3>
                <p className="text-gray-600 mt-1">{selectedOrder.order_number}</p>
              </div>
              <button
                onClick={closeOrderModal}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 訂單基本資訊 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">桌號</div>
                  <div className="font-semibold">{selectedOrder.table_number || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">訂單狀態</div>
                  <div className="font-semibold">{selectedOrder.status}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">客人數量</div>
                  <div className="font-semibold">{selectedOrder.customer_count || 1} 人</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">下單時間</div>
                  <div className="font-semibold">
                    {selectedOrder.created_at 
                      ? new Date(selectedOrder.created_at).toLocaleString('zh-TW')
                      : 'N/A'
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* 客戶資訊 */}
            {(selectedOrder.customer_name || selectedOrder.customer_phone) && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">客戶資訊</h4>
                <div className="space-y-2">
                  {selectedOrder.customer_name && (
                    <div>
                      <span className="text-sm text-gray-600">姓名：</span>
                      <span className="font-medium">{selectedOrder.customer_name}</span>
                    </div>
                  )}
                  {selectedOrder.customer_phone && (
                    <div>
                      <span className="text-sm text-gray-600">電話：</span>
                      <span className="font-medium">{selectedOrder.customer_phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 訂單項目 */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">訂單項目</h4>
              <div className="space-y-3">
                {getOrderItems(selectedOrder.id).length > 0 ? (
                  getOrderItems(selectedOrder.id).map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-sm text-gray-600">NT$ {item.unit_price.toLocaleString()}</div>
                          {item.special_instructions && (
                            <div className="text-xs text-blue-600 mt-1">備註：{item.special_instructions}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">x{item.quantity}</div>
                          <div className="text-sm text-gray-600">NT$ {item.total_price.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    暫無訂單項目資料
                  </div>
                )}
              </div>
            </div>

            {/* 金額總計 */}
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">金額明細</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">小計</span>
                  <span>NT$ {(selectedOrder.subtotal || 605).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">稅額 (10%)</span>
                  <span>NT$ {(selectedOrder.tax_amount || 61).toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>總計</span>
                  <span className="text-green-600">
                    NT$ {(selectedOrder.total_amount || 666).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 備註 */}
            {selectedOrder.notes && (
              <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">訂單備註</h4>
                <p className="text-gray-700">{selectedOrder.notes}</p>
              </div>
            )}

            {/* 關閉按鈕 */}
            <button
              onClick={closeOrderModal}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              關閉
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
