// TanaPOS v4 AI - 服務密鑰測試資料載入腳本
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMzMzcxMCwiZXhwIjoyMDY5OTA5NzEwfQ.P8LGJrBBgzBJ_IuO8eQ0zzpyeE6LhMuG1kqRoBGhSLQ'
const RESTAURANT_ID = '11111111-1111-1111-1111-111111111111'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🚀 TanaPOS v4 AI - 服務密鑰測試資料載入\n')

async function loadTestDataWithServiceRole() {
  try {
    console.log('🔑 使用服務密鑰進行完整資料載入...')

    // 1. 檢查連線
    console.log('🔗 檢查 Supabase 連線...')
    const { data: healthCheck, error: healthError } = await supabase
      .from('restaurants')
      .select('count', { count: 'exact', head: true })
    
    if (healthError) {
      console.error('❌ 連線失敗:', healthError.message)
      return
    }
    console.log('✅ Supabase 連線正常')

    // 2. 載入餐廳資料
    console.log('🏪 載入餐廳資料...')
    const { error: restaurantError } = await supabase
      .from('restaurants')
      .upsert({
        id: RESTAURANT_ID,
        name: 'TanaPOS 示範餐廳',
        address: '台北市信義區信義路五段7號',
        phone: '02-1234-5678',
        email: 'demo@tanapos.com',
        tax_rate: 0.05,
        currency: 'TWD',
        timezone: 'Asia/Taipei',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (restaurantError) {
      console.error('❌ 餐廳資料載入失敗:', restaurantError.message)
      return
    }
    console.log('✅ 餐廳資料載入成功')

    // 3. 載入分類資料
    console.log('📂 載入分類資料...')
    const categories = [
      {
        id: 'cat-1111-1111-1111-111111111111',
        restaurant_id: RESTAURANT_ID,
        name: '主餐',
        description: '主要餐點',
        sort_order: 1,
        color: '#3B82F6',
        icon: '🍽️',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'cat-2222-2222-2222-222222222222', 
        restaurant_id: RESTAURANT_ID,
        name: '飲品',
        description: '各式飲品',
        sort_order: 2,
        color: '#10B981',
        icon: '🥤',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'cat-3333-3333-3333-333333333333',
        restaurant_id: RESTAURANT_ID,
        name: '甜點',
        description: '精緻甜點',
        sort_order: 3,
        color: '#F59E0B',
        icon: '🍰',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'cat-4444-4444-4444-444444444444',
        restaurant_id: RESTAURANT_ID,
        name: '前菜',
        description: '開胃小菜',
        sort_order: 4,
        color: '#EF4444',
        icon: '🥗',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    const { error: categoryError } = await supabase
      .from('categories')
      .upsert(categories)
    
    if (categoryError) {
      console.error('❌ 分類資料載入失敗:', categoryError.message)
      return
    }
    console.log('✅ 分類資料載入成功')

    // 4. 載入產品資料
    console.log('🍽️ 載入產品資料...')
    const products = [
      {
        id: 'prod-1111-1111-1111-111111111111',
        restaurant_id: RESTAURANT_ID,
        category_id: 'cat-1111-1111-1111-111111111111',
        name: '招牌牛肉麵',
        description: '經典台式牛肉麵，湯頭濃郁',
        price: 180.00,
        cost: 80.00,
        preparation_time: 15,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-2222-2222-2222-222222222222',
        restaurant_id: RESTAURANT_ID,
        category_id: 'cat-1111-1111-1111-111111111111',
        name: '滷肉飯',
        description: '傳統台式滷肉飯',
        price: 80.00,
        cost: 35.00,
        preparation_time: 8,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-3333-3333-3333-333333333333',
        restaurant_id: RESTAURANT_ID,
        category_id: 'cat-1111-1111-1111-111111111111',
        name: '炒飯',
        description: '香噴噴炒飯',
        price: 120.00,
        cost: 50.00,
        preparation_time: 12,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-4444-4444-4444-444444444444',
        restaurant_id: RESTAURANT_ID,
        category_id: 'cat-2222-2222-2222-222222222222',
        name: '古早味紅茶',
        description: '香濃古早味紅茶',
        price: 30.00,
        cost: 8.00,
        preparation_time: 3,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-5555-5555-5555-555555555555',
        restaurant_id: RESTAURANT_ID,
        category_id: 'cat-2222-2222-2222-222222222222',
        name: '檸檬汽水',
        description: '清爽檸檬汽水',
        price: 40.00,
        cost: 12.00,
        preparation_time: 2,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-6666-6666-6666-666666666666',
        restaurant_id: RESTAURANT_ID,
        category_id: 'cat-3333-3333-3333-333333333333',
        name: '巧克力蛋糕',
        description: '濃郁巧克力蛋糕',
        price: 120.00,
        cost: 45.00,
        preparation_time: 5,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'prod-7777-7777-7777-777777777777',
        restaurant_id: RESTAURANT_ID,
        category_id: 'cat-4444-4444-4444-444444444444',
        name: '涼拌小黃瓜',
        description: '清爽涼拌小黃瓜',
        price: 60.00,
        cost: 20.00,
        preparation_time: 5,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    const { error: productError } = await supabase
      .from('products')
      .upsert(products)
    
    if (productError) {
      console.error('❌ 產品資料載入失敗:', productError.message)
      return
    }
    console.log('✅ 產品資料載入成功')

    // 5. 載入桌台資料
    console.log('🪑 載入桌台資料...')
    const tables = [
      {
        id: 'table-1111-1111-1111-111111111111',
        restaurant_id: RESTAURANT_ID,
        table_number: 1,
        name: 'A01',
        capacity: 4,
        status: 'available',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'table-2222-2222-2222-222222222222',
        restaurant_id: RESTAURANT_ID,
        table_number: 2,
        name: 'A02', 
        capacity: 4,
        status: 'available',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'table-3333-3333-3333-333333333333',
        restaurant_id: RESTAURANT_ID,
        table_number: 3,
        name: 'A03',
        capacity: 6,
        status: 'occupied',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'table-4444-4444-4444-444444444444',
        restaurant_id: RESTAURANT_ID,
        table_number: 4,
        name: 'B01',
        capacity: 2,
        status: 'available',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'table-5555-5555-5555-555555555555',
        restaurant_id: RESTAURANT_ID,
        table_number: 5,
        name: 'B02',
        capacity: 4,
        status: 'cleaning',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'table-6666-6666-6666-666666666666',
        restaurant_id: RESTAURANT_ID,
        table_number: 6,
        name: 'B03',
        capacity: 8,
        status: 'available',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    const { error: tableError } = await supabase
      .from('tables')
      .upsert(tables)
    
    if (tableError) {
      console.error('❌ 桌台資料載入失敗:', tableError.message)
      return
    }
    console.log('✅ 桌台資料載入成功')

    // 6. 驗證載入結果
    console.log('\n🔍 驗證測試資料載入結果...')
    
    const verification = [
      { table: 'restaurants', expectedMin: 1 },
      { table: 'categories', expectedMin: 4 },
      { table: 'products', expectedMin: 7 },
      { table: 'tables', expectedMin: 6 }
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

    console.log('\n🎉 基礎測試資料載入完成！')
    console.log('💡 現在可以開啟 http://localhost:5177 測試基本功能')
    console.log('📝 資料庫已包含：餐廳、分類、產品、桌台等基礎資料')

  } catch (error) {
    console.error('❌ 載入失敗:', error.message)
    console.error('詳細錯誤:', error)
  }
}

loadTestDataWithServiceRole()
