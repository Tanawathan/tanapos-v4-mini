import { supabase } from './supabase'

// 模擬的支付功能（前端實現）
interface PaymentRecord {
  id: string
  order_id: string
  method: string
  amount: number
  service_fee: number
  total_amount: number
  status: string
  created_at: string
}

// 支付記錄存儲（使用 localStorage 模擬資料庫）
class PaymentService {
  private storageKey = 'tanapos_payments'

  // 獲取所有支付記錄
  getPayments(): PaymentRecord[] {
    const data = localStorage.getItem(this.storageKey)
    return data ? JSON.parse(data) : []
  }

  // 添加支付記錄
  addPayment(payment: Omit<PaymentRecord, 'id' | 'created_at'>): PaymentRecord {
    const payments = this.getPayments()
    const newPayment: PaymentRecord = {
      ...payment,
      id: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    }
    
    payments.push(newPayment)
    localStorage.setItem(this.storageKey, JSON.stringify(payments))
    return newPayment
  }

  // 根據訂單ID獲取支付記錄
  getPaymentByOrderId(orderId: string): PaymentRecord | null {
    const payments = this.getPayments()
    return payments.find(p => p.order_id === orderId) || null
  }

  // 檢查訂單是否已支付
  isOrderPaid(orderId: string): boolean {
    const payment = this.getPaymentByOrderId(orderId)
    return payment ? payment.status === 'completed' : false
  }
}

// 餐後結帳處理函數
export class PostMealCheckoutService {
  private paymentService = new PaymentService()

  // 處理支付
  async processPayment(
    orderId: string,
    paymentMethod: string,
    amount: number,
    serviceFee: number = 0,
    additionalData: any = {}
  ) {
    try {
      console.log('🔄 處理支付中...', {
        orderId,
        paymentMethod,
        amount,
        serviceFee,
        totalAmount: amount + serviceFee
      })

      // 1. 檢查訂單是否已支付
      if (this.paymentService.isOrderPaid(orderId)) {
        throw new Error('此訂單已經支付過了')
      }

      // 2. 創建支付記錄
      const paymentRecord = this.paymentService.addPayment({
        order_id: orderId,
        method: paymentMethod,
        amount: amount,
        service_fee: serviceFee,
        total_amount: amount + serviceFee,
        status: 'completed'
      })

      console.log('✅ 支付記錄已創建:', paymentRecord)

      // 3. 更新訂單狀態（使用 Supabase）
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (orderError) {
        console.error('更新訂單狀態失敗:', orderError.message)
        // 不阻止流程，因為支付已成功
      } else {
        console.log('✅ 訂單狀態已更新為 paid')
      }

      // 4. 釋放桌台（獲取桌台ID並更新狀態）
      const { data: orderData } = await supabase
        .from('orders')
        .select('table_number')
        .eq('id', orderId)
        .single()

      if (orderData) {
        const { error: tableError } = await supabase
          .from('tables')
          .update({ status: 'available' })
          .eq('table_number', orderData.table_number)

        if (tableError) {
          console.error('釋放桌台失敗:', tableError.message)
        } else {
          console.log(`✅ 桌號 ${orderData.table_number} 已釋放`)
        }
      }

      // 5. 返回支付結果
      return {
        success: true,
        paymentId: paymentRecord.id,
        totalAmount: paymentRecord.total_amount,
        receiptNumber: this.generateReceiptNumber(),
        message: '支付成功'
      }

    } catch (error) {
      console.error('❌ 支付處理失敗:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤',
        message: '支付失敗'
      }
    }
  }

  // 生成收據編號
  private generateReceiptNumber(): string {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = now.getTime().toString().slice(-6)
    return `REC-${dateStr}-${timeStr}`
  }

  // 獲取支付記錄
  getPaymentHistory() {
    return this.paymentService.getPayments()
  }

  // 檢查訂單支付狀態
  checkPaymentStatus(orderId: string) {
    return this.paymentService.getPaymentByOrderId(orderId)
  }
}

// 測試餐後結帳功能
async function testPostMealCheckout() {
  console.log('🧪 測試餐後結帳功能...\n')
  
  const checkoutService = new PostMealCheckoutService()
  
  try {
    // 獲取一個可結帳的訂單
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, order_number, table_number, total_amount, status')
      .eq('status', 'completed')
      .limit(1)

    if (error || !orders || orders.length === 0) {
      console.log('⚠️ 沒有可測試的訂單，創建測試訂單...')
      
      // 創建測試訂單
      const { data: testOrder, error: createError } = await supabase
        .from('orders')
        .insert({
          order_number: `TEST-CHECKOUT-${Date.now()}`,
          table_number: 99,
          total_amount: 350,
          status: 'completed',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('創建測試訂單失敗:', createError.message)
        return
      }

      orders.push(testOrder)
    }

    const testOrder = orders[0]
    console.log('📋 測試訂單:', testOrder)

    // 測試不同支付方式
    const testCases = [
      {
        name: '現金支付',
        method: 'cash',
        amount: testOrder.total_amount,
        serviceFee: 0
      },
      {
        name: '行動支付 (含5%手續費)',
        method: 'mobile',
        amount: testOrder.total_amount,
        serviceFee: testOrder.total_amount * 0.05
      }
    ]

    for (const testCase of testCases) {
      console.log(`\n🧪 測試 ${testCase.name}...`)
      
      const result = await checkoutService.processPayment(
        testOrder.id,
        testCase.method,
        testCase.amount,
        testCase.serviceFee,
        {
          receivedAmount: testCase.method === 'cash' ? testCase.amount + testCase.serviceFee + 50 : undefined,
          transactionId: testCase.method === 'mobile' ? `TXN-${Date.now()}` : undefined
        }
      )

      if (result.success) {
        console.log('✅ 測試成功:')
        console.log(`   支付ID: ${result.paymentId}`)
        console.log(`   總金額: NT$ ${result.totalAmount}`)
        console.log(`   收據編號: ${result.receiptNumber}`)
      } else {
        console.log('❌ 測試失敗:', result.message)
      }
      
      // 等待一段時間後進行下一個測試
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    // 顯示支付歷史
    console.log('\n📊 支付歷史:')
    const history = checkoutService.getPaymentHistory()
    history.slice(-3).forEach(payment => {
      console.log(`   ${payment.id}: ${payment.method} NT$ ${payment.total_amount} (${payment.status})`)
    })

  } catch (error) {
    console.error('❌ 測試失敗:', error)
  }
}

// 只在 Node.js 環境下運行測試
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  // 檢查是否直接執行此檔案
  if (typeof require !== 'undefined' && require.main === module) {
    testPostMealCheckout().then(() => {
      console.log('\n🎉 餐後結帳功能測試完成！')
      process.exit(0)
    })
  }
}
