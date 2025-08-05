// 完整訂單功能測試
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://arksfwmcmwnyxvlcpskm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU'

const supabase = createClient(supabaseUrl, supabaseKey)

// 模擬前端的訂單創建邏輯
async function createOrderWithTableUpdate(orderData) {
  const orderId = crypto.randomUUID()
  const orderNumber = `ORD-${Date.now()}`
  const now = new Date().toISOString()
  
  // 準備完整的訂單資料 (不設置 session_id，讓它為 null)
  const completeOrderData = {
    id: orderId,
    order_number: orderNumber,
    restaurant_id: orderData.restaurant_id,
    table_id: orderData.table_id,
    table_number: orderData.table_number,
    session_id: null, // 設為 null 避免外鍵約束問題
    order_type: 'dine_in',
    customer_name: orderData.customer_name || '',
    customer_phone: orderData.customer_phone || '',
    customer_email: null,
    party_size: orderData.party_size || 1,
    subtotal: orderData.subtotal,
    discount_amount: 0,
    tax_amount: orderData.tax_amount,
    service_charge: 0,
    total_amount: orderData.total_amount,
    status: orderData.status,
    payment_status: orderData.payment_status,
    ordered_at: now,
    notes: orderData.notes || '',
    source: 'pos',
    created_at: now,
    updated_at: now
  }
  
  console.log('📋 準備創建訂單:', completeOrderData)
  
  try {
    // 1. 保存訂單
    const { data: orderResult, error: orderError } = await supabase
      .from('orders')
      .insert([completeOrderData])
      .select()
      
    if (orderError) {
      console.error('❌ 訂單保存失敗:', orderError)
      return null
    }
    
    console.log('✅ 訂單保存成功')
    
    // 2. 保存訂單項目
    if (orderData.items && orderData.items.length > 0) {
      const orderItems = orderData.items.map(item => ({
        id: crypto.randomUUID(),
        order_id: orderId,
        product_id: item.product_id,
        item_type: 'product',
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        status: item.status,
        special_instructions: item.special_instructions || '',
        ordered_at: now,
        created_at: now,
        updated_at: now
      }))
      
      const { data: itemsResult, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select()
        
      if (itemsError) {
        console.error('❌ 訂單項目保存失敗:', itemsError)
        return null
      }
      
      console.log('✅ 訂單項目保存成功')
    }
    
    // 3. 更新桌台狀態 (也不設置 current_session_id)
    const { data: tableResult, error: tableError } = await supabase
      .from('tables')
      .update({
        status: 'occupied',
        current_session_id: null, // 暫時設為 null
        last_occupied_at: now,
        updated_at: now
      })
      .eq('id', orderData.table_id)
      .select()
      
    if (tableError) {
      console.error('❌ 桌台狀態更新失敗:', tableError)
      return null
    }
    
    console.log('✅ 桌台狀態更新成功')
    
    return orderResult[0]
    
  } catch (error) {
    console.error('❌ 訂單創建過程中發生錯誤:', error)
    return null
  }
}

async function testCompleteOrderFlow() {
  console.log('🧪 測試完整訂單流程')
  console.log('=' .repeat(50))
  
  try {
    // 模擬前端傳入的訂單資料
    const orderData = {
      restaurant_id: '11111111-1111-1111-1111-111111111111',
      table_id: '11111111-1111-1111-1111-111111111102',
      table_number: 2,
      customer_name: '李小明',
      customer_phone: '0987654321',
      party_size: 3,
      subtotal: 340,
      tax_amount: 34,
      total_amount: 374,
      status: 'pending',
      payment_status: 'unpaid',
      notes: '不要辣',
      items: [
        {
          product_id: 'a1111111-1111-1111-1111-111111111111',
          product_name: '招牌牛肉麵',
          quantity: 2,
          unit_price: 180,
          total_price: 360,
          special_instructions: '不要洋蔥',
          status: 'pending'
        },
        {
          product_id: 'b4444444-4444-4444-4444-444444444444',
          product_name: '古早味紅茶',
          quantity: 1,
          unit_price: 30,
          total_price: 30,
          special_instructions: '',
          status: 'pending'
        }
      ]
    }
    
    // 執行訂單創建
    const result = await createOrderWithTableUpdate(orderData)
    
    if (result) {
      console.log('\n🎉 訂單創建流程完全成功！')
      console.log('訂單編號:', result.order_number)
      console.log('訂單ID:', result.id)
      console.log('桌號:', result.table_number)
      console.log('總金額:', result.total_amount)
    } else {
      console.log('\n❌ 訂單創建流程失敗')
    }
    
  } catch (error) {
    console.error('❌ 測試執行失敗:', error)
  }
}

testCompleteOrderFlow()
