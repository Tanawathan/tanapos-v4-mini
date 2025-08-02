import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

// 付款方式定義
export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'voucher' | 'points'

// 發票類型
export type InvoiceType = 'receipt' | 'personal' | 'company'

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

export default function CheckoutSystemNew() {
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
      console.log('🔄 載入結帳訂單...')
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
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
        order_items: order.order_items || []
      })) || []

      console.log('✅ 載入完成，找到訂單:', formattedOrders.length)
      setOrders(formattedOrders)
    } catch (err) {
      console.error('❌ 載入訂單失敗:', err)
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

  // 創建測試訂單的功能
  const createTestOrder = async () => {
    try {
      const testOrder = {
        order_number: `TEST-${Date.now()}`,
        table_number: Math.floor(Math.random() * 20) + 1,
        customer_name: '測試客戶',
        status: 'ready',
        payment_status: 'pending',
        subtotal: 285.71,
        tax_amount: 14.29,
        total_amount: 300.00,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(testOrder)
        .select()
        .single()

      if (orderError) throw orderError

      // 添加測試訂單項目
      const testItems = [
        {
          order_id: orderData.id,
          product_name: '招牌牛肉麵',
          quantity: 1,
          unit_price: 180.00,
          total_price: 180.00
        },
        {
          order_id: orderData.id,
          product_name: '小籠包 (8顆)',
          quantity: 1,
          unit_price: 120.00,
          total_price: 120.00
        }
      ]

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(testItems)

      if (itemsError) throw itemsError

      console.log('✅ 測試訂單創建成功')
      loadPendingOrders()
    } catch (err) {
      console.error('❌ 創建測試訂單失敗:', err)
    }
  }

  if (loading) {
    return (
      <div className="modern-container" style={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💰</div>
        <div className="modern-card-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          載入結帳系統中...
        </div>
        <div className="modern-card-subtitle">
          正在載入待結帳訂單...
        </div>
      </div>
    )
  }

  return (
    <div className="modern-container" style={{ minHeight: '100vh', padding: '1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="modern-page-title">
          💰 完整結帳系統
        </h1>
        
        {/* 測試按鈕 */}
        <div style={{ marginBottom: '1rem' }}>
          <button
            onClick={createTestOrder}
            className="modern-btn modern-btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          >
            🧪 創建測試訂單
          </button>
        </div>
        
        {/* 統計資訊 */}
        <div style={{ 
          display: 'flex', 
          gap: '0.75rem', 
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          justifyContent: 'space-between'
        }}>
          {[
            { label: '待結帳訂單', count: orders.length, color: 'var(--modern-warning)' },
            { label: '待收金額', amount: orders.reduce((sum, order) => sum + order.total_amount, 0), color: 'var(--modern-success)' },
            { label: '營業額', amount: orders.reduce((sum, order) => sum + order.subtotal, 0), color: 'var(--modern-primary)' },
            { label: '稅額', amount: orders.reduce((sum, order) => sum + order.tax_amount, 0), color: 'var(--modern-warning)' }
          ].map((stat, index) => (
            <div key={index} className="modern-card" style={{ 
              textAlign: 'center', 
              padding: '0.75rem',
              flex: '1',
              minWidth: '120px'
            }}>
              <div className="modern-card-title" style={{ 
                fontSize: '1.5rem', 
                marginBottom: '0.25rem',
                color: stat.color
              }}>
                {stat.count !== undefined ? stat.count : `$${stat.amount!.toFixed(2)}`}
              </div>
              <div className="modern-card-subtitle" style={{ fontSize: '0.75rem' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="modern-card" style={{ 
          marginBottom: '1rem', 
          padding: '1rem', 
          backgroundColor: 'var(--modern-danger-light)', 
          border: '1px solid var(--modern-danger)' 
        }}>
          <div style={{ color: 'var(--modern-danger)' }}>{error}</div>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1.5fr 1fr', 
        gap: '1.5rem', 
        minHeight: '600px' 
      }}>
        {/* 訂單列表 */}
        <div className="modern-card" style={{ overflow: 'hidden', height: 'fit-content' }}>
          <div className="modern-card-header">
            <h2 className="modern-card-title">
              待結帳訂單 ({orders.length})
            </h2>
          </div>
          
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {orders.length === 0 ? (
              <div style={{ 
                padding: '2rem', 
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🛒</div>
                <div className="modern-card-title" style={{ marginBottom: '0.5rem' }}>目前沒有待結帳的訂單</div>
                <div className="modern-card-subtitle">
                  當有訂單準備好結帳時，會在這裡顯示
                </div>
              </div>
            ) : (
              orders.map(order => {
                const isSelected = selectedOrder?.id === order.id
                
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`modern-card modern-interactive ${isSelected ? 'modern-card-selected' : ''}`}
                    style={{ 
                      margin: '0.5rem',
                      borderRadius: '0.5rem',
                      padding: '0.75rem'
                    }}
                  >
                    {/* 訂單標題行 */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem'
                    }}>
                      <div>
                        <div className="modern-card-title" style={{ marginBottom: '0.25rem', fontSize: '0.95rem' }}>
                          {order.order_number}
                        </div>
                        <div className="modern-card-subtitle" style={{ fontSize: '0.8rem' }}>
                          桌號: {order.table_number} | 項目: {order.order_items?.length || 0}
                          {order.customer_name && (
                            <span> | {order.customer_name}</span>
                          )}
                        </div>
                      </div>
                      <span className={`modern-badge ${
                        order.status === 'ready' ? 'modern-badge-success' : 'modern-badge-secondary'
                      }`} style={{ fontSize: '0.7rem' }}>
                        {order.status === 'ready' ? '待取餐' : '已完成'}
                      </span>
                    </div>

                    {/* 訂單詳情行 */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div className="modern-card-subtitle" style={{ fontSize: '0.75rem' }}>
                        等待結帳
                      </div>
                      <div className="modern-card-title" style={{ fontSize: '0.9rem' }}>
                        ${order.total_amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* 結帳詳情 */}
        <div className="modern-card" style={{ height: 'fit-content' }}>
          {!selectedOrder ? (
            <div style={{
              padding: '3rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
              <div className="modern-card-title" style={{ marginBottom: '0.5rem' }}>選擇訂單開始結帳</div>
              <div className="modern-card-subtitle">點擊左側訂單項目查看詳情並進行結帳</div>
            </div>
          ) : (
            <CheckoutPanel
              order={selectedOrder}
              onPayment={() => setShowPaymentModal(true)}
              onInvoice={() => setShowInvoiceModal(true)}
              onComplete={() => {
                loadPendingOrders()
                setSelectedOrder(null)
              }}
            />
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
      console.log('💰 處理付款:', orderId, paymentData)

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

      console.log('✅ 付款處理完成')
      loadPendingOrders()
      setSelectedOrder(null)

    } catch (err) {
      console.error('❌ 處理付款失敗:', err)
      setError('處理付款失敗')
    }
  }

  // 生成發票
  async function generateInvoice(orderId: string, invoiceData: any) {
    try {
      console.log('📄 生成發票:', orderId, invoiceData)
      // 這裡可以實作發票生成邏輯
      console.log('✅ 發票生成完成')
    } catch (err) {
      console.error('❌ 生成發票失敗:', err)
      setError('生成發票失敗')
    }
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
      <div className="modern-card-header">
        <h2 className="modern-card-title">
          結帳詳情
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: '1rem' }}>
        {/* 訂單基本資訊 */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 className="modern-card-title" style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>訂單資訊</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="modern-card-subtitle">訂單編號:</span>
              <span className="modern-card-title" style={{ fontSize: '0.875rem' }}>{order.order_number}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="modern-card-subtitle">桌號:</span>
              <span className="modern-card-title" style={{ fontSize: '0.875rem' }}>{order.table_number}</span>
            </div>
            {order.customer_name && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="modern-card-subtitle">客戶:</span>
                <span className="modern-card-title" style={{ fontSize: '0.875rem' }}>{order.customer_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* 訂單項目 */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 className="modern-card-title" style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>
            訂單項目 ({order.order_items.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {order.order_items.map((item, index) => (
              <div key={index} className="modern-card" style={{ padding: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div className="modern-card-title" style={{ marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                      {item.product_name}
                    </div>
                    <div className="modern-card-subtitle" style={{ fontSize: '0.75rem' }}>
                      ${item.unit_price.toFixed(2)} × {item.quantity}
                    </div>
                  </div>
                  <div className="modern-card-title" style={{ fontSize: '0.875rem' }}>
                    ${item.total_price.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 金額明細 */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 className="modern-card-title" style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>金額明細</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="modern-card-subtitle">小計:</span>
              <span className="modern-card-title" style={{ fontSize: '0.875rem' }}>${order.subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="modern-card-subtitle">稅額 (5%):</span>
              <span className="modern-card-title" style={{ fontSize: '0.875rem' }}>${order.tax_amount.toFixed(2)}</span>
            </div>
            <div style={{ 
              borderTop: '1px solid var(--modern-border)', 
              paddingTop: '0.5rem', 
              marginTop: '0.5rem',
              display: 'flex', 
              justifyContent: 'space-between' 
            }}>
              <span className="modern-card-title" style={{ fontSize: '1rem' }}>總金額:</span>
              <span className="modern-card-title" style={{ fontSize: '1rem' }}>${order.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* 操作按鈕 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={onPayment}
            className="modern-btn modern-btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
          >
            💰 開始結帳
          </button>
          
          <button
            onClick={onInvoice}
            className="modern-btn modern-btn-secondary"
            style={{ width: '100%', padding: '0.5rem' }}
          >
            📄 開立發票
          </button>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button className="modern-btn modern-btn-secondary" style={{ padding: '0.5rem' }}>
              🖨️ 列印
            </button>
            <button className="modern-btn modern-btn-secondary" style={{ padding: '0.5rem' }}>
              📧 寄送
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
      changeAmount
    })
  }

  const paymentMethods: Array<{value: PaymentMethod, label: string, icon: string}> = [
    { value: 'cash', label: '現金付款', icon: '💵' },
    { value: 'card', label: '信用卡', icon: '💳' },
    { value: 'mobile', label: '行動支付', icon: '📱' },
    { value: 'voucher', label: '餐券', icon: '🎫' },
    { value: 'points', label: '點數', icon: '⭐' }
  ]

  return (
    <div className="modern-modal-overlay">
      <div className="modern-modal">
        <div className="modern-card-header">
          <h3 className="modern-card-title">
            💰 付款處理
          </h3>
          <button
            onClick={onClose}
            className="modern-btn modern-btn-secondary"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1rem' }}>
          {/* 付款金額顯示 */}
          <div className="modern-card" style={{ 
            marginBottom: '1.5rem', 
            textAlign: 'center', 
            padding: '1rem' 
          }}>
            <div className="modern-card-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
              ${order.total_amount.toFixed(2)}
            </div>
            <div className="modern-card-subtitle">
              訂單 {order.order_number}
            </div>
          </div>

          {/* 付款方式選擇 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="modern-card-subtitle" style={{ display: 'block', marginBottom: '0.5rem' }}>
              選擇付款方式
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {paymentMethods.map(method => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  className={`modern-card modern-interactive ${
                    paymentMethod === method.value ? 'modern-card-selected' : ''
                  }`}
                  style={{ padding: '0.75rem', textAlign: 'left' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{method.icon}</span>
                    <span className="modern-card-title" style={{ fontSize: '0.875rem' }}>
                      {method.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 現金付款專用 */}
          {paymentMethod === 'cash' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="modern-card-subtitle" style={{ display: 'block', marginBottom: '0.5rem' }}>
                收款金額
              </label>
              <input
                type="number"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                step="0.01"
                min={order.total_amount}
                className="modern-input"
                style={{ width: '100%', fontSize: '1.125rem' }}
              />

              {/* 找零顯示 */}
              {changeAmount > 0 && (
                <div className="modern-card" style={{ 
                  marginTop: '0.75rem', 
                  padding: '0.75rem', 
                  textAlign: 'center',
                  backgroundColor: 'var(--modern-success-light)',
                  border: '1px solid var(--modern-success)'
                }}>
                  <div className="modern-card-subtitle" style={{ marginBottom: '0.25rem' }}>找零</div>
                  <div className="modern-card-title" style={{ fontSize: '1.25rem', color: 'var(--modern-success)' }}>
                    ${changeAmount.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 確認按鈕 */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="modern-btn modern-btn-secondary"
              style={{ flex: '1', padding: '0.75rem' }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!canComplete}
              className={`modern-btn ${canComplete ? 'modern-btn-primary' : 'modern-btn-disabled'}`}
              style={{ flex: '1', padding: '0.75rem' }}
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onComplete({ type: invoiceType })
  }

  return (
    <div className="modern-modal-overlay">
      <div className="modern-modal">
        <div className="modern-card-header">
          <h3 className="modern-card-title">
            📄 開立發票
          </h3>
          <button
            onClick={onClose}
            className="modern-btn modern-btn-secondary"
            style={{ padding: '0.25rem 0.5rem' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1rem' }}>
          {/* 發票類型 */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="modern-card-subtitle" style={{ display: 'block', marginBottom: '0.5rem' }}>
              發票類型
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { value: 'receipt', label: '收據 (免開統一發票)', icon: '🧾' },
                { value: 'personal', label: '個人發票', icon: '👤' },
                { value: 'company', label: '公司發票', icon: '🏢' }
              ].map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setInvoiceType(type.value as InvoiceType)}
                  className={`modern-card modern-interactive ${
                    invoiceType === type.value ? 'modern-card-selected' : ''
                  }`}
                  style={{ padding: '0.75rem', textAlign: 'left' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 金額摘要 */}
          <div className="modern-card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>小計:</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>稅額:</span>
                <span>${order.tax_amount.toFixed(2)}</span>
              </div>
              <div style={{ 
                borderTop: '1px solid var(--modern-border)', 
                paddingTop: '0.5rem',
                display: 'flex', 
                justifyContent: 'space-between',
                fontWeight: 'bold'
              }}>
                <span>總金額:</span>
                <span>${order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 確認按鈕 */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="modern-btn modern-btn-secondary"
              style={{ flex: '1', padding: '0.75rem' }}
            >
              取消
            </button>
            <button
              type="submit"
              className="modern-btn modern-btn-primary"
              style={{ flex: '1', padding: '0.75rem' }}
            >
              開立發票
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
