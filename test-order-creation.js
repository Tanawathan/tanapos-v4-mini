// 測試訂單保存功能
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testOrderCreation() {
  console.log('🧪 測試訂單建立功能')
  console.log('=' .repeat(50))
  
  try {
    // 創建測試訂單
    const testOrder = {
      id: crypto.randomUUID(),
      order_number: `TEST-${Date.now()}`,
      restaurant_id: '11111111-1111-1111-1111-111111111111',
      table_id: '11111111-1111-1111-1111-111111111102', // 桌號 2
      session_id: null,
      order_type: 'dine_in',
      customer_name: '測試客戶',
      customer_phone: '0912345678',
      customer_email: null,
      table_number: 2,
      party_size: 2,
      subtotal: 360,
      discount_amount: 0,
      tax_amount: 36,
      service_charge: 0,
      total_amount: 396,
      status: 'pending',
      payment_status: 'unpaid',
      ordered_at: new Date().toISOString(),
      notes: '測試訂單',
      source: 'pos',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('📋 測試訂單資料:', testOrder)
    
    // 測試保存到 orders 表
    console.log('\n💾 測試保存訂單到資料庫...')
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([testOrder])
      .select()
    
    if (orderError) {
      console.error('❌ 訂單保存失敗:', orderError)
      return
    }
    
    console.log('✅ 訂單保存成功:', orderData)
    
    // 創建測試訂單項目
    const testOrderItems = [
      {
        id: crypto.randomUUID(),
        order_id: testOrder.id,
        product_id: 'a1111111-1111-1111-1111-111111111111',
        product_name: '招牌牛肉麵',
        quantity: 1,
        unit_price: 180,
        total_price: 180,
        special_instructions: '不要洋蔥',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        order_id: testOrder.id,
        product_id: 'a2222222-2222-2222-2222-222222222222',
        product_name: '滷肉飯',
        quantity: 2,
        unit_price: 80,
        total_price: 160,
        special_instructions: '',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]
    
    // 測試保存訂單項目
    console.log('\n💾 測試保存訂單項目...')
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .insert(testOrderItems)
      .select()
    
    if (itemsError) {
      console.error('❌ 訂單項目保存失敗:', itemsError)
    } else {
      console.log('✅ 訂單項目保存成功:', itemsData)
    }
    
    // 測試桌台狀態更新
    console.log('\n💾 測試桌台狀態更新...')
    const { data: tableData, error: tableError } = await supabase
      .from('tables')
      .update({ 
        status: 'occupied',
        current_session_id: testOrder.id,
        last_occupied_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', testOrder.table_id)
      .select()
    
    if (tableError) {
      console.error('❌ 桌台狀態更新失敗:', tableError)
    } else {
      console.log('✅ 桌台狀態更新成功:', tableData)
    }
    
    console.log('\n🎯 測試完成！請檢查資料庫中的訂單資料。')
    
  } catch (e) {
    console.error('💥 測試過程發生錯誤:', e.message)
  }
}

testOrderCreation()
