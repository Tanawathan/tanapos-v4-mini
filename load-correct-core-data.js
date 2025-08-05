// TanaPOS v4 AI - 正確的核心資料載入
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const RESTAURANT_ID = process.env.VITE_RESTAURANT_ID

// 使用 Service Role Key 確保有完整權限
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔧 TanaPOS v4 AI - 正確的核心資料載入\n')

async function loadCorrectCoreData() {
  try {
    // 1. 載入餐廳資料 - 符合實際表結構
    console.log('🏪 載入餐廳資料...')
    const { error: restError } = await supabase
      .from('restaurants')
      .upsert([
        {
          id: RESTAURANT_ID,
          name: 'TanaPOS v4 AI 測試餐廳',
          address: '台北市信義區松高路123號',
          phone: '02-1234-5678',
          email: 'test@tanapos-v4.ai',
          website: 'https://tanapos-v4.ai',
          tax_rate: 0.05,
          service_charge_rate: 0.10,
          currency: 'TWD',
          timezone: 'Asia/Taipei',
          business_hours: {
            monday: { open: '09:00', close: '22:00' },
            tuesday: { open: '09:00', close: '22:00' },
            wednesday: { open: '09:00', close: '22:00' },
            thursday: { open: '09:00', close: '22:00' },
            friday: { open: '09:00', close: '23:00' },
            saturday: { open: '09:00', close: '23:00' },
            sunday: { open: '10:00', close: '21:00' }
          },
          settings: {
            kds_auto_print: true,
            order_timeout: 30,
            language: 'zh-TW',
            theme: 'light'
          },
          is_active: true,
          metadata: {
            description: '完整功能測試餐廳，支援AI智能分析',
            cuisine_type: 'mixed'
          }
        }
      ], { onConflict: 'id' })

    if (restError) throw restError
    console.log('✅ 餐廳資料載入完成')

    // 2. 載入分類資料
    console.log('📂 載入分類資料...')
    const categories = [
      {
        id: 'cat-appetizers',
        restaurant_id: RESTAURANT_ID,
        name: '開胃菜',
        description: '精緻開胃小點',
        icon: '🥗',
        color: '#10B981',
        sort_order: 1,
        is_active: true
      },
      {
        id: 'cat-mains',
        restaurant_id: RESTAURANT_ID,
        name: '主餐',
        description: '招牌主要餐點',
        icon: '🍖',
        color: '#F59E0B',
        sort_order: 2,
        is_active: true
      },
      {
        id: 'cat-drinks',
        restaurant_id: RESTAURANT_ID,
        name: '飲品',
        description: '各式精選飲品',
        icon: '🥤',
        color: '#3B82F6',
        sort_order: 3,
        is_active: true
      },
      {
        id: 'cat-desserts',
        restaurant_id: RESTAURANT_ID,
        name: '甜點',
        description: '手工精緻甜點',
        icon: '🍰',
        color: '#EC4899',
        sort_order: 4,
        is_active: true
      }
    ]

    const { error: catError } = await supabase
      .from('categories')
      .upsert(categories, { onConflict: 'id' })

    if (catError) throw catError
    console.log('✅ 分類資料載入完成')

    // 3. 載入產品資料
    console.log('🍽️ 載入產品資料...')
    const products = [
      {
        id: 'prod-caesar-salad',
        restaurant_id: RESTAURANT_ID,
        category_id: 'cat-appetizers',
        name: '凱薩沙拉',
        description: '新鮮蘿蔓生菜配經典凱薩醬',
        price: 280,
        cost: 120,
        image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
        is_available: true,
        is_featured: true,
        preparation_time: 10,
        nutritional_info: {
          calories: 180,
          allergens: ['dairy', 'eggs']
        },
        tags: ['healthy', 'vegetarian']
      },
      {
        id: 'prod-grilled-chicken',
        restaurant_id: RESTAURANT_ID,
        category_id: 'cat-mains',
        name: '炭烤雞胸',
        description: '特製香料醃製炭烤雞胸佐時蔬',
        price: 480,
        cost: 220,
        image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b',
        is_available: true,
        is_featured: true,
        preparation_time: 25,
        nutritional_info: {
          calories: 420,
          allergens: []
        },
        tags: ['protein', 'grilled']
      },
      {
        id: 'prod-beef-steak',
        restaurant_id: RESTAURANT_ID,
        category_id: 'cat-mains',
        name: '安格斯牛排',
        description: '精選安格斯牛肉佐蘑菇醬',
        price: 780,
        cost: 350,
        image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d',
        is_available: true,
        is_featured: true,
        preparation_time: 30,
        nutritional_info: {
          calories: 650,
          allergens: []
        },
        tags: ['premium', 'beef']
      },
      {
        id: 'prod-latte',
        restaurant_id: RESTAURANT_ID,
        category_id: 'cat-drinks',
        name: '精品拿鐵',
        description: '單品咖啡豆手工拉花拿鐵',
        price: 150,
        cost: 45,
        image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735',
        is_available: true,
        is_featured: false,
        preparation_time: 8,
        nutritional_info: {
          calories: 120,
          allergens: ['dairy']
        },
        tags: ['coffee', 'hot']
      },
      {
        id: 'prod-tiramisu',
        restaurant_id: RESTAURANT_ID,
        category_id: 'cat-desserts',
        name: '經典提拉米蘇',
        description: '義式手工提拉米蘇',
        price: 180,
        cost: 70,
        image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9',
        is_available: true,
        is_featured: true,
        preparation_time: 5,
        nutritional_info: {
          calories: 320,
          allergens: ['dairy', 'eggs', 'alcohol']
        },
        tags: ['italian', 'classic']
      }
    ]

    const { error: prodError } = await supabase
      .from('products')
      .upsert(products, { onConflict: 'id' })

    if (prodError) throw prodError
    console.log('✅ 產品資料載入完成')

    // 4. 載入訂單資料
    console.log('📋 載入訂單資料...')
    const orders = [
      {
        id: 'order-001',
        restaurant_id: RESTAURANT_ID,
        table_id: 'table-a03',
        order_number: 'A001',
        customer_name: '王先生',
        customer_phone: '0912-345-678',
        status: 'preparing',
        order_type: 'dine_in',
        total_amount: 960,
        tax_amount: 48,
        service_charge: 96,
        discount_amount: 0,
        special_instructions: '牛排要七分熟',
        estimated_ready_time: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      },
      {
        id: 'order-002',
        restaurant_id: RESTAURANT_ID,
        table_id: 'table-b02',
        order_number: 'B002',
        customer_name: '李小姐',
        customer_phone: '0987-654-321',
        status: 'ready',
        order_type: 'dine_in',
        total_amount: 610,
        tax_amount: 30,
        service_charge: 61,
        discount_amount: 50,
        special_instructions: '拿鐵要低咖啡因',
        estimated_ready_time: new Date().toISOString()
      }
    ]

    const { error: orderError } = await supabase
      .from('orders')
      .upsert(orders, { onConflict: 'id' })

    if (orderError) throw orderError
    console.log('✅ 訂單資料載入完成')

    // 5. 載入訂單項目
    console.log('📝 載入訂單項目...')
    const orderItems = [
      {
        id: 'item-001-001',
        order_id: 'order-001',
        product_id: 'prod-beef-steak',
        quantity: 1,
        unit_price: 780,
        total_price: 780,
        special_instructions: '七分熟'
      },
      {
        id: 'item-001-002',
        order_id: 'order-001',
        product_id: 'prod-latte',
        quantity: 1,
        unit_price: 150,
        total_price: 150,
        special_instructions: ''
      },
      {
        id: 'item-002-001',
        order_id: 'order-002',
        product_id: 'prod-grilled-chicken',
        quantity: 1,
        unit_price: 480,
        total_price: 480,
        special_instructions: ''
      },
      {
        id: 'item-002-002',
        order_id: 'order-002',
        product_id: 'prod-latte',
        quantity: 1,
        unit_price: 150,
        total_price: 150,
        special_instructions: '低咖啡因'
      }
    ]

    const { error: itemError } = await supabase
      .from('order_items')
      .upsert(orderItems, { onConflict: 'id' })

    if (itemError) throw itemError
    console.log('✅ 訂單項目載入完成')

    console.log('\n🎉 正確的核心資料載入完成！')
    console.log('✅ 餐廳: 1 筆')
    console.log('✅ 分類: 4 筆 (開胃菜、主餐、飲品、甜點)')
    console.log('✅ 產品: 5 筆 (凱薩沙拉、炭烤雞胸、安格斯牛排、精品拿鐵、經典提拉米蘇)')
    console.log('✅ 訂單: 2 筆 (1筆準備中、1筆已完成)')
    console.log('✅ 訂單項目: 4 筆')
    console.log('\n🚀 現在可以測試完整的 POS 系統功能！')
    console.log('💡 建議測試流程:')
    console.log('   1. 開啟 http://localhost:5177')
    console.log('   2. 測試菜單管理 - 查看分類和產品')
    console.log('   3. 測試桌台管理 - 檢查桌台狀態')
    console.log('   4. 測試訂單系統 - 查看現有訂單')
    console.log('   5. 測試 KDS 系統 - 廚房顯示功能')

  } catch (error) {
    console.error('❌ 載入失敗:', error.message)
    console.error('詳細錯誤:', error)
  }
}

loadCorrectCoreData()
