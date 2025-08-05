// 驗證資料庫中的訂單資料
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyOrderData() {
  console.log('🔍 驗證資料庫中的訂單資料')
  console.log('=' .repeat(50))
  
  try {
    // 查詢最近的訂單
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
      
    if (ordersError) {
      console.log('❌ 查詢訂單失敗:', ordersError)
      return
    }
    
    console.log(`✅ 找到 ${orders.length} 個最近的訂單:`)
    orders.forEach((order, index) => {
      console.log(`\n${index + 1}. 訂單 ${order.order_number}`)
      console.log(`   - ID: ${order.id}`)
      console.log(`   - 餐廳ID: ${order.restaurant_id}`)
      console.log(`   - 桌台ID: ${order.table_id}`)
      console.log(`   - 桌號: ${order.table_number}`)
      console.log(`   - 人數: ${order.party_size}`)
      console.log(`   - 總金額: NT$ ${order.total_amount}`)
      console.log(`   - 狀態: ${order.status}`)
      console.log(`   - 建立時間: ${order.created_at}`)
      console.log(`   - 備註: ${order.notes || '無'}`)
    })
    
    // 查詢訂單項目
    if (orders.length > 0) {
      const latestOrderId = orders[0].id
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', latestOrderId)
        
      if (itemsError) {
        console.log('❌ 查詢訂單項目失敗:', itemsError)
      } else {
        console.log(`\n📋 最新訂單 (${orders[0].order_number}) 的項目:`)
        items.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.product_name} x ${item.quantity}`)
          console.log(`      - 單價: NT$ ${item.unit_price}`)
          console.log(`      - 小計: NT$ ${item.total_price}`)
          console.log(`      - 特殊要求: ${item.special_instructions || '無'}`)
        })
      }
    }
    
    // 查詢桌台狀態
    const { data: tables, error: tablesError } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', '11111111-1111-1111-1111-111111111111')
      .eq('status', 'occupied')
      
    if (tablesError) {
      console.log('❌ 查詢桌台失敗:', tablesError)
    } else {
      console.log(`\n🪑 目前佔用的桌台 (${tables.length} 桌):`)
      tables.forEach(table => {
        console.log(`   - 桌號 ${table.table_number} (${table.name})`)
        console.log(`     狀態: ${table.status}`)
        console.log(`     最後佔用時間: ${table.last_occupied_at}`)
      })
    }
    
  } catch (error) {
    console.log('❌ 驗證失敗:', error)
  }
}

verifyOrderData()
