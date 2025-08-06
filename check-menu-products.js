import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY;
const restaurantId = process.env.VITE_RESTAURANT_ID;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductsLoad() {
  console.log('🔍 檢查菜單管理頁面的商品載入...');
  
  try {
    // 模擬菜單服務的查詢
    const { data, error, count } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `, { count: 'exact' })
      .eq('restaurant_id', restaurantId)
      .order('sort_order', { ascending: true })
      .range(0, 49); // 預設分頁：前50項
    
    if (error) {
      console.error('❌ 查詢失敗:', error);
      return;
    }
    
    console.log(`📊 查詢結果:`);
    console.log(`  - 總商品數: ${count}`);
    console.log(`  - 本頁商品數: ${data?.length || 0}`);
    console.log(`  - 分頁範圍: 0-49 (前50項)`);
    
    console.log('\n📝 商品列表:');
    data?.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} - NT$${product.price} - ${product.is_available ? '✅' : '❌'} - 分類: ${product.category?.name || '無'}`);
    });
    
    // 檢查是否有被篩選掉的商品
    const { data: allProducts } = await supabase
      .from('products')
      .select('id, name, is_available')
      .eq('restaurant_id', restaurantId);
    
    const unavailableCount = allProducts?.filter(p => !p.is_available).length || 0;
    console.log(`\n🔍 商品狀態統計:`);
    console.log(`  - 可用商品: ${(allProducts?.length || 0) - unavailableCount}`);
    console.log(`  - 不可用商品: ${unavailableCount}`);
    
  } catch (error) {
    console.error('❌ 執行失敗:', error);
  }
}

checkProductsLoad();
