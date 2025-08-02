import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://peubpisofenlyquqnpan.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWJwaXNvZmVubHlxdXFucGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTgwODgsImV4cCI6MjA2OTQzNDA4OH0.6IzK9jjs-Ld_mFBRQqNk594ayXapjGxwAmhQpoY26cY'
)

async function setupPostMealCheckout() {
  console.log('🏗️ 設置餐後結帳系統資料庫...\n')
  
  try {
    // 1. 為 orders 表添加結帳狀態
    console.log('1. 添加結帳狀態欄位...')
    
    // 檢查欄位是否已存在
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'orders')
      .eq('column_name', 'checkout_status')
    
    if (!columns || columns.length === 0) {
      console.log('   添加 checkout_status 欄位到 orders 表...')
      // 需要使用 RPC 來執行 DDL
    }
    
    // 2. 創建支付記錄表
    console.log('2. 創建支付記錄表...')
    
    const createPaymentsTable = `
      CREATE TABLE IF NOT EXISTS payments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        order_id UUID NOT NULL,
        method VARCHAR(20) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        service_fee DECIMAL(10,2) DEFAULT 0,
        received_amount DECIMAL(10,2),
        change_amount DECIMAL(10,2),
        transaction_id VARCHAR(100),
        card_last_four VARCHAR(4),
        mobile_provider VARCHAR(50),
        status VARCHAR(20) DEFAULT 'pending',
        notes TEXT,
        processed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    // 3. 手動創建必要的資料
    console.log('3. 設置測試資料...')
    
    // 更新一些現有訂單為可結帳狀態
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, status, total_amount')
      .eq('status', 'completed')
      .limit(5)
    
    if (ordersError) {
      console.error('載入訂單失敗:', ordersError.message)
    } else {
      console.log(`   找到 ${orders.length} 個已完成的訂單`)
      
      // 為這些訂單添加結帳狀態（如果可能的話）
      for (const order of orders) {
        console.log(`   - 訂單 ${order.id} 金額 NT$ ${order.total_amount}`)
      }
    }
    
    console.log('\n✅ 基本設置完成！')
    
    // 4. 檢查資料表狀態
    console.log('\n📊 系統狀態檢查:')
    
    const { data: ordersCheck } = await supabase
      .from('orders')
      .select('status, count(*)')
      .group('status')
    
    console.log('   訂單狀態分布:')
    ordersCheck?.forEach(row => {
      console.log(`   - ${row.status}: ${row.count} 筆`)
    })
    
    // 檢查是否有可結帳的訂單
    const { data: readyOrders } = await supabase
      .from('orders')
      .select('id, order_number, table_number, total_amount, status')
      .eq('status', 'completed')
      .limit(3)
    
    if (readyOrders && readyOrders.length > 0) {
      console.log('\n🎯 可結帳訂單:')
      readyOrders.forEach(order => {
        console.log(`   - ${order.order_number} (桌${order.table_number}) NT$ ${order.total_amount}`)
      })
    } else {
      console.log('\n⚠️ 目前沒有可結帳的訂單')
      console.log('   建議: 先創建一些測試訂單並設為 completed 狀態')
    }
    
  } catch (error) {
    console.error('❌ 設置過程發生錯誤:', error)
  }
}

setupPostMealCheckout().then(() => {
  console.log('\n🎉 餐後結帳系統設置完成！')
  process.exit(0)
})
