// 快速診斷 Supabase 連接狀態
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function quickDiagnosis() {
  console.log('🚀 TanaPOS v4 - Supabase 連接診斷')
  console.log('=' .repeat(50))
  
  try {
    // 測試 1: 餐廳資料
    console.log('📍 測試餐廳資料...')
    const { data: restaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name, is_active')
      .limit(5)
    
    if (restaurantError) {
      console.log('❌ 餐廳資料錯誤:', restaurantError.message)
    } else {
      console.log('✅ 餐廳資料:', restaurants?.length, '筆')
      restaurants?.forEach(r => console.log(`   - ${r.name} (${r.is_active ? 'active' : 'inactive'})`))
    }
    
    // 測試 2: 分類資料
    console.log('\n📂 測試分類資料...')
    const { data: categories, error: categoryError } = await supabase
      .from('categories')
      .select('id, name, sort_order')
      .limit(5)
    
    if (categoryError) {
      console.log('❌ 分類資料錯誤:', categoryError.message)
    } else {
      console.log('✅ 分類資料:', categories?.length, '筆')
      categories?.forEach(c => console.log(`   - ${c.name} (順序: ${c.sort_order})`))
    }
    
    // 測試 3: 產品資料
    console.log('\n🍽️ 測試產品資料...')
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, name, price, is_available')
      .limit(5)
    
    if (productError) {
      console.log('❌ 產品資料錯誤:', productError.message)
    } else {
      console.log('✅ 產品資料:', products?.length, '筆')
      products?.forEach(p => console.log(`   - ${p.name} ($${p.price}) - ${p.is_available ? 'available' : 'unavailable'}`))
    }
    
    // 測試 4: 桌台資料
    console.log('\n🪑 測試桌台資料...')
    const { data: tables, error: tableError } = await supabase
      .from('tables')
      .select('id, table_number, status, table_type')
      .limit(5)
    
    if (tableError) {
      console.log('❌ 桌台資料錯誤:', tableError.message)
    } else {
      console.log('✅ 桌台資料:', tables?.length, '筆')
      tables?.forEach(t => console.log(`   - 桌號 ${t.table_number} (${t.status}) - ${t.table_type}`))
    }
    
    // 測試 5: 用戶認證
    console.log('\n🔐 測試用戶認證...')
    const { data: authData, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('❌ 認證錯誤:', authError.message)
    } else {
      console.log('✅ 認證狀態:', authData.user ? '已登入' : '未登入')
      if (authData.user) {
        console.log(`   - 用戶: ${authData.user.email}`)
      }
    }
    
    console.log('\n' + '=' .repeat(50))
    console.log('🎯 診斷完成！')
    
  } catch (e) {
    console.error('💥 診斷過程發生錯誤:', e.message)
  }
}

quickDiagnosis()
