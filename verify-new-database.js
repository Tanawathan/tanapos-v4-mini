// TanaPOS V4 AI - 新資料庫驗證腳本
import { createClient } from '@supabase/supabase-js'

console.log('🚀 TanaPOS V4 AI - 新建資料庫驗證測試\n')

// 請在這裡填入您的 Supabase 專案資訊
const supabaseUrl = 'https://[your-project-ref].supabase.co'  // 替換為您的專案URL
const supabaseAnonKey = '[your-anon-key]'  // 替換為您的anon key

// 如果已經設定環境變數，可以使用以下方式：
// const supabaseUrl = process.env.VITE_SUPABASE_URL
// const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 測試資料庫連線
async function testConnection() {
  console.log('🔗 測試資料庫連線...')
  try {
    const { data, error } = await supabase.from('restaurants').select('count').single()
    
    if (error) {
      console.log('❌ 連線失敗:', error.message)
      return false
    }
    
    console.log('✅ 資料庫連線正常')
    return true
  } catch (err) {
    console.log('❌ 連線異常:', err.message)
    return false
  }
}

// 測試示範資料
async function testDemoData() {
  console.log('📊 檢查示範資料...')
  
  const tests = [
    { table: 'restaurants', name: '餐廳' },
    { table: 'categories', name: '分類' },
    { table: 'products', name: '產品' },
    { table: 'tables', name: '桌台' }
  ]
  
  let allPassed = true
  
  for (const test of tests) {
    try {
      const { data, error } = await supabase
        .from(test.table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`❌ ${test.name}資料表錯誤:`, error.message)
        allPassed = false
      } else {
        console.log(`✅ ${test.name}資料表正常 (${data.length} 筆示範資料)`)
      }
    } catch (err) {
      console.log(`❌ ${test.name}資料表異常:`, err.message)
      allPassed = false
    }
  }
  
  return allPassed
}

// 測試基本功能
async function testBasicFunctions() {
  console.log('⚡ 測試基本功能...')
  
  try {
    // 測試讀取餐廳資料
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id, name')
      .limit(1)
      .single()
    
    if (restaurant) {
      console.log(`✅ 可以讀取餐廳資料: ${restaurant.name}`)
      
      // 測試讀取分類資料
      const { data: categories } = await supabase
        .from('categories')
        .select('name')
        .eq('restaurant_id', restaurant.id)
      
      console.log(`✅ 可以讀取分類資料: ${categories.map(c => c.name).join(', ')}`)
      
      // 測試讀取產品資料
      const { data: products } = await supabase
        .from('products')
        .select('name, price')
        .eq('restaurant_id', restaurant.id)
        .limit(3)
      
      console.log(`✅ 可以讀取產品資料: ${products.length} 項產品`)
      
      // 測試讀取桌台資料
      const { data: tables } = await supabase
        .from('tables')
        .select('table_number, status')
        .eq('restaurant_id', restaurant.id)
      
      console.log(`✅ 可以讀取桌台資料: ${tables.length} 張桌台`)
      
      return true
    }
    
    return false
  } catch (err) {
    console.log('❌ 基本功能測試失敗:', err.message)
    return false
  }
}

// 測試新增訂單功能
async function testOrderCreation() {
  console.log('📝 測試訂單建立功能...')
  
  try {
    // 取得餐廳和桌台資訊
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1)
      .single()
    
    const { data: table } = await supabase
      .from('tables')
      .select('id')
      .eq('restaurant_id', restaurant.id)
      .limit(1)
      .single()
    
    // 建立測試訂單
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurant.id,
        table_id: table.id,
        order_number: 'TEST-' + Date.now(),
        customer_name: '測試客戶',
        order_type: 'dine_in',
        status: 'pending'
      })
      .select()
      .single()
    
    if (orderError) {
      console.log('❌ 訂單建立失敗:', orderError.message)
      return false
    }
    
    console.log('✅ 成功建立測試訂單:', order.order_number)
    
    // 刪除測試訂單
    await supabase.from('orders').delete().eq('id', order.id)
    console.log('✅ 成功清理測試資料')
    
    return true
  } catch (err) {
    console.log('❌ 訂單測試失敗:', err.message)
    return false
  }
}

// 執行所有測試
async function runAllTests() {
  console.log('開始執行資料庫驗證測試...\n')
  
  const tests = [
    { name: '資料庫連線', fn: testConnection },
    { name: '示範資料', fn: testDemoData },
    { name: '基本功能', fn: testBasicFunctions },
    { name: '訂單功能', fn: testOrderCreation }
  ]
  
  let passedTests = 0
  
  for (const test of tests) {
    try {
      const result = await test.fn()
      if (result) passedTests++
    } catch (err) {
      console.log(`❌ ${test.name}測試執行失敗:`, err.message)
    }
    console.log('')
  }
  
  console.log('📊 測試結果總結:')
  console.log(`✅ 通過: ${passedTests}/${tests.length} 項測試`)
  
  if (passedTests === tests.length) {
    console.log('\n🎉 所有測試通過！您的 Supabase 資料庫已準備就緒')
    console.log('💡 現在可以啟動應用程式: npm run dev')
  } else {
    console.log('\n⚠️  部分測試失敗，請檢查：')
    console.log('1. Supabase 專案是否正確建立')
    console.log('2. 資料庫架構是否完整執行')
    console.log('3. API Key 是否正確設定')
  }
}

// 檢查設定
if (supabaseUrl.includes('[your-project-ref]') || supabaseAnonKey.includes('[your-anon-key]')) {
  console.log('⚠️  請先設定您的 Supabase 專案資訊:')
  console.log('1. 將 supabaseUrl 替換為您的專案 URL')
  console.log('2. 將 supabaseAnonKey 替換為您的 anon key')
  console.log('3. 或設定環境變數 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY')
} else {
  runAllTests().catch(console.error)
}
