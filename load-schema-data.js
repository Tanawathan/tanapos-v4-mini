// TanaPOS v4 AI - 符合實際 Schema 的核心資料載入
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const RESTAURANT_ID = process.env.VITE_RESTAURANT_ID

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔧 TanaPOS v4 AI - 符合實際 Schema 的核心資料載入\n')

// 預定義的 UUID
const CATEGORY_IDS = {
  appetizers: '11111111-2222-3333-4444-555555555551',
  mains: '11111111-2222-3333-4444-555555555552', 
  drinks: '11111111-2222-3333-4444-555555555553',
  desserts: '11111111-2222-3333-4444-555555555554'
}

const PRODUCT_IDS = {
  caesar: '22222222-3333-4444-5555-666666666661',
  chicken: '22222222-3333-4444-5555-666666666662',
  steak: '22222222-3333-4444-5555-666666666663',
  latte: '22222222-3333-4444-5555-666666666664',
  tiramisu: '22222222-3333-4444-5555-666666666665'
}

async function loadSchemaCompliantData() {
  try {
    // 1. 載入餐廳資料 
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
        id: CATEGORY_IDS.appetizers,
        restaurant_id: RESTAURANT_ID,
        name: '開胃菜',
        description: '精緻開胃小點',
        icon: '🥗',
        color: '#10B981',
        sort_order: 1,
        is_active: true
      },
      {
        id: CATEGORY_IDS.mains,
        restaurant_id: RESTAURANT_ID,
        name: '主餐',
        description: '招牌主要餐點',
        icon: '🍖',
        color: '#F59E0B',
        sort_order: 2,
        is_active: true
      },
      {
        id: CATEGORY_IDS.drinks,
        restaurant_id: RESTAURANT_ID,
        name: '飲品',
        description: '各式精選飲品',
        icon: '🥤',
        color: '#3B82F6',
        sort_order: 3,
        is_active: true
      },
      {
        id: CATEGORY_IDS.desserts,
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

    // 3. 載入產品資料 - 使用實際的欄位
    console.log('🍽️ 載入產品資料...')
    const products = [
      {
        id: PRODUCT_IDS.caesar,
        restaurant_id: RESTAURANT_ID,
        category_id: CATEGORY_IDS.appetizers,
        name: '凱薩沙拉',
        description: '新鮮蘿蔓生菜配經典凱薩醬',
        sku: 'APP-CAESAR-001',
        price: 280,
        cost: 120,
        image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
        sort_order: 1,
        is_available: true,
        is_active: true,
        prep_time_minutes: 10,
        cook_time_minutes: 0,
        total_time_minutes: 10,
        calories: 180,
        nutrition_info: { protein: 8, carbs: 12, fat: 14 },
        allergens: ['dairy', 'eggs'],
        dietary_tags: ['vegetarian'],
        ai_recommended: true,
        ai_popularity_score: 0.85
      },
      {
        id: PRODUCT_IDS.chicken,
        restaurant_id: RESTAURANT_ID,
        category_id: CATEGORY_IDS.mains,
        name: '炭烤雞胸',
        description: '特製香料醃製炭烤雞胸佐時蔬',
        sku: 'MAIN-CHICKEN-001',
        price: 480,
        cost: 220,
        image_url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b',
        sort_order: 1,
        is_available: true,
        is_active: true,
        prep_time_minutes: 15,
        cook_time_minutes: 10,
        total_time_minutes: 25,
        calories: 420,
        nutrition_info: { protein: 45, carbs: 8, fat: 18 },
        allergens: [],
        dietary_tags: ['high-protein', 'gluten-free'],
        ai_recommended: true,
        ai_popularity_score: 0.92
      },
      {
        id: PRODUCT_IDS.steak,
        restaurant_id: RESTAURANT_ID,
        category_id: CATEGORY_IDS.mains,
        name: '安格斯牛排',
        description: '精選安格斯牛肉佐蘑菇醬',
        sku: 'MAIN-STEAK-001',
        price: 780,
        cost: 350,
        image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d',
        sort_order: 2,
        is_available: true,
        is_active: true,
        prep_time_minutes: 20,
        cook_time_minutes: 10,
        total_time_minutes: 30,
        calories: 650,
        nutrition_info: { protein: 55, carbs: 5, fat: 38 },
        allergens: [],
        dietary_tags: ['premium', 'high-protein'],
        ai_recommended: true,
        ai_popularity_score: 0.78
      },
      {
        id: PRODUCT_IDS.latte,
        restaurant_id: RESTAURANT_ID,
        category_id: CATEGORY_IDS.drinks,
        name: '精品拿鐵',
        description: '單品咖啡豆手工拉花拿鐵',
        sku: 'DRINK-LATTE-001',
        price: 150,
        cost: 45,
        image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735',
        sort_order: 1,
        is_available: true,
        is_active: true,
        prep_time_minutes: 8,
        cook_time_minutes: 0,
        total_time_minutes: 8,
        calories: 120,
        nutrition_info: { protein: 6, carbs: 12, fat: 6 },
        allergens: ['dairy'],
        dietary_tags: ['coffee', 'hot'],
        ai_recommended: false,
        ai_popularity_score: 0.68
      },
      {
        id: PRODUCT_IDS.tiramisu,
        restaurant_id: RESTAURANT_ID,
        category_id: CATEGORY_IDS.desserts,
        name: '經典提拉米蘇',
        description: '義式手工提拉米蘇',
        sku: 'DESSERT-TIRAMISU-001',
        price: 180,
        cost: 70,
        image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9',
        sort_order: 1,
        is_available: true,
        is_active: true,
        prep_time_minutes: 5,
        cook_time_minutes: 0,
        total_time_minutes: 5,
        calories: 320,
        nutrition_info: { protein: 8, carbs: 35, fat: 18 },
        allergens: ['dairy', 'eggs', 'alcohol'],
        dietary_tags: ['italian', 'classic'],
        ai_recommended: true,
        ai_popularity_score: 0.73
      }
    ]

    const { error: prodError } = await supabase
      .from('products')
      .upsert(products, { onConflict: 'id' })

    if (prodError) throw prodError
    console.log('✅ 產品資料載入完成')

    // 4. 載入訂單資料 (使用現有桌台)
    console.log('📋 載入訂單資料...')
    const { data: tables } = await supabase
      .from('tables')
      .select('id, name')
      .eq('restaurant_id', RESTAURANT_ID)
      .in('name', ['A03', 'B02'])

    if (tables && tables.length > 0) {
      const tableA03 = tables.find(t => t.name === 'A03')
      const tableB02 = tables.find(t => t.name === 'B02')

      const orders = [
        {
          restaurant_id: RESTAURANT_ID,
          table_id: tableA03?.id,
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
          restaurant_id: RESTAURANT_ID,
          table_id: tableB02?.id,
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

      const { data: insertedOrders, error: orderError } = await supabase
        .from('orders')
        .insert(orders)
        .select('id, order_number')

      if (orderError) throw orderError
      console.log('✅ 訂單資料載入完成')

      // 5. 載入訂單項目
      if (insertedOrders && insertedOrders.length > 0) {
        console.log('📝 載入訂單項目...')
        const order1 = insertedOrders.find(o => o.order_number === 'A001')
        const order2 = insertedOrders.find(o => o.order_number === 'B002')

        const orderItems = [
          {
            order_id: order1?.id,
            product_id: PRODUCT_IDS.steak,
            quantity: 1,
            unit_price: 780,
            total_price: 780,
            special_instructions: '七分熟'
          },
          {
            order_id: order1?.id,
            product_id: PRODUCT_IDS.latte,
            quantity: 1,
            unit_price: 150,
            total_price: 150,
            special_instructions: ''
          },
          {
            order_id: order2?.id,
            product_id: PRODUCT_IDS.chicken,
            quantity: 1,
            unit_price: 480,
            total_price: 480,
            special_instructions: ''
          },
          {
            order_id: order2?.id,
            product_id: PRODUCT_IDS.latte,
            quantity: 1,
            unit_price: 150,
            total_price: 150,
            special_instructions: '低咖啡因'
          }
        ]

        const { error: itemError } = await supabase
          .from('order_items')
          .insert(orderItems)

        if (itemError) throw itemError
        console.log('✅ 訂單項目載入完成')
      }
    }

    console.log('\n🎉 Schema 符合的核心資料載入完成！')
    console.log('✅ 餐廳: 1 筆')
    console.log('✅ 分類: 4 筆 (開胃菜 🥗、主餐 🍖、飲品 🥤、甜點 🍰)')
    console.log('✅ 產品: 5 筆 (含 SKU、營養資訊、AI 推薦)')
    console.log('✅ 訂單: 2 筆 (1筆準備中、1筆已完成)')
    console.log('✅ 訂單項目: 4 筆')
    console.log('')
    console.log('🎯 產品特色:')
    console.log('   🥗 凱薩沙拉 - AI推薦 (85%受歡迎度)')
    console.log('   🍖 炭烤雞胸 - AI推薦 (92%受歡迎度)')
    console.log('   🥩 安格斯牛排 - AI推薦 (78%受歡迎度)')
    console.log('   ☕ 精品拿鐵 - 經典飲品 (68%受歡迎度)')
    console.log('   🍰 經典提拉米蘇 - AI推薦 (73%受歡迎度)')
    console.log('')
    console.log('🚀 完整的 POS 系統測試環境已就緒！')
    console.log('💡 執行 npm run dev 啟動系統: http://localhost:5177')

  } catch (error) {
    console.error('❌ 載入失敗:', error.message)
    console.error('詳細錯誤:', error)
  }
}

loadSchemaCompliantData()
