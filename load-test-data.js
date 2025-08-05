// TanaPOS v4 AI - 完整測試資料載入腳本
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'
const RESTAURANT_ID = '11111111-1111-1111-1111-111111111111'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('🚀 TanaPOS v4 AI - 完整測試資料載入\n')

async function loadTestData() {
  try {
    // 1. 確認餐廳存在
    console.log('🏪 檢查餐廳資料...')
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', RESTAURANT_ID)
      .single()
    
    if (!restaurant) {
      console.log('📝 建立示範餐廳...')
      await supabase.from('restaurants').insert({
        id: RESTAURANT_ID,
        name: 'TanaPOS 示範餐廳',
        address: '台北市信義區信義路五段7號',
        phone: '02-1234-5678',
        email: 'demo@tanapos.com',
        tax_rate: 0.05,
        currency: 'TWD',
        timezone: 'Asia/Taipei'
      })
    }
    console.log('✅ 餐廳資料確認')

    // 2. 載入分類資料
    console.log('📂 載入分類資料...')
    const categories = [
      {
        id: 'cat-1111-1111-1111-111111111111',
        restaurant_id: RESTAURANT_ID,
        name: '主餐',
        description: '主要餐點',
        sort_order: 1,
        color: '#3B82F6',
        icon: '🍽️'
      },
      {
        id: 'cat-2222-2222-2222-222222222222', 
        restaurant_id: RESTAURANT_ID,
        name: '飲品',
        description: '各式飲品',
        sort_order: 2,
        color: '#10B981',
        icon: '🥤'
      },
      {
        id: 'cat-3333-3333-3333-333333333333',
        restaurant_id: RESTAURANT_ID,
        name: '甜點',
        description: '精緻甜點',
        sort_order: 3,
        color: '#F59E0B',
        icon: '🍰'
      },
      {
        id: 'cat-4444-4444-4444-444444444444',
        restaurant_id: RESTAURANT_ID,
        name: '前菜',
        description: '開胃小菜',
        sort_order: 4,
        color: '#EF4444',
        icon: '🥗'
      }
    ]

    for (const category of categories) {
      await supabase.from('categories').upsert(category)
    }
    console.log('✅ 分類資料載入完成')

    // 3. 載入產品資料
    console.log('🍽️ 載入產品資料...')
    const products = [
      {
        id: 'prod-1111-1111-1111-111111111111',
        restaurant_id: RESTAURANT_ID,
        category_id: 'cat-1111-1111-1111-111111111111',
        name: '招牌牛肉麵',
        description: '經典台式牛肉麵，湯頭濃郁',
        price: 180,
        cost: 80,
        preparation_time: 15,
        is_available: true
      },
      {
        id: 'prod-2222-2222-2222-222222222222',
        restaurant_id: RESTAURANT_ID,
        category_id: 'cat-1111-1111-1111-111111111111',
        name: '滷肉飯',
        description: '傳統台式滷肉飯',
        price: 80,
        cost: 35,
        preparation_time: 8,
        is_available: true
      },
      {
        id: 'prod-3333-3333-3333-333333333333',
        restaurant_id: RESTAURANT_ID,
        category_id: 'cat-1111-1111-1111-111111111111',
        name: '炒飯',
        description: '香噴噴炒飯',
        price: 120,
        cost: 50,
        preparation_time: 12,
        is_available: true
      },
      {
        id: 'prod-4444-4444-4444-444444444444',
        restaurant_id: RESTAURANT_ID,
        category_id: 'cat-2222-2222-2222-222222222222',
        name: '古早味紅茶',
        description: '香濃古早味紅茶',
        price: 30,
        cost: 8,
        preparation_time: 3,
        is_available: true
      },
      {
        id: 'prod-5555-5555-5555-555555555555',
        restaurant_id: RESTAURANT_ID,
        category_id: 'cat-2222-2222-2222-222222222222',
        name: '檸檬汽水',
        description: '清爽檸檬汽水',
        price: 40,
        cost: 12,
        preparation_time: 2,
        is_available: true
      },
      {
        id: 'prod-6666-6666-6666-666666666666',
        restaurant_id: RESTAURANT_ID,
        category_id: 'cat-3333-3333-3333-333333333333',
        name: '巧克力蛋糕',
        description: '濃郁巧克力蛋糕',
        price: 120,
        cost: 45,
        preparation_time: 5,
        is_available: true
      },
      {
        id: 'prod-7777-7777-7777-777777777777',
        restaurant_id: RESTAURANT_ID,
        category_id: 'cat-4444-4444-4444-444444444444',
        name: '涼拌小黃瓜',
        description: '清爽涼拌小黃瓜',
        price: 60,
        cost: 20,
        preparation_time: 5,
        is_available: true
      }
    ]

    for (const product of products) {
      await supabase.from('products').upsert(product)
    }
    console.log('✅ 產品資料載入完成')

    // 4. 載入桌台資料
    console.log('🪑 載入桌台資料...')
    const tables = [
      {
        id: 'table-1111-1111-1111-111111111111',
        restaurant_id: RESTAURANT_ID,
        table_number: 1,
        name: 'A01',
        capacity: 4,
        status: 'available'
      },
      {
        id: 'table-2222-2222-2222-222222222222',
        restaurant_id: RESTAURANT_ID,
        table_number: 2,
        name: 'A02', 
        capacity: 4,
        status: 'available'
      },
      {
        id: 'table-3333-3333-3333-333333333333',
        restaurant_id: RESTAURANT_ID,
        table_number: 3,
        name: 'A03',
        capacity: 6,
        status: 'occupied'
      },
      {
        id: 'table-4444-4444-4444-444444444444',
        restaurant_id: RESTAURANT_ID,
        table_number: 4,
        name: 'B01',
        capacity: 2,
        status: 'available'
      },
      {
        id: 'table-5555-5555-5555-555555555555',
        restaurant_id: RESTAURANT_ID,
        table_number: 5,
        name: 'B02',
        capacity: 4,
        status: 'cleaning'
      },
      {
        id: 'table-6666-6666-6666-666666666666',
        restaurant_id: RESTAURANT_ID,
        table_number: 6,
        name: 'B03',
        capacity: 8,
        status: 'available'
      }
    ]

    for (const table of tables) {
      await supabase.from('tables').upsert(table)
    }
    console.log('✅ 桌台資料載入完成')

    // 5. 載入範例訂單
    console.log('📋 載入範例訂單...')
    const orders = [
      {
        id: 'order-1111-1111-1111-111111111111',
        restaurant_id: RESTAURANT_ID,
        table_id: 'table-3333-3333-3333-333333333333',
        order_number: 'ORD-001',
        customer_name: '王小明',
        customer_phone: '0912345678',
        subtotal: 260,
        tax_amount: 13,
        total_amount: 273,
        status: 'preparing',
        payment_status: 'unpaid',
        order_type: 'dine_in'
      },
      {
        id: 'order-2222-2222-2222-222222222222',
        restaurant_id: RESTAURANT_ID,
        table_id: 'table-1111-1111-1111-111111111111',
        order_number: 'ORD-002',
        customer_name: '李小華',
        customer_phone: '0987654321',
        subtotal: 200,
        tax_amount: 10,
        total_amount: 210,
        status: 'ready',
        payment_status: 'paid',
        order_type: 'dine_in'
      }
    ]

    for (const order of orders) {
      await supabase.from('orders').upsert(order)
    }

    // 6. 載入訂單項目
    console.log('📝 載入訂單項目...')
    const orderItems = [
      // 訂單1的項目
      {
        id: 'item-1111-1111-1111-111111111111',
        order_id: 'order-1111-1111-1111-111111111111',
        product_id: 'prod-1111-1111-1111-111111111111',
        product_name: '招牌牛肉麵',
        quantity: 1,
        unit_price: 180,
        total_price: 180,
        status: 'preparing'
      },
      {
        id: 'item-2222-2222-2222-222222222222',
        order_id: 'order-1111-1111-1111-111111111111',
        product_id: 'prod-2222-2222-2222-222222222222',
        product_name: '滷肉飯',
        quantity: 1,
        unit_price: 80,
        total_price: 80,
        status: 'preparing'
      },
      // 訂單2的項目
      {
        id: 'item-3333-3333-3333-333333333333',
        order_id: 'order-2222-2222-2222-222222222222',
        product_id: 'prod-3333-3333-3333-333333333333',
        product_name: '炒飯',
        quantity: 1,
        unit_price: 120,
        total_price: 120,
        status: 'ready'
      },
      {
        id: 'item-4444-4444-4444-444444444444',
        order_id: 'order-2222-2222-2222-222222222222',
        product_id: 'prod-2222-2222-2222-222222222222',
        product_name: '滷肉飯',
        quantity: 1,
        unit_price: 80,
        total_price: 80,
        status: 'ready'
      }
    ]

    for (const item of orderItems) {
      await supabase.from('order_items').upsert(item)
    }
    console.log('✅ 訂單項目載入完成')

    // 7. 驗證載入結果
    console.log('\n🔍 驗證測試資料載入結果...')
    
    const verification = [
      { table: 'restaurants', expectedMin: 1 },
      { table: 'categories', expectedMin: 4 },
      { table: 'products', expectedMin: 7 },
      { table: 'tables', expectedMin: 6 },
      { table: 'orders', expectedMin: 2 },
      { table: 'order_items', expectedMin: 4 }
    ]

    for (const check of verification) {
      const { count } = await supabase
        .from(check.table)
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', RESTAURANT_ID)
      
      if (count >= check.expectedMin) {
        console.log(`✅ ${check.table}: ${count} 筆資料`)
      } else {
        console.log(`⚠️ ${check.table}: ${count} 筆資料 (預期至少 ${check.expectedMin} 筆)`)
      }
    }

    console.log('\n🎉 測試資料載入完成！')
    console.log('💡 現在可以開啟 http://localhost:5177 測試完整功能')

  } catch (error) {
    console.error('❌ 載入失敗:', error.message)
  }
}

loadTestData()
