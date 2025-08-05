// TanaPOS V4 AI - API功能測試腳本
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'
const RESTAURANT_ID = '11111111-1111-1111-1111-111111111111'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('🚀 TanaPOS v4 AI - API功能測試\n')

// 測試餐廳資料
async function testRestaurantData() {
  console.log('📍 測試餐廳資料...')
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .limit(3)
    
    if (error) {
      console.log('❌ 餐廳資料錯誤:', error.message)
      return false
    }
    
    console.log(`✅ 餐廳資料正常 (${data.length} 筆)`)
    if (data.length > 0) {
      console.log(`   第一筆: ${data[0].name}`)
    }
    return true
  } catch (err) {
    console.log('❌ 餐廳資料異常:', err.message)
    return false
  }
}

// 測試分類資料
async function testCategoryData() {
  console.log('📂 測試菜單分類...')
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .limit(5)
    
    if (error) {
      console.log('❌ 分類資料錯誤:', error.message)
      return false
    }
    
    console.log(`✅ 分類資料正常 (${data.length} 筆)`)
    if (data.length > 0) {
      console.log(`   分類: ${data.map(c => c.name).join(', ')}`)
    }
    return true
  } catch (err) {
    console.log('❌ 分類資料異常:', err.message)
    return false
  }
}

// 測試產品資料
async function testProductData() {
  console.log('🍽️ 測試產品資料...')
  try {
    const { data, error } = await supabase
      .from('products')
      .select('name, price, category_id')
      .eq('restaurant_id', RESTAURANT_ID)
      .limit(5)
    
    if (error) {
      console.log('❌ 產品資料錯誤:', error.message)
      return false
    }
    
    console.log(`✅ 產品資料正常 (${data.length} 筆)`)
    if (data.length > 0) {
      console.log(`   產品: ${data[0].name} - $${data[0].price}`)
    }
    return true
  } catch (err) {
    console.log('❌ 產品資料異常:', err.message)
    return false
  }
}

// 測試桌台資料
async function testTableData() {
  console.log('🪑 測試桌台資料...')
  try {
    const { data, error } = await supabase
      .from('tables')
      .select('table_number, capacity, status')
      .eq('restaurant_id', RESTAURANT_ID)
      .limit(5)
    
    if (error) {
      console.log('❌ 桌台資料錯誤:', error.message)
      return false
    }
    
    console.log(`✅ 桌台資料正常 (${data.length} 筆)`)
    if (data.length > 0) {
      console.log(`   桌台: ${data.map(t => `${t.table_number}號(${t.status})`).join(', ')}`)
    }
    return true
  } catch (err) {
    console.log('❌ 桌台資料異常:', err.message)
    return false
  }
}

// 測試訂單資料
async function testOrderData() {
  console.log('📋 測試訂單資料...')
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('order_number, status, total_amount')
      .eq('restaurant_id', RESTAURANT_ID)
      .limit(3)
    
    if (error) {
      console.log('❌ 訂單資料錯誤:', error.message)
      return false
    }
    
    console.log(`✅ 訂單資料正常 (${data.length} 筆)`)
    if (data.length > 0) {
      console.log(`   訂單: ${data[0].order_number} - $${data[0].total_amount}`)
    }
    return true
  } catch (err) {
    console.log('❌ 訂單資料異常:', err.message)
    return false
  }
}

// 測試即時連線功能
async function testRealtimeConnection() {
  console.log('⚡ 測試即時連線...')
  try {
    const channel = supabase.channel('test-channel')
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        channel.unsubscribe()
        reject(new Error('連線逾時'))
      }, 5000)
      
      channel
        .on('presence', { event: 'sync' }, () => {
          clearTimeout(timeout)
          channel.unsubscribe()
          console.log('✅ 即時連線正常')
          resolve()
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ user: 'test' })
          }
        })
    })
    
    return true
  } catch (err) {
    console.log('❌ 即時連線異常:', err.message)
    return false
  }
}

// 執行所有測試
async function runAllTests() {
  const tests = [
    testRestaurantData,
    testCategoryData,
    testProductData,
    testTableData,
    testOrderData,
    testRealtimeConnection
  ]
  
  let passedTests = 0
  
  for (const test of tests) {
    try {
      const result = await test()
      if (result) passedTests++
    } catch (err) {
      console.log('❌ 測試執行失敗:', err.message)
    }
    console.log('')
  }
  
  console.log('📊 測試結果總結:')
  console.log(`✅ 通過: ${passedTests}/${tests.length} 項測試`)
  
  if (passedTests === tests.length) {
    console.log('🎉 所有API測試通過！資料庫運作正常')
  } else {
    console.log('⚠️  部分測試失敗，請檢查相關功能')
  }
}

runAllTests().catch(console.error)
