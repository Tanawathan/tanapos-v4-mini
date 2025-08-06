import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY;
const restaurantId = process.env.VITE_RESTAURANT_ID;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrderingPageProducts() {
  console.log('🔍 檢查點餐系統商品載入問題...');
  
  try {
    // 檢查總商品數
    const { count: totalCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId);
    
    console.log(`📊 總商品數: ${totalCount}`);
    
    // 檢查 is_active 狀態
    const { data: allProducts, error } = await supabase
      .from('products')
      .select('id, name, is_active, is_available, sort_order')
      .eq('restaurant_id', restaurantId)
      .order('sort_order', { ascending: true });
    
    if (error) {
      console.error('❌ 查詢失敗:', error);
      return;
    }
    
    const activeProducts = allProducts?.filter(p => p.is_active) || [];
    const inactiveProducts = allProducts?.filter(p => !p.is_active) || [];
    const availableProducts = allProducts?.filter(p => p.is_available) || [];
    const unavailableProducts = allProducts?.filter(p => !p.is_available) || [];
    
    console.log(`\n📋 商品狀態統計:`);
    console.log(`  - is_active = true: ${activeProducts.length} 個`);
    console.log(`  - is_active = false: ${inactiveProducts.length} 個`);
    console.log(`  - is_available = true: ${availableProducts.length} 個`);
    console.log(`  - is_available = false: ${unavailableProducts.length} 個`);
    
    // 模擬點餐系統的查詢
    const { data: orderingProducts } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    console.log(`\n🛒 點餐系統載入的商品數: ${orderingProducts?.length || 0}`);
    
    if (inactiveProducts.length > 0) {
      console.log(`\n⚠️ 以下 ${inactiveProducts.length} 個商品因 is_active = false 而未顯示:`);
      inactiveProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} (sort_order: ${product.sort_order})`);
      });
    }
    
    if (orderingProducts && orderingProducts.length < totalCount) {
      console.log(`\n🔧 建議修復: 將所有商品的 is_active 設為 true`);
    }
    
  } catch (error) {
    console.error('❌ 執行失敗:', error);
  }
}

checkOrderingPageProducts();
