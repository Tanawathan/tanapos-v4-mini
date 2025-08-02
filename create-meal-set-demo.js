import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://peubpisofenlyquqnpan.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWJwaXNvZmVubHlxdXFucGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTgwODgsImV4cCI6MjA2OTQzNDA4OH0.6IzK9jjs-Ld_mFBRQqNk594ayXapjGxwAmhQpoY26cY'
)

async function createMealSetDemo() {
  console.log('🍽️ 創建套餐展示訂單')
  console.log('=' .repeat(50))
  
  try {
    // 創建展示用訂單
    const demoOrderNumber = `MEAL-SET-DEMO-${Date.now()}`
    const { data: demoOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: demoOrderNumber,
        table_number: 8,
        customer_name: '套餐展示客戶',
        status: 'ready',
        total_amount: 980,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (orderError) {
      console.error('❌ 創建展示訂單失敗:', orderError.message)
      return
    }
    
    console.log(`✅ 展示訂單創建成功: ${demoOrderNumber}`)
    
    // 添加各種套餐和一般商品
    const demoItems = [
      // 套餐商品
      {
        order_id: demoOrder.id,
        product_id: '341f04b7-b3ae-42c7-96a6-fab33ed8c848',
        product_name: '夏日套餐',
        quantity: 1,
        unit_price: 330,
        total_price: 330,
        special_instructions: '少冰，不要番茄',
        status: 'ready'
      },
      {
        order_id: demoOrder.id,
        product_id: '550e8400-e29b-41d4-a716-446655440001',
        product_name: '夏日特色套餐',
        quantity: 1,
        unit_price: 380,
        total_price: 380,
        special_instructions: '加辣醬',
        status: 'ready'
      },
      {
        order_id: demoOrder.id,
        product_id: '550e8400-e29b-41d4-a716-446655440002',
        product_name: '輕食套餐',
        quantity: 1,
        unit_price: 250,
        total_price: 250,
        status: 'ready'
      },
      // 一般商品
      {
        order_id: demoOrder.id,
        product_name: '美式咖啡',
        quantity: 1,
        unit_price: 120,
        total_price: 120,
        status: 'ready'
      }
    ]
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(demoItems)
    
    if (itemsError) {
      console.error('❌ 添加展示項目失敗:', itemsError.message)
    } else {
      console.log('✅ 展示項目添加成功:')
      
      let mealSetCount = 0
      let regularCount = 0
      
      demoItems.forEach(item => {
        const isMealSet = item.product_name.includes('套餐')
        const icon = isMealSet ? '🍽️' : '🍴'
        const badge = isMealSet ? '[套餐]' : '[一般]'
        
        if (isMealSet) mealSetCount++
        else regularCount++
        
        console.log(`   ${icon} ${item.product_name} x${item.quantity} ${badge} - NT$ ${item.total_price}`)
        if (item.special_instructions) {
          console.log(`      📝 ${item.special_instructions}`)
        }
      })
      
      console.log(`\n📊 訂單統計:`)
      console.log(`   🍽️ 套餐商品: ${mealSetCount} 個`)
      console.log(`   🍴 一般商品: ${regularCount} 個`)
      console.log(`   💰 總金額: NT$ ${demoOrder.total_amount}`)
    }
    
    console.log(`\n🎯 展示功能:`)
    console.log('✅ 套餐商品顯示橙色標記')
    console.log('✅ 套餐使用 🍽️ 圖標')
    console.log('✅ 一般商品使用 🍴 圖標')
    console.log('✅ 訂單列表顯示「含套餐」標記')
    console.log('✅ 備註資訊完整顯示')
    
    console.log(`\n🔗 測試連結:`)
    console.log('💰 餐後結帳頁面: http://localhost:5173/checkout-post-meal')
    console.log(`📋 訂單編號: ${demoOrderNumber}`)
    console.log(`🪑 桌號: ${demoOrder.table_number}`)
    
    console.log(`\n📝 測試步驟:`)
    console.log('1. 開啟餐後結帳頁面')
    console.log('2. 找到桌號 8 的訂單（應該顯示「含套餐 🍽️」標記）')
    console.log('3. 點擊選擇該訂單')
    console.log('4. 查看訂單詳情中的套餐標記')
    console.log('5. 進行結帳流程測試')
    
  } catch (error) {
    console.error('❌ 創建展示訂單失敗:', error)
  }
}

createMealSetDemo().then(() => {
  console.log('\n🎊 套餐展示訂單創建完成！')
  console.log('現在可以測試套餐辨識功能了！')
  process.exit(0)
})
