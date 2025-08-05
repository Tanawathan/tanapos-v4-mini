// 檢查餐廳ID和訂單結構
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRestaurantAndOrders() {
  console.log('🔍 檢查餐廳ID和訂單結構')
  console.log('=' .repeat(50))
  
  try {
    // 檢查餐廳資料
    console.log('📍 檢查餐廳資料:')
    const { data: restaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, is_active')
    
    if (restaurantError) {
      console.log('❌ 餐廳查詢錯誤:', restaurantError.message)
    } else {
      console.log('✅ 餐廳資料:')
      restaurants?.forEach(r => console.log(`   - ID: ${r.id}, 名稱: ${r.name}, 狀態: ${r.is_active}`))
    }
    
    // 檢查桌台資料
    console.log('\n🪑 檢查桌台資料:')
    const { data: tables, error: tableError } = await supabase
      .from('tables')
      .select('id, table_number, restaurant_id, status')
      .limit(3)
    
    if (tableError) {
      console.log('❌ 桌台查詢錯誤:', tableError.message)
    } else {
      console.log('✅ 桌台資料:')
      tables?.forEach(t => console.log(`   - ID: ${t.id}, 桌號: ${t.table_number}, 餐廳ID: ${t.restaurant_id}, 狀態: ${t.status}`))
    }
    
    // 檢查現有訂單
    console.log('\n📋 檢查現有訂單:')
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, restaurant_id, table_id, total_amount, status, created_at')
      .limit(5)
      .order('created_at', { ascending: false })
    
    if (orderError) {
      console.log('❌ 訂單查詢錯誤:', orderError.message)
    } else {
      console.log(`✅ 現有訂單: ${orders?.length} 筆`)
      orders?.forEach(o => console.log(`   - 訂單: ${o.order_number}, 餐廳ID: ${o.restaurant_id}, 桌台ID: ${o.table_id}, 金額: ${o.total_amount}, 狀態: ${o.status}`))
    }
    
    // 檢查環境變數中的餐廳ID
    console.log('\n🏪 環境變數餐廳ID:')
    const envRestaurantId = process.env.VITE_RESTAURANT_ID || process.env.RESTAURANT_ID
    console.log('RESTAURANT_ID:', envRestaurantId)
    
  } catch (e) {
    console.error('💥 檢查過程發生錯誤:', e.message)
  }
}

checkRestaurantAndOrders()
