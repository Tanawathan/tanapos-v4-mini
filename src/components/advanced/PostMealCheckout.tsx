import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { PostMealCheckoutService } from '../../lib/checkout-service'

// 支付方式定義
export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'voucher' | 'points'

// 訂單介面
interface Order {
  id: string
  order_number: string
  table_id: string
  table_number: number
  customer_name?: string
  status: string
  checkout_status: 'pending' | 'ready' | 'paid'
  subtotal: number
  tax_amount: number
  total_amount: number
  created_at: string
  order_items: OrderItem[]
}

interface OrderItem {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  special_instructions?: string
}

// 支付資料介面
interface PaymentData {
  method: PaymentMethod
  amount: number
  serviceFee?: number
  totalAmount: number
  receivedAmount?: number
  changeAmount?: number
  transactionId?: string
  cardLastFour?: string
  mobileProvider?: string
}

const PostMealCheckout: React.FC = () => {
  // 使用 useMemo 來確保只創建一次 service 實例
  const checkoutService = useMemo(() => new PostMealCheckoutService(), [])
  
  // 檢查是否為套餐的輔助函數
  const isMealSet = (productName: string): boolean => {
    return productName?.includes('套餐') || false
  }
  
  // 獲取套餐圖標
  const getMealSetIcon = (productName: string): string => {
    return isMealSet(productName) ? '🍽️' : '🍴'
  }
  
  // 格式化套餐特殊說明的輔助函數
  const formatMealSetInstructions = (productName: string, instructions: string): string => {
    if (!isMealSet(productName)) {
      return instructions
    }
    
    try {
      const data = JSON.parse(instructions)
      let formattedItems: string[] = []
      
      // 處理每個群組的商品
      Object.values(data).forEach((group: any) => {
        if (Array.isArray(group)) {
          group.forEach((item: any) => {
            if (item.name) {
              formattedItems.push(item.name)
            }
          })
        }
      })
      
      if (formattedItems.length > 0) {
        return `套餐組合: ${formattedItems.join(' + ')}`
      }
    } catch (error) {
      // JSON 解析失敗，返回原始說明
    }
    
    return instructions
  }
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [receivedAmount, setReceivedAmount] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [cardLastFour, setCardLastFour] = useState('')
  const [mobileProvider, setMobileProvider] = useState('LinePay')

  // 支付方式清單
  const paymentMethods = [
    { value: 'cash' as PaymentMethod, label: '現金', icon: '💵' },
    { value: 'card' as PaymentMethod, label: '信用卡', icon: '💳' },
    { value: 'mobile' as PaymentMethod, label: '行動支付', icon: '📱', serviceFee: 0.05 },
    { value: 'voucher' as PaymentMethod, label: '餐券', icon: '🎫' },
    { value: 'points' as PaymentMethod, label: '點數', icon: '⭐' }
  ]

  // 行動支付提供商
  const mobileProviders = [
    { value: 'LinePay', label: 'LINE Pay', icon: '💚' },
    { value: 'ApplePay', label: 'Apple Pay', icon: '🍎' },
    { value: 'GooglePay', label: 'Google Pay', icon: '🟢' },
    { value: 'JKOPay', label: '街口支付', icon: '🟦' },
    { value: 'EasyCard', label: '悠遊付', icon: '🟪' }
  ]

  // 載入可結帳的訂單
  const loadCheckoutOrders = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('status', 'completed')
        .in('checkout_status', ['pending', 'ready'])
        .order('created_at', { ascending: true })

      if (error) throw error

      setOrders(data || [])
    } catch (err) {
      console.error('載入訂單失敗:', err)
      setError('載入訂單失敗')
    } finally {
      setLoading(false)
    }
  }

  // 依桌號篩選訂單
  const filteredOrders = selectedTable 
    ? orders.filter(order => order.table_number === selectedTable)
    : orders

  // 計算支付金額和手續費
  const calculatePaymentAmount = (order: Order, method: PaymentMethod) => {
    const subtotal = order.total_amount
    const serviceFeerate = method === 'mobile' ? 0.05 : 0
    const serviceFee = subtotal * serviceFeerate
    const totalAmount = subtotal + serviceFee
    
    return {
      subtotal,
      serviceFee,
      totalAmount
    }
  }

  // 處理支付
  const handlePayment = async (paymentData: PaymentData) => {
    if (!selectedOrder) return

    try {
      setProcessing(true)

      // 使用結帳服務處理支付
      const result = await checkoutService.processPayment(
        selectedOrder.id,
        paymentData.method,
        paymentData.amount,
        paymentData.serviceFee || 0,
        {
          receivedAmount: paymentData.receivedAmount,
          changeAmount: paymentData.changeAmount,
          transactionId: paymentData.transactionId,
          cardLastFour: paymentData.cardLastFour,
          mobileProvider: paymentData.mobileProvider
        }
      )

      if (result.success) {
        // 生成收據
        generateReceipt(selectedOrder, paymentData)

        alert('支付成功！')
        setShowPaymentModal(false)
        setSelectedOrder(null)
        loadCheckoutOrders()
      } else {
        throw new Error(result.message || '支付失敗')
      }

    } catch (err) {
      console.error('支付失敗:', err)
      alert(`支付失敗: ${err instanceof Error ? err.message : '未知錯誤'}`)
    } finally {
      setProcessing(false)
    }
  }

  // 生成收據
  const generateReceipt = (order: Order, paymentData: PaymentData) => {
    const now = new Date()
    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>收據 - ${order.order_number}</title>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              margin: 20px; 
              line-height: 1.4;
            }
            .header { text-align: center; margin-bottom: 20px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .total { font-weight: bold; font-size: 14px; }
            .payment-info { margin-top: 15px; }
            .footer { text-align: center; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>🍽️ TanaPOS 餐廳</h2>
            <p>收據編號: ${order.order_number}</p>
            <p>日期: ${now.toLocaleString('zh-TW')}</p>
            <p>桌號: ${order.table_number}</p>
            ${order.customer_name ? `<p>客戶: ${order.customer_name}</p>` : ''}
          </div>
          
          <div class="divider"></div>
          
          <div class="items">
            ${order.order_items.map(item => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>
                  ${isMealSet(item.product_name) ? '🍽️' : '🍴'} 
                  ${item.product_name} x${item.quantity}
                  ${isMealSet(item.product_name) ? ' <span style="background: #fbbf24; color: #92400e; padding: 1px 4px; border-radius: 3px; font-size: 8px;">套餐</span>' : ''}
                </span>
                <span>NT$ ${item.total_price.toFixed(0)}</span>
              </div>
              ${item.special_instructions ? `<div style="font-size: 10px; color: #666; margin-left: 10px;">📝 備註: ${formatMealSetInstructions(item.product_name, item.special_instructions)}</div>` : ''}
            `).join('')}
          </div>
          
          <div class="divider"></div>
          
          <div style="display: flex; justify-content: space-between;">
            <span>小計:</span>
            <span>NT$ ${(paymentData.totalAmount - (paymentData.serviceFee || 0)).toFixed(0)}</span>
          </div>
          
          ${paymentData.serviceFee && paymentData.serviceFee > 0 ? `
            <div style="display: flex; justify-content: space-between;">
              <span>手續費 (5%):</span>
              <span>NT$ ${paymentData.serviceFee.toFixed(0)}</span>
            </div>
          ` : ''}
          
          <div style="display: flex; justify-content: space-between;" class="total">
            <span>總計:</span>
            <span>NT$ ${paymentData.totalAmount.toFixed(0)}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="payment-info">
            <p><strong>付款方式:</strong> ${paymentMethods.find(m => m.value === paymentData.method)?.label}</p>
            ${paymentData.method === 'cash' && paymentData.receivedAmount ? `
              <p>收款: NT$ ${paymentData.receivedAmount.toFixed(0)}</p>
              <p>找零: NT$ ${(paymentData.changeAmount || 0).toFixed(0)}</p>
            ` : ''}
            ${paymentData.transactionId ? `<p>交易編號: ${paymentData.transactionId}</p>` : ''}
            ${paymentData.cardLastFour ? `<p>卡號後四碼: ****${paymentData.cardLastFour}</p>` : ''}
            ${paymentData.mobileProvider ? `<p>支付平台: ${paymentData.mobileProvider}</p>` : ''}
          </div>
          
          <div class="footer">
            <div class="divider"></div>
            <p>🙏 謝謝光臨！</p>
            <p>歡迎再次蒞臨</p>
            <p style="font-size: 10px; color: #666;">此為電子收據</p>
          </div>
        </body>
      </html>
    `

    // 開啟收據視窗
    const receiptWindow = window.open('', '_blank', 'width=400,height=700')
    if (receiptWindow) {
      receiptWindow.document.write(receiptContent)
      receiptWindow.document.close()
      receiptWindow.print()
    }
  }

  useEffect(() => {
    loadCheckoutOrders()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            💰 餐後結帳系統
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            選擇訂單進行結帳，支援多種支付方式
          </p>
        </div>

        {/* 桌號篩選 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              篩選桌號:
            </label>
            <select
              value={selectedTable || ''}
              onChange={(e) => setSelectedTable(e.target.value ? Number(e.target.value) : null)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">全部桌號</option>
              {[...new Set(orders.map(o => o.table_number))].sort().map(tableNum => (
                <option key={tableNum} value={tableNum}>桌號 {tableNum}</option>
              ))}
            </select>
            <button
              onClick={loadCheckoutOrders}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔄 重新載入
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 訂單清單 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                待結帳訂單 ({filteredOrders.length})
              </h2>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  {selectedTable ? `桌號 ${selectedTable} 沒有待結帳訂單` : '目前沒有待結帳的訂單'}
                </div>
              ) : (
                filteredOrders.map(order => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors
                      ${selectedOrder?.id === order.id
                        ? 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {order.order_number}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          桌號: {order.table_number} | 項目: {order.order_items.length}
                          {order.order_items.some(item => isMealSet(item.product_name)) && (
                            <span className="ml-2 px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded-full">
                              含套餐 🍽️
                            </span>
                          )}
                        </div>
                        {order.customer_name && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            客戶: {order.customer_name}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {new Date(order.created_at).toLocaleString('zh-TW')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-gray-900 dark:text-white">
                          NT$ {order.total_amount.toFixed(0)}
                        </div>
                        <div className={`px-2 py-1 text-xs rounded
                          ${order.checkout_status === 'ready' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}
                        >
                          {order.checkout_status === 'ready' ? '可結帳' : '待結帳'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 結帳詳情 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            {selectedOrder ? (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  結帳詳情
                </h3>

                {/* 訂單資訊 */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">訂單編號:</span>
                      <span className="text-gray-900 dark:text-white">{selectedOrder.order_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">桌號:</span>
                      <span className="text-gray-900 dark:text-white">{selectedOrder.table_number}</span>
                    </div>
                    {selectedOrder.customer_name && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">客戶:</span>
                        <span className="text-gray-900 dark:text-white">{selectedOrder.customer_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 訂單項目 */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    訂單項目 ({selectedOrder.order_items.length})
                  </h4>
                  <div className="space-y-3">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm border-b border-gray-200 dark:border-gray-600 pb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {getMealSetIcon(item.product_name)}
                            </span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {item.product_name} x{item.quantity}
                            </span>
                            {isMealSet(item.product_name) && (
                              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs rounded-full">
                                套餐
                              </span>
                            )}
                          </div>
                          {item.special_instructions && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                              📝 備註: {formatMealSetInstructions(item.product_name, item.special_instructions)}
                            </div>
                          )}
                        </div>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          NT$ {item.total_price.toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 金額摘要 */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between font-bold text-lg">
                      <span>總金額:</span>
                      <span>NT$ {selectedOrder.total_amount.toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                {/* 開始結帳按鈕 */}
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 
                           font-medium text-lg transition-colors"
                >
                  💰 開始結帳
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                選擇一個訂單開始結帳
              </div>
            )}
          </div>
        </div>

        {/* 支付彈窗 */}
        {showPaymentModal && selectedOrder && (
          <PaymentModal
            order={selectedOrder}
            onClose={() => setShowPaymentModal(false)}
            onComplete={handlePayment}
            paymentMethods={paymentMethods}
            mobileProviders={mobileProviders}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            receivedAmount={receivedAmount}
            setReceivedAmount={setReceivedAmount}
            processing={processing}
            transactionId={transactionId}
            setTransactionId={setTransactionId}
            cardLastFour={cardLastFour}
            setCardLastFour={setCardLastFour}
            mobileProvider={mobileProvider}
            setMobileProvider={setMobileProvider}
            calculatePaymentAmount={calculatePaymentAmount}
          />
        )}
      </div>
    </div>
  )
}

// 支付彈窗組件
interface PaymentModalProps {
  order: Order
  onClose: () => void
  onComplete: (paymentData: PaymentData) => void
  paymentMethods: any[]
  mobileProviders: any[]
  paymentMethod: PaymentMethod
  setPaymentMethod: (method: PaymentMethod) => void
  receivedAmount: number
  setReceivedAmount: (amount: number) => void
  processing: boolean
  transactionId: string
  setTransactionId: (id: string) => void
  cardLastFour: string
  setCardLastFour: (last4: string) => void
  mobileProvider: string
  setMobileProvider: (provider: string) => void
  calculatePaymentAmount: (order: Order, method: PaymentMethod) => any
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  order,
  onClose,
  onComplete,
  paymentMethods,
  mobileProviders,
  paymentMethod,
  setPaymentMethod,
  receivedAmount,
  setReceivedAmount,
  processing,
  transactionId,
  setTransactionId,
  cardLastFour,
  setCardLastFour,
  mobileProvider,
  setMobileProvider,
  calculatePaymentAmount
}) => {
  const amounts = calculatePaymentAmount(order, paymentMethod)
  const changeAmount = paymentMethod === 'cash' && receivedAmount > amounts.totalAmount 
    ? receivedAmount - amounts.totalAmount 
    : 0

  const canComplete = 
    (paymentMethod === 'cash' && receivedAmount >= amounts.totalAmount) ||
    (paymentMethod === 'card' && cardLastFour.length === 4) ||
    (paymentMethod === 'mobile' && transactionId) ||
    (paymentMethod === 'voucher') ||
    (paymentMethod === 'points')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canComplete) return

    const paymentData: PaymentData = {
      method: paymentMethod,
      amount: amounts.subtotal,
      serviceFee: amounts.serviceFee,
      totalAmount: amounts.totalAmount,
      receivedAmount: paymentMethod === 'cash' ? receivedAmount : undefined,
      changeAmount: paymentMethod === 'cash' ? changeAmount : undefined,
      transactionId: paymentMethod === 'mobile' ? transactionId : undefined,
      cardLastFour: paymentMethod === 'card' ? cardLastFour : undefined,
      mobileProvider: paymentMethod === 'mobile' ? mobileProvider : undefined
    }

    onComplete(paymentData)
  }

  // 快速金額按鈕
  const quickAmounts = [
    amounts.totalAmount,
    Math.ceil(amounts.totalAmount / 100) * 100,
    Math.ceil(amounts.totalAmount / 500) * 500,
    Math.ceil(amounts.totalAmount / 1000) * 1000
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              支付 - {order.order_number}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {/* 金額摘要 */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>訂單金額:</span>
                <span>NT$ {amounts.subtotal.toFixed(0)}</span>
              </div>
              {amounts.serviceFee > 0 && (
                <div className="flex justify-between text-orange-600 dark:text-orange-400">
                  <span>手續費 (5%):</span>
                  <span>NT$ {amounts.serviceFee.toFixed(0)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>總金額:</span>
                <span>NT$ {amounts.totalAmount.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* 支付方式選擇 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              選擇支付方式
            </label>
            <div className="space-y-2">
              {paymentMethods.map(method => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  className={`w-full p-3 text-left border rounded-lg transition-colors
                    ${paymentMethod === method.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{method.icon}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {method.label}
                      </span>
                    </div>
                    {method.serviceFee && (
                      <span className="text-sm text-orange-600 dark:text-orange-400">
                        +5% 手續費
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 現金付款 */}
          {paymentMethod === 'cash' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                收款金額
              </label>
              <input
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                step="1"
                min={amounts.totalAmount}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg"
              />
              
              {/* 快速金額按鈕 */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                {quickAmounts.map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setReceivedAmount(amount)}
                    className="py-2 px-3 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white
                             rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    NT$ {amount.toFixed(0)}
                  </button>
                ))}
              </div>

              {/* 找零顯示 */}
              {changeAmount > 0 && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded">
                  <div className="text-center">
                    <div className="text-sm text-green-600 dark:text-green-400">找零</div>
                    <div className="text-xl font-bold text-green-700 dark:text-green-300">
                      NT$ {changeAmount.toFixed(0)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 信用卡付款 */}
          {paymentMethod === 'card' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                卡號後四碼
              </label>
              <input
                type="text"
                value={cardLastFour}
                onChange={(e) => setCardLastFour(e.target.value.slice(0, 4))}
                placeholder="1234"
                maxLength={4}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}

          {/* 行動支付 */}
          {paymentMethod === 'mobile' && (
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  支付平台
                </label>
                <select
                  value={mobileProvider}
                  onChange={(e) => setMobileProvider(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {mobileProviders.map(provider => (
                    <option key={provider.value} value={provider.value}>
                      {provider.icon} {provider.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  交易編號
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="輸入交易編號"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              {/* 手續費提醒 */}
              <div className="p-3 bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-orange-600 dark:text-orange-400">⚠️</span>
                  <span className="text-sm text-orange-700 dark:text-orange-300">
                    行動支付將加收 5% 手續費 (NT$ {amounts.serviceFee.toFixed(0)})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 確認按鈕 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!canComplete || processing}
              className={`flex-1 py-3 rounded-lg font-medium
                ${canComplete && !processing
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              {processing ? '處理中...' : '確認付款'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PostMealCheckout
