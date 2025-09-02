const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testDeliveryOrder() {
  console.log('測試外送訂單建立...');
  
  try {
    // 先查詢正確的餐廳 ID
    const { data: restaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1);
      
    if (restaurantError || !restaurants || restaurants.length === 0) {
      console.log('無法找到餐廳資料:', restaurantError);
      return;
    }
    
    const restaurantId = restaurants[0].id;
    console.log('使用餐廳 ID:', restaurantId);
    
    // 生成正確的 UUID
    const generateUUID = () => {
      try { 
        if (crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID() 
      } catch {}
      const hex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(-4)
      return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`
    }
    
    // 生成測試訂單資料
    const testOrder = {
      id: generateUUID(),
      order_number: 'Uber-123456',
      restaurant_id: restaurantId,
      table_id: null,
      session_id: null,
      order_type: 'delivery',
      customer_name: '測試客戶',
      customer_phone: '0912345678',
      customer_email: null,
      table_number: null,
      party_size: 1,
      subtotal: 100,
      discount_amount: 0,
      tax_amount: 5,
      service_charge: 0,
      total_amount: 105,
      status: 'pending',
      payment_status: 'unpaid',
      ordered_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ai_optimized: false,
      notes: '測試外送訂單',
    };
    
    console.log('準備插入訂單:', testOrder);
    
    const { data, error } = await supabase
      .from('orders')
      .insert([testOrder])
      .select();
    
    if (error) {
      console.error('插入失敗:', error);
      
      // 檢查是否是欄位問題
      if (error.message && error.message.includes('column')) {
        console.log('可能是資料庫欄位問題，檢查 orders 表結構...');
        
        // 嘗試查詢現有訂單結構
        const { data: existingOrders, error: queryError } = await supabase
          .from('orders')
          .select('*')
          .limit(1);
          
        if (!queryError && existingOrders && existingOrders.length > 0) {
          console.log('現有 orders 表欄位:', Object.keys(existingOrders[0]));
        }
      }
    } else {
      console.log('✅ 訂單建立成功:', data);
      
      // 清理測試資料
      await supabase.from('orders').delete().eq('id', testOrder.id);
      console.log('✅ 測試資料已清理');
    }
    
  } catch (err) {
    console.error('測試過程中發生錯誤:', err);
  }
}

testDeliveryOrder();
