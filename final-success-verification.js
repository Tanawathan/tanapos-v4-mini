// TanaPOS v4 AI - 最終成功驗證
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const RESTAURANT_ID = process.env.VITE_RESTAURANT_ID

// 使用 Service Role Key 確保完整權限
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🎉 TanaPOS v4 AI - 最終成功驗證\n')

async function finalSuccessVerification() {
  try {
    console.log('🔍 使用 Service Role Key 進行完整驗證...\n')

    // 驗證餐廳資料
    console.log('🏪 === 餐廳資料 ===')
    const { data: restaurant, error: restError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', RESTAURANT_ID)
      .single()

    if (restError) {
      console.log('❌ 餐廳資料:', restError.message)
    } else if (restaurant) {
      console.log('✅ 餐廳資料: 已載入')
      console.log(`   名稱: ${restaurant.name}`)
      console.log(`   地址: ${restaurant.address}`)
      console.log(`   稅率: ${restaurant.tax_rate * 100}%`)
      console.log(`   服務費: ${restaurant.service_charge_rate * 100}%`)
    } else {
      console.log('❌ 餐廳資料: 未找到')
    }

    // 驗證分類資料
    console.log('\n📂 === 分類資料 ===')
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('name, icon, color')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('sort_order')

    if (catError) {
      console.log('❌ 分類資料:', catError.message)
    } else if (categories && categories.length > 0) {
      console.log(`✅ 分類資料: ${categories.length} 筆`)
      categories.forEach(cat => {
        console.log(`   ${cat.icon} ${cat.name}`)
      })
    } else {
      console.log('❌ 分類資料: 無資料')
    }

    // 驗證產品資料
    console.log('\n🍽️ === 產品資料 ===')
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('name, price, sku, ai_recommended, ai_popularity_score')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('name')

    if (prodError) {
      console.log('❌ 產品資料:', prodError.message)
    } else if (products && products.length > 0) {
      console.log(`✅ 產品資料: ${products.length} 筆`)
      products.forEach(product => {
        const aiIcon = product.ai_recommended ? '🤖' : '   '
        const score = product.ai_popularity_score ? `(${Math.round(product.ai_popularity_score * 100)}%)` : ''
        console.log(`   ${aiIcon} ${product.name} - $${product.price} ${score}`)
      })
    } else {
      console.log('❌ 產品資料: 無資料')
    }

    // 驗證桌台資料
    console.log('\n🪑 === 桌台資料 ===')
    const { data: tables, error: tableError } = await supabase
      .from('tables')
      .select('name, capacity, status')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('table_number')

    if (tableError) {
      console.log('❌ 桌台資料:', tableError.message)
    } else if (tables && tables.length > 0) {
      console.log(`✅ 桌台資料: ${tables.length} 筆`)
      tables.forEach(table => {
        const statusIcon = table.status === 'available' ? '🟢' : 
                          table.status === 'occupied' ? '🔴' : '🟡'
        console.log(`   ${statusIcon} ${table.name} (${table.capacity}人) - ${table.status}`)
      })
    } else {
      console.log('❌ 桌台資料: 無資料')
    }

    // 驗證訂單資料
    console.log('\n📋 === 訂單資料 ===')
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('order_number, customer_name, status, total_amount')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('created_at', { ascending: false })

    if (orderError) {
      console.log('❌ 訂單資料:', orderError.message)
    } else if (orders && orders.length > 0) {
      console.log(`✅ 訂單資料: ${orders.length} 筆`)
      orders.forEach(order => {
        const statusIcon = order.status === 'preparing' ? '🔄' : 
                          order.status === 'ready' ? '✅' : '🍽️'
        console.log(`   ${statusIcon} ${order.order_number} - ${order.customer_name} ($${order.total_amount})`)
      })
    } else {
      console.log('❌ 訂單資料: 無資料')
    }

    // 驗證供應商資料
    console.log('\n🏢 === 供應商資料 ===')
    const { data: suppliers, error: supplierError } = await supabase
      .from('suppliers')
      .select('name, contact_person, phone')
      .eq('restaurant_id', RESTAURANT_ID)

    if (supplierError) {
      console.log('❌ 供應商資料:', supplierError.message)
    } else if (suppliers && suppliers.length > 0) {
      console.log(`✅ 供應商資料: ${suppliers.length} 筆`)
      suppliers.forEach(supplier => {
        console.log(`   ${supplier.name} - ${supplier.contact_person} (${supplier.phone})`)
      })
    } else {
      console.log('❌ 供應商資料: 無資料')
    }

    // 檢查系統完整性
    console.log('\n🎯 === 系統完整性檢查 ===')
    let totalRecords = 0
    let successModules = 0

    const checks = [
      { name: '餐廳', data: restaurant ? 1 : 0 },
      { name: '分類', data: categories?.length || 0 },
      { name: '產品', data: products?.length || 0 },
      { name: '桌台', data: tables?.length || 0 },
      { name: '訂單', data: orders?.length || 0 },
      { name: '供應商', data: suppliers?.length || 0 }
    ]

    checks.forEach(check => {
      totalRecords += check.data
      if (check.data > 0) {
        successModules++
        console.log(`✅ ${check.name}: ${check.data} 筆`)
      } else {
        console.log(`❌ ${check.name}: 0 筆`)
      }
    })

    console.log('\n🎉 === 最終報告 ===')
    console.log(`📊 總計載入記錄: ${totalRecords} 筆`)
    console.log(`📋 成功模組數: ${successModules}/6`)
    
    if (successModules >= 4) {
      console.log('🚀 系統狀態: 可以開始測試！')
      console.log('💡 建議操作:')
      console.log('   1. 執行 npm run dev')
      console.log('   2. 開啟 http://localhost:5177')
      console.log('   3. 測試各個功能模組')
      
      if (products && products.length > 0) {
        console.log('\n🎯 可測試的功能:')
        console.log('   📂 菜單管理 - 分類與產品展示')
        console.log('   🪑 桌台管理 - 桌台狀態管理')
        if (orders && orders.length > 0) {
          console.log('   📋 訂單管理 - 現有訂單處理')
          console.log('   🍳 KDS 系統 - 廚房顯示功能')
        }
        console.log('   🛒 點餐系統 - 新增訂單功能')
        console.log('   ⚙️ 設定頁面 - 系統配置')
      }
    } else {
      console.log('⚠️  系統狀態: 需要載入更多測試資料')
      console.log('💡 建議先執行: node load-final-complete-data.js')
    }

  } catch (error) {
    console.error('❌ 驗證失敗:', error.message)
  }
}

finalSuccessVerification()
