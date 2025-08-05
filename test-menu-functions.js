#!/usr/bin/env node
/**
 * TanaPOS v4 AI - 菜單管理頁面測試
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const restaurantId = process.env.VITE_RESTAURANT_ID;

async function testMenuFunctions() {
  console.log('🍽️ TanaPOS v4 AI - 菜單管理功能測試');
  console.log('==========================================');
  console.log('');
  
  const supabase = createClient(supabaseUrl, anonKey);
  
  try {
    // 測試分類載入
    console.log('📂 測試分類載入...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('sort_order');
    
    if (catError) {
      console.log('❌ 分類載入失敗:', catError.message);
    } else {
      console.log(`✅ 成功載入 ${categories.length} 個分類:`);
      categories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.icon || '📂'})`);
      });
    }
    console.log('');
    
    // 測試產品載入
    console.log('🍽️ 測試產品載入...');
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select(`
        *,
        categories:category_id (
          name,
          color,
          icon
        )
      `)
      .eq('restaurant_id', restaurantId)
      .eq('is_available', true)
      .order('name');
    
    if (prodError) {
      console.log('❌ 產品載入失敗:', prodError.message);
    } else {
      console.log(`✅ 成功載入 ${products.length} 個產品:`);
      products.slice(0, 5).forEach(prod => {
        console.log(`   - ${prod.name}: $${prod.price} (${prod.categories?.name || '未分類'})`);
      });
      if (products.length > 5) {
        console.log(`   ... 還有 ${products.length - 5} 個產品`);
      }
    }
    console.log('');
    
    // 測試套餐載入  
    console.log('🎁 測試套餐載入...');
    const { data: combos, error: comboError } = await supabase
      .from('combo_products')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_available', true)
      .order('name');
    
    if (comboError) {
      console.log('❌ 套餐載入失敗:', comboError.message);
    } else {
      console.log(`✅ 成功載入 ${combos.length} 個套餐`);
      combos.forEach(combo => {
        console.log(`   - ${combo.name}: $${combo.price}`);
      });
    }
    console.log('');
    
    // 測試寫入權限
    console.log('✏️ 測試寫入權限...');
    
    // 生成有效的 UUID v4 格式
    function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    
    const testCategory = {
      id: generateUUID(),
      restaurant_id: restaurantId,
      name: '測試分類',
      description: '菜單管理測試',
      sort_order: 999,
      color: '#FF0000',
      icon: '🧪',
      is_active: false
    };
    
    const { data: newCat, error: writeError } = await supabase
      .from('categories')
      .insert(testCategory)
      .select()
      .single();
    
    if (writeError) {
      console.log('❌ 寫入測試失敗:', writeError.message);
      console.log('💡 可能需要 RLS 政策調整或使用 Service Key');
    } else {
      console.log('✅ 寫入權限正常');
      
      // 清理測試資料
      await supabase
        .from('categories')
        .delete()
        .eq('id', newCat.id);
      console.log('✅ 測試資料已清理');
    }
    
    console.log('');
    console.log('🎊 菜單管理功能測試完成！');
    
    // 總結
    const workingFeatures = [];
    const brokenFeatures = [];
    
    if (!catError) workingFeatures.push('分類管理');
    else brokenFeatures.push('分類管理');
    
    if (!prodError) workingFeatures.push('產品管理');
    else brokenFeatures.push('產品管理');
    
    if (!comboError) workingFeatures.push('套餐管理');
    else brokenFeatures.push('套餐管理');
    
    if (!writeError) workingFeatures.push('寫入權限');
    else brokenFeatures.push('寫入權限');
    
    console.log('📊 功能狀態總結:');
    console.log(`✅ 正常功能: ${workingFeatures.join(', ')}`);
    if (brokenFeatures.length > 0) {
      console.log(`❌ 需修復功能: ${brokenFeatures.join(', ')}`);
    }
    
  } catch (error) {
    console.log('❌ 測試過程發生錯誤:', error.message);
  }
}

testMenuFunctions()
  .then(() => {
    console.log('🏁 測試完成！');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 測試失敗:', error);
    process.exit(1);
  });
