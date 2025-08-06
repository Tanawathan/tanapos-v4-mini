import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY;
const restaurantId = process.env.VITE_RESTAURANT_ID;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkComboProductsStatus() {
  console.log('🔍 檢查套餐管理與點餐系統整合狀況...');
  
  try {
    // 檢查套餐總數
    const { count: totalCombos } = await supabase
      .from('combo_products')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId);
    
    console.log(`📊 總套餐數: ${totalCombos || 0}`);
    
    // 檢查套餐狀態
    const { data: allCombos, error } = await supabase
      .from('combo_products')
      .select('id, name, is_available, combo_type, price, category_id')
      .eq('restaurant_id', restaurantId)
      .order('name', { ascending: true });
    
    if (error) {
      console.error('❌ 查詢失敗:', error);
      return;
    }
    
    if (!allCombos || allCombos.length === 0) {
      console.log('\n⚠️ 目前沒有任何套餐資料');
      console.log('📝 建議：到菜單管理的套餐管理頁面新增套餐');
      return;
    }
    
    const availableCombos = allCombos.filter(c => c.is_available);
    const unavailableCombos = allCombos.filter(c => !c.is_available);
    const fixedCombos = allCombos.filter(c => c.combo_type === 'fixed');
    const selectableCombos = allCombos.filter(c => c.combo_type === 'selectable');
    
    console.log(`\n📋 套餐狀態統計:`);
    console.log(`  - is_available = true: ${availableCombos.length} 個`);
    console.log(`  - is_available = false: ${unavailableCombos.length} 個`);
    console.log(`  - 固定套餐: ${fixedCombos.length} 個`);
    console.log(`  - 自選套餐: ${selectableCombos.length} 個`);
    
    // 模擬點餐系統的查詢 (根據 store.ts 的邏輯)
    const { data: orderingCombos } = await supabase
      .from('combo_products')
      .select('*')
      .eq('is_available', true)
      .order('name', { ascending: true });
    
    console.log(`\n🛒 點餐系統載入的套餐數: ${orderingCombos?.length || 0}`);
    
    if (allCombos.length > 0) {
      console.log(`\n📃 套餐清單:`);
      allCombos.forEach((combo, index) => {
        const status = combo.is_available ? '✅' : '❌';
        const type = combo.combo_type === 'fixed' ? '固定' : '自選';
        console.log(`  ${index + 1}. ${status} ${combo.name} (${type}套餐, $${combo.price})`);
      });
    }
    
    if (unavailableCombos.length > 0) {
      console.log(`\n⚠️ 以下 ${unavailableCombos.length} 個套餐因 is_available = false 而未在點餐系統顯示:`);
      unavailableCombos.forEach((combo, index) => {
        console.log(`  ${index + 1}. ${combo.name} (${combo.combo_type}套餐)`);
      });
      console.log(`\n🔧 建議修復: 到套餐管理頁面啟用這些套餐`);
    }
    
  } catch (error) {
    console.error('❌ 執行失敗:', error);
  }
}

checkComboProductsStatus();
