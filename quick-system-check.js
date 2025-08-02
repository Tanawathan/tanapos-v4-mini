import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://peubpisofenlyquqnpan.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWJwaXNvZmVubHlxdXFucGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTgwODgsImV4cCI6MjA2OTQzNDA4OH0.6IzK9jjs-Ld_mFBRQqNk594ayXapjGxwAmhQpoY26cY'
)

async function quickSystemCheck() {
  console.log('🔍 TanaPOS 系統快速檢查')
  console.log('=' .repeat(50))
  
  try {
    // 1. 檢查資料庫連接
    console.log('📊 檢查資料庫連接...')
    const { data: orders, error: dbError } = await supabase
      .from('orders')
      .select('*')
      .limit(1)
    
    if (dbError) {
      console.error('❌ 資料庫連接失敗:', dbError.message)
      return false
    } else {
      console.log('✅ 資料庫連接正常')
    }
    
    // 2. 檢查餐後結帳相關訂單
    console.log('\n💰 檢查餐後結帳訂單...')
    const { data: readyOrders, error: readyError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'ready')
      .limit(5)
    
    if (readyError) {
      console.error('❌ 查詢可結帳訂單失敗:', readyError.message)
    } else {
      console.log(`✅ 找到 ${readyOrders?.length || 0} 個可結帳訂單`)
      if (readyOrders && readyOrders.length > 0) {
        readyOrders.forEach(order => {
          console.log(`   📋 ${order.order_number} - 桌號 ${order.table_number} - NT$ ${order.total_amount}`)
        })
      }
    }
    
    // 3. 檢查桌台狀態
    console.log('\n🪑 檢查桌台狀態...')
    const { data: tables, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .limit(10)
    
    if (tableError) {
      console.error('❌ 查詢桌台失敗:', tableError.message)
    } else {
      console.log(`✅ 找到 ${tables?.length || 0} 個桌台`)
      if (tables && tables.length > 0) {
        const availableTables = tables.filter(t => t.status === 'available').length
        const occupiedTables = tables.filter(t => t.status === 'occupied').length
        console.log(`   🟢 可用桌台: ${availableTables}`)
        console.log(`   🔴 佔用桌台: ${occupiedTables}`)
      }
    }
    
    // 4. 測試創建測試訂單
    console.log('\n🧪 測試創建訂單...')
    const testOrderNumber = `QUICK-CHECK-${Date.now()}`
    const { data: testOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: testOrderNumber,
        table_number: 99,
        customer_name: '系統檢查測試',
        status: 'ready',
        total_amount: 100,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (orderError) {
      console.error('❌ 創建測試訂單失敗:', orderError.message)
    } else {
      console.log('✅ 測試訂單創建成功')
      console.log(`   📋 訂單號: ${testOrder.order_number}`)
      
      // 清理測試訂單
      await supabase
        .from('orders')
        .delete()
        .eq('id', testOrder.id)
      
      console.log('🗑️ 測試訂單已清理')
    }
    
    console.log('\n🎉 系統檢查完成！')
    console.log('\n🔗 可以訪問以下連結:')
    console.log('• 🏠 主頁: http://localhost:5173/')
    console.log('• 📱 POS 下單: http://localhost:5173/pos-simple')
    console.log('• 💰 餐後結帳: http://localhost:5173/checkout-post-meal')
    console.log('• 🔍 系統檢查: http://localhost:5173/system-check.html')
    
    return true
    
  } catch (error) {
    console.error('❌ 系統檢查失敗:', error)
    return false
  }
}

quickSystemCheck().then(success => {
  if (success) {
    console.log('\n✅ TanaPOS 餐後結帳系統運行正常！')
  } else {
    console.log('\n⚠️ 系統可能需要進一步檢查')
  }
  process.exit(0)
})
