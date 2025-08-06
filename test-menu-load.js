import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY;
const restaurantId = process.env.VITE_RESTAURANT_ID;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMenuPageLoad() {
  console.log('🧪 測試菜單管理頁面商品載入...');
  
  try {
    // 模擬新的查詢邏輯（增加了分頁大小）
    const { data, error, count } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `, { count: 'exact' })
      .eq('restaurant_id', restaurantId)
      .order('sort_order', { ascending: true })
      .range(0, 99); // 新的分頁大小：前100項
    
    if (error) {
      console.error('❌ 查詢失敗:', error);
      return;
    }
    
    console.log(`📊 新的查詢結果:`);
    console.log(`  - 總商品數: ${count}`);
    console.log(`  - 載入商品數: ${data?.length || 0}`);
    console.log(`  - 是否有更多: ${count && count > 100 ? '是' : '否'}`);
    
    if (count && count <= 100) {
      console.log('✅ 所有商品都能在第一頁顯示！');
    } else {
      console.log('⚠️ 商品數量超過100個，需要分頁載入');
    }
    
    // 檢查遺漏的商品
    if (data && count && data.length < count) {
      console.log(`\n🔍 還有 ${count - data.length} 個商品未顯示:`);
      
      const { data: missingProducts } = await supabase
        .from('products')
        .select('name')
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true })
        .range(100, count - 1);
      
      missingProducts?.forEach((product, index) => {
        console.log(`  ${index + 101}. ${product.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 執行失敗:', error);
  }
}

testMenuPageLoad();
