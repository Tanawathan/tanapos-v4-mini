import { useState, useEffect } from 'react'
import usePOSStore from '../lib/store'
import { Table, Order } from '../lib/types'

interface CheckoutPageProps {
  onBack: () => void
}

export default function CheckoutPage({ onBack }: CheckoutPageProps) {
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
  const processCheckout = usePOSStore(state => state.processCheckout)

  // 狀態管理
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedTableData, setSelectedTableData] = useState<(Table & { is_takeout?: boolean }) | null>(null)
  const [tableOrders, setTableOrders] = useState<Order[]>([])
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [receivedAmount, setReceivedAmount] = useState<string>('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // 只在未載入時觸發資料載入，避免無限渲染
  useEffect(() => {
    if (!tablesLoaded) {
      console.log('🔄 CheckoutPage: 載入桌台資料...')
      loadTables()
    }
    if (!ordersLoaded) {
      console.log('🔄 CheckoutPage: 載入訂單資料...')
      loadOrders()
    }
  }, [tablesLoaded, ordersLoaded, loadTables, loadOrders])

  // 取得有活躍訂單的桌台（包含外帶訂單）
  const getOccupiedTablesAndTakeout = () => {
    // 桌台訂單
    const occupiedTables = tables.filter(table => {
      const tableOrders = getTableOrders(table.table_number || '', table.id)
      return tableOrders.length > 0
    })

    // 外帶訂單（創建虛擬桌台）
    const takeoutOrders = getTakeoutOrders()
    const takeoutTables: (Table & { is_takeout: boolean })[] = takeoutOrders.map((order, index) => ({
      id: `takeout-${order.id}`,
      table_number: 9900 + index, // 使用特殊桌號範圍表示外帶
      name: `外帶-${order.order_number.replace(/^#?TOGO-/i, '')}`,
      capacity: 1,
      status: 'occupied' as const,
      created_at: order.created_at || new Date().toISOString(),
      updated_at: order.updated_at || new Date().toISOString(),
      restaurant_id: order.restaurant_id || '',
      is_takeout: true, // 自定義屬性，標記為外帶
      last_occupied_at: order.created_at
    }))

    return [...occupiedTables, ...takeoutTables]
  }

  // 取得桌台相關的所有未結帳訂單
  const getTableOrders = (tableNumber: string | number, tableId?: string) => {
    const tableNumberStr = String(tableNumber)
    return orders.filter(order => {
      // 使用 table_number 匹配（適用於手機點餐）
      const matchByNumber = String(order.table_number) === tableNumberStr
      // 使用 table_id 匹配（適用於傳統POS）
      const matchById = tableId && order.table_id === tableId
      
      return (matchByNumber || matchById) && 
        ['pending', 'confirmed', 'preparing', 'ready', 'served'].includes(order.status || '')
    }).sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime())
  }

  // 取得外帶訂單
  const getTakeoutOrders = () => {
    return orders.filter(order => 
      isTakeoutOrder(order.order_number) &&
      ['pending', 'confirmed', 'preparing', 'ready', 'served'].includes(order.status || '')
    ).sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime())
  }

  // 檢測是否為外帶訂單
  const isTakeoutOrder = (orderNumber: string): boolean => {
    return orderNumber?.toUpperCase().startsWith('TOGO-') || orderNumber?.toUpperCase().startsWith('#TOGO-');
  }

  // 取得桌台的活躍訂單（保持向後兼容）
  const getTableOrder = (tableId: string) => {
    return orders.find(order => 
      order.table_id === tableId && 
      ['pending', 'confirmed', 'preparing', 'ready', 'served'].includes(order.status || '')
    )
  }

  // 取得桌台的訂單項目總和（保持向後兼容）
  const getOrderItems = (orderId: string) => {
    return orderItems.filter(item => item.order_id === orderId)
  }

  // 選擇桌台進行結帳
  const selectTableForCheckout = (table: Table & { is_takeout?: boolean }) => {
    let relatedOrders: Order[] = []
    
    if (table.is_takeout) {
      // 外帶：取得該特定外帶訂單
      const takeoutOrders = getTakeoutOrders()
      const orderIndex = parseInt(table.id.replace('takeout-', ''))
      relatedOrders = takeoutOrders.filter(order => order.id === table.id.replace('takeout-', ''))
      if (relatedOrders.length === 0) {
        // 如果找不到，使用其他方式定位
        relatedOrders = takeoutOrders.filter(order => 
          order.order_number.replace(/^#?TOGO-/i, '') === table.name?.replace('外帶-', '')
        )
      }
    } else {
      // 桌台：取得該桌所有未結帳訂單
      relatedOrders = getTableOrders(table.table_number || '', table.id)
    }

    if (relatedOrders.length === 0) {
      alert('該桌台沒有未結帳的訂單')
      return
    }

    setSelectedTableData(table)
    setTableOrders(relatedOrders)
    setShowConfirmModal(true)
  }

  // 計算所有訂單的總計
  const calculateTotalAmount = () => {
    if (tableOrders.length === 0) return 0
    return tableOrders.reduce((total, order) => total + (order.total_amount || 0), 0)
  }

  // 計算稅額（根據付款方式）
  const getTaxAmount = () => {
    if (tableOrders.length === 0) return 0
    const subtotal = calculateTotalAmount()
    
    // 現金付款：不收稅金
    if (paymentMethod === 'cash') {
      return 0
    }
    
    // 行動支付：收3%稅金
    if (paymentMethod === 'mobile') {
      return subtotal * 0.03
    }
    
    return 0
  }

  // 計算服務費（基於含稅金額）
  const getServiceFee = () => {
    if (tableOrders.length === 0) return 0
    
    // 現金付款：不收服務費
    if (paymentMethod === 'cash') {
      return 0
    }
    
    // 行動支付：收2%服務費（基於含稅金額）
    if (paymentMethod === 'mobile') {
      const subtotal = calculateTotalAmount()
      const taxAmount = getTaxAmount()
      return (subtotal + taxAmount) * 0.02
    }
    
    return 0
  }

  // 計算最終金額（包含稅額和服務費）
  const getFinalAmount = () => {
    if (tableOrders.length === 0) return 0
    
    const subtotal = calculateTotalAmount()
    const taxAmount = getTaxAmount()
    const serviceFee = getServiceFee()
    
    // 總金額 = 小計 + 稅額 + 服務費
    return subtotal + taxAmount + serviceFee
  }

  // 計算找零
  const calculateChange = () => {
    if (tableOrders.length === 0 || !receivedAmount) return 0
    const received = parseFloat(receivedAmount)
    const total = getFinalAmount()
    return Math.max(0, received - total)
  }

  // 驗證支付金額
  const isPaymentValid = () => {
    if (paymentMethod !== 'cash') return true
    if (!receivedAmount) return false
    const received = parseFloat(receivedAmount)
    const total = getFinalAmount()
    return received >= total
  }

  // 處理結帳
  const handleCheckout = async () => {
    if (tableOrders.length === 0) return

    setIsProcessing(true)
    try {
      // 處理所有訂單的結帳
      for (const order of tableOrders) {
        await processCheckout(selectedTableData?.id || '', order.id, {
          payment_method: paymentMethod,
          received_amount: paymentMethod === 'cash' ? parseFloat(receivedAmount) : undefined,
          change_amount: paymentMethod === 'cash' ? calculateChange() : undefined
        })
      }

      const finalAmount = getFinalAmount()
      const taxAmount = getTaxAmount()
      const serviceFee = getServiceFee()
      const subtotal = calculateTotalAmount()
      
      // 建立詳細的金額說明
      let amountDetails = `\n小計：NT$ ${subtotal.toLocaleString()}`
      
      if (paymentMethod === 'mobile') {
        amountDetails += `\n稅額(3%)：NT$ ${taxAmount.toLocaleString()}`
        amountDetails += `\n服務費(2%)：NT$ ${serviceFee.toLocaleString()}`
      } else {
        amountDetails += `\n稅額：NT$ 0 (現金免稅)`
        amountDetails += `\n服務費：NT$ 0 (現金免服務費)`
      }
      
      const orderNumbers = tableOrders.map(order => order.order_number).join(', ')
      const tableDisplay = selectedTableData?.is_takeout ? 
        `外帶 (${orderNumbers})` : 
        `桌號：${selectedTableData?.table_number}`
      
      alert(`✅ 結帳成功！\n${tableDisplay}\n訂單：${orderNumbers}${amountDetails}\n總計：NT$ ${finalAmount.toLocaleString()}\n${paymentMethod === 'cash' ? `找零：NT$ ${calculateChange().toLocaleString()}` : ''}`)

      setSelectedTableData(null)
      setTableOrders([])
      setReceivedAmount('')
      setShowConfirmModal(false)

    } catch (error) {
      console.error('結帳失敗:', error)
      alert('❌ 結帳失敗，請稍後再試')
    } finally {
      setIsProcessing(false)
    }
  }

  // 支付方式選項（移除信用卡）
  const paymentMethods = [
    { id: 'cash', name: '現金', icon: '💵' },
    { id: 'mobile', name: '行動支付', icon: '📱' },
    { id: 'transfer', name: '銀行轉帳', icon: '🏦' }
  ]

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
              <h1 className="text-2xl font-bold text-ui-primary">💰 結帳系統</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  // 重置 loaded 狀態以觸發重新載入
                  usePOSStore.setState({ tablesLoaded: false, ordersLoaded: false })
                  loadTables()
                  loadOrders()
                }}
                className="p-2 text-ui-muted hover:text-ui-primary transition-colors"
                title="重新載入資料"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 桌台選擇區域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-ui-primary rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-ui-primary mb-6">選擇要結帳的桌台</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {getOccupiedTablesAndTakeout().map((table) => {
              const orders = table.is_takeout ? 
                getTakeoutOrders().filter(order => 
                  order.order_number.replace(/^#?TOGO-/i, '') === table.name?.replace('外帶-', '')
                ) :
                getTableOrders(table.table_number || '', table.id)
              
              const totalAmount = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
              
              return (
                <button
                  key={table.id}
                  onClick={() => selectTableForCheckout(table)}
                  className="p-4 bg-yellow-100 border-2 border-yellow-300 rounded-lg hover:bg-yellow-200 transition-colors text-left"
                >
                  <div className="font-semibold text-gray-900 mb-1">
                    {table.is_takeout ? '🥡' : '🍽️'} {table.is_takeout ? table.name : table.table_number}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {orders.length}個訂單
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    NT$ {totalAmount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {orders.map(order => order.order_number).join(', ')}
                  </div>
                </button>
              )
            })}
          </div>

          {getOccupiedTablesAndTakeout().length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">沒有需要結帳的桌台</div>
              <div className="text-gray-500 text-sm mt-2">所有桌台都已結帳完成</div>
            </div>
          )}
        </div>
      </main>

      {/* 結帳確認彈窗 */}
      {showConfirmModal && selectedTableData && tableOrders.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-ui-primary rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-ui-primary mb-4">
                {selectedTableData.is_takeout ? '🥡 外帶訂單結帳' : `🍽️ 桌號 ${selectedTableData.table_number} 結帳`}
              </h3>
              
              {/* 訂單詳情 */}
              <div className="space-y-4 mb-6">
                <div className="bg-ui-secondary p-4 rounded-lg">
                  <h4 className="font-medium text-ui-primary mb-3">訂單資訊</h4>
                  <div className="space-y-2">
                    {tableOrders.map((order, index) => (
                      <div key={order.id} className="flex justify-between items-center py-1">
                        <span className="text-sm text-ui-muted">
                          {index + 1}. {order.order_number}
                        </span>
                        <span className="font-medium text-ui-primary">
                          NT$ {(order.total_amount || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center font-semibold">
                        <span>小計</span>
                        <span>NT$ {calculateTotalAmount().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 支付方式選擇 */}
                <div>
                  <h4 className="font-medium text-ui-primary mb-3">選擇支付方式</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-3 rounded-lg border-2 text-left transition-colors ${
                          paymentMethod === method.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-ui bg-ui-secondary text-ui-muted hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{method.icon}</span>
                          <span className="font-medium">{method.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 現金付款輸入 */}
                {paymentMethod === 'cash' && (
                  <div>
                    <label className="block text-sm font-medium text-ui-primary mb-2">
                      收款金額
                    </label>
                    <input
                      type="number"
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                      placeholder="輸入收款金額"
                      className="w-full px-3 py-2 border border-ui rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {receivedAmount && !isNaN(parseFloat(receivedAmount)) && (
                      <div className="mt-2 text-sm text-ui-muted">
                        找零：NT$ {calculateChange().toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                {/* 金額計算詳情 */}
                <div className="bg-ui-secondary p-4 rounded-lg">
                  <h4 className="font-medium text-ui-primary mb-3">金額明細</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-ui-muted">小計</span>
                      <span className="font-medium">NT$ {calculateTotalAmount().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ui-muted">
                        稅額 {paymentMethod === 'mobile' ? '(3%)' : '(現金免稅)'}
                      </span>
                      <span className="font-medium">NT$ {getTaxAmount().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ui-muted">
                        服務費 {paymentMethod === 'mobile' ? '(2%)' : '(現金免收)'}
                      </span>
                      <span className="font-medium">NT$ {getServiceFee().toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>總計</span>
                        <span className="text-green-600">NT$ {getFinalAmount().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {paymentMethod === 'cash' && receivedAmount && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="text-gray-600">收款金額</span>
                      <span className="font-semibold">NT$ {parseFloat(receivedAmount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">找零</span>
                      <span className="font-semibold">NT$ {calculateChange().toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3 p-6 pt-0">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 text-ui-muted border border-ui rounded-lg hover:text-ui-primary hover:bg-ui-secondary transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCheckout}
                disabled={isProcessing || !isPaymentValid()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? '處理中...' : '確認結帳'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
