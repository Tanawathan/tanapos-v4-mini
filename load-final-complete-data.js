// TanaPOS v4 AI - 完整符合 Schema 的最終資料載入
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const RESTAURANT_ID = process.env.VITE_RESTAURANT_ID

const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🎯 TanaPOS v4 AI - 完整符合 Schema 的最終資料載入\n')

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

async function loadFinalCompleteData() {
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
            theme: 'light',
            ai_enabled: true,
            auto_recommendations: true
          },
          is_active: true,
          metadata: {
            description: '完整功能測試餐廳，支援AI智能分析',
            cuisine_type: 'mixed',
            setup_version: 'v4.0-final'
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

    // 3. 載入產品資料
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
        ai_popularity_score: 0.85,
        total_sold: 45,
        revenue_generated: 12600
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
        ai_popularity_score: 0.92,
        total_sold: 62,
        revenue_generated: 29760
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
        ai_popularity_score: 0.78,
        total_sold: 28,
        revenue_generated: 21840
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
        ai_popularity_score: 0.68,
        total_sold: 89,
        revenue_generated: 13350
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
        ai_popularity_score: 0.73,
        total_sold: 34,
        revenue_generated: 6120
      }
    ]

    const { error: prodError } = await supabase
      .from('products')
      .upsert(products, { onConflict: 'id' })

    if (prodError) throw prodError
    console.log('✅ 產品資料載入完成')

    // 4. 載入訂單資料
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

      // 5. 載入訂單項目 (包含所有必要欄位)
      if (insertedOrders && insertedOrders.length > 0) {
        console.log('📝 載入訂單項目...')
        const order1 = insertedOrders.find(o => o.order_number === 'A001')
        const order2 = insertedOrders.find(o => o.order_number === 'B002')

        const orderItems = [
          {
            order_id: order1?.id,
            product_id: PRODUCT_IDS.steak,
            item_type: 'product',
            product_name: '安格斯牛排',
            product_sku: 'MAIN-STEAK-001',
            quantity: 1,
            unit_price: 780,
            total_price: 780,
            cost_price: 350,
            status: 'preparing',
            estimated_prep_time: 30,
            special_instructions: '七分熟',
            kitchen_station: '熱廚',
            priority_level: 2
          },
          {
            order_id: order1?.id,
            product_id: PRODUCT_IDS.latte,
            item_type: 'product',
            product_name: '精品拿鐵',
            product_sku: 'DRINK-LATTE-001',
            quantity: 1,
            unit_price: 150,
            total_price: 150,
            cost_price: 45,
            status: 'preparing',
            estimated_prep_time: 8,
            special_instructions: '',
            kitchen_station: '飲品吧',
            priority_level: 3
          },
          {
            order_id: order2?.id,
            product_id: PRODUCT_IDS.chicken,
            item_type: 'product',
            product_name: '炭烤雞胸',
            product_sku: 'MAIN-CHICKEN-001',
            quantity: 1,
            unit_price: 480,
            total_price: 480,
            cost_price: 220,
            status: 'ready',
            estimated_prep_time: 25,
            actual_prep_time: 22,
            special_instructions: '',
            kitchen_station: '熱廚',
            priority_level: 3,
            quality_checked: true
          },
          {
            order_id: order2?.id,
            product_id: PRODUCT_IDS.latte,
            item_type: 'product',
            product_name: '精品拿鐵',
            product_sku: 'DRINK-LATTE-001',
            quantity: 1,
            unit_price: 150,
            total_price: 150,
            cost_price: 45,
            status: 'ready',
            estimated_prep_time: 8,
            actual_prep_time: 6,
            special_instructions: '低咖啡因',
            kitchen_station: '飲品吧',
            priority_level: 3,
            quality_checked: true
          }
        ]

        const { error: itemError } = await supabase
          .from('order_items')
          .insert(orderItems)

        if (itemError) throw itemError
        console.log('✅ 訂單項目載入完成')
      }
    }

    console.log('\n🎉 TanaPOS v4 AI 完整測試環境載入成功！')
    console.log('')
    console.log('✅ 已載入的資料:')
    console.log('   🏪 餐廳: 1 筆 (含完整設定)')
    console.log('   📂 分類: 4 筆 (開胃菜 🥗、主餐 🍖、飲品 🥤、甜點 🍰)')
    console.log('   🍽️ 產品: 5 筆 (含 SKU、營養資訊、AI 分析、銷售統計)')
    console.log('   📋 訂單: 2 筆 (1筆準備中、1筆已完成)')
    console.log('   📝 訂單項目: 4 筆 (含廚房站點、優先級、品質檢查)')
    console.log('')
    console.log('🎯 AI 推薦產品:')
    console.log('   🥗 凱薩沙拉 - 85%受歡迎度 (已售45份，營收$12,600)')
    console.log('   🍖 炭烤雞胸 - 92%受歡迎度 (已售62份，營收$29,760)')
    console.log('   🥩 安格斯牛排 - 78%受歡迎度 (已售28份，營收$21,840)')
    console.log('   🍰 經典提拉米蘇 - 73%受歡迎度 (已售34份，營收$6,120)')
    console.log('')
    console.log('📊 KDS 系統資料:')
    console.log('   🔄 準備中訂單: A001 (安格斯牛排、精品拿鐵)')
    console.log('   ✅ 完成訂單: B002 (炭烤雞胸、精品拿鐵)')
    console.log('   🏨 廚房站點: 熱廚、飲品吧')
    console.log('   ⚡ 優先級管理: 已設定')
    console.log('')
    console.log('🚀 系統已完全就緒！')
    console.log('💡 執行 npm run dev 啟動完整 POS 系統')
    console.log('🌐 前端地址: http://localhost:5177')
    console.log('')
    console.log('🎮 建議測試流程:')
    console.log('   1. 菜單管理 - 查看 AI 推薦產品')
    console.log('   2. 桌台管理 - 檢查桌台狀態')
    console.log('   3. 訂單系統 - 查看現有訂單和統計')
    console.log('   4. KDS 廚房 - 測試訂單處理流程')
    console.log('   5. 點餐系統 - 建立新的測試訂單')

  } catch (error) {
    console.error('❌ 載入失敗:', error.message)
    console.error('詳細錯誤:', error)
  }
}

loadFinalCompleteData()
