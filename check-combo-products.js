import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://peubpisofenlyquqnpan.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBldWJwaXNvZmVubHlxdXFucGFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUxOTc5MjQsImV4cCI6MjA1MDc3MzkyNH0.ZQ_r4rGO_g0U9Wm-_UJIxqHZwRfRyJIcrJHTKWJGP0s'
);

async function checkComboInProducts() {
  console.log('=== 檢查套餐是否在 products 表中 ===');
  
  const { data: combos, error: comboError } = await supabase
    .from('combo_products')
    .select('*');
  
  if (comboError) {
    console.error('獲取套餐失敗:', comboError);
    return;
  }
  
  console.log('combo_products 表中的套餐:');
  combos.forEach(combo => {
    console.log('- ID:', combo.id, 'Name:', combo.name);
  });
  
  console.log('\n=== 檢查這些套餐是否在 products 表中 ===');
  
  for (const combo of combos) {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', combo.id)
      .single();
    
    if (productError) {
      console.log('❌ 套餐', combo.name, '(ID:', combo.id, ') 不在 products 表中');
      console.log('   錯誤:', productError.message);
    } else {
      console.log('✅ 套餐', combo.name, '在 products 表中');
    }
  }
  
  console.log('\n=== 插入缺失的套餐到 products 表 ===');
  
  for (const combo of combos) {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', combo.id)
      .single();
    
    if (productError && productError.code === 'PGRST116') {
      // 產品不存在，插入到 products 表
      console.log('插入套餐到 products 表:', combo.name);
      
      const { data: insertData, error: insertError } = await supabase
        .from('products')
        .insert({
          id: combo.id,
          name: combo.name,
          description: combo.description,
          price: combo.price,
          category_id: combo.category_id,
          image_url: combo.image_url,
          is_available: true,
          combo_type: 'selectable'
        });
      
      if (insertError) {
        console.error('插入失敗:', insertError);
      } else {
        console.log('✅ 成功插入套餐:', combo.name);
      }
    }
  }
}

checkComboInProducts().catch(console.error);
