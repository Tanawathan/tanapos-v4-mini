import { useState, useEffect } from 'react'
import usePOSStore from '../lib/store'
import { Order, OrderItem } from '../lib/types'

interface OrdersPageProps {
  onBack: () => void
}

export default function OrdersPage({ onBack }: OrdersPageProps) {
  const { 
    orders, 
    orderItems, 
    loadOrders, 
    updateOrderStatus,
    loading 
  } = usePOSStore()

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('today')

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  // 過濾訂單
  const filteredOrders = orders.filter(order => {
    // 狀態過濾
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false
    }

    // 日期過濾
    const orderDate = new Date(order.created_at || '')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    switch (dateFilter) {
      case 'today':
        return orderDate >= today
      case 'yesterday':
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        return orderDate >= yesterday && orderDate < today
      case 'week':
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return orderDate >= weekAgo
      default:
        return true
    }
  })

  // 取得訂單項目
  const getOrderItems = (orderId: string): OrderItem[] => {
    return orderItems.filter(item => item.order_id === orderId)
  }

  // 狀態顏色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'preparing': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'ready': return 'bg-green-100 text-green-800 border-green-200'
      case 'served': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // 付款狀態顏色
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'unpaid': return 'bg-red-100 text-red-800 border-red-200'
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'paid': return 'bg-green-100 text-green-800 border-green-200'
      case 'refunded': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-ui-secondary">
      {/* 頂部導航 */}
      <header className="bg-ui-primary shadow-sm border-b border-ui sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
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
              <h1 className="text-2xl font-bold text-ui-primary">📋 訂單管理</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-ui-muted">
                總計 {filteredOrders.length} 筆訂單
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：訂單列表 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 篩選器 */}
            <div className="bg-ui-primary rounded-lg shadow-sm border border-ui p-4">
              <h3 className="text-lg font-semibold mb-4 text-ui-primary">篩選條件</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 狀態篩選 */}
                <div>
                  <label className="block text-sm font-medium text-ui-secondary mb-2">
                    訂單狀態
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-ui rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-ui-primary text-ui-primary"
                  >
                    <option value="all">全部狀態</option>
                    <option value="pending">待確認</option>
                    <option value="confirmed">已確認</option>
                    <option value="preparing">準備中</option>
                    <option value="ready">備餐完成</option>
                    <option value="served">已上菜</option>
                    <option value="completed">已完成</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </div>

                {/* 日期篩選 */}
                <div>
                  <label className="block text-sm font-medium text-ui-secondary mb-2">
                    時間範圍
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-ui rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-ui-primary text-ui-primary"
                  >
                    <option value="today">今天</option>
                    <option value="yesterday">昨天</option>
                    <option value="week">最近一週</option>
                    <option value="all">全部</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 訂單列表 */}
            <div className="bg-ui-primary rounded-lg shadow-sm border border-ui">
              <div className="p-4 border-b border-ui">
                <h3 className="text-lg font-semibold text-ui-primary">訂單列表</h3>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-ui-muted">載入訂單中...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-ui-muted">沒有找到符合條件的訂單</p>
                </div>
              ) : (
                <div className="divide-y divide-ui">
                  {filteredOrders.map(order => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-4 hover:bg-ui-secondary cursor-pointer transition-colors ${
                        selectedOrder?.id === order.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            訂單 #{order.order_number}
                          </h4>
                          <p className="text-sm text-gray-600">
                            桌號: {order.table_number} | 客戶: {order.customer_name || '未提供'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            NT$ {(order.total_amount || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.created_at || '').toLocaleString('zh-TW')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(order.status || 'pending')}`}>
                            {order.status === 'pending' && '待確認'}
                            {order.status === 'confirmed' && '已確認'}
                            {order.status === 'preparing' && '準備中'}
                            {order.status === 'ready' && '備餐完成'}
                            {order.status === 'served' && '已上菜'}
                            {order.status === 'completed' && '已完成'}
                            {order.status === 'cancelled' && '已取消'}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full border ${getPaymentStatusColor(order.payment_status || 'unpaid')}`}>
                            {order.payment_status === 'unpaid' && '未付款'}
                            {order.payment_status === 'partial' && '部分付款'}
                            {order.payment_status === 'paid' && '已付款'}
                            {order.payment_status === 'refunded' && '已退款'}
                          </span>
                        </div>
                        
                        {order.party_size && (
                          <span className="text-xs text-gray-500">
                            {order.party_size} 人
                          </span>
                        )}
                      </div>

                      {order.notes && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <span className="font-medium">備註:</span> {order.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右側：訂單詳情 */}
          <div className="bg-ui-primary rounded-lg shadow-sm border border-ui h-fit sticky top-24">
            {selectedOrder ? (
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-ui-primary">訂單詳情</h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-ui-muted hover:text-ui-primary"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* 基本資訊 */}
                <div className="space-y-3 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">訂單編號:</span>
                      <div className="font-medium">{selectedOrder.order_number}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">桌號:</span>
                      <div className="font-medium">{selectedOrder.table_number}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">客戶姓名:</span>
                      <div className="font-medium">{selectedOrder.customer_name || '未提供'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">聯絡電話:</span>
                      <div className="font-medium">{selectedOrder.customer_phone || '未提供'}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">人數:</span>
                      <div className="font-medium">{selectedOrder.party_size || 1} 人</div>
                    </div>
                    <div>
                      <span className="text-gray-600">訂單類型:</span>
                      <div className="font-medium">{selectedOrder.order_type || '內用'}</div>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <span className="text-gray-600">建立時間:</span>
                    <div className="font-medium">
                      {new Date(selectedOrder.created_at || '').toLocaleString('zh-TW')}
                    </div>
                  </div>

                  {selectedOrder.served_at && (
                    <div className="text-sm">
                      <span className="text-gray-600">上菜時間:</span>
                      <div className="font-medium">
                        {new Date(selectedOrder.served_at).toLocaleString('zh-TW')}
                      </div>
                    </div>
                  )}

                  {selectedOrder.completed_at && (
                    <div className="text-sm">
                      <span className="text-gray-600">完成時間:</span>
                      <div className="font-medium">
                        {new Date(selectedOrder.completed_at).toLocaleString('zh-TW')}
                      </div>
                    </div>
                  )}
                </div>

                {/* 訂單項目 */}
                <div className="border-t pt-4 mb-6">
                  <h4 className="font-medium mb-3">訂單項目</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {getOrderItems(selectedOrder.id).map(item => (
                      <div key={item.id} className="border-b pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{item.product_name}</h5>
                            {item.product_sku && (
                              <p className="text-xs text-gray-500">SKU: {item.product_sku}</p>
                            )}
                            <p className="text-xs text-gray-600">
                              NT$ {item.unit_price.toLocaleString()} × {item.quantity}
                            </p>
                            {item.special_instructions && (
                              <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded mt-1">
                                <span className="font-medium">備註:</span> {item.special_instructions}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              NT$ {item.total_price.toLocaleString()}
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(item.status || 'pending')}`}>
                              {item.status === 'pending' && '待處理'}
                              {item.status === 'confirmed' && '已確認'}
                              {item.status === 'preparing' && '準備中'}
                              {item.status === 'ready' && '完成'}
                              {item.status === 'served' && '已上菜'}
                              {item.status === 'cancelled' && '已取消'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 金額明細 */}
                <div className="border-t pt-4 mb-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>小計:</span>
                      <span>NT$ {(selectedOrder.subtotal || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>稅額:</span>
                      <span>NT$ {(selectedOrder.tax_amount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base border-t pt-2">
                      <span>總計:</span>
                      <span className="text-blue-600">NT$ {(selectedOrder.total_amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* 狀態更新 */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">更新狀態</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {['confirmed', 'preparing', 'ready', 'served', 'completed'].map(status => (
                      <button
                        key={status}
                        onClick={() => updateOrderStatus(selectedOrder.id, status as Order['status'])}
                        disabled={selectedOrder.status === status}
                        className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                          selectedOrder.status === status
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {status === 'confirmed' && '確認訂單'}
                        {status === 'preparing' && '開始準備'}
                        {status === 'ready' && '備餐完成'}
                        {status === 'served' && '已上菜'}
                        {status === 'completed' && '完成訂單'}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedOrder.ai_optimized && (
                  <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-purple-800 mb-1">🤖 AI 優化建議</h5>
                    {selectedOrder.ai_estimated_prep_time && (
                      <p className="text-xs text-purple-700">
                        預估準備時間: {selectedOrder.ai_estimated_prep_time} 分鐘
                      </p>
                    )}
                    {selectedOrder.ai_recommendations && (
                      <div className="text-xs text-purple-700 mt-1">
                        AI 建議: {JSON.stringify(selectedOrder.ai_recommendations)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="text-ui-muted text-4xl mb-4">📋</div>
                <p className="text-ui-muted">點擊左側訂單查看詳情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
