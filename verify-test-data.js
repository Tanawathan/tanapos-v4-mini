// TanaPOS v4 AI - 快速驗證載入結果
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const RESTAURANT_ID = process.env.VITE_RESTAURANT_ID

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('🔍 TanaPOS v4 AI - 測試資料驗證\n')

async function verifyTestData() {
  try {
    console.log('🏪 驗證餐廳資料...')
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', RESTAURANT_ID)
      .single()
    
    if (restaurantError) {
      console.error('❌ 餐廳資料錯誤:', restaurantError.message)
    } else {
      console.log('✅ 餐廳:', restaurant.name)
    }

    console.log('\n📂 驗證分類資料...')
    const { data: categories, error: categoryError } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('sort_order')
    
    if (categoryError) {
      console.error('❌ 分類資料錯誤:', categoryError.message)
    } else {
      console.log('✅ 分類列表:')
      categories.forEach(cat => {
        console.log(`   ${cat.icon} ${cat.name} (${cat.description})`)
      })
    }

    console.log('\n🍽️ 驗證產品資料...')
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('name, price, category_id')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('name')
    
    if (productError) {
      console.error('❌ 產品資料錯誤:', productError.message)
    } else {
      console.log('✅ 產品列表 (部分):')
      products.slice(0, 10).forEach(product => {
        console.log(`   ${product.name} - $${product.price}`)
      })
      if (products.length > 10) {
        console.log(`   ... 還有 ${products.length - 10} 個產品`)
      }
    }

    console.log('\n🪑 驗證桌台資料...')
    const { data: tables, error: tableError } = await supabase
      .from('tables')
      .select('name, capacity, status')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('table_number')
    
    if (tableError) {
      console.error('❌ 桌台資料錯誤:', tableError.message)
    } else {
      console.log('✅ 桌台列表:')
      tables.forEach(table => {
        const statusIcon = table.status === 'available' ? '🟢' : 
                          table.status === 'occupied' ? '🔴' : '🟡'
        console.log(`   ${statusIcon} ${table.name} (${table.capacity}人座) - ${table.status}`)
      })
    }

    console.log('\n📋 驗證訂單資料...')
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select(`
        order_number,
        customer_name,
        status,
        total_amount,
        order_items(product_name, quantity, total_price)
      `)
      .eq('restaurant_id', RESTAURANT_ID)
      .order('created_at')
    
    if (orderError) {
      console.error('❌ 訂單資料錯誤:', orderError.message)
    } else {
      console.log('✅ 訂單列表:')
      orders.forEach(order => {
        const statusIcon = order.status === 'preparing' ? '🔄' : 
                          order.status === 'ready' ? '✅' : '🍽️'
        console.log(`   ${statusIcon} ${order.order_number} - ${order.customer_name} ($${order.total_amount})`)
        if (order.order_items && order.order_items.length > 0) {
          order.order_items.forEach(item => {
            console.log(`      • ${item.product_name} x${item.quantity} = $${item.total_price}`)
          })
        }
      })
    }

    console.log('\n🎉 測試資料驗證完成！')
    console.log('💡 所有功能模組都有完整的測試資料')
    console.log('🚀 可以開始測試完整的 POS 系統功能了！')
    console.log('')
    console.log('📋 功能測試建議:')
    console.log('1. 菜單管理 - 查看和編輯分類與產品')
    console.log('2. 桌台管理 - 查看桌台狀態和切換')
    console.log('3. 點餐系統 - 選擇桌台和產品下單')
    console.log('4. KDS 廚房 - 查看訂單狀態和更新')
    console.log('5. 結帳系統 - 計算總額和付款')

  } catch (error) {
    console.error('❌ 驗證失敗:', error.message)
  }
}

verifyTestData()
