import React, { useState } from 'react'
import { usePOSStore } from '../../lib/store-complete'
import { Order } from '../../lib/types-unified'
import { formatCurrency, formatTime } from '../../lib/utils'
import Button from '../ui/Button'
import LoadingSpinner from '../ui/LoadingSpinner'

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'all'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
}

const statusLabels = {
  pending: '待確認',
  confirmed: '已確認',
  preparing: '準備中',
  ready: '已完成',
  completed: '已送達',
  cancelled: '已取消'
}

const OrdersView: React.FC = () => {
  const { orders, updateOrderStatus } = usePOSStore()
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('all')
  const [isLoading, setIsLoading] = useState(false)

  // 篩選訂單
  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter((order: Order) => order.status === selectedStatus)

  // 處理狀態更新
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setIsLoading(true)
    try {
      const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled']
      if (validStatuses.includes(newStatus)) {
        await updateOrderStatus(orderId, newStatus as any)
      }
    } catch (error) {
      console.error('更新訂單狀態失敗:', error)
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
      {/* 標題和統計 */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">訂單管理</h1>
        <div className="flex space-x-4 text-sm">
          <div className="bg-blue-100 px-3 py-1 rounded">
            總訂單: {orders.length}
          </div>
          <div className="bg-yellow-100 px-3 py-1 rounded">
            待處理: {orders.filter((order: Order) => ['pending', 'confirmed', 'preparing'].includes(order.status)).length}
          </div>
          <div className="bg-green-100 px-3 py-1 rounded">
            已完成: {orders.filter((order: Order) => order.status === 'completed').length}
          </div>
        </div>
      </div>

      {/* 狀態篩選器 */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            selectedStatus === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          全部 ({orders.length})
        </button>
        {Object.entries(statusLabels).map(([status, label]) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status as OrderStatus)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label} ({orders.filter((order: Order) => order.status === status).length})
          </button>
        ))}
      </div>

      {/* 訂單列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  訂單編號
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  桌號
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  項目
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  總額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order: Order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.order_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.table_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status as keyof typeof statusColors]}`}>
                      {statusLabels[order.status as keyof typeof statusLabels]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs">
                      {order.order_items?.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between">
                          <span className="truncate">{item.product_name}</span>
                          <span className="ml-2 text-gray-500">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(order.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {order.status === 'pending' && (
                        <Button
                          onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                          variant="primary"
                          size="sm"
                        >
                          確認
                        </Button>
                      )}
                      {order.status === 'confirmed' && (
                        <Button
                          onClick={() => handleStatusUpdate(order.id, 'preparing')}
                          variant="primary"
                          size="sm"
                        >
                          準備中
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button
                          onClick={() => handleStatusUpdate(order.id, 'ready')}
                          variant="primary"
                          size="sm"
                        >
                          已完成
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button
                          onClick={() => handleStatusUpdate(order.id, 'completed')}
                          variant="primary"
                          size="sm"
                        >
                          送達
                        </Button>
                      )}
                      {order.status !== 'cancelled' && order.status !== 'completed' && (
                        <Button
                          onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                          variant="outline"
                          size="sm"
                        >
                          取消
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 空狀態 */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">沒有訂單</h3>
          <p className="text-gray-500">
            {selectedStatus === 'all' ? '目前沒有任何訂單' : `沒有${statusLabels[selectedStatus as keyof typeof statusLabels]}的訂單`}
          </p>
        </div>
      )}
    </div>
  )
}

export default OrdersView
