import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useUIStyle } from '../../contexts/UIStyleContext'

// 付款方式定義
export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'voucher' | 'points'

// 發票類型
export type InvoiceType = 'receipt' | 'personal' | 'company'

// 付款記錄
interface Payment {
  id: string
  order_id: string
  method: PaymentMethod
  amount: number
  received_amount?: number
  change_amount?: number
  transaction_id?: string
  card_last_four?: string
  mobile_provider?: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  processed_at: string
}

// 發票資料
interface Invoice {
  id: string
  order_id: string
  type: InvoiceType
  invoice_number?: string
  tax_id?: string
  company_name?: string
  buyer_email?: string
  buyer_phone?: string
  subtotal: number
  tax_amount: number
  total_amount: number
  issued_at: string
  void_at?: string
}

// 收據資料
interface Receipt {
  id: string
  order_id: string
  receipt_number: string
  items: Array<{
    name: string
    quantity: number
    unit_price: number
    total_price: number
  }>
  subtotal: number
  tax_amount: number
  total_amount: number
  payment_method: PaymentMethod
  received_amount?: number
  change_amount?: number
  issued_at: string
  printed_at?: string
}

// 訂單資料 (簡化版)
interface CheckoutOrder {
  id: string
  order_number: string
  table_number: number
  customer_name?: string
  subtotal: number
  tax_amount: number
  total_amount: number
  status: string
  order_items: Array<{
    product_name: string
    quantity: number
    unit_price: number
    total_price: number
  }>
}

export default function CheckoutSystem() {
  const { currentStyle, styleConfig } = useUIStyle()
  const [orders, setOrders] = useState<CheckoutOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<CheckoutOrder | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 載入待結帳訂單
  const loadPendingOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          tables (table_number),
          order_items (
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .in('status', ['ready', 'served'])
        .eq('payment_status', 'pending')
        .order('created_at')

      if (error) throw error

      const formattedOrders = data?.map(order => ({
        ...order,
        table_number: order.tables?.table_number || 0,
        order_items: order.order_items || []
      })) || []

      setOrders(formattedOrders)
    } catch (err) {
      console.error('載入訂單失敗:', err)
      setError('載入訂單失敗')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPendingOrders()

    // 即時更新
    const subscription = supabase
      .channel('checkout-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        () => loadPendingOrders()
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">載入訂單中...</span>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          💰 完整結帳系統
        </h1>
        
        {/* 統計資訊 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {orders.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">待結帳訂單</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              ${orders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">待收金額</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">
              ${orders.reduce((sum, order) => sum + order.subtotal, 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">營業額</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">
              ${orders.reduce((sum, order) => sum + order.tax_amount, 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">稅額</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 訂單列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              待結帳訂單 ({orders.length})
            </h2>
          </div>
          
          <div className="max-h-[600px] overflow-y-auto">
            {orders.map(order => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer
                  hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                  ${selectedOrder?.id === order.id ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {order.order_number}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      桌號: {order.table_number} | 項目: {order.order_items.length}
                    </div>
                    {order.customer_name && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        客戶: {order.customer_name}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-gray-900 dark:text-white">
                      ${order.total_amount.toFixed(2)}
                    </div>
                    <div className={`px-2 py-1 text-xs rounded
                      ${order.status === 'ready' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}
                    >
                      {order.status === 'ready' ? '待取餐' : '已完成'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {orders.length === 0 && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                目前沒有待結帳的訂單
              </div>
            )}
          </div>
        </div>

        {/* 結帳詳情 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {selectedOrder ? (
            <CheckoutPanel
              order={selectedOrder}
              onPayment={() => setShowPaymentModal(true)}
              onInvoice={() => setShowInvoiceModal(true)}
              onComplete={() => {
                loadPendingOrders()
                setSelectedOrder(null)
              }}
            />
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              選擇一個訂單開始結帳
            </div>
          )}
        </div>
      </div>

      {/* 付款彈窗 */}
      {showPaymentModal && selectedOrder && (
        <PaymentModal
          order={selectedOrder}
          onClose={() => setShowPaymentModal(false)}
          onComplete={(paymentData) => {
            processPayment(selectedOrder.id, paymentData)
            setShowPaymentModal(false)
          }}
        />
      )}

      {/* 發票彈窗 */}
      {showInvoiceModal && selectedOrder && (
        <InvoiceModal
          order={selectedOrder}
          onClose={() => setShowInvoiceModal(false)}
          onComplete={(invoiceData) => {
            generateInvoice(selectedOrder.id, invoiceData)
            setShowInvoiceModal(false)
          }}
        />
      )}
    </div>
  )

  // 處理付款
  async function processPayment(orderId: string, paymentData: any) {
    try {
      // 記錄付款
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          method: paymentData.method,
          amount: paymentData.amount,
          received_amount: paymentData.receivedAmount,
          change_amount: paymentData.changeAmount,
          transaction_id: paymentData.transactionId,
          card_last_four: paymentData.cardLastFour,
          mobile_provider: paymentData.mobileProvider,
          status: 'completed',
          processed_at: new Date().toISOString()
        })

      if (paymentError) throw paymentError

      // 更新訂單狀態
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          payment_method: paymentData.method,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (orderError) throw orderError

      // 生成收據
      await generateReceipt(orderId, paymentData)

    } catch (err) {
      console.error('處理付款失敗:', err)
      setError('處理付款失敗')
    }
  }

  // 生成收據
  async function generateReceipt(orderId: string, paymentData: any) {
    try {
      const order = orders.find(o => o.id === orderId)
      if (!order) return

      const receiptNumber = `R${Date.now()}`
      
      const { error } = await supabase
        .from('receipts')
        .insert({
          order_id: orderId,
          receipt_number: receiptNumber,
          items: order.order_items,
          subtotal: order.subtotal,
          tax_amount: order.tax_amount,
          total_amount: order.total_amount,
          payment_method: paymentData.method,
          received_amount: paymentData.receivedAmount,
          change_amount: paymentData.changeAmount,
          issued_at: new Date().toISOString()
        })

      if (error) throw error

      // 這裡可以整合印表機列印功能
      printReceipt(receiptNumber, order, paymentData)

    } catch (err) {
      console.error('生成收據失敗:', err)
    }
  }

  // 生成發票
  async function generateInvoice(orderId: string, invoiceData: any) {
    try {
      const invoiceNumber = invoiceData.type === 'company' 
        ? `${new Date().getFullYear()}${(Date.now() % 100000).toString().padStart(8, '0')}`
        : undefined

      const { error } = await supabase
        .from('invoices')
        .insert({
          order_id: orderId,
          type: invoiceData.type,
          invoice_number: invoiceNumber,
          tax_id: invoiceData.taxId,
          company_name: invoiceData.companyName,
          buyer_email: invoiceData.buyerEmail,
          buyer_phone: invoiceData.buyerPhone,
          subtotal: selectedOrder!.subtotal,
          tax_amount: selectedOrder!.tax_amount,
          total_amount: selectedOrder!.total_amount,
          issued_at: new Date().toISOString()
        })

      if (error) throw error

    } catch (err) {
      console.error('生成發票失敗:', err)
      setError('生成發票失敗')
    }
  }

  // 列印收據 (模擬)
  function printReceipt(receiptNumber: string, order: CheckoutOrder, paymentData: any) {
    const receiptContent = generateReceiptContent(receiptNumber, order, paymentData)
    
    // 實際環境中這裡會呼叫印表機 API
    console.log('列印收據:', receiptContent)
    
    // 在開發環境中開啟新視窗顯示收據
    if (process.env.NODE_ENV === 'development') {
      const receiptWindow = window.open('', '_blank', 'width=400,height=600')
      if (receiptWindow) {
        receiptWindow.document.write(`
          <html>
            <head>
              <title>收據 - ${receiptNumber}</title>
              <style>
                body { font-family: 'Courier New', monospace; font-size: 12px; margin: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                .total { font-weight: bold; }
              </style>
            </head>
            <body>
              ${receiptContent}
            </body>
          </html>
        `)
        receiptWindow.document.close()
      }
    }
  }

  // 生成收據內容
  function generateReceiptContent(receiptNumber: string, order: CheckoutOrder, paymentData: any) {
    const now = new Date()
    const paymentMethodNames: Record<PaymentMethod, string> = {
      cash: '現金',
      card: '信用卡',
      mobile: '行動支付',
      voucher: '餐券',
      points: '點數'
    }

    return `
      <div class="header">
        <h2>TanaPOS 餐廳</h2>
        <p>收據編號: ${receiptNumber}</p>
        <p>日期: ${now.toLocaleString('zh-TW')}</p>
        <p>桌號: ${order.table_number}</p>
        ${order.customer_name ? `<p>客戶: ${order.customer_name}</p>` : ''}
      </div>
      
      <div class="divider"></div>
      
      <div class="items">
        ${order.order_items.map(item => `
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <span>${item.product_name} x${item.quantity}</span>
            <span>$${item.total_price.toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
      
      <div class="divider"></div>
      
      <div style="display: flex; justify-content: space-between;">
        <span>小計:</span>
        <span>$${order.subtotal.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>稅額:</span>
        <span>$${order.tax_amount.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between;" class="total">
        <span>總計:</span>
        <span>$${order.total_amount.toFixed(2)}</span>
      </div>
      
      <div class="divider"></div>
      
      <div>
        <p>付款方式: ${paymentMethodNames[paymentData.method as PaymentMethod]}</p>
        ${paymentData.method === 'cash' ? `
          <p>收款: $${paymentData.receivedAmount.toFixed(2)}</p>
          <p>找零: $${paymentData.changeAmount.toFixed(2)}</p>
        ` : ''}
        ${paymentData.transactionId ? `<p>交易編號: ${paymentData.transactionId}</p>` : ''}
      </div>
      
      <div class="divider"></div>
      
      <div class="header">
        <p>謝謝光臨！</p>
        <p>歡迎再次蒞臨</p>
      </div>
    `
  }
}

// 結帳面板組件
interface CheckoutPanelProps {
  order: CheckoutOrder
  onPayment: () => void
  onInvoice: () => void
  onComplete: () => void
}

function CheckoutPanel({ order, onPayment, onInvoice, onComplete }: CheckoutPanelProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          結帳詳情
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* 訂單基本資訊 */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">訂單資訊</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">訂單編號:</span>
              <span className="text-gray-900 dark:text-white">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">桌號:</span>
              <span className="text-gray-900 dark:text-white">{order.table_number}</span>
            </div>
            {order.customer_name && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">客戶:</span>
                <span className="text-gray-900 dark:text-white">{order.customer_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* 訂單項目 */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            訂單項目 ({order.order_items.length})
          </h3>
          <div className="space-y-3">
            {order.order_items.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {item.product_name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    ${item.unit_price.toFixed(2)} × {item.quantity}
                  </div>
                </div>
                <div className="font-medium text-gray-900 dark:text-white">
                  ${item.total_price.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 金額明細 */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">金額明細</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">小計:</span>
              <span className="text-gray-900 dark:text-white">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">稅額 (5%):</span>
              <span className="text-gray-900 dark:text-white">${order.tax_amount.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
              <div className="flex justify-between font-bold text-lg">
                <span className="text-gray-900 dark:text-white">總金額:</span>
                <span className="text-gray-900 dark:text-white">${order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div className="space-y-3">
          <button
            onClick={onPayment}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            💰 開始結帳
          </button>
          
          <button
            onClick={onInvoice}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            📄 開立發票
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button className="py-2 bg-orange-600 text-white rounded hover:bg-orange-700">
              🖨️ 列印收據
            </button>
            <button className="py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
              📧 寄送收據
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 付款彈窗組件
interface PaymentModalProps {
  order: CheckoutOrder
  onClose: () => void
  onComplete: (paymentData: any) => void
}

function PaymentModal({ order, onClose, onComplete }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [receivedAmount, setReceivedAmount] = useState(order.total_amount)
  const [transactionId, setTransactionId] = useState('')
  const [cardLastFour, setCardLastFour] = useState('')
  const [mobileProvider, setMobileProvider] = useState('')

  const changeAmount = paymentMethod === 'cash' 
    ? Math.max(0, receivedAmount - order.total_amount)
    : 0

  const canComplete = paymentMethod === 'cash' 
    ? receivedAmount >= order.total_amount
    : true

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canComplete) {
      alert('收款金額不足')
      return
    }

    onComplete({
      method: paymentMethod,
      amount: order.total_amount,
      receivedAmount: paymentMethod === 'cash' ? receivedAmount : order.total_amount,
      changeAmount,
      transactionId,
      cardLastFour,
      mobileProvider
    })
  }

  const paymentMethods: Array<{value: PaymentMethod, label: string, icon: string}> = [
    { value: 'cash', label: '現金付款', icon: '💵' },
    { value: 'card', label: '信用卡', icon: '💳' },
    { value: 'mobile', label: '行動支付', icon: '📱' },
    { value: 'voucher', label: '餐券', icon: '🎫' },
    { value: 'points', label: '點數', icon: '⭐' }
  ]

  // 快速金額按鈕
  const quickAmounts = [
    order.total_amount,
    Math.ceil(order.total_amount / 100) * 100,
    Math.ceil(order.total_amount / 500) * 500,
    Math.ceil(order.total_amount / 1000) * 1000
  ].filter((amount, index, arr) => arr.indexOf(amount) === index)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            💰 付款處理
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 付款金額顯示 */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                ${order.total_amount.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                訂單 {order.order_number}
              </div>
            </div>
          </div>

          {/* 付款方式選擇 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              選擇付款方式
            </label>
            <div className="grid grid-cols-1 gap-2">
              {paymentMethods.map(method => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  className={`p-3 text-left border rounded-lg transition-colors
                    ${paymentMethod === method.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{method.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {method.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 現金付款專用 */}
          {paymentMethod === 'cash' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                收款金額
              </label>
              <input
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                step="0.01"
                min={order.total_amount}
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
                    ${amount.toFixed(2)}
                  </button>
                ))}
              </div>

              {/* 找零顯示 */}
              {changeAmount > 0 && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded">
                  <div className="text-center">
                    <div className="text-sm text-green-600 dark:text-green-400">找零</div>
                    <div className="text-xl font-bold text-green-700 dark:text-green-300">
                      ${changeAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 信用卡專用 */}
          {paymentMethod === 'card' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                卡號後四碼
              </label>
              <input
                type="text"
                value={cardLastFour}
                onChange={(e) => setCardLastFour(e.target.value)}
                placeholder="1234"
                maxLength={4}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4">
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
          )}

          {/* 行動支付專用 */}
          {paymentMethod === 'mobile' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                支付平台
              </label>
              <select
                value={mobileProvider}
                onChange={(e) => setMobileProvider(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">選擇支付平台</option>
                <option value="line_pay">LINE Pay</option>
                <option value="apple_pay">Apple Pay</option>
                <option value="google_pay">Google Pay</option>
                <option value="jko_pay">街口支付</option>
                <option value="pi_wallet">Pi 錢包</option>
              </select>
              
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4">
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
              disabled={!canComplete}
              className={`flex-1 py-3 rounded-lg font-medium
                ${canComplete
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              確認付款
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 發票彈窗組件
interface InvoiceModalProps {
  order: CheckoutOrder
  onClose: () => void
  onComplete: (invoiceData: any) => void
}

function InvoiceModal({ order, onClose, onComplete }: InvoiceModalProps) {
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('receipt')
  const [taxId, setTaxId] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    onComplete({
      type: invoiceType,
      taxId,
      companyName,
      buyerEmail,
      buyerPhone
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            📄 開立發票
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 發票類型 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              發票類型
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setInvoiceType('receipt')}
                className={`w-full p-3 text-left border rounded-lg
                  ${invoiceType === 'receipt'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                    : 'border-gray-300 dark:border-gray-600'
                  }`}
              >
                <div className="flex items-center space-x-2">
                  <span>🧾</span>
                  <span>收據 (免開統一發票)</span>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setInvoiceType('personal')}
                className={`w-full p-3 text-left border rounded-lg
                  ${invoiceType === 'personal'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                    : 'border-gray-300 dark:border-gray-600'
                  }`}
              >
                <div className="flex items-center space-x-2">
                  <span>👤</span>
                  <span>個人發票</span>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setInvoiceType('company')}
                className={`w-full p-3 text-left border rounded-lg
                  ${invoiceType === 'company'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                    : 'border-gray-300 dark:border-gray-600'
                  }`}
              >
                <div className="flex items-center space-x-2">
                  <span>🏢</span>
                  <span>公司發票</span>
                </div>
              </button>
            </div>
          </div>

          {/* 公司發票專用欄位 */}
          {invoiceType === 'company' && (
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  統一編號 *
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="12345678"
                  maxLength={8}
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  公司名稱 *
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="輸入公司名稱"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* 聯絡資訊 (個人或公司發票) */}
          {invoiceType !== 'receipt' && (
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  電子信箱
                </label>
                <input
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  手機號碼
                </label>
                <input
                  type="tel"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* 金額摘要 */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>小計:</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>稅額:</span>
                <span>${order.tax_amount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>總金額:</span>
                <span>${order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

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
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              開立發票
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
