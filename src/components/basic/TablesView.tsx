import React, { useState } from 'react'
import { usePOSStore } from '../../lib/store-complete'
import { Table, Order } from '../../lib/types-unified'
import Button from '../ui/Button'
import LoadingSpinner from '../ui/LoadingSpinner'

const TablesView: React.FC = () => {
  const { tables, orders, updateTableStatus } = usePOSStore()
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'available' | 'occupied'>('all')
  const [isLoading, setIsLoading] = useState(false)

  // 獲取桌位的訂單
  const getTableOrders = (tableId: string) => {
    return orders.filter((order: Order) => 
      order.table_id === tableId && 
      !['completed', 'cancelled'].includes(order.status)
    )
  }

  // 篩選桌位
  const filteredTables = tables.filter((table: Table) => {
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
        await updateTableStatus(parseInt(tableId), status as any)
      }
    } catch (error) {
      console.error('更新桌位狀態失敗:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 標題和篩選器 */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">桌位管理</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>全部 ({tables.length})</span>
          </button>
          <button
            onClick={() => setSelectedFilter('available')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedFilter === 'available'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>可用 ({tables.filter((t: Table) => t.status === 'available').length})</span>
          </button>
          <button
            onClick={() => setSelectedFilter('occupied')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedFilter === 'occupied'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>占用 ({tables.filter((t: Table) => t.status === 'occupied').length})</span>
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
            <p>總桌位: {tables.length}</p>
            <p>可用桌位: {tables.filter((t: Table) => t.status === 'available').length}</p>
            <p>占用率: {Math.round((tables.filter((t: Table) => t.status === 'occupied').length / tables.length) * 100)}%</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">座位統計</h3>
          <div className="space-y-1 text-sm">
            <p>總座位: {tables.reduce((sum: number, table: Table) => sum + table.capacity, 0)}</p>
            <p>可用座位: {tables.filter((t: Table) => t.status === 'available').reduce((sum: number, table: Table) => sum + table.capacity, 0)}</p>
            <p>占用座位: {tables.filter((t: Table) => t.status === 'occupied').reduce((sum: number, table: Table) => sum + table.capacity, 0)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">訂單統計</h3>
          <div className="space-y-1 text-sm">
            <p>總訂單: {orders.filter((o: Order) => !['completed', 'cancelled'].includes(o.status)).length}</p>
            <p>有訂單桌位: {tables.filter((t: Table) => getTableOrders(t.id).length > 0).length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">效率統計</h3>
          <div className="space-y-1 text-sm">
            <p>平均每桌訂單: {tables.length > 0 ? (orders.length / tables.length).toFixed(1) : '0'}</p>
            <p>桌位利用率: {Math.round((tables.filter((t: Table) => t.status === 'occupied').length / tables.length) * 100)}%</p>
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
