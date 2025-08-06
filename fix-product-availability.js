import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY;
const restaurantId = process.env.VITE_RESTAURANT_ID;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProductAvailability() {
  console.log('🔧 修復商品可用狀態...');
  
  try {
    // 更新所有商品為可用狀態
    const { data, error } = await supabase
      .from('products')
      .update({ 
        is_available: true,
        updated_at: new Date().toISOString()
      })
      .eq('restaurant_id', restaurantId);
    
    if (error) {
      console.error('❌ 更新失敗:', error);
      return;
    }
    
    console.log('✅ 成功更新商品狀態');
    
    // 驗證更新結果
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('name, is_available')
      .eq('restaurant_id', restaurantId)
      .order('name');
    
    if (fetchError) {
      console.error('❌ 獲取商品失敗:', fetchError);
      return;
    }
    
    console.log('📊 更新後的商品狀態:');
    products?.forEach(p => {
      console.log(`  - ${p.name}: ${p.is_available ? '✅ 可用' : '❌ 不可用'}`);
    });
    
  } catch (error) {
    console.error('❌ 執行失敗:', error);
  }
}

fixProductAvailability();
