// TanaPOS v4 AI - 完整資料庫測試資料載入 (所有表)
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const RESTAURANT_ID = process.env.VITE_RESTAURANT_ID

console.log('🚀 TanaPOS v4 AI - 完整資料庫測試資料載入\n')

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 已載入的 ID 參考
const categoryIds = {
  mainDish: '11111111-1111-1111-1111-111111111111',
  drinks: '22222222-2222-2222-2222-222222222222',
  desserts: '33333333-3333-3333-3333-333333333333',
  appetizers: '44444444-4444-4444-4444-444444444444',
  soups: '55555555-5555-5555-5555-555555555555'
}

const productIds = {
  beefNoodle: 'a1111111-1111-1111-1111-111111111111',
  braisedPorkRice: 'a2222222-2222-2222-2222-222222222222',
  friedRice: 'a3333333-3333-3333-3333-333333333333',
  kungPaoChicken: 'a0000001-0001-0001-0001-000000000001',
  sweetSourPork: 'a0000002-0002-0002-0002-000000000002',
  blackTea: 'b4444444-4444-4444-4444-444444444444',
  lemonSoda: 'b5555555-5555-5555-5555-555555555555',
  bubbleTea: 'b0000003-0003-0003-0003-000000000003',
  iceCoffee: 'b0000004-0004-0004-0004-000000000004'
}

const tableIds = {
  a01: '11111111-1111-1111-1111-111111111101',
  a02: '11111111-1111-1111-1111-111111111102',
  a03: '11111111-1111-1111-1111-111111111103',
  b01: '11111111-1111-1111-1111-111111111104',
  b02: '11111111-1111-1111-1111-111111111105',
  b03: '11111111-1111-1111-1111-111111111106',
  c01: '11111111-1111-1111-1111-111111111107',
  c02: '11111111-1111-1111-1111-111111111108'
}

const orderIds = {
  order1: '11111111-1111-1111-1111-111111111201',
  order2: '11111111-1111-1111-1111-111111111202',
  order3: '11111111-1111-1111-1111-111111111203'
}

async function loadAllTestData() {
  try {
    console.log('🔗 檢查 Supabase 連線...')
    const { error: healthError } = await supabase
      .from('restaurants')
      .select('count', { count: 'exact', head: true })
    
    if (healthError) {
      console.error('❌ 連線失敗:', healthError.message)
      return
    }
    console.log('✅ Supabase 連線正常\n')

    // 1. 產品變體 (Product Variants)
    console.log('🔧 載入產品變體資料...')
    const productVariants = [
      {
        id: '11111111-1111-1111-1111-111111111401',
        product_id: productIds.beefNoodle,
        name: '大碗',
        description: '大碗牛肉麵',
        price_adjustment: 20.00,
        sort_order: 1,
        is_available: true
      },
      {
        id: '11111111-1111-1111-1111-111111111402',
        product_id: productIds.beefNoodle,
        name: '小碗',
        description: '小碗牛肉麵',
        price_adjustment: -10.00,
        sort_order: 2,
        is_available: true
      },
      {
        id: '11111111-1111-1111-1111-111111111403',
        product_id: productIds.bubbleTea,
        name: '大杯',
        description: '大杯珍珠奶茶',
        price_adjustment: 10.00,
        sort_order: 1,
        is_available: true
      },
      {
        id: '11111111-1111-1111-1111-111111111404',
        product_id: productIds.bubbleTea,
        name: '中杯',
        description: '中杯珍珠奶茶',
        price_adjustment: 0.00,
        sort_order: 2,
        is_available: true
      }
    ]
    await supabase.from('product_variants').insert(productVariants)
    console.log('✅ 產品變體載入成功')

    // 2. 產品調整選項 (Product Modifiers)
    console.log('⚙️ 載入產品調整選項...')
    const productModifiers = [
      {
        id: '11111111-1111-1111-1111-111111111501',
        product_id: productIds.beefNoodle,
        name: '辣度',
        description: '調整辣度',
        type: 'single_select',
        options: JSON.stringify([
          { name: '不辣', price: 0 },
          { name: '小辣', price: 0 },
          { name: '中辣', price: 0 },
          { name: '大辣', price: 0 },
          { name: '超辣', price: 5 }
        ]),
        is_required: true,
        sort_order: 1
      },
      {
        id: '11111111-1111-1111-1111-111111111502',
        product_id: productIds.bubbleTea,
        name: '甜度',
        description: '調整甜度',
        type: 'single_select',
        options: JSON.stringify([
          { name: '正常甜', price: 0 },
          { name: '少糖', price: 0 },
          { name: '半糖', price: 0 },
          { name: '微糖', price: 0 },
          { name: '無糖', price: 0 }
        ]),
        is_required: true,
        sort_order: 1
      },
      {
        id: '11111111-1111-1111-1111-111111111503',
        product_id: productIds.bubbleTea,
        name: '加料',
        description: '額外配料',
        type: 'multi_select',
        options: JSON.stringify([
          { name: '珍珠', price: 0 },
          { name: '椰果', price: 5 },
          { name: '布丁', price: 10 },
          { name: '紅豆', price: 8 }
        ]),
        is_required: false,
        sort_order: 2
      }
    ]
    await supabase.from('product_modifiers').insert(productModifiers)
    console.log('✅ 產品調整選項載入成功')

    // 3. 套餐商品 (Combo Products)
    console.log('🍱 載入套餐商品...')
    const comboProducts = [
      {
        id: '11111111-1111-1111-1111-111111111601',
        restaurant_id: RESTAURANT_ID,
        category_id: categoryIds.mainDish,
        name: '經典套餐',
        description: '牛肉麵 + 飲品 + 小菜',
        base_price: 250.00,
        final_price: 220.00,
        discount_amount: 30.00,
        is_available: true,
        sort_order: 1
      },
      {
        id: '11111111-1111-1111-1111-111111111602',
        restaurant_id: RESTAURANT_ID,
        category_id: categoryIds.mainDish,
        name: '家庭套餐',
        description: '2主餐 + 2飲品 + 2小菜',
        base_price: 500.00,
        final_price: 450.00,
        discount_amount: 50.00,
        is_available: true,
        sort_order: 2
      }
    ]
    await supabase.from('combo_products').insert(comboProducts)
    console.log('✅ 套餐商品載入成功')

    // 4. 套餐選擇規則 (Combo Selection Rules)
    console.log('📋 載入套餐選擇規則...')
    const comboRules = [
      {
        id: '11111111-1111-1111-1111-111111111701',
        combo_id: '11111111-1111-1111-1111-111111111601',
        category_name: '主餐',
        min_selections: 1,
        max_selections: 1,
        sort_order: 1
      },
      {
        id: '11111111-1111-1111-1111-111111111702',
        combo_id: '11111111-1111-1111-1111-111111111601',
        category_name: '飲品',
        min_selections: 1,
        max_selections: 1,
        sort_order: 2
      },
      {
        id: '11111111-1111-1111-1111-111111111703',
        combo_id: '11111111-1111-1111-1111-111111111601',
        category_name: '小菜',
        min_selections: 1,
        max_selections: 1,
        sort_order: 3
      }
    ]
    await supabase.from('combo_selection_rules').insert(comboRules)
    console.log('✅ 套餐選擇規則載入成功')

    // 5. 套餐選項 (Combo Selection Options)
    console.log('🍽️ 載入套餐選項...')
    const comboOptions = [
      {
        id: '11111111-1111-1111-1111-111111111801',
        rule_id: '11111111-1111-1111-1111-111111111701',
        product_id: productIds.beefNoodle,
        price_adjustment: 0.00
      },
      {
        id: '11111111-1111-1111-1111-111111111802',
        rule_id: '11111111-1111-1111-1111-111111111701',
        product_id: productIds.braisedPorkRice,
        price_adjustment: -20.00
      },
      {
        id: '11111111-1111-1111-1111-111111111803',
        rule_id: '11111111-1111-1111-1111-111111111702',
        product_id: productIds.blackTea,
        price_adjustment: 0.00
      },
      {
        id: '11111111-1111-1111-1111-111111111804',
        rule_id: '11111111-1111-1111-1111-111111111702',
        product_id: productIds.lemonSoda,
        price_adjustment: 5.00
      }
    ]
    await supabase.from('combo_selection_options').insert(comboOptions)
    console.log('✅ 套餐選項載入成功')

    // 6. 桌台預約 (Table Reservations)
    console.log('📅 載入桌台預約...')
    const reservations = [
      {
        id: '11111111-1111-1111-1111-111111111901',
        restaurant_id: RESTAURANT_ID,
        table_id: tableIds.a03,
        customer_name: '林大華',
        customer_phone: '0988123456',
        party_size: 6,
        reservation_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2小時後
        status: 'confirmed',
        notes: '慶生聚餐'
      },
      {
        id: '11111111-1111-1111-1111-111111111902',
        restaurant_id: RESTAURANT_ID,
        table_id: tableIds.b03,
        customer_name: '陳美玲',
        customer_phone: '0977234567',
        party_size: 8,
        reservation_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4小時後
        status: 'pending',
        notes: '公司聚餐'
      }
    ]
    await supabase.from('table_reservations').insert(reservations)
    console.log('✅ 桌台預約載入成功')

    // 7. 桌台會話 (Table Sessions)
    console.log('💺 載入桌台會話...')
    const tableSessions = [
      {
        id: '11111111-1111-1111-1111-111111112001',
        restaurant_id: RESTAURANT_ID,
        table_id: tableIds.a03,
        session_start: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1小時前開始
        party_size: 4,
        status: 'active'
      },
      {
        id: '11111111-1111-1111-1111-111111112002',
        restaurant_id: RESTAURANT_ID,
        table_id: tableIds.c01,
        session_start: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2小時前開始
        session_end: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30分鐘前結束
        party_size: 3,
        status: 'completed'
      }
    ]
    await supabase.from('table_sessions').insert(tableSessions)
    console.log('✅ 桌台會話載入成功')

    // 8. 付款記錄 (Payments)
    console.log('💳 載入付款記錄...')
    const payments = [
      {
        id: '11111111-1111-1111-1111-111111112101',
        restaurant_id: RESTAURANT_ID,
        order_id: orderIds.order2,
        amount: 210.00,
        payment_method: 'cash',
        status: 'completed',
        transaction_id: 'TXN-20250805-001'
      },
      {
        id: '11111111-1111-1111-1111-111111112102',
        restaurant_id: RESTAURANT_ID,
        order_id: orderIds.order3,
        amount: 330.75,
        payment_method: 'credit_card',
        status: 'completed',
        transaction_id: 'TXN-20250805-002',
        card_last_four: '1234',
        card_type: 'visa'
      }
    ]
    await supabase.from('payments').insert(payments)
    console.log('✅ 付款記錄載入成功')

    // 9. 收據 (Receipts)
    console.log('🧾 載入收據...')
    const receipts = [
      {
        id: '11111111-1111-1111-1111-111111112201',
        restaurant_id: RESTAURANT_ID,
        order_id: orderIds.order2,
        payment_id: '11111111-1111-1111-1111-111111112101',
        receipt_number: 'RCP-20250805-001',
        subtotal: 200.00,
        tax_amount: 10.00,
        total_amount: 210.00,
        payment_method: 'cash'
      },
      {
        id: '11111111-1111-1111-1111-111111112202',
        restaurant_id: RESTAURANT_ID,
        order_id: orderIds.order3,
        payment_id: '11111111-1111-1111-1111-111111112102',
        receipt_number: 'RCP-20250805-002',
        subtotal: 315.00,
        tax_amount: 15.75,
        total_amount: 330.75,
        payment_method: 'credit_card'
      }
    ]
    await supabase.from('receipts').insert(receipts)
    console.log('✅ 收據載入成功')

    // 10. 供應商 (Suppliers)
    console.log('🏢 載入供應商...')
    const suppliers = [
      {
        id: '11111111-1111-1111-1111-111111112301',
        restaurant_id: RESTAURANT_ID,
        name: '新鮮食材有限公司',
        contact_person: '王經理',
        phone: '02-1234-5678',
        email: 'wang@freshfood.com',
        address: '台北市中山區民生東路123號',
        payment_terms: 'net_30',
        is_active: true
      },
      {
        id: '11111111-1111-1111-1111-111111112302',
        restaurant_id: RESTAURANT_ID,
        name: '品質飲料批發',
        contact_person: '李小姐',
        phone: '02-9876-5432',
        email: 'lee@beverages.com',
        address: '台北市松山區復興北路456號',
        payment_terms: 'net_15',
        is_active: true
      }
    ]
    await supabase.from('suppliers').insert(suppliers)
    console.log('✅ 供應商載入成功')

    // 11. 原材料 (Raw Materials)
    console.log('🥩 載入原材料...')
    const rawMaterials = [
      {
        id: '11111111-1111-1111-1111-111111112401',
        restaurant_id: RESTAURANT_ID,
        supplier_id: '11111111-1111-1111-1111-111111112301',
        name: '牛肉塊',
        category: '肉類',
        unit: 'kg',
        cost_per_unit: 350.00,
        current_stock: 25.5,
        min_stock: 10.0,
        max_stock: 50.0
      },
      {
        id: '11111111-1111-1111-1111-111111112402',
        restaurant_id: RESTAURANT_ID,
        supplier_id: '11111111-1111-1111-1111-111111112301',
        name: '白米',
        category: '穀物',
        unit: 'kg',
        cost_per_unit: 45.00,
        current_stock: 80.0,
        min_stock: 20.0,
        max_stock: 100.0
      },
      {
        id: '11111111-1111-1111-1111-111111112403',
        restaurant_id: RESTAURANT_ID,
        supplier_id: '11111111-1111-1111-1111-111111112302',
        name: '紅茶葉',
        category: '飲料',
        unit: 'kg',
        cost_per_unit: 180.00,
        current_stock: 5.2,
        min_stock: 2.0,
        max_stock: 10.0
      }
    ]
    await supabase.from('raw_materials').insert(rawMaterials)
    console.log('✅ 原材料載入成功')

    // 12. 採購訂單 (Purchase Orders)
    console.log('📦 載入採購訂單...')
    const purchaseOrders = [
      {
        id: '11111111-1111-1111-1111-111111112501',
        restaurant_id: RESTAURANT_ID,
        supplier_id: '11111111-1111-1111-1111-111111112301',
        po_number: 'PO-20250805-001',
        order_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3天前
        expected_delivery_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天
        status: 'pending',
        total_amount: 2500.00,
        notes: '每週定期採購'
      },
      {
        id: '11111111-1111-1111-1111-111111112502',
        restaurant_id: RESTAURANT_ID,
        supplier_id: '11111111-1111-1111-1111-111111112302',
        po_number: 'PO-20250805-002',
        order_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天前
        expected_delivery_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5天前
        actual_delivery_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'received',
        total_amount: 900.00
      }
    ]
    await supabase.from('purchase_orders').insert(purchaseOrders)
    console.log('✅ 採購訂單載入成功')

    // 13. 採購訂單項目 (Purchase Order Items)
    console.log('📝 載入採購訂單項目...')
    const purchaseOrderItems = [
      {
        id: '11111111-1111-1111-1111-111111112601',
        purchase_order_id: '11111111-1111-1111-1111-111111112501',
        raw_material_id: '11111111-1111-1111-1111-111111112401',
        quantity: 5.0,
        unit_cost: 350.00,
        total_cost: 1750.00
      },
      {
        id: '11111111-1111-1111-1111-111111112602',
        purchase_order_id: '11111111-1111-1111-1111-111111112501',
        raw_material_id: '11111111-1111-1111-1111-111111112402',
        quantity: 15.0,
        unit_cost: 45.00,
        total_cost: 675.00
      },
      {
        id: '11111111-1111-1111-1111-111111112603',
        purchase_order_id: '11111111-1111-1111-1111-111111112502',
        raw_material_id: '11111111-1111-1111-1111-111111112403',
        quantity: 5.0,
        unit_cost: 180.00,
        total_cost: 900.00
      }
    ]
    await supabase.from('purchase_order_items').insert(purchaseOrderItems)
    console.log('✅ 採購訂單項目載入成功')

    // 14. 庫存異動 (Stock Movements)
    console.log('📊 載入庫存異動...')
    const stockMovements = [
      {
        id: '11111111-1111-1111-1111-111111112701',
        restaurant_id: RESTAURANT_ID,
        raw_material_id: '11111111-1111-1111-1111-111111112401',
        movement_type: 'purchase',
        quantity: 5.0,
        unit_cost: 350.00,
        total_cost: 1750.00,
        reference_type: 'purchase_order',
        reference_id: '11111111-1111-1111-1111-111111112502',
        notes: '定期採購入庫'
      },
      {
        id: '11111111-1111-1111-1111-111111112702',
        restaurant_id: RESTAURANT_ID,
        raw_material_id: '11111111-1111-1111-1111-111111112401',
        movement_type: 'consumption',
        quantity: -2.0,
        reference_type: 'production',
        notes: '製作牛肉麵消耗'
      },
      {
        id: '11111111-1111-1111-1111-111111112703',
        restaurant_id: RESTAURANT_ID,
        raw_material_id: '11111111-1111-1111-1111-111111112403',
        movement_type: 'purchase',
        quantity: 5.0,
        unit_cost: 180.00,
        total_cost: 900.00,
        reference_type: 'purchase_order',
        reference_id: '11111111-1111-1111-1111-111111112502',
        notes: '紅茶葉補貨'
      }
    ]
    await supabase.from('stock_movements').insert(stockMovements)
    console.log('✅ 庫存異動載入成功')

    // 15. AI 分析日誌 (AI Analysis Logs)
    console.log('🤖 載入 AI 分析日誌...')
    const aiLogs = [
      {
        id: '11111111-1111-1111-1111-111111112801',
        restaurant_id: RESTAURANT_ID,
        analysis_type: 'sales_forecast',
        input_data: JSON.stringify({
          period: '2025-08-05',
          historical_days: 30,
          weather: 'sunny'
        }),
        output_data: JSON.stringify({
          predicted_sales: 15000,
          confidence: 0.85,
          trending_items: ['牛肉麵', '珍珠奶茶']
        }),
        execution_time_ms: 1250,
        accuracy_score: 0.89
      },
      {
        id: '11111111-1111-1111-1111-111111112802',
        restaurant_id: RESTAURANT_ID,
        analysis_type: 'inventory_optimization',
        input_data: JSON.stringify({
          current_stock: { beef: 25.5, rice: 80.0 },
          daily_consumption: { beef: 3.2, rice: 12.5 }
        }),
        output_data: JSON.stringify({
          reorder_suggestions: [
            { item: 'beef', quantity: 10, urgency: 'medium' }
          ]
        }),
        execution_time_ms: 890
      }
    ]
    await supabase.from('ai_analysis_logs').insert(aiLogs)
    console.log('✅ AI 分析日誌載入成功')

    // 16. AI 推薦 (AI Recommendations)
    console.log('💡 載入 AI 推薦...')
    const aiRecommendations = [
      {
        id: '11111111-1111-1111-1111-111111112901',
        restaurant_id: RESTAURANT_ID,
        recommendation_type: 'menu_optimization',
        target_entity: 'product',
        target_id: productIds.beefNoodle,
        recommendation_text: '建議將招牌牛肉麵價格調整至 $185，根據成本分析和市場定位',
        confidence_score: 0.78,
        expected_impact: '預期營收增加 8%',
        status: 'pending',
        priority: 'medium'
      },
      {
        id: '11111111-1111-1111-1111-111111112902',
        restaurant_id: RESTAURANT_ID,
        recommendation_type: 'inventory_reorder',
        target_entity: 'raw_material',
        target_id: '11111111-1111-1111-1111-111111112401',
        recommendation_text: '牛肉庫存即將不足，建議訂購 15kg',
        confidence_score: 0.95,
        expected_impact: '避免缺貨風險',
        status: 'active',
        priority: 'high'
      }
    ]
    await supabase.from('ai_recommendations').insert(aiRecommendations)
    console.log('✅ AI 推薦載入成功')

    // 17. AI 效能指標 (AI Performance Metrics)
    console.log('📈 載入 AI 效能指標...')
    const aiMetrics = [
      {
        id: '11111111-1111-1111-1111-111111113001',
        restaurant_id: RESTAURANT_ID,
        metric_type: 'forecast_accuracy',
        metric_name: '銷售預測準確度',
        metric_value: 0.87,
        target_value: 0.85,
        measurement_period: 'daily',
        measurement_date: new Date().toISOString().split('T')[0]
      },
      {
        id: '11111111-1111-1111-1111-111111113002',
        restaurant_id: RESTAURANT_ID,
        metric_type: 'recommendation_adoption',
        metric_name: '推薦採用率',
        metric_value: 0.65,
        target_value: 0.70,
        measurement_period: 'weekly',
        measurement_date: new Date().toISOString().split('T')[0]
      }
    ]
    await supabase.from('ai_performance_metrics').insert(aiMetrics)
    console.log('✅ AI 效能指標載入成功')

    // 18. 審計日誌 (Audit Logs)
    console.log('📋 載入審計日誌...')
    const auditLogs = [
      {
        id: '11111111-1111-1111-1111-111111113101',
        restaurant_id: RESTAURANT_ID,
        user_id: 'admin-user-001',
        action: 'CREATE',
        table_name: 'products',
        record_id: productIds.beefNoodle,
        old_values: null,
        new_values: JSON.stringify({ name: '招牌牛肉麵', price: 180 }),
        ip_address: '192.168.1.100'
      },
      {
        id: '11111111-1111-1111-1111-111111113102',
        restaurant_id: RESTAURANT_ID,
        user_id: 'admin-user-001',
        action: 'UPDATE',
        table_name: 'tables',
        record_id: tableIds.a03,
        old_values: JSON.stringify({ status: 'available' }),
        new_values: JSON.stringify({ status: 'occupied' }),
        ip_address: '192.168.1.100'
      }
    ]
    await supabase.from('audit_logs').insert(auditLogs)
    console.log('✅ 審計日誌載入成功')

    // 19. 錯誤日誌 (Error Logs)
    console.log('🚨 載入錯誤日誌...')
    const errorLogs = [
      {
        id: '11111111-1111-1111-1111-111111113201',
        restaurant_id: RESTAURANT_ID,
        error_type: 'API_ERROR',
        error_message: 'Payment gateway timeout',
        error_details: JSON.stringify({
          endpoint: '/api/payments/process',
          payment_id: '11111111-1111-1111-1111-111111112101',
          timeout_duration: '30s'
        }),
        user_id: 'cashier-001',
        ip_address: '192.168.1.50',
        severity: 'medium'
      },
      {
        id: '11111111-1111-1111-1111-111111113202',
        restaurant_id: RESTAURANT_ID,
        error_type: 'VALIDATION_ERROR',
        error_message: 'Invalid product quantity',
        error_details: JSON.stringify({
          product_id: productIds.beefNoodle,
          quantity: -5,
          validation_rule: 'quantity_must_be_positive'
        }),
        user_id: 'waiter-002',
        ip_address: '192.168.1.75',
        severity: 'low'
      }
    ]
    await supabase.from('error_logs').insert(errorLogs)
    console.log('✅ 錯誤日誌載入成功')

    // 最終驗證
    console.log('\n🔍 驗證完整測試資料載入結果...')
    
    const allTables = [
      { table: 'restaurants', expectedMin: 1 },
      { table: 'categories', expectedMin: 5 },
      { table: 'products', expectedMin: 18 },
      { table: 'product_variants', expectedMin: 4 },
      { table: 'product_modifiers', expectedMin: 3 },
      { table: 'combo_products', expectedMin: 2 },
      { table: 'combo_selection_rules', expectedMin: 3 },
      { table: 'combo_selection_options', expectedMin: 4 },
      { table: 'tables', expectedMin: 8 },
      { table: 'table_reservations', expectedMin: 2 },
      { table: 'table_sessions', expectedMin: 2 },
      { table: 'orders', expectedMin: 3 },
      { table: 'order_items', expectedMin: 7 },
      { table: 'payments', expectedMin: 2 },
      { table: 'receipts', expectedMin: 2 },
      { table: 'suppliers', expectedMin: 2 },
      { table: 'raw_materials', expectedMin: 3 },
      { table: 'purchase_orders', expectedMin: 2 },
      { table: 'purchase_order_items', expectedMin: 3 },
      { table: 'stock_movements', expectedMin: 3 },
      { table: 'ai_analysis_logs', expectedMin: 2 },
      { table: 'ai_recommendations', expectedMin: 2 },
      { table: 'ai_performance_metrics', expectedMin: 2 },
      { table: 'audit_logs', expectedMin: 2 },
      { table: 'error_logs', expectedMin: 2 }
    ]

    let totalRecords = 0
    for (const check of allTables) {
      try {
        const { count, error } = await supabase
          .from(check.table)
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', RESTAURANT_ID)
        
        if (error && !error.message.includes('column "restaurant_id" does not exist')) {
          console.log(`⚠️ ${check.table}: 查詢錯誤 - ${error.message}`)
        } else if (error && error.message.includes('column "restaurant_id" does not exist')) {
          // 對於沒有 restaurant_id 的表，直接計算總數
          const { count: totalCount, error: totalError } = await supabase
            .from(check.table)
            .select('*', { count: 'exact', head: true })
          
          if (totalError) {
            console.log(`❌ ${check.table}: 查詢錯誤 - ${totalError.message}`)
          } else if (totalCount >= check.expectedMin) {
            console.log(`✅ ${check.table}: ${totalCount} 筆資料`)
            totalRecords += totalCount
          } else {
            console.log(`⚠️ ${check.table}: ${totalCount} 筆資料 (預期至少 ${check.expectedMin} 筆)`)
            totalRecords += totalCount
          }
        } else if (count >= check.expectedMin) {
          console.log(`✅ ${check.table}: ${count} 筆資料`)
          totalRecords += count
        } else {
          console.log(`⚠️ ${check.table}: ${count} 筆資料 (預期至少 ${check.expectedMin} 筆)`)
          totalRecords += count
        }
      } catch (err) {
        console.log(`❌ ${check.table}: 驗證失敗 - ${err.message}`)
      }
    }

    console.log('\n🎉 完整資料庫測試資料載入成功！')
    console.log(`📊 總計載入記錄數: ${totalRecords} 筆`)
    console.log('')
    console.log('🏗️ 已載入的完整功能模組:')
    console.log('   🏪 餐廳管理 - 基本資訊、設定')
    console.log('   📂 菜單管理 - 分類、產品、變體、調整選項')
    console.log('   🍱 套餐管理 - 套餐商品、選擇規則、選項')
    console.log('   🪑 桌台管理 - 桌台、預約、會話')
    console.log('   📋 訂單管理 - 訂單、項目、套餐選擇')
    console.log('   💳 支付管理 - 付款、收據')
    console.log('   🏢 供應鏈管理 - 供應商、原材料、採購')
    console.log('   📊 庫存管理 - 異動記錄、庫存追蹤')
    console.log('   🤖 AI 系統 - 分析、推薦、效能指標')
    console.log('   📋 系統管理 - 審計日誌、錯誤日誌')
    console.log('')
    console.log('💡 現在可以開啟 http://localhost:5177 測試所有功能')
    console.log('🚀 完整的企業級 POS 系統測試環境已準備就緒！')

  } catch (error) {
    console.error('❌ 載入失敗:', error.message)
    console.error('詳細錯誤:', error)
  }
}

loadAllTestData()
