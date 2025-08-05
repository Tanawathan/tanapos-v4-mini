// TanaPOS v4 AI - 使用環境變數 API 載入測試資料
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// 載入環境變數
config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const RESTAURANT_ID = process.env.VITE_RESTAURANT_ID

console.log('🚀 TanaPOS v4 AI - 環境變數 API 測試資料載入\n')

// 驗證環境變數
if (!supabaseUrl || !supabaseServiceKey || !RESTAURANT_ID) {
  console.error('❌ 環境變數缺失:')
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('VITE_SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  console.error('VITE_RESTAURANT_ID:', RESTAURANT_ID ? '✅' : '❌')
  process.exit(1)
}

console.log('🔧 環境變數檢查:')
console.log('✅ Supabase URL:', supabaseUrl)
console.log('✅ Service Key:', supabaseServiceKey.substring(0, 50) + '...')
console.log('✅ Restaurant ID:', RESTAURANT_ID)
console.log('')

// 建立 Supabase 客戶端 (使用服務密鑰)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function loadTestDataWithAPI() {
  try {
    // 1. 檢查連線
    console.log('🔗 檢查 Supabase 連線...')
    const { data: healthCheck, error: healthError } = await supabase
      .from('restaurants')
      .select('count', { count: 'exact', head: true })
    
    if (healthError) {
      console.error('❌ 連線失敗:', healthError.message)
      return
    }
    console.log('✅ Supabase 連線正常\n')

    // 2. 清理現有測試資料
    console.log('🧹 清理現有測試資料...')
    
    // 刪除訂單項目
    await supabase
      .from('order_items')
      .delete()
      .in('order_id', (await supabase
        .from('orders')
        .select('id')
        .eq('restaurant_id', RESTAURANT_ID)
      ).data?.map(o => o.id) || [])
    
    // 刪除訂單
    await supabase
      .from('orders')
      .delete()
      .eq('restaurant_id', RESTAURANT_ID)
    
    // 刪除產品
    await supabase
      .from('products')
      .delete()
      .eq('restaurant_id', RESTAURANT_ID)
    
    // 刪除分類
    await supabase
      .from('categories')
      .delete()
      .eq('restaurant_id', RESTAURANT_ID)
    
    // 刪除桌台
    await supabase
      .from('tables')
      .delete()
      .eq('restaurant_id', RESTAURANT_ID)
    
    // 刪除餐廳
    await supabase
      .from('restaurants')
      .delete()
      .eq('id', RESTAURANT_ID)
    
    console.log('✅ 清理完成\n')

    // 3. 載入餐廳資料
    console.log('🏪 載入餐廳資料...')
    const { error: restaurantError } = await supabase
      .from('restaurants')
      .insert({
        id: RESTAURANT_ID,
        name: 'TanaPOS 示範餐廳',
        address: '台北市信義區信義路五段7號',
        phone: '02-1234-5678',
        email: 'demo@tanapos.com',
        tax_rate: 0.05,
        currency: 'TWD',
        timezone: 'Asia/Taipei'
      })
    
    if (restaurantError) {
      console.error('❌ 餐廳資料載入失敗:', restaurantError.message)
      return
    }
    console.log('✅ 餐廳資料載入成功')

    // 4. 載入分類資料
    console.log('📂 載入分類資料...')
    const categories = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        restaurant_id: RESTAURANT_ID,
        name: '主餐',
        description: '主要餐點',
        sort_order: 1,
        color: '#3B82F6',
        icon: '🍽️',
        is_active: true
      },
      {
        id: '22222222-2222-2222-2222-222222222222', 
        restaurant_id: RESTAURANT_ID,
        name: '飲品',
        description: '各式飲品',
        sort_order: 2,
        color: '#10B981',
        icon: '🥤',
        is_active: true
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        restaurant_id: RESTAURANT_ID,
        name: '甜點',
        description: '精緻甜點',
        sort_order: 3,
        color: '#F59E0B',
        icon: '🍰',
        is_active: true
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        restaurant_id: RESTAURANT_ID,
        name: '前菜',
        description: '開胃小菜',
        sort_order: 4,
        color: '#EF4444',
        icon: '🥗',
        is_active: true
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        restaurant_id: RESTAURANT_ID,
        name: '湯品',
        description: '暖心湯品',
        sort_order: 5,
        color: '#8B5CF6',
        icon: '🍲',
        is_active: true
      }
    ]

    const { error: categoryError } = await supabase
      .from('categories')
      .insert(categories)
    
    if (categoryError) {
      console.error('❌ 分類資料載入失敗:', categoryError.message)
      return
    }
    console.log('✅ 分類資料載入成功')

    // 5. 載入產品資料
    console.log('🍽️ 載入產品資料...')
    const products = [
      // 主餐
      { id: 'a1111111-1111-1111-1111-111111111111', restaurant_id: RESTAURANT_ID, category_id: '11111111-1111-1111-1111-111111111111', name: '招牌牛肉麵', description: '經典台式牛肉麵，湯頭濃郁', price: 180.00, cost: 80.00, prep_time_minutes: 15, is_available: true },
      { id: 'a2222222-2222-2222-2222-222222222222', restaurant_id: RESTAURANT_ID, category_id: '11111111-1111-1111-1111-111111111111', name: '滷肉飯', description: '傳統台式滷肉飯', price: 80.00, cost: 35.00, prep_time_minutes: 8, is_available: true },
      { id: 'a3333333-3333-3333-3333-333333333333', restaurant_id: RESTAURANT_ID, category_id: '11111111-1111-1111-1111-111111111111', name: '炒飯', description: '香噴噴炒飯', price: 120.00, cost: 50.00, prep_time_minutes: 12, is_available: true },
      { id: 'a0000001-0001-0001-0001-000000000001', restaurant_id: RESTAURANT_ID, category_id: '11111111-1111-1111-1111-111111111111', name: '宮保雞丁', description: '經典川菜宮保雞丁', price: 150.00, cost: 65.00, prep_time_minutes: 12, is_available: true },
      { id: 'a0000002-0002-0002-0002-000000000002', restaurant_id: RESTAURANT_ID, category_id: '11111111-1111-1111-1111-111111111111', name: '糖醋排骨', description: '酸甜糖醋排骨', price: 160.00, cost: 70.00, prep_time_minutes: 18, is_available: true },
      
      // 飲品
      { id: 'b4444444-4444-4444-4444-444444444444', restaurant_id: RESTAURANT_ID, category_id: '22222222-2222-2222-2222-222222222222', name: '古早味紅茶', description: '香濃古早味紅茶', price: 30.00, cost: 8.00, prep_time_minutes: 3, is_available: true },
      { id: 'b5555555-5555-5555-5555-555555555555', restaurant_id: RESTAURANT_ID, category_id: '22222222-2222-2222-2222-222222222222', name: '檸檬汽水', description: '清爽檸檬汽水', price: 40.00, cost: 12.00, prep_time_minutes: 2, is_available: true },
      { id: 'b0000003-0003-0003-0003-000000000003', restaurant_id: RESTAURANT_ID, category_id: '22222222-2222-2222-2222-222222222222', name: '珍珠奶茶', description: '經典珍珠奶茶', price: 55.00, cost: 18.00, prep_time_minutes: 5, is_available: true },
      { id: 'b0000004-0004-0004-0004-000000000004', restaurant_id: RESTAURANT_ID, category_id: '22222222-2222-2222-2222-222222222222', name: '冰咖啡', description: '香醇冰咖啡', price: 65.00, cost: 20.00, prep_time_minutes: 4, is_available: true },
      
      // 甜點
      { id: 'c6666666-6666-6666-6666-666666666666', restaurant_id: RESTAURANT_ID, category_id: '33333333-3333-3333-3333-333333333333', name: '巧克力蛋糕', description: '濃郁巧克力蛋糕', price: 120.00, cost: 45.00, prep_time_minutes: 5, is_available: true },
      { id: 'c0000005-0005-0005-0005-000000000005', restaurant_id: RESTAURANT_ID, category_id: '33333333-3333-3333-3333-333333333333', name: '草莓蛋糕', description: '新鮮草莓蛋糕', price: 130.00, cost: 50.00, prep_time_minutes: 5, is_available: true },
      { id: 'c0000006-0006-0006-0006-000000000006', restaurant_id: RESTAURANT_ID, category_id: '33333333-3333-3333-3333-333333333333', name: '提拉米蘇', description: '義式提拉米蘇', price: 140.00, cost: 55.00, prep_time_minutes: 3, is_available: true },
      
      // 前菜
      { id: 'd7777777-7777-7777-7777-777777777777', restaurant_id: RESTAURANT_ID, category_id: '44444444-4444-4444-4444-444444444444', name: '涼拌小黃瓜', description: '清爽涼拌小黃瓜', price: 60.00, cost: 20.00, prep_time_minutes: 5, is_available: true },
      { id: 'd0000007-0007-0007-0007-000000000007', restaurant_id: RESTAURANT_ID, category_id: '44444444-4444-4444-4444-444444444444', name: '皮蛋豆腐', description: '經典皮蛋豆腐', price: 80.00, cost: 25.00, prep_time_minutes: 5, is_available: true },
      { id: 'd0000008-0008-0008-0008-000000000008', restaurant_id: RESTAURANT_ID, category_id: '44444444-4444-4444-4444-444444444444', name: '涼拌海帶絲', description: '爽脆涼拌海帶絲', price: 70.00, cost: 22.00, prep_time_minutes: 5, is_available: true },
      
      // 湯品
      { id: 'e0000009-0009-0009-0009-000000000009', restaurant_id: RESTAURANT_ID, category_id: '55555555-5555-5555-5555-555555555555', name: '酸辣湯', description: '經典酸辣湯', price: 60.00, cost: 18.00, prep_time_minutes: 8, is_available: true },
      { id: 'e0000010-0010-0010-0010-000000000010', restaurant_id: RESTAURANT_ID, category_id: '55555555-5555-5555-5555-555555555555', name: '玉米濃湯', description: '香濃玉米濃湯', price: 50.00, cost: 15.00, prep_time_minutes: 6, is_available: true },
      { id: 'e0000011-0011-0011-0011-000000000011', restaurant_id: RESTAURANT_ID, category_id: '55555555-5555-5555-5555-555555555555', name: '蛤蜊湯', description: '鮮美蛤蜊湯', price: 90.00, cost: 35.00, prep_time_minutes: 10, is_available: true }
    ]

    const { error: productError } = await supabase
      .from('products')
      .insert(products)
    
    if (productError) {
      console.error('❌ 產品資料載入失敗:', productError.message)
      return
    }
    console.log('✅ 產品資料載入成功')

    // 6. 載入桌台資料
    console.log('🪑 載入桌台資料...')
    const tables = [
      { id: '11111111-1111-1111-1111-111111111101', restaurant_id: RESTAURANT_ID, table_number: 1, name: 'A01', capacity: 4, status: 'available' },
      { id: '11111111-1111-1111-1111-111111111102', restaurant_id: RESTAURANT_ID, table_number: 2, name: 'A02', capacity: 4, status: 'available' },
      { id: '11111111-1111-1111-1111-111111111103', restaurant_id: RESTAURANT_ID, table_number: 3, name: 'A03', capacity: 6, status: 'occupied' },
      { id: '11111111-1111-1111-1111-111111111104', restaurant_id: RESTAURANT_ID, table_number: 4, name: 'B01', capacity: 2, status: 'available' },
      { id: '11111111-1111-1111-1111-111111111105', restaurant_id: RESTAURANT_ID, table_number: 5, name: 'B02', capacity: 4, status: 'cleaning' },
      { id: '11111111-1111-1111-1111-111111111106', restaurant_id: RESTAURANT_ID, table_number: 6, name: 'B03', capacity: 8, status: 'available' },
      { id: '11111111-1111-1111-1111-111111111107', restaurant_id: RESTAURANT_ID, table_number: 7, name: 'C01', capacity: 4, status: 'available' },
      { id: '11111111-1111-1111-1111-111111111108', restaurant_id: RESTAURANT_ID, table_number: 8, name: 'C02', capacity: 6, status: 'available' }
    ]

    const { error: tableError } = await supabase
      .from('tables')
      .insert(tables)
    
    if (tableError) {
      console.error('❌ 桌台資料載入失敗:', tableError.message)
      return
    }
    console.log('✅ 桌台資料載入成功')

    // 7. 載入範例訂單
    console.log('📋 載入範例訂單...')
    const orders = [
      { id: '11111111-1111-1111-1111-111111111201', restaurant_id: RESTAURANT_ID, table_id: '11111111-1111-1111-1111-111111111103', order_number: 'ORD-001', customer_name: '王小明', customer_phone: '0912345678', subtotal: 260.00, tax_amount: 13.00, total_amount: 273.00, status: 'preparing', payment_status: 'unpaid', order_type: 'dine_in' },
      { id: '11111111-1111-1111-1111-111111111202', restaurant_id: RESTAURANT_ID, table_id: '11111111-1111-1111-1111-111111111101', order_number: 'ORD-002', customer_name: '李小華', customer_phone: '0987654321', subtotal: 200.00, tax_amount: 10.00, total_amount: 210.00, status: 'ready', payment_status: 'paid', order_type: 'dine_in' },
      { id: '11111111-1111-1111-1111-111111111203', restaurant_id: RESTAURANT_ID, table_id: '11111111-1111-1111-1111-111111111107', order_number: 'ORD-003', customer_name: '張大同', customer_phone: '0923456789', subtotal: 315.00, tax_amount: 15.75, total_amount: 330.75, status: 'served', payment_status: 'paid', order_type: 'dine_in' }
    ]

    const { error: orderError } = await supabase
      .from('orders')
      .insert(orders)
    
    if (orderError) {
      console.error('❌ 訂單資料載入失敗:', orderError.message)
      return
    }
    console.log('✅ 訂單資料載入成功')

    // 8. 載入訂單項目
    console.log('📝 載入訂單項目...')
    const orderItems = [
      // 訂單1的項目
      { id: '11111111-1111-1111-1111-111111111301', order_id: '11111111-1111-1111-1111-111111111201', product_id: 'a1111111-1111-1111-1111-111111111111', product_name: '招牌牛肉麵', quantity: 1, unit_price: 180.00, total_price: 180.00, status: 'preparing' },
      { id: '11111111-1111-1111-1111-111111111302', order_id: '11111111-1111-1111-1111-111111111201', product_id: 'a2222222-2222-2222-2222-222222222222', product_name: '滷肉飯', quantity: 1, unit_price: 80.00, total_price: 80.00, status: 'preparing' },
      
      // 訂單2的項目
      { id: '11111111-1111-1111-1111-111111111303', order_id: '11111111-1111-1111-1111-111111111202', product_id: 'a3333333-3333-3333-3333-333333333333', product_name: '炒飯', quantity: 1, unit_price: 120.00, total_price: 120.00, status: 'ready' },
      { id: '11111111-1111-1111-1111-111111111304', order_id: '11111111-1111-1111-1111-111111111202', product_id: 'a2222222-2222-2222-2222-222222222222', product_name: '滷肉飯', quantity: 1, unit_price: 80.00, total_price: 80.00, status: 'ready' },
      
      // 訂單3的項目
      { id: '11111111-1111-1111-1111-111111111305', order_id: '11111111-1111-1111-1111-111111111203', product_id: 'a0000001-0001-0001-0001-000000000001', product_name: '宮保雞丁', quantity: 1, unit_price: 150.00, total_price: 150.00, status: 'served' },
      { id: '11111111-1111-1111-1111-111111111306', order_id: '11111111-1111-1111-1111-111111111203', product_id: 'a0000002-0002-0002-0002-000000000002', product_name: '糖醋排骨', quantity: 1, unit_price: 160.00, total_price: 160.00, status: 'served' },
      { id: '11111111-1111-1111-1111-111111111307', order_id: '11111111-1111-1111-1111-111111111203', product_id: 'e0000009-0009-0009-0009-000000000009', product_name: '酸辣湯', quantity: 1, unit_price: 60.00, total_price: 60.00, status: 'served' }
    ]

    const { error: itemError } = await supabase
      .from('order_items')
      .insert(orderItems)
    
    if (itemError) {
      console.error('❌ 訂單項目載入失敗:', itemError.message)
      return
    }
    console.log('✅ 訂單項目載入成功')

    // 9. 驗證載入結果
    console.log('\n🔍 驗證測試資料載入結果...')
    
    const verification = [
      { table: 'restaurants', expectedMin: 1 },
      { table: 'categories', expectedMin: 5 },
      { table: 'products', expectedMin: 18 },
      { table: 'tables', expectedMin: 8 },
      { table: 'orders', expectedMin: 3 },
      { table: 'order_items', expectedMin: 7 }
    ]

    for (const check of verification) {
      const { count, error } = await supabase
        .from(check.table)
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', RESTAURANT_ID)
      
      if (error) {
        console.log(`❌ ${check.table}: 查詢錯誤 - ${error.message}`)
      } else if (count >= check.expectedMin) {
        console.log(`✅ ${check.table}: ${count} 筆資料`)
      } else {
        console.log(`⚠️ ${check.table}: ${count} 筆資料 (預期至少 ${check.expectedMin} 筆)`)
      }
    }

    console.log('\n🎉 完整測試資料載入成功！')
    console.log('📊 載入統計:')
    console.log('   🏪 餐廳: 1 筆')
    console.log('   📂 分類: 5 筆')
    console.log('   🍽️ 產品: 18 筆')
    console.log('   🪑 桌台: 8 張')
    console.log('   📋 訂單: 3 筆')
    console.log('   📝 訂單項目: 7 筆')
    console.log('')
    console.log('💡 現在可以開啟 http://localhost:5177 測試完整功能')
    console.log('🚀 所有功能模組都有測試資料，不會出現連接錯誤！')

  } catch (error) {
    console.error('❌ 載入失敗:', error.message)
    console.error('詳細錯誤:', error)
  }
}

loadTestDataWithAPI()
