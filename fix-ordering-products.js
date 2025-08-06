import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY;
const restaurantId = process.env.VITE_RESTAURANT_ID;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixOrderingProductsDisplay() {
  console.log('🔧 修復點餐系統商品顯示問題...');
  
  try {
    // 查詢所有 is_active = false 的商品
    const { data: inactiveProducts, error: queryError } = await supabase
      .from('products')
      .select('id, name, is_active')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', false);
    
    if (queryError) {
      console.error('❌ 查詢失敗:', queryError);
      return;
    }
    
    console.log(`📋 找到 ${inactiveProducts?.length || 0} 個需要修復的商品`);
    
    if (inactiveProducts && inactiveProducts.length > 0) {
      // 將所有 is_active = false 的商品設為 true
      const { data: updatedData, error: updateError } = await supabase
        .from('products')
        .update({ is_active: true })
        .eq('restaurant_id', restaurantId)
        .eq('is_active', false)
        .select('id, name');
      
      if (updateError) {
        console.error('❌ 更新失敗:', updateError);
        return;
      }
      
      console.log(`✅ 成功啟用 ${updatedData?.length || 0} 個商品`);
      
      // 驗證修復結果
      const { data: verifyProducts } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      console.log(`🎉 點餐系統現在可顯示 ${verifyProducts?.length || 0} 個商品`);
      
      // 顯示前10個商品作為確認
      if (verifyProducts && verifyProducts.length > 0) {
        console.log('\n📋 修復後的商品清單（前10個）:');
        verifyProducts.slice(0, 10).forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name} (分類: ${product.category})`);
        });
        
        if (verifyProducts.length > 10) {
          console.log(`  ... 還有 ${verifyProducts.length - 10} 個商品`);
        }
      }
      
    } else {
      console.log('✅ 所有商品已經是啟用狀態，無需修復');
    }
    
  } catch (error) {
    console.error('❌ 執行失敗:', error);
  }
}

fixOrderingProductsDisplay();
