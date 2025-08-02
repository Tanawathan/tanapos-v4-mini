import { supabase } from '../lib/supabase.js';

async function initializeData() {
  console.log('🚀 開始初始化新 POS 系統數據...');
  
  try {
    // 1. 確保基本分類存在
    const { data: categories } = await supabase
      .from('categories')
      .select('*');
    
    console.log('現有分類數量:', categories?.length || 0);
    
    if (!categories || categories.length === 0) {
      console.log('插入基本分類...');
      await supabase.from('categories').insert([
        { id: 'cat-1', name: '主餐', description: '主要餐點' },
        { id: 'cat-2', name: '配菜', description: '配菜類' },
        { id: 'cat-3', name: '飲品', description: '飲料類' },
        { id: 'cat-4', name: '甜點', description: '甜點類' },
        { id: 'cat-5', name: '前菜', description: '開胃菜' }
      ]);
    }
    
    // 2. 確保基本產品存在
    const { data: products } = await supabase
      .from('products')
      .select('*');
    
    console.log('現有產品數量:', products?.length || 0);
    
    if (!products || products.length < 5) {
      console.log('插入基本產品...');
      await supabase.from('products').insert([
        { id: 'prod-1', name: '經典漢堡', description: '牛肉漢堡配生菜番茄', price: 120, category_id: 'cat-1', is_available: true },
        { id: 'prod-2', name: '薯條', description: '酥脆黃金薯條', price: 60, category_id: 'cat-2', is_available: true },
        { id: 'prod-3', name: '可樂', description: '冰涼可樂', price: 35, category_id: 'cat-3', is_available: true },
        { id: 'prod-4', name: '雞塊', description: '酥脆雞塊 6 塊', price: 80, category_id: 'cat-2', is_available: true },
        { id: 'prod-5', name: '沙拉', description: '新鮮蔬菜沙拉', price: 90, category_id: 'cat-2', is_available: true },
        { id: 'prod-6', name: '奶昔', description: '香草奶昔', price: 65, category_id: 'cat-3', is_available: true },
        { id: 'prod-7', name: '冰淇淋', description: '香草冰淇淋', price: 45, category_id: 'cat-4', is_available: true },
        { id: 'prod-8', name: '雞翅', description: '烤雞翅 3 隻', price: 95, category_id: 'cat-1', is_available: true }
      ]);
    }
    
    // 3. 確保套餐產品存在
    const { data: combos } = await supabase
      .from('combo_products')
      .select('*');
    
    console.log('現有套餐數量:', combos?.length || 0);
    
    // 4. 將套餐同步到 products 表
    if (combos && combos.length > 0) {
      console.log('同步套餐到 products 表...');
      for (const combo of combos) {
        const { error } = await supabase
          .from('products')
          .upsert({
            id: combo.id,
            name: combo.name,
            description: combo.description,
            price: combo.price,
            category_id: combo.category_id,
            image_url: combo.image_url,
            is_available: combo.is_available
          });
        
        if (error && error.code !== '23505') { // 忽略重複錯誤
          console.error('同步套餐失敗:', combo.name, error);
        } else {
          console.log('✅ 同步套餐:', combo.name);
        }
      }
    }
    
    // 5. 最終檢查
    const { data: finalProducts } = await supabase
      .from('products')
      .select('*');
    
    const { data: finalCombos } = await supabase
      .from('combo_products')
      .select('*');
    
    console.log('🎉 初始化完成!');
    console.log('總產品數量:', finalProducts?.length || 0);
    console.log('套餐數量:', finalCombos?.length || 0);
    
  } catch (error) {
    console.error('❌ 初始化失敗:', error);
  }
}

export default initializeData;
