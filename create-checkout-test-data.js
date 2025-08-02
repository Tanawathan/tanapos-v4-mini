import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://peubpisofenlyquqnpan.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWJwaXNvZmVubHlxdXFucGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTgwODgsImV4cCI6MjA2OTQzNDA4OH0.6IzK9jjs-Ld_mFBRQqNk594ayXapjGxwAmhQpoY26cY'
)

async function createTestCheckoutData() {
  console.log('🏗️ 創建餐後結帳測試資料...\n')
  
  try {
    // 1. 檢查現有訂單
    console.log('1. 檢查現有訂單狀態...')
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number, table_number, status, total_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (ordersError) {
      console.error('載入訂單失敗:', ordersError.message)
      return
    }
    
    console.log(`   找到 ${orders.length} 個最近訂單`)
    
    // 2. 將一些訂單設為已完成，可以結帳
    console.log('\n2. 設置可結帳訂單...')
    
    const ordersToUpdate = orders.slice(0, 3) // 取前3個訂單
    
    for (const order of ordersToUpdate) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)
      
      if (updateError) {
        console.error(`   更新訂單 ${order.order_number} 失敗:`, updateError.message)
      } else {
        console.log(`   ✅ 訂單 ${order.order_number} (桌${order.table_number}) 已設為可結帳`)
        console.log(`       金額: NT$ ${order.total_amount}`)
      }
    }
    
    // 3. 檢查桌台狀態
    console.log('\n3. 檢查桌台狀態...')
    const { data: tables, error: tablesError } = await supabase
      .from('tables')
      .select('table_number, status')
      .order('table_number')
    
    if (tablesError) {
      console.error('載入桌台失敗:', tablesError.message)
    } else {
      console.log('   桌台狀態:')
      tables.forEach(table => {
        const statusText = table.status === 'occupied' ? '使用中' : '可用'
        console.log(`   - 桌號 ${table.table_number}: ${statusText}`)
      })
    }
    
    // 4. 模擬創建一些新的測試訂單（餐後結帳流程）
    console.log('\n4. 創建測試訂單...')
    
    const testOrders = [
      {
        order_number: `TEST-CHECKOUT-${Date.now()}`,
        table_number: 1,
        customer_name: '測試客戶A',
        total_amount: 580,
        status: 'completed'
      },
      {
        order_number: `TEST-CHECKOUT-${Date.now() + 1}`,
        table_number: 3,
        customer_name: '測試客戶B',
        total_amount: 1200,
        status: 'completed'
      }
    ]
    
    for (const orderData of testOrders) {
      // 創建訂單
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          ...orderData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (orderError) {
        console.error(`   創建訂單失敗:`, orderError.message)
        continue
      }
      
      console.log(`   ✅ 創建訂單: ${orderData.order_number}`)
      
      // 添加訂單項目
      const orderItems = [
        {
          order_id: newOrder.id,
          product_name: '美式咖啡',
          quantity: 2,
          unit_price: 120,
          total_price: 240,
          status: 'completed'
        },
        {
          order_id: newOrder.id,
          product_name: '義大利麵',
          quantity: 1,
          unit_price: 280,
          total_price: 280,
          status: 'completed'
        }
      ]
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
      
      if (itemsError) {
        console.error(`   添加訂單項目失敗:`, itemsError.message)
      } else {
        console.log(`       └─ 添加 ${orderItems.length} 個項目`)
      }
      
      // 更新桌台狀態為佔用
      await supabase
        .from('tables')
        .update({ status: 'occupied' })
        .eq('table_number', orderData.table_number)
    }
    
    // 5. 檢查最終狀態
    console.log('\n📊 最終狀態檢查:')
    
    const { data: completedOrders } = await supabase
      .from('orders')
      .select('id, order_number, table_number, total_amount, status')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (completedOrders && completedOrders.length > 0) {
      console.log(`   可結帳訂單 (${completedOrders.length} 筆):`)
      completedOrders.forEach(order => {
        console.log(`   - ${order.order_number} (桌${order.table_number}) NT$ ${order.total_amount}`)
      })
    } else {
      console.log('   ⚠️ 沒有可結帳的訂單')
    }
    
    console.log('\n🎉 測試資料設置完成！')
    console.log('\n📍 下一步:')
    console.log('1. 在 App.tsx 中添加餐後結帳頁面路由')
    console.log('2. 在主導覽中添加結帳系統連結')
    console.log('3. 測試完整的結帳流程')
    
  } catch (error) {
    console.error('❌ 設置失敗:', error)
  }
}

createTestCheckoutData().then(() => process.exit(0))
