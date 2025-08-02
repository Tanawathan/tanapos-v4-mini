import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { PostMealCheckoutService } from '../../lib/checkout-service'
import { useUIStyle } from '../../contexts/UIStyleContext'

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
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
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
  const { currentStyle, styleConfig } = useUIStyle()
  
  // 使用 useMemo 來確保只創建一次 service 實例
  const checkoutService = useMemo(() => new PostMealCheckoutService(), [])
  
  // 樣式 helper 函數
  const getBaseStyles = () => ({
    primaryText: currentStyle === 'cyberpunk' ? '#00ffff' :
                 currentStyle === 'dos' ? '#00ff00' :
                 currentStyle === 'neumorphism' ? '#555555' :
                 '#111827',
    secondaryText: currentStyle === 'cyberpunk' ? '#ff0080' :
                   currentStyle === 'dos' ? '#ffff00' :
                   '#6b7280',
    primaryBg: currentStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.25)' :
               currentStyle === 'cyberpunk' ? 'rgba(0, 255, 255, 0.1)' :
               currentStyle === 'neumorphism' ? 'linear-gradient(145deg, #f0f0f3, #cacdd1)' :
               currentStyle === 'dos' ? '#000080' :
               'rgba(255, 255, 255, 0.95)',
    border: currentStyle === 'cyberpunk' ? '1px solid #00ffff' :
            currentStyle === 'dos' ? '2px solid #00ff00' : 'none',
    boxShadow: currentStyle === 'neumorphism' ? '20px 20px 40px #bebebe, -20px -20px 40px #ffffff' :
               currentStyle === 'glassmorphism' ? '0 8px 32px rgba(31, 38, 135, 0.37)' :
               currentStyle === 'cyberpunk' ? '0 0 20px rgba(0, 255, 255, 0.3)' :
               '0 4px 6px rgba(0, 0, 0, 0.1)'
  })
  
  // 通用樣式生成器
  const getUIStyles = {
    flexContainer: (direction: 'row' | 'column' = 'column', gap: string = '16px') => ({
      display: 'flex',
      flexDirection: direction,
      gap
    }),
    card: (padding: string = '16px') => ({
      borderRadius: currentStyle === 'dos' ? '0' : '8px',
      padding,
      background: baseStyles.primaryBg,
      border: baseStyles.border,
      boxShadow: baseStyles.boxShadow
    }),
    button: (isPrimary: boolean = true) => ({
      padding: '8px 16px',
      borderRadius: currentStyle === 'dos' ? '0' : '8px',
      background: isPrimary 
        ? (currentStyle === 'cyberpunk' ? '#00ffff' :
           currentStyle === 'dos' ? '#00ff00' :
           '#3b82f6')
        : 'transparent',
      color: isPrimary 
        ? (currentStyle === 'cyberpunk' ? '#000000' :
           currentStyle === 'dos' ? '#000080' :
           '#ffffff')
        : baseStyles.primaryText,
      border: baseStyles.border || (isPrimary ? 'none' : '1px solid rgba(107, 114, 128, 0.3)'),
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }),
    text: (size: 'sm' | 'base' | 'lg' | 'xl' = 'base', weight: 'normal' | 'medium' | 'bold' = 'normal') => ({
      fontSize: size === 'sm' ? '0.875rem' : 
                size === 'lg' ? '1.125rem' :
                size === 'xl' ? '1.25rem' : '1rem',
      fontWeight: weight === 'medium' ? '500' : weight === 'bold' ? '700' : '400',
      color: baseStyles.primaryText
    })
  }
  
  const baseStyles = getBaseStyles()
  
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
      console.log('🔄 載入結帳訂單...')
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('status', 'completed')
        .eq('payment_status', 'unpaid')
        .order('created_at', { ascending: true })

      if (error) throw error

      console.log('📦 載入的訂單數據:', data)
      console.log('🔢 訂單數量:', data?.length || 0)
      
      if (data && data.length > 0) {
        const tableNumbers = [...new Set(data.map(o => o.table_number))].filter(Boolean)
        console.log('🏷️ 可用桌號:', tableNumbers)
      }

      setOrders(data || [])
    } catch (err) {
      console.error('❌ 載入訂單失敗:', err)
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
      <div style={{
        minHeight: '100vh',
        background: currentStyle === 'modern' ? '#f8fafc' :
                   currentStyle === 'neumorphism' ? 'linear-gradient(145deg, #f0f0f3, #cacdd1)' :
                   currentStyle === 'glassmorphism' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
                   currentStyle === 'cyberpunk' ? 'linear-gradient(45deg, #0a0a0a, #1a1a2e, #16213e)' :
                   currentStyle === 'dos' ? '#000080' :
                   '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: styleConfig.fontFamily
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: `2px solid ${currentStyle === 'cyberpunk' ? '#00ffff' :
                                 currentStyle === 'dos' ? '#00ff00' :
                                 '#3b82f6'}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{
            color: currentStyle === 'cyberpunk' ? '#00ffff' :
                   currentStyle === 'dos' ? '#00ff00' :
                   '#6b7280'
          }}>載入結帳訂單中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: currentStyle === 'modern' ? '#f8fafc' :
                   currentStyle === 'neumorphism' ? 'linear-gradient(145deg, #f0f0f3, #cacdd1)' :
                   currentStyle === 'glassmorphism' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
                   currentStyle === 'cyberpunk' ? 'linear-gradient(45deg, #0a0a0a, #1a1a2e, #16213e)' :
                   currentStyle === 'dos' ? '#000080' :
                   '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: styleConfig.fontFamily
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '16px',
            color: currentStyle === 'cyberpunk' ? '#ff0080' :
                   currentStyle === 'dos' ? '#ff0000' :
                   '#dc2626'
          }}>❌</div>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: currentStyle === 'cyberpunk' ? '#00ffff' :
                   currentStyle === 'dos' ? '#00ff00' :
                   currentStyle === 'neumorphism' ? '#555555' :
                   '#111827',
            marginBottom: '8px'
          }}>載入失敗</h2>
          <p style={{
            color: currentStyle === 'cyberpunk' ? '#ff0080' :
                   currentStyle === 'dos' ? '#ffff00' :
                   '#6b7280',
            marginBottom: '16px'
          }}>{error}</p>
          <button
            onClick={() => {
              setError(null)
              loadCheckoutOrders()
            }}
            style={{
              padding: '8px 16px',
              background: currentStyle === 'cyberpunk' ? '#00ffff' :
                         currentStyle === 'dos' ? '#00ff00' :
                         currentStyle === 'neumorphism' ? 'linear-gradient(145deg, #667eea, #764ba2)' :
                         '#3b82f6',
              color: currentStyle === 'cyberpunk' ? '#000000' :
                     currentStyle === 'dos' ? '#000080' :
                     '#ffffff',
              border: 'none',
              borderRadius: currentStyle === 'dos' ? '0' : '8px',
              cursor: 'pointer',
              fontSize: '16px',
              boxShadow: currentStyle === 'neumorphism' ? '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' :
                        currentStyle === 'glassmorphism' ? '0 8px 32px rgba(31, 38, 135, 0.37)' :
                        '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = currentStyle === 'cyberpunk' ? 'rgba(0, 255, 255, 0.8)' :
                                                  currentStyle === 'dos' ? 'rgba(0, 255, 0, 0.8)' :
                                                  '#2563eb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = currentStyle === 'cyberpunk' ? '#00ffff' :
                                                  currentStyle === 'dos' ? '#00ff00' :
                                                  '#3b82f6'
            }}
          >
            重試
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
         minHeight: '100vh',
         padding: '16px',
         fontFamily: styleConfig.fontFamily,
         background: currentStyle === 'modern' ? '#f8fafc' :
                    currentStyle === 'neumorphism' ? 'linear-gradient(145deg, #f0f0f3, #cacdd1)' :
                    currentStyle === 'glassmorphism' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
                    currentStyle === 'cyberpunk' ? 'linear-gradient(45deg, #0a0a0a, #1a1a2e, #16213e)' :
                    currentStyle === 'dos' ? '#000080' :
                    '#f8fafc'
         }}>
      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto' 
      }}>
        {/* 頁面標題 */}
        <div style={{
          marginBottom: '24px'
        }}>
          <h1 style={{
                fontSize: '1.875rem',
                fontWeight: 'bold',
                marginBottom: '8px',
                color: baseStyles.primaryText
              }}>
            💰 餐後結帳系統
          </h1>
          <p style={{
               opacity: 0.7,
               color: baseStyles.secondaryText
             }}>
            選擇訂單進行結帳，支援多種支付方式
          </p>
        </div>

        {/* 桌號篩選 */}
        <div style={{
               ...getUIStyles.card('16px'),
               marginBottom: '24px',
               backdropFilter: currentStyle === 'glassmorphism' ? 'blur(10px)' : 'none'
             }}>
          <div style={{
            ...getUIStyles.flexContainer('row', '16px'),
            alignItems: 'center'
          }}>
            <label style={{
              ...getUIStyles.text('sm', 'medium'),
              opacity: 0.8
            }}>
              篩選桌號:
            </label>
            <select
              value={selectedTable || ''}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : null
                console.log('🏷️ 選擇桌號:', value)
                setSelectedTable(value)
              }}
              style={{
                border: baseStyles.border || '1px solid rgba(107, 114, 128, 0.3)',
                borderRadius: currentStyle === 'dos' ? '0' : '8px',
                padding: '8px 12px',
                minWidth: '120px',
                background: baseStyles.primaryBg,
                color: baseStyles.primaryText,
                backdropFilter: currentStyle === 'glassmorphism' ? 'blur(10px)' : 'none'
              }}
            >
              <option value="">全部桌號 ({orders.length})</option>
              {(() => {
                const tableNumbers = [...new Set(orders.map(o => o.table_number))]
                  .filter(Boolean)
                  .sort((a, b) => a - b)
                console.log('🏷️ 渲染桌號選項:', tableNumbers)
                return tableNumbers.map(tableNum => (
                  <option key={tableNum} value={tableNum}>
                    桌號 {tableNum} ({orders.filter(o => o.table_number === tableNum).length}筆)
                  </option>
                ))
              })()}
            </select>
            <button
              onClick={() => {
                console.log('🔄 手動重新載入訂單')
                loadCheckoutOrders()
              }}
              style={{
                padding: '8px 16px',
                borderRadius: currentStyle === 'dos' ? '0' : '8px',
                background: currentStyle === 'cyberpunk' ? 'linear-gradient(45deg, #ff0080, #00ffff)' :
                           currentStyle === 'dos' ? '#00ff00' :
                           currentStyle === 'glassmorphism' ? 'rgba(59, 130, 246, 0.8)' :
                           '#3b82f6',
                color: currentStyle === 'dos' ? '#000080' : '#ffffff',
                border: baseStyles.border || 'none',
                boxShadow: baseStyles.boxShadow,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
              disabled={loading}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {loading ? '載入中...' : '🔄 重新載入'}
            </button>
            <div style={{
              fontSize: '0.875rem',
              opacity: 0.7,
              color: baseStyles.secondaryText
            }}>
              總計: {orders.length} 筆訂單
            </div>
          </div>
        </div>

        {/* 主要內容區域 - Flex 左右布局 */}
        <div style={{
          display: 'flex',
          flexDirection: window.innerWidth >= 1280 ? 'row' : 'column',
          gap: '24px',
          minHeight: '600px'
        }}>
          {/* 左側：訂單清單 */}
          <div style={{
               width: window.innerWidth >= 1280 ? (window.innerWidth >= 1536 ? '420px' : '384px') : '100%',
               borderRadius: currentStyle === 'dos' ? '0' : '8px',
               boxShadow: baseStyles.boxShadow,
               display: 'flex',
               flexDirection: 'column',
               background: baseStyles.primaryBg,
               border: baseStyles.border
               }}>
            <div className="p-4 border-b border-opacity-30"
                 style={{
                   borderColor: currentStyle === 'cyberpunk' ? '#00ffff' :
                               currentStyle === 'dos' ? '#00ff00' :
                               'rgba(107, 114, 128, 0.3)'
                 }}>
              <h2 className="text-xl font-semibold"
                  style={{
                    color: currentStyle === 'cyberpunk' ? '#00ffff' :
                           currentStyle === 'dos' ? '#00ff00' : 'inherit'
                  }}>
                待結帳訂單 ({filteredOrders.length})
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-300px)] lg:max-h-[500px]">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center opacity-70">
                  {orders.length === 0 ? (
                    <div>
                      <div className="text-4xl mb-4">🍽️</div>
                      <h3 className="text-lg font-medium mb-2">
                        沒有待結帳的訂單
                      </h3>
                      <p className="text-sm mb-4">
                        當前沒有已完成且待結帳的訂單
                      </p>
                      <button
                        onClick={() => {
                          console.log('🔄 重新載入訂單 (來自空狀態)')
                          loadCheckoutOrders()
                        }}
                        className="px-4 py-2 rounded-lg transition-all duration-200"
                        style={{
                          background: currentStyle === 'cyberpunk' ? 'linear-gradient(45deg, #ff0080, #00ffff)' :
                                     currentStyle === 'dos' ? '#00ff00' :
                                     '#3b82f6',
                          color: currentStyle === 'dos' ? '#000080' : '#ffffff'
                        }}
                      >
                        重新載入
                      </button>
                      <div className="mt-4 text-xs opacity-60">
                        提示：請確保有已完成的訂單 (status = 'completed')
                      </div>
                    </div>
                  ) : selectedTable ? (
                    <div>
                      <div className="text-4xl mb-4">🏷️</div>
                      <h3 className="text-lg font-medium mb-2">
                        桌號 {selectedTable} 沒有待結帳訂單
                      </h3>
                      <p className="text-sm mb-4">
                        該桌台目前沒有需要結帳的訂單
                      </p>
                      <button
                        onClick={() => setSelectedTable(null)}
                        className="px-4 py-2 rounded-lg transition-all duration-200"
                        style={{
                          background: currentStyle === 'cyberpunk' ? 'rgba(107, 114, 128, 0.8)' :
                                     currentStyle === 'dos' ? '#666666' :
                                     '#6b7280',
                          color: '#ffffff'
                        }}
                      >
                        查看全部訂單
                      </button>
                    </div>
                  ) : (
                    '目前沒有待結帳的訂單'
                  )}
                </div>
              ) : (
                filteredOrders.map(order => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="p-4 cursor-pointer transition-all duration-200 border-b border-opacity-30"
                    style={{
                      borderColor: currentStyle === 'cyberpunk' ? '#00ffff' :
                                  currentStyle === 'dos' ? '#00ff00' :
                                  'rgba(107, 114, 128, 0.3)',
                      background: selectedOrder?.id === order.id
                        ? (currentStyle === 'cyberpunk' ? 'rgba(0, 255, 255, 0.2)' :
                           currentStyle === 'glassmorphism' ? 'rgba(59, 130, 246, 0.2)' :
                           currentStyle === 'dos' ? 'rgba(0, 255, 0, 0.2)' :
                           'rgba(59, 130, 246, 0.1)')
                        : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedOrder?.id !== order.id) {
                        e.currentTarget.style.background = currentStyle === 'cyberpunk' ? 'rgba(255, 0, 128, 0.1)' :
                                                           currentStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.1)' :
                                                           currentStyle === 'dos' ? 'rgba(0, 255, 0, 0.1)' :
                                                           'rgba(107, 114, 128, 0.05)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedOrder?.id !== order.id) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium"
                             style={{
                               color: currentStyle === 'cyberpunk' ? '#00ffff' :
                                      currentStyle === 'dos' ? '#00ff00' : 'inherit'
                             }}>
                          {order.order_number}
                        </div>
                        <div className="text-sm opacity-70">
                          桌號: {order.table_number} | 項目: {order.order_items.length}
                          {order.order_items.some(item => isMealSet(item.product_name)) && (
                            <span className="ml-2 px-2 py-1 text-xs rounded-full"
                                  style={{
                                    background: currentStyle === 'cyberpunk' ? 'rgba(255, 165, 0, 0.8)' :
                                               currentStyle === 'dos' ? 'rgba(255, 255, 0, 0.8)' :
                                               'rgba(251, 146, 60, 0.2)',
                                    color: currentStyle === 'cyberpunk' ? '#000' :
                                           currentStyle === 'dos' ? '#000080' :
                                           'rgb(194, 65, 12)'
                                  }}>
                              含套餐 🍽️
                            </span>
                          )}
                        </div>
                        {order.customer_name && (
                          <div className="text-sm opacity-70">
                            客戶: {order.customer_name}
                          </div>
                        )}
                        <div className="text-xs opacity-60 mt-1">
                          {new Date(order.created_at).toLocaleString('zh-TW')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg"
                             style={{
                               color: currentStyle === 'cyberpunk' ? '#ff0080' :
                                      currentStyle === 'dos' ? '#ffff00' : 'inherit'
                             }}>
                          NT$ {order.total_amount.toFixed(0)}
                        </div>
                        <div className="px-2 py-1 text-xs rounded"
                             style={{
                               background: order.payment_status === 'pending' 
                                 ? (currentStyle === 'cyberpunk' ? 'rgba(255, 255, 0, 0.8)' :
                                    currentStyle === 'dos' ? 'rgba(255, 255, 0, 0.8)' :
                                    'rgba(254, 240, 138, 0.8)')
                                 : (currentStyle === 'cyberpunk' ? 'rgba(0, 255, 0, 0.8)' :
                                    currentStyle === 'dos' ? 'rgba(0, 255, 0, 0.8)' :
                                    'rgba(187, 247, 208, 0.8)'),
                               color: order.payment_status === 'pending'
                                 ? (currentStyle === 'cyberpunk' || currentStyle === 'dos' ? '#000' : 'rgb(146, 64, 14)')
                                 : (currentStyle === 'cyberpunk' || currentStyle === 'dos' ? '#000' : 'rgb(20, 83, 45)')
                             }}
                        >
                          {order.payment_status === 'pending' ? '待結帳' : '已付款'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 右側：結帳詳情 */}
          <div style={{
               flex: 1,
               borderRadius: currentStyle === 'dos' ? '0' : '8px',
               boxShadow: baseStyles.boxShadow,
               display: 'flex',
               flexDirection: 'column',
               background: baseStyles.primaryBg,
               border: baseStyles.border,
               minHeight: '500px'
               }}>
            {selectedOrder ? (
              <div className="p-6 flex-1 overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4"
                    style={{
                      color: currentStyle === 'cyberpunk' ? '#00ffff' :
                             currentStyle === 'dos' ? '#00ff00' : 'inherit'
                    }}>
                  結帳詳情
                </h3>

                {/* 訂單資訊 */}
                <div className="mb-6 p-4 rounded-lg bg-opacity-50"
                     style={{
                       background: currentStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.2)' :
                                  currentStyle === 'cyberpunk' ? 'rgba(255, 0, 128, 0.1)' :
                                  currentStyle === 'dos' ? 'rgba(0, 255, 0, 0.1)' :
                                  'rgba(107, 114, 128, 0.1)'
                     }}>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="opacity-70">訂單編號:</span>
                      <span>{selectedOrder.order_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">桌號:</span>
                      <span>{selectedOrder.table_number}</span>
                    </div>
                    {selectedOrder.customer_name && (
                      <div className="flex justify-between">
                        <span className="opacity-70">客戶:</span>
                        <span>{selectedOrder.customer_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 訂單項目 */}
                <div className="mb-6">
                  <h4 className="text-md font-medium mb-3"
                      style={{
                        color: currentStyle === 'cyberpunk' ? '#ff0080' :
                               currentStyle === 'dos' ? '#ffff00' : 'inherit'
                      }}>
                    訂單項目 ({selectedOrder.order_items.length})
                  </h4>
                  <div className="space-y-3">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm pb-2 border-b border-opacity-30"
                           style={{
                             borderColor: currentStyle === 'cyberpunk' ? '#00ffff' :
                                         currentStyle === 'dos' ? '#00ff00' :
                                         'rgba(107, 114, 128, 0.3)'
                           }}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {getMealSetIcon(item.product_name)}
                            </span>
                            <span className="font-medium">
                              {item.product_name} x{item.quantity}
                            </span>
                            {isMealSet(item.product_name) && (
                              <span className="px-2 py-1 text-xs rounded-full"
                                    style={{
                                      background: currentStyle === 'cyberpunk' ? 'rgba(255, 165, 0, 0.8)' :
                                                 currentStyle === 'dos' ? 'rgba(255, 255, 0, 0.8)' :
                                                 'rgba(251, 146, 60, 0.2)',
                                      color: currentStyle === 'cyberpunk' ? '#000' :
                                             currentStyle === 'dos' ? '#000080' :
                                             'rgb(194, 65, 12)'
                                    }}>
                                套餐
                              </span>
                            )}
                          </div>
                          {item.special_instructions && (
                            <div className="text-xs opacity-60 mt-1 ml-6">
                              📝 備註: {formatMealSetInstructions(item.product_name, item.special_instructions)}
                            </div>
                          )}
                        </div>
                        <span className="font-semibold"
                              style={{
                                color: currentStyle === 'cyberpunk' ? '#ff0080' :
                                       currentStyle === 'dos' ? '#ffff00' : 'inherit'
                              }}>
                          NT$ {item.total_price.toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 金額摘要 */}
                <div className="mb-6 p-4 rounded-lg bg-opacity-50"
                     style={{
                       background: currentStyle === 'glassmorphism' ? 'rgba(255, 255, 255, 0.2)' :
                                  currentStyle === 'cyberpunk' ? 'rgba(255, 0, 128, 0.1)' :
                                  currentStyle === 'dos' ? 'rgba(0, 255, 0, 0.1)' :
                                  'rgba(107, 114, 128, 0.1)'
                     }}>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between font-bold text-lg"
                         style={{
                           color: currentStyle === 'cyberpunk' ? '#00ffff' :
                                  currentStyle === 'dos' ? '#00ff00' : 'inherit'
                         }}>
                      <span>總金額:</span>
                      <span>NT$ {selectedOrder.total_amount.toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                {/* 開始結帳按鈕 */}
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full py-3 rounded-lg font-medium text-lg transition-all duration-200 hover:scale-105"
                  style={{
                    background: currentStyle === 'cyberpunk' ? 'linear-gradient(45deg, #00ff00, #00ffff)' :
                               currentStyle === 'dos' ? '#00ff00' :
                               currentStyle === 'glassmorphism' ? 'rgba(34, 197, 94, 0.8)' :
                               '#22c55e',
                    color: currentStyle === 'dos' ? '#000080' : '#ffffff',
                    border: currentStyle === 'cyberpunk' ? '1px solid #00ffff' : 'none',
                    boxShadow: currentStyle === 'neumorphism' ? '8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff' :
                              currentStyle === 'glassmorphism' ? '0 8px 32px rgba(31, 38, 135, 0.37)' :
                              '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  💰 開始結帳
                </button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center opacity-70">
                <div>
                  <div className="text-4xl mb-4">🧾</div>
                  <div className="text-lg font-medium">選擇一個訂單開始結帳</div>
                  <div className="text-sm mt-2">從左側訂單列表中選擇要結帳的訂單</div>
                </div>
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
