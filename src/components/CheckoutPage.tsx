import { useState, useEffect } from 'react'
import usePOSStore from '../lib/store'
import { Table, Order } from '../lib/types'

interface CheckoutPageProps {
  onBack: () => void
}

export default function CheckoutPage({ onBack }: CheckoutPageProps) {
  const {
    tables,
    orders,
    orderItems,
    loadTables,
    loadOrders,
    processCheckout,
    loading
  } = usePOSStore()

  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [receivedAmount, setReceivedAmount] = useState<string>('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadTables()
    loadOrders()
  }, [loadTables, loadOrders])

  // 取得有活躍訂單的桌台
  const getOccupiedTables = () => {
    return tables.filter(table => {
      const order = orders.find(order => 
        order.table_id === table.id && 
        ['pending', 'confirmed', 'preparing', 'ready', 'served'].includes(order.status || '')
      )
      return order !== undefined
    })
  }

  // 取得桌台的活躍訂單
  const getTableOrder = (tableId: string) => {
    return orders.find(order => 
      order.table_id === tableId && 
      ['pending', 'confirmed', 'preparing', 'ready', 'served'].includes(order.status || '')
    )
  }

  // 取得訂單項目
  const getOrderItems = (orderId: string) => {
    return orderItems.filter(item => item.order_id === orderId)
  }

  // 選擇桌台進行結帳
  const selectTableForCheckout = (table: Table) => {
    const order = getTableOrder(table.id)
    setSelectedTable(table)
    setSelectedOrder(order || null)
    setReceivedAmount('')
  }

  // 計算最終金額（包含服務費）
  const getFinalAmount = () => {
    if (!selectedOrder) return 0
    const baseAmount = selectedOrder.subtotal || 0
    
    // 行動支付加收5%服務費
    if (paymentMethod === 'mobile') {
      return baseAmount * 1.05
    }
    
    // 其他支付方式不加費用
    return baseAmount
  }

  // 計算找零
  const calculateChange = () => {
    if (!selectedOrder || !receivedAmount) return 0
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
    if (!selectedTable || !selectedOrder) return

    setIsProcessing(true)
    try {
      await processCheckout(selectedTable.id, selectedOrder.id, {
        payment_method: paymentMethod,
        received_amount: paymentMethod === 'cash' ? parseFloat(receivedAmount) : undefined,
        change_amount: paymentMethod === 'cash' ? calculateChange() : undefined
      })

      const finalAmount = getFinalAmount()
      const serviceFeeText = paymentMethod === 'mobile' ? `\n服務費(5%)：NT$ ${((selectedOrder.subtotal || 0) * 0.05).toLocaleString()}` : ''
      
      alert(`✅ 結帳成功！\n桌號：${selectedTable.table_number}\n訂單：${selectedOrder.order_number}\n金額：NT$ ${finalAmount.toLocaleString()}${serviceFeeText}\n${paymentMethod === 'cash' ? `找零：NT$ ${calculateChange().toLocaleString()}` : ''}`)

      setSelectedTable(null)
      setSelectedOrder(null)
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
    <div className="min-h-screen bg-gray-50">
      {/* 頂部導航 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>返回</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">💰 結帳系統</h1>
            </div>
            <button
              onClick={() => {
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
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側：桌台選擇 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">選擇結帳桌台</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">載入桌台資訊中...</p>
              </div>
            ) : getOccupiedTables().length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">🍽️</div>
                <p className="text-gray-600">目前沒有需要結帳的桌台</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {getOccupiedTables().map(table => {
                  const order = getTableOrder(table.id)
                  const isSelected = selectedTable?.id === table.id
                  
                  return (
                    <button
                      key={table.id}
                      onClick={() => selectTableForCheckout(table)}
                      className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-lg'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-lg font-bold text-gray-900">
                          桌號 {table.table_number}
                        </div>
                        <div className="text-xl">🍽️</div>
                      </div>
                      
                      {table.name && (
                        <div className="text-sm text-gray-600 mb-2">({table.name})</div>
                      )}
                      
                      {order && (
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-800">
                            {order.order_number}
                          </div>
                          <div className="text-sm text-gray-600">
                            客人數：{order.customer_count || 1} 人
                          </div>
                          <div className="text-lg font-bold text-green-600">
                            NT$ {(order.subtotal || 0).toLocaleString()}
                          </div>
                        </div>
                      )}
                      
                      {table.seated_at && (
                        <div className="text-xs text-gray-500 mt-2">
                          入座：{new Date(table.seated_at).toLocaleTimeString()}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 右側：結帳詳情 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">結帳詳情</h2>
            
            {!selectedTable || !selectedOrder ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">👈</div>
                <p className="text-gray-600">請先選擇要結帳的桌台</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 訂單基本資訊 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">訂單資訊</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">桌號</div>
                      <div className="font-semibold">{selectedTable.table_number}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">訂單編號</div>
                      <div className="font-semibold">{selectedOrder.order_number}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">客人數量</div>
                      <div className="font-semibold">{selectedOrder.customer_count || 1} 人</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">用餐時間</div>
                      <div className="font-semibold">
                        {selectedTable.seated_at
                          ? Math.round((Date.now() - new Date(selectedTable.seated_at).getTime()) / 60000)
                          : 0
                        } 分鐘
                      </div>
                    </div>
                  </div>
                </div>

                {/* 訂單項目 */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">訂單項目</h3>
                  <div className="space-y-2">
                    {getOrderItems(selectedOrder.id).map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-medium">{item.product_name}</div>
                          {item.special_instructions && (
                            <div className="text-xs text-blue-600">備註：{item.special_instructions}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium">x{item.quantity}</div>
                          <div className="text-sm text-gray-600">NT$ {item.total_price.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 金額明細（移除稅額，加入行動支付服務費） */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">金額明細</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">小計</span>
                      <span>NT$ {(selectedOrder.subtotal || 0).toLocaleString()}</span>
                    </div>
                    {paymentMethod === 'mobile' && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">服務費 (5%)</span>
                        <span>NT$ {((selectedOrder.subtotal || 0) * 0.05).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                      <span>總計</span>
                      <span className="text-green-600">
                        NT$ {getFinalAmount().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 支付方式選擇（移除信用卡） */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">支付方式</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map(method => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-3 rounded-lg border-2 text-center transition-colors ${
                          paymentMethod === method.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{method.icon}</div>
                        <div className="text-sm font-medium">{method.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 現金收款 */}
                {paymentMethod === 'cash' && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">現金收款</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          收款金額
                        </label>
                        <input
                          type="number"
                          value={receivedAmount}
                          onChange={(e) => setReceivedAmount(e.target.value)}
                          placeholder="請輸入收款金額"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* 快速金額按鈕 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          快速選擇
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setReceivedAmount(getFinalAmount().toString())}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded-lg border border-green-300 hover:bg-green-200 transition-colors text-sm font-medium"
                          >
                            <div className="text-xs text-green-600 mb-1">剛好</div>
                            <div>NT$ {getFinalAmount().toLocaleString()}</div>
                          </button>
                          <button
                            onClick={() => setReceivedAmount('500')}
                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg border border-blue-300 hover:bg-blue-200 transition-colors text-sm font-medium"
                          >
                            <div className="text-xs text-blue-600 mb-1">500元</div>
                            <div>NT$ 500</div>
                          </button>
                          <button
                            onClick={() => setReceivedAmount('1000')}
                            className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg border border-purple-300 hover:bg-purple-200 transition-colors text-sm font-medium"
                          >
                            <div className="text-xs text-purple-600 mb-1">1000元</div>
                            <div>NT$ 1,000</div>
                          </button>
                        </div>
                      </div>
                      
                      {receivedAmount && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-yellow-800">找零</span>
                            <span className="text-lg font-bold text-yellow-900">
                              NT$ {calculateChange().toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 結帳按鈕 */}
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!isPaymentValid() || isProcessing}
                  className={`w-full py-3 rounded-lg font-semibold text-lg transition-colors ${
                    isPaymentValid() && !isProcessing
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? '處理中...' : '確認結帳'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 確認結帳模態框 */}
      {showConfirmModal && selectedOrder && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-gray-900">確認結帳</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">桌號</div>
                    <div className="font-semibold">{selectedTable.table_number}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">訂單</div>
                    <div className="font-semibold">{selectedOrder.order_number}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">總計</div>
                    <div className="font-semibold text-green-600">
                      NT$ {getFinalAmount().toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">支付方式</div>
                    <div className="font-semibold">
                      {paymentMethods.find(m => m.id === paymentMethod)?.name}
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
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:text-gray-800 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCheckout}
                disabled={isProcessing}
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
