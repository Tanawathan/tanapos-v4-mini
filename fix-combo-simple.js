import { supabase } from './src/lib/supabase.js';

async function fixComboProducts() {
  console.log('=== 修復套餐產品問題 ===');
  
  try {
    // 1. 獲取所有套餐
    const { data: combos, error: comboError } = await supabase
      .from('combo_products')
      .select('*');
    
    if (comboError) {
      console.error('獲取套餐失敗:', comboError);
      return;
    }
    
    console.log(`找到 ${combos.length} 個套餐`);
    
    // 2. 檢查並插入缺失的套餐到 products 表
    for (const combo of combos) {
      console.log(`處理套餐: ${combo.name} (ID: ${combo.id})`);
      
      // 檢查是否已存在
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('id', combo.id)
        .single();
      
      if (existingProduct) {
        console.log(`  ✅ 套餐已存在於 products 表中`);
        continue;
      }
      
      // 插入套餐到 products 表
      const { error: insertError } = await supabase
        .from('products')
        .insert({
          id: combo.id,
          name: combo.name,
          description: combo.description || '',
          price: combo.price,
          category_id: combo.category_id,
          image_url: combo.image_url || null,
          is_available: true
        });
      
      if (insertError) {
        console.error(`  ❌ 插入套餐失敗:`, insertError);
      } else {
        console.log(`  ✅ 成功插入套餐到 products 表`);
      }
    }
    
    console.log('=== 修復完成 ===');
    
  } catch (error) {
    console.error('修復過程出錯:', error);
  }
}

fixComboProducts();
