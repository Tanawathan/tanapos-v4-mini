import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://peubpisofenlyquqnpan.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWJwaXNvZmVubHlxdXFucGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTgwODgsImV4cCI6MjA2OTQzNDA4OH0.6IzK9jjs-Ld_mFBRQqNk594ayXapjGxwAmhQpoY26cY'
)

async function analyzeMealSets() {
  console.log('🍽️ 分析套餐訂單辨識問題')
  console.log('=' .repeat(50))
  
  try {
    // 1. 檢查產品表結構
    console.log('📊 檢查產品表結構...')
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .limit(5)
    
    if (prodError) {
      console.error('產品表查詢錯誤:', prodError.message)
    } else if (products && products.length > 0) {
      console.log('產品表欄位:', Object.keys(products[0]))
      
      // 查找套餐相關產品
      const mealSets = products.filter(p => 
        p.name?.includes('套餐') || 
        p.category?.includes('套餐') ||
        p.description?.includes('套餐')
      )
      
      console.log(`找到 ${mealSets.length} 個套餐產品:`)
      mealSets.forEach(p => {
        console.log(`  - ${p.name} (類別: ${p.category || 'N/A'})`)
      })
    }
    
    // 2. 檢查訂單項目表結構
    console.log('\n📋 檢查訂單項目表結構...')
    const { data: orderItems, error: itemError } = await supabase
      .from('order_items')
      .select('*')
      .limit(5)
    
    if (itemError) {
      console.error('訂單項目表查詢錯誤:', itemError.message)
    } else if (orderItems && orderItems.length > 0) {
      console.log('訂單項目表欄位:', Object.keys(orderItems[0]))
      
      // 查找套餐相關訂單項目
      const { data: mealSetItems } = await supabase
        .from('order_items')
        .select('*')
        .ilike('product_name', '%套餐%')
        .limit(10)
      
      console.log(`\n找到 ${mealSetItems?.length || 0} 個套餐訂單項目:`)
      mealSetItems?.forEach(item => {
        console.log(`  - ${item.product_name} x${item.quantity} = NT$ ${item.total_price}`)
        if (item.special_instructions) {
          console.log(`    備註: ${item.special_instructions}`)
        }
      })
    }
    
    // 3. 檢查具體的套餐訂單
    console.log('\n🔍 檢查最近的訂單與套餐關聯...')
    const { data: ordersWithItems } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('status', 'ready')
      .limit(3)
    
    if (ordersWithItems) {
      ordersWithItems.forEach(order => {
        console.log(`\n訂單 ${order.order_number}:`)
        console.log(`  桌號: ${order.table_number}`)
        console.log(`  總金額: NT$ ${order.total_amount}`)
        console.log(`  項目數量: ${order.order_items?.length || 0}`)
        
        if (order.order_items) {
          order.order_items.forEach(item => {
            const isMealSet = item.product_name?.includes('套餐')
            const indicator = isMealSet ? '🍽️' : '🍴'
            console.log(`    ${indicator} ${item.product_name} x${item.quantity} - NT$ ${item.total_price}`)
            
            if (item.special_instructions) {
              console.log(`      備註: ${item.special_instructions}`)
            }
          })
        }
      })
    }
    
    // 4. 分析套餐辨識問題
    console.log('\n🎯 套餐辨識問題分析:')
    
    // 檢查是否有類別標記
    const { data: allItems } = await supabase
      .from('order_items')
      .select('*')
      .limit(20)
    
    if (allItems) {
      const hasCategory = allItems.some(item => item.category_id || item.category)
      const hasMealSetFlag = allItems.some(item => item.is_meal_set || item.meal_set_id)
      
      console.log(`  - 訂單項目是否有類別標記: ${hasCategory ? '✅' : '❌'}`)
      console.log(`  - 訂單項目是否有套餐標記: ${hasMealSetFlag ? '✅' : '❌'}`)
      
      // 檢查套餐相關欄位
      if (allItems.length > 0) {
        const sampleItem = allItems[0]
        const itemFields = Object.keys(sampleItem)
        
        console.log('\n  可能的套餐相關欄位:')
        itemFields.forEach(field => {
          if (field.includes('meal') || field.includes('set') || field.includes('category')) {
            console.log(`    - ${field}: ${sampleItem[field] || 'null'}`)
          }
        })
      }
    }
    
  } catch (error) {
    console.error('分析失敗:', error)
  }
}

analyzeMealSets().then(() => {
  console.log('\n✅ 套餐分析完成')
  process.exit(0)
})
