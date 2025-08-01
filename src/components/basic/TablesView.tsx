import React, { useState, useEffect } from 'react'
import { usePOSStore } from '../../lib/store-supabase'
import { Table, Order } from '../../lib/types-unified'
import Button from '../ui/Button'
import LoadingSpinner from '../ui/LoadingSpinner'

const TablesView: React.FC = () => {
  console.log('🏗️ TablesView 組件開始載入...')
  
  const { tables, orders, updateTableStatus, loadTables, loadOrders, loading } = usePOSStore()
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'available' | 'occupied'>('all')
  const [isLoading, setIsLoading] = useState(false)

  console.log('🔧 TablesView 初始狀態:', {
    tablesCount: tables.length,
    ordersCount: orders.length,
    loading,
    env: {
      url: import.meta.env.VITE_SUPABASE_URL,
      hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
    }
  })

  // 組件掛載時載入數據
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔍 開始載入桌台數據...')
        console.log('🔧 環境變量檢查:', {
          url: import.meta.env.VITE_SUPABASE_URL,
          hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
        })
        
        await Promise.all([
          loadTables(),
          loadOrders()
        ])
        console.log('✅ 桌台數據載入完成')
      } catch (error) {
        console.error('❌ 載入桌台數據失敗:', error)
      }
    }
    
    loadData()
  }, [])

  // 添加調試資訊
  useEffect(() => {
    console.log('🔍 桌台數據狀態檢查:')
    console.log('   - 載入中:', loading)
    console.log('   - 桌台數量:', tables.length)
    console.log('   - 桌台數據:', tables)
    console.log('   - 訂單數量:', orders.length)
    console.log('   - 訂單數據:', orders)
    
    if (tables.length === 0 && !loading) {
      console.log('⚠️ 沒有找到桌台數據！')
      console.log('🔧 可能的原因:')
      console.log('   1. 數據庫連接問題')
      console.log('   2. 環境變量未正確設置')
      console.log('   3. API 調用失敗')
      console.log('   4. 數據庫中沒有桌台數據')
    } else if (tables.length > 0) {
      console.log('✅ 成功載入真實桌台數據！')
    }
  }, [tables, orders, loading])

  // 創建測試桌台數據（如果沒有數據的話）
  const createTestTables = () => {
    const testTables: Table[] = [
      {
        id: '1',
        table_number: 1,
        capacity: 2,
        status: 'available',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        table_number: 2,
        capacity: 4,
        status: 'occupied',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        table_number: 3,
        capacity: 6,
        status: 'available',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    console.log('🔧 創建測試桌台數據:', testTables)
    return testTables
  }

  // 獲取桌位的訂單
  const getTableOrders = (tableId: string) => {
    return orders.filter((order: Order) => 
      order.table_id === tableId && 
      !['completed', 'cancelled'].includes(order.status)
    )
  }

  // 篩選桌位（優先使用真實數據）
  const currentTables = tables.length > 0 ? tables : (loading ? [] : createTestTables())
  const filteredTables = currentTables.filter((table: Table) => {
    if (selectedFilter === 'available') return table.status === 'available'
    if (selectedFilter === 'occupied') return table.status === 'occupied'
    return true
  })

  // 處理桌位狀態更新
  const handleTableStatusUpdate = async (tableId: string, status: string) => {
    setIsLoading(true)
    try {
      const validStatuses = ['available', 'occupied', 'cleaning', 'reserved', 'out_of_order']
      if (validStatuses.includes(status)) {
        if (tables.length > 0) {
          // 使用真實數據 - 將 tableId 轉換為 table_number
          const table = tables.find(t => t.id === tableId)
          if (table) {
            await updateTableStatus(table.table_number, status as any)
          }
        } else {
          // 使用測試數據 - 僅在控制台顯示
          console.log(`🔧 測試模式: 桌位 ${tableId} 狀態更新為 ${status}`)
          // 這裡可以更新本地狀態，但由於我們使用的是函數返回的測試數據，
          // 實際上不會改變顯示，但至少可以看到功能在工作
        }
      }
    } catch (error) {
      console.error('更新桌位狀態失敗:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || isLoading) {
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
          {/* 數據狀態指示器 */}
          <div className="mt-2 text-sm">
            {loading ? (
              <span className="text-blue-600">🔄 載入中...</span>
            ) : tables.length > 0 ? (
              <span className="text-green-600">✅ 已連接數據庫 ({tables.length} 個桌台)</span>
            ) : (
              <span className="text-amber-600">⚠️ 使用測試數據 (無法連接數據庫)</span>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          {/* 重新載入按鈕 */}
          <button
            onClick={async () => {
              setIsLoading(true)
              try {
                console.log('🔄 手動重新載入桌台數據...')
                console.log('🔧 當前環境變量:', {
                  url: import.meta.env.VITE_SUPABASE_URL,
                  hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
                })
                
                // 直接測試 API 調用
                const { tablesService } = await import('../../lib/api')
                const directTables = await tablesService.getAll()
                console.log('🔧 直接 API 調用結果:', directTables)
                
                await loadTables()
                await loadOrders()
                console.log('✅ 重新載入完成')
              } catch (error) {
                console.error('❌ 重新載入失敗:', error)
              } finally {
                setIsLoading(false)
              }
            }}
            disabled={loading || isLoading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading || isLoading ? '載入中...' : '🔄 重新載入'}
          </button>
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>全部 ({currentTables.length})</span>
          </button>
          <button
            onClick={() => setSelectedFilter('available')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedFilter === 'available'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>可用 ({currentTables.filter((t: Table) => t.status === 'available').length})</span>
          </button>
          <button
            onClick={() => setSelectedFilter('occupied')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedFilter === 'occupied'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>占用 ({currentTables.filter((t: Table) => t.status === 'occupied').length})</span>
          </button>
        </div>
      </div>

      {/* 桌位網格 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredTables.map((table: Table) => {
          const tableOrders = getTableOrders(table.id)
          const isOccupied = table.status === 'occupied'
          
          return (
            <div
              key={table.id}
              className={`relative bg-white rounded-lg shadow-md border-2 p-4 transition-all ${
                isOccupied
                  ? 'border-red-200 bg-red-50'
                  : 'border-green-200 bg-green-50'
              }`}
            >
              {/* 桌位狀態指示器 */}
              <div className="absolute top-2 right-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isOccupied ? 'bg-red-500' : 'bg-green-500'
                  }`}
                />
              </div>

              {/* 桌位信息 */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  桌號 {table.table_number}
                </h3>
                <p className="text-sm text-gray-600">
                  容量: {table.capacity} 人
                </p>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isOccupied
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {isOccupied ? '占用中' : '可使用'}
                  </span>
                </div>
              </div>

              {/* 訂單信息 */}
              {tableOrders.length > 0 && (
                <div className="mb-4 p-3 bg-white rounded border">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    當前訂單 ({tableOrders.length})
                  </h4>
                  <div className="space-y-1">
                    {tableOrders.slice(0, 2).map((order: Order) => (
                      <div key={order.id} className="text-sm text-gray-600">
                        #{order.order_number} - {order.status}
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
                {!isOccupied ? (
                  <Button
                    onClick={() => handleTableStatusUpdate(table.id, 'occupied')}
                    className="w-full"
                    variant="primary"
                  >
                    標記為占用
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleTableStatusUpdate(table.id, 'available')}
                    className="w-full"
                    variant="outline"
                  >
                    標記為可用
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 統計信息 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">桌位統計</h3>
          <div className="space-y-1 text-sm">
            <p>總桌位: {currentTables.length}</p>
            <p>可用桌位: {currentTables.filter((t: Table) => t.status === 'available').length}</p>
            <p>占用率: {Math.round((currentTables.filter((t: Table) => t.status === 'occupied').length / currentTables.length) * 100)}%</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">座位統計</h3>
          <div className="space-y-1 text-sm">
            <p>總座位: {currentTables.reduce((sum: number, table: Table) => sum + table.capacity, 0)}</p>
            <p>可用座位: {currentTables.filter((t: Table) => t.status === 'available').reduce((sum: number, table: Table) => sum + table.capacity, 0)}</p>
            <p>占用座位: {currentTables.filter((t: Table) => t.status === 'occupied').reduce((sum: number, table: Table) => sum + table.capacity, 0)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">訂單統計</h3>
          <div className="space-y-1 text-sm">
            <p>總訂單: {orders.filter((o: Order) => !['completed', 'cancelled'].includes(o.status)).length}</p>
            <p>有訂單桌位: {currentTables.filter((t: Table) => getTableOrders(t.id).length > 0).length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">效率統計</h3>
          <div className="space-y-1 text-sm">
            <p>平均每桌訂單: {currentTables.length > 0 ? (orders.length / currentTables.length).toFixed(1) : '0'}</p>
            <p>桌位利用率: {Math.round((currentTables.filter((t: Table) => t.status === 'occupied').length / currentTables.length) * 100)}%</p>
            {currentTables.length === 0 && tables.length === 0 && (
              <p className="text-amber-600">📝 使用測試數據</p>
            )}
          </div>
        </div>
      </div>

      {/* 空狀態 */}
      {filteredTables.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🪑</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">沒有桌位</h3>
          <p className="text-gray-500">
            {selectedFilter === 'all' ? '沒有設置任何桌位' : `沒有${selectedFilter === 'available' ? '可用' : '占用'}的桌位`}
          </p>
        </div>
      )}
    </div>
  )
}

export default TablesView
