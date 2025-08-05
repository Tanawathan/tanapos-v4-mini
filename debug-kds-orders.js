import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 載入環境變數
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const restaurantId = process.env.VITE_RESTAURANT_ID;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugKDSOrders() {
  try {
    console.log('🔍 KDS 訂單診斷...');
    console.log(`📍 餐廳ID: ${restaurantId}`);
    
    // 1. 檢查餐廳資料
    const { data: restaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*');
    
    if (restaurantError) throw restaurantError;
    console.log('\n🏪 餐廳資料:', restaurants);
    
    // 2. 檢查所有訂單
    const { data: allOrders, error: allOrdersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (allOrdersError) throw allOrdersError;
    console.log(`\n📋 所有訂單數量: ${allOrders?.length || 0}`);
    if (allOrders && allOrders.length > 0) {
      console.log('📋 最新訂單:', allOrders.slice(0, 3));
    }
    
    // 3. 檢查指定餐廳的訂單
    const { data: restaurantOrders, error: restaurantOrdersError } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    
    if (restaurantOrdersError) throw restaurantOrdersError;
    console.log(`\n🍽️ 餐廳 ${restaurantId} 的訂單數量: ${restaurantOrders?.length || 0}`);
    if (restaurantOrders && restaurantOrders.length > 0) {
      console.log('🍽️ 餐廳訂單:', restaurantOrders);
    }
    
    // 4. 檢查今天的訂單
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayOrders, error: todayOrdersError } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });
    
    if (todayOrdersError) throw todayOrdersError;
    console.log(`\n📅 今天的訂單數量: ${todayOrders?.length || 0}`);
    if (todayOrders && todayOrders.length > 0) {
      console.log('📅 今天的訂單:', todayOrders);
    }
    
    // 5. 檢查有效狀態的訂單（KDS應該顯示的）
    const { data: activeOrders, error: activeOrdersError } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .gte('created_at', today.toISOString())
      .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
      .order('created_at', { ascending: false });
    
    if (activeOrdersError) throw activeOrdersError;
    console.log(`\n🔥 KDS應顯示的有效訂單數量: ${activeOrders?.length || 0}`);
    if (activeOrders && activeOrders.length > 0) {
      console.log('🔥 有效訂單詳細:', activeOrders);
    }
    
    // 6. 檢查訂單項目
    if (activeOrders && activeOrders.length > 0) {
      for (const order of activeOrders) {
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            *,
            products (
              name,
              category_id,
              categories (
                name
              )
            )
          `)
          .eq('order_id', order.id);
        
        if (itemsError) {
          console.error(`❌ 訂單 ${order.id} 的項目查詢失敗:`, itemsError);
        } else {
          console.log(`\n🍜 訂單 ${order.order_number} 的項目:`, orderItems);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 診斷失敗:', error);
  }
}

debugKDSOrders();
