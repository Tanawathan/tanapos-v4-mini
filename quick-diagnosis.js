// 快速診斷餐後結帳訂單狀態
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://peubpisofenlyquqnpan.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWJwaXNvZmVubHlxdXFucGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTgwODgsImV4cCI6MjA2OTQzNDA4OH0.6IzK9jjs-Ld_mFBRQqNk594ayXapjGxwAmhQpoY26cY'
)

async function quickDiagnosis() {
  console.log('🩺 快速診斷餐後結帳系統\n')
  
  try {
    // 1. 檢查所有訂單
    console.log('1. 檢查所有訂單狀態...')
    const { data: allOrders, error: allError } = await supabase
      .from('orders')
      .select('id, order_number, table_number, status, payment_status, total_amount')
      .order('created_at', { ascending: false })
      .limit(10)

    if (allError) throw allError
    console.log(`   最新 ${allOrders.length} 筆訂單:`)
    allOrders.forEach(order => {
      console.log(`   - ${order.order_number}: 桌號${order.table_number}, ${order.status}/${order.payment_status}, NT$${order.total_amount}`)
    })

    // 2. 檢查可結帳訂單
    console.log('\n2. 檢查可結帳訂單 (status=completed, payment_status=unpaid)...')
    const { data: checkoutOrders, error: checkoutError } = await supabase
      .from('orders')
      .select('id, order_number, table_number, status, payment_status, total_amount')
      .eq('status', 'completed')
      .eq('payment_status', 'unpaid')

    if (checkoutError) throw checkoutError
    console.log(`   找到 ${checkoutOrders.length} 筆可結帳訂單:`)
    
    if (checkoutOrders.length === 0) {
      console.log('   ⚠️ 沒有可結帳的訂單！')
      console.log('   💡 建議執行: node create-simple-checkout-orders.js')
    } else {
      const tableNums = [...new Set(checkoutOrders.map(o => o.table_number))].sort((a,b) => a-b)
      console.log(`   桌號分布: [${tableNums.join(', ')}]`)
      checkoutOrders.forEach(order => {
        console.log(`   - ${order.order_number}: 桌號${order.table_number}, NT$${order.total_amount}`)
      })
    }

    // 3. 檢查已完成但已付款的訂單
    console.log('\n3. 檢查已付款訂單 (status=completed, payment_status=paid)...')
    const { data: paidOrders, error: paidError } = await supabase
      .from('orders')
      .select('id, order_number, table_number, status, payment_status, total_amount')
      .eq('status', 'completed')
      .eq('payment_status', 'paid')
      .limit(5)

    if (paidError) throw paidError
    console.log(`   最近 ${paidOrders.length} 筆已付款訂單:`)
    paidOrders.forEach(order => {
      console.log(`   - ${order.order_number}: 桌號${order.table_number}, NT$${order.total_amount}`)
    })

    // 4. 檢查進行中的訂單
    console.log('\n4. 檢查進行中訂單 (status!=completed)...')
    const { data: pendingOrders, error: pendingError } = await supabase
      .from('orders')
      .select('id, order_number, table_number, status, payment_status, total_amount')
      .neq('status', 'completed')
      .limit(5)

    if (pendingError) throw pendingError
    console.log(`   最近 ${pendingOrders.length} 筆進行中訂單:`)
    pendingOrders.forEach(order => {
      console.log(`   - ${order.order_number}: 桌號${order.table_number}, ${order.status}, NT$${order.total_amount}`)
    })

    // 5. 結論和建議
    console.log('\n📊 診斷結果總結:')
    console.log(`✅ 資料庫連線: 正常`)
    console.log(`📋 全部訂單: ${allOrders.length} 筆 (最新10筆)`)
    console.log(`🧾 可結帳訂單: ${checkoutOrders.length} 筆`)
    console.log(`💰 已付款訂單: ${paidOrders.length} 筆 (最新5筆)`)
    console.log(`⏳ 進行中訂單: ${pendingOrders.length} 筆 (最新5筆)`)

    if (checkoutOrders.length > 0) {
      console.log('\n🎉 系統狀態正常！')
      console.log('📍 桌號選擇應該能正常顯示以下桌號:')
      const tableNums = [...new Set(checkoutOrders.map(o => o.table_number))].sort((a,b) => a-b)
      console.log(`   [${tableNums.join(', ')}]`)
    } else {
      console.log('\n⚠️ 沒有可結帳的訂單')
      console.log('💡 需要創建測試數據: node create-simple-checkout-orders.js')
    }

  } catch (error) {
    console.error('❌ 診斷過程發生錯誤:', error)
  }
}

quickDiagnosis()
