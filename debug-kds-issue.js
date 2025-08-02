import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://peubpisofenlyquqnpan.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWJwaXNvZmVubHlxdXFucGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTgwODgsImV4cCI6MjA2OTQzNDA4OH0.6IzK9jjs-Ld_mFBRQqNk594ayXapjGxwAmhQpoY26cY'
)

async function debugKDSIssue() {
  console.log('🔧 調試 KDS 套餐顯示問題')
  console.log('=' .repeat(50))
  
  try {
    // 1. 檢查套餐示範訂單
    console.log('📋 檢查套餐示範訂單...')
    const { data: mealSetOrder } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('order_number', 'MEAL-SET-DEMO-1754124172006')
      .single()
    
    if (mealSetOrder) {
      console.log(`✅ 找到套餐訂單: ${mealSetOrder.order_number}`)
      console.log(`   狀態: ${mealSetOrder.status}`)
      console.log(`   項目: ${mealSetOrder.order_items?.length} 個`)
      
      if (mealSetOrder.order_items) {
        mealSetOrder.order_items.forEach((item, index) => {
          console.log(`\n   ${index + 1}. ${item.product_name} x${item.quantity}`)
          console.log(`      ID: ${item.id}`)
          console.log(`      Product ID: ${item.product_id || 'N/A'}`)
          console.log(`      Price: NT$ ${item.total_price}`)
          console.log(`      Status: ${item.status || 'N/A'}`)
          if (item.special_instructions) {
            console.log(`      Instructions: ${item.special_instructions}`)
          }
        })
      }
    } else {
      console.log('❌ 找不到套餐示範訂單')
    }
    
    // 2. 檢查 pending 狀態的訂單 (KDS 應該顯示的)
    console.log('\n🍳 檢查 KDS 應該顯示的訂單...')
    const { data: pendingOrders } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .in('status', ['pending', 'preparing'])
      .order('created_at', { ascending: true })
      .limit(3)
    
    if (pendingOrders && pendingOrders.length > 0) {
      console.log(`✅ 找到 ${pendingOrders.length} 個待處理訂單`)
      
      pendingOrders.forEach((order, orderIndex) => {
        console.log(`\n📋 訂單 ${orderIndex + 1}: ${order.order_number}`)
        console.log(`   狀態: ${order.status}`)
        console.log(`   桌號: ${order.table_number}`)
        
        if (order.order_items && order.order_items.length > 0) {
          order.order_items.forEach((item, itemIndex) => {
            console.log(`   ${itemIndex + 1}. ${item.product_name} x${item.quantity}`)
            // 檢查是否有異常的資料
            if (typeof item.product_name !== 'string') {
              console.log(`      ⚠️ 異常資料類型: ${typeof item.product_name}`)
              console.log(`      ⚠️ 資料內容:`, item.product_name)
            }
          })
        } else {
          console.log('   ⚠️ 無訂單項目或項目為空')
        }
      })
    } else {
      console.log('❌ 沒有找到待處理訂單')
    }
    
    // 3. 創建一個簡單的測試訂單來確認 KDS
    console.log('\n🧪 創建 KDS 測試訂單...')
    const testOrderNumber = `KDS-TEST-${Date.now()}`
    
    const { data: testOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: testOrderNumber,
        table_number: 99,
        customer_name: 'KDS測試',
        status: 'pending', // KDS 顯示狀態
        total_amount: 450,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (orderError) {
      console.error('❌ 創建測試訂單失敗:', orderError.message)
      return
    }
    
    // 添加簡單的測試項目
    const testItems = [
      {
        order_id: testOrder.id,
        product_name: '夏日套餐',
        quantity: 1,
        unit_price: 330,
        total_price: 330,
        special_instructions: '少冰',
        status: 'pending'
      },
      {
        order_id: testOrder.id,
        product_name: '美式咖啡',
        quantity: 2,
        unit_price: 60,
        total_price: 120,
        status: 'pending'
      }
    ]
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(testItems)
    
    if (itemsError) {
      console.error('❌ 添加測試項目失敗:', itemsError.message)
    } else {
      console.log(`✅ KDS 測試訂單創建成功: ${testOrderNumber}`)
      console.log('   項目:')
      testItems.forEach(item => {
        console.log(`   - ${item.product_name} x${item.quantity}`)
      })
      
      console.log('\n🔗 測試連結:')
      console.log('KDS 頁面: http://localhost:5173/kds')
      console.log(`測試訂單: ${testOrderNumber}`)
    }
    
  } catch (error) {
    console.error('調試失敗:', error)
  }
}

debugKDSIssue().then(() => {
  console.log('\n✅ KDS 調試完成')
  process.exit(0)
})
