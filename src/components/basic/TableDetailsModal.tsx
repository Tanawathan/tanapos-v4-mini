import React from 'react'
import { Table, Order } from '../../lib/types-unified'
import Button from '../ui/Button'

interface TableDetailsModalProps {
  table: Table | null
  orders: Order[]
  isOpen: boolean
  onClose: () => void
}

const TableDetailsModal: React.FC<TableDetailsModalProps> = ({ 
  table, 
  orders, 
  isOpen, 
  onClose 
}) => {
  console.log('🔍 TableDetailsModal 接收到的 props:', { table, orders, isOpen })
  
  if (!isOpen || !table) {
    console.log('❌ Modal 未開啟或沒有 table 數據:', { isOpen, table })
    return null
  }
  
  console.log('✅ Modal 將顯示，table 數據:', table)

  // 獲取該桌的訂單
  const tableOrders = orders.filter((order: Order) => 
    order.table_id === table.id && 
    !['completed', 'cancelled'].includes(order.status)
  )

  // 計算下一個預約時間 (模擬資料)
  const getNextReservation = () => {
    if (table.status !== 'occupied') return '無預約'
    
    const now = new Date()
    const nextHour = new Date(now.getTime() + (1 + Math.random() * 3) * 60 * 60 * 1000) // 1-4小時後
    return nextHour.toLocaleString('zh-TW', { 
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // 獲取餐點準備狀況
  const getFoodStatus = () => {
    if (tableOrders.length === 0) return { status: '無進行中訂單', color: 'text-gray-500' }
    
    const statuses = [
      { status: '準備中', color: 'text-yellow-600' },
      { status: '製作中', color: 'text-blue-600' },
      { status: '即將完成', color: 'text-orange-600' },
      { status: '等待出餐', color: 'text-green-600' }
    ]
    return statuses[Math.floor(Math.random() * statuses.length)]
  }

  // 計算預估用餐剩餘時間
  const getEstimatedTime = () => {
    if (table.status !== 'occupied') return '無'
    
    const times = ['15分鐘', '30分鐘', '45分鐘', '1小時', '1小時15分鐘', '1小時30分鐘']
    return times[Math.floor(Math.random() * times.length)]
  }

  // 計算用餐開始時間
  const getDiningStartTime = () => {
    if (table.status !== 'occupied') return '無'
    
    const now = new Date()
    const startTime = new Date(now.getTime() - (30 + Math.random() * 90) * 60 * 1000) // 30-120分鐘前
    return startTime.toLocaleTimeString('zh-TW', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // 生成模擬餐點資料
  const getMockMenuItems = () => {
    const items = [
      { name: '招牌牛肉麵', price: 280, quantity: 2, status: '製作中' },
      { name: '蒜泥白肉', price: 320, quantity: 1, status: '已完成' },
      { name: '紅燒獅子頭', price: 360, quantity: 1, status: '準備中' },
      { name: '麻婆豆腐', price: 180, quantity: 3, status: '製作中' },
      { name: '宮保雞丁', price: 240, quantity: 1, status: '已完成' }
    ]
    
    // 隨機選擇2-4個餐點
    const selectedItems = items
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 2)
    
    return selectedItems
  }

  const mockItems = getMockMenuItems()

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
           onClick={(e) => e.stopPropagation()}>
        {/* 標題欄 */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {table.table_name || `桌號 ${table.table_number}`} - 詳細資訊
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded hover:bg-white hover:bg-opacity-20"
            >
              ×
            </button>
          </div>
          <div className="flex items-center mt-2 space-x-4">
            <span className="text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
              #{table.table_number}
            </span>
            <span className={`text-sm px-2 py-1 rounded ${
              table.status === 'occupied' 
                ? 'bg-red-500 text-white' 
                : 'bg-green-500 text-white'
            }`}>
              {table.status === 'occupied' ? '使用中' : '可使用'}
            </span>
          </div>
        </div>

        {/* 主要內容 */}
        <div className="p-6 space-y-6">
          {/* 基本資訊 */}
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
                <p><span className="font-medium">用餐開始:</span> {getDiningStartTime()}</p>
                <p><span className="font-medium">預估剩餘時間:</span> {getEstimatedTime()}</p>
                <p><span className="font-medium">下個預約:</span> {getNextReservation()}</p>
                <p><span className="font-medium">最後更新:</span> {new Date(table.updated_at).toLocaleTimeString('zh-TW')}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">餐點狀況</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-medium">製作進度:</span>{' '}
                  <span className={getFoodStatus().color}>{getFoodStatus().status}</span>
                </p>
                <p><span className="font-medium">總餐點數:</span> {mockItems.reduce((sum, item) => sum + item.quantity, 0)} 份</p>
                <p><span className="font-medium">總金額:</span> NT$ {mockItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">服務資訊</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">負責服務員:</span> {['小王', '小李', '小張', '小陳'][Math.floor(Math.random() * 4)]}</p>
                <p><span className="font-medium">特殊需求:</span> {['無', '素食', '不辣', '加辣', '兒童餐具'][Math.floor(Math.random() * 5)]}</p>
                <p><span className="font-medium">服務次數:</span> {Math.floor(Math.random() * 5) + 1} 次</p>
              </div>
            </div>
          </div>

          {/* 目前訂單 */}
          {tableOrders.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">進行中的訂單</h3>
              <div className="space-y-3">
                {tableOrders.map((order: Order) => (
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
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">餐點詳情</h3>
            {mockItems.length > 0 ? (
              <div className="space-y-2">
                {mockItems.map((item, index) => (
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
                    <span>NT$ {mockItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">目前沒有餐點資料</p>
            )}
          </div>

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
                // 這裡可以添加更新桌位狀態的邏輯
                console.log('更新桌位狀態')
              }}
              variant="primary"
              className="flex-1"
            >
              更新狀態
            </Button>
            <Button
              onClick={() => {
                // 這裡可以添加新增訂單的邏輯
                console.log('新增訂單')
              }}
              variant="primary"
              className="flex-1"
            >
              新增訂單
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TableDetailsModal
