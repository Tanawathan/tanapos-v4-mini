import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://peubpisofenlyquqnpan.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWJwaXNvZmVubHlxdXFucGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTgwODgsImV4cCI6MjA2OTQzNDA4OH0.6IzK9jjs-Ld_mFBRQqNk594ayXapjGxwAmhQpoY26cY'
)

async function createSimpleTestOrders() {
  console.log('🏗️ 創建簡單的測試訂單...\n')
  
  try {
    // 創建幾個簡單的測試訂單
    const testOrders = [
      {
        order_number: `TEST-SIMPLE-${Date.now()}-1`,
        table_number: 1,
        customer_name: '測試客戶A',
        status: 'completed',
        payment_status: 'unpaid',
        subtotal: 500,
        tax_amount: 25,
        total_amount: 525,
        created_at: new Date().toISOString()
      },
      {
        order_number: `TEST-SIMPLE-${Date.now()}-2`,
        table_number: 2,
        customer_name: '測試客戶B',
        status: 'completed',
        payment_status: 'unpaid',
        subtotal: 800,
        tax_amount: 40,
        total_amount: 840,
        created_at: new Date().toISOString()
      },
      {
        order_number: `TEST-SIMPLE-${Date.now()}-3`,
        table_number: 3,
        customer_name: '測試客戶C',
        status: 'completed',
        payment_status: 'unpaid',
        subtotal: 300,
        tax_amount: 15,
        total_amount: 315,
        created_at: new Date().toISOString()
      }
    ]

    console.log('創建測試訂單...')
    for (let i = 0; i < testOrders.length; i++) {
      const order = testOrders[i]
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([order])
        .select()
        .single()

      if (orderError) {
        console.error(`❌ 創建訂單 ${order.order_number} 失敗:`, orderError.message)
        continue
      }

      console.log(`✅ 創建訂單: ${order.order_number} (桌${order.table_number}) NT$${order.total_amount}`)

      // 添加一些簡單的訂單項目
      const orderItems = [
        {
          order_id: orderData.id,
          product_name: '經典漢堡',
          quantity: 1,
          unit_price: 200,
          total_price: 200,
          status: 'completed'
        },
        {
          order_id: orderData.id,
          product_name: '薯條',
          quantity: 1,
          unit_price: 80,
          total_price: 80,
          status: 'completed'
        }
      ]

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error(`❌ 添加訂單項目失敗:`, itemsError.message)
      } else {
        console.log(`   ✅ 添加了 ${orderItems.length} 個項目`)
      }
    }

    // 檢查創建結果
    const { data: checkData, error: checkError } = await supabase
      .from('orders')
      .select('order_number, table_number, status, payment_status, total_amount')
      .eq('status', 'completed')
      .eq('payment_status', 'unpaid')
      .order('created_at', { ascending: false })

    if (checkError) {
      console.error('❌ 檢查結果失敗:', checkError.message)
      return
    }

    console.log('\n📊 可結帳訂單總結:')
    checkData.forEach(order => {
      console.log(`   - ${order.order_number} (桌${order.table_number}) ${order.payment_status} NT$${order.total_amount}`)
    })

    console.log(`\n🎉 創建完成！總計 ${checkData.length} 個可結帳訂單`)
    console.log('📍 現在可以到 /checkout-post-meal 頁面測試桌號選擇功能')

  } catch (error) {
    console.error('❌ 創建過程發生錯誤:', error)
  }
}

createSimpleTestOrders()
