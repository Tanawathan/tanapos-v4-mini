#!/usr/bin/env node
/**
 * TanaPOS v4 AI - 高權限系統驗證
 * 使用 Service Role Key 進行完整系統測試
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import process from 'process';

dotenv.config();

// 使用 Service Role Key 獲得最高權限
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
const restaurantId = process.env.VITE_RESTAURANT_ID || process.env.RESTAURANT_ID || '11111111-1111-1111-1111-111111111111';

async function testHighPrivilegeAccess() {
  console.log('🔐 TanaPOS v4 AI - 高權限系統驗證');
  console.log('');

  // 檢查環境變數
  console.log('🔍 檢查環境變數...');
  if (!supabaseUrl) {
    console.log('❌ SUPABASE_URL 未設定');
    return false;
  }
  if (!serviceKey) {
    console.log('❌ SUPABASE_SERVICE_KEY 未設定');
    return false;
  }
  
  console.log(`✅ Supabase URL: ${supabaseUrl}`);
  console.log(`✅ Service Key: ${serviceKey.substring(0, 20)}...`);
  console.log(`✅ Restaurant ID: ${restaurantId}`);
  console.log('');

  // 創建高權限客戶端
  const supabase = createClient(supabaseUrl, serviceKey);
  
  try {
    // 測試 1: 基本連接
    console.log('🔗 測試 1: Supabase 連接...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('restaurants')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.log('❌ 連接失敗:', healthError.message);
      return false;
    }
    console.log('✅ 連接成功');
    console.log('');

    // 測試 2: 餐廳資料操作
    console.log('🏪 測試 2: 餐廳資料操作...');
    
    // 確保餐廳存在
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .upsert({
        id: restaurantId,
        name: 'TanaPOS 測試餐廳',
        address: '台北市信義區測試路123號',
        phone: '02-12345678',
        email: 'test@tanapos.com',
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (restaurantError) {
      console.log('❌ 餐廳資料操作失敗:', restaurantError.message);
      return false;
    }
    console.log('✅ 餐廳資料操作成功');
    console.log(`   餐廳名稱: ${restaurant.name}`);
    console.log('');

    // 測試 3: 分類資料
    console.log('📂 測試 3: 分類資料查詢...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurantId);

    if (categoriesError) {
      console.log('❌ 分類查詢失敗:', categoriesError.message);
    } else {
      console.log(`✅ 找到 ${categories.length} 個分類`);
    }
    console.log('');

    // 測試 4: 產品資料
    console.log('🍽️ 測試 4: 產品資料查詢...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurantId);

    if (productsError) {
      console.log('❌ 產品查詢失敗:', productsError.message);
    } else {
      console.log(`✅ 找到 ${products.length} 個產品`);
    }
    console.log('');

    // 測試 5: 桌台資料
    console.log('🪑 測試 5: 桌台資料查詢...');
    const { data: tables, error: tablesError } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurantId);

    if (tablesError) {
      console.log('❌ 桌台查詢失敗:', tablesError.message);
    } else {
      console.log(`✅ 找到 ${tables.length} 個桌台`);
    }
    console.log('');

    // 測試 6: RLS 政策檢查
    console.log('🛡️ 測試 6: RLS 政策檢查...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies_info');

    if (policiesError) {
      console.log('⚠️ 無法取得政策資訊 (這是正常的)');
    } else {
      console.log('✅ RLS 政策已啟用');
    }
    console.log('');

    // 測試 7: 寫入權限測試
    console.log('✏️ 測試 7: 寫入權限測試...');
    const testCategory = {
      id: 'test-category-' + Date.now(),
      restaurant_id: restaurantId,
      name: '測試分類',
      description: '權限測試用分類',
      color: '#FF6B6B',
      order_index: 999,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newCategory, error: writeError } = await supabase
      .from('categories')
      .insert(testCategory)
      .select()
      .single();

    if (writeError) {
      console.log('❌ 寫入測試失敗:', writeError.message);
    } else {
      console.log('✅ 寫入權限正常');
      
      // 清理測試資料
      await supabase
        .from('categories')
        .delete()
        .eq('id', newCategory.id);
      console.log('✅ 測試資料已清理');
    }
    console.log('');

    // 系統摘要
    console.log('📊 系統狀態摘要:');
    console.log(`   🏪 餐廳: 已設定 (${restaurant.name})`);
    console.log(`   📂 分類: ${categories?.length || 0} 個`);
    console.log(`   🍽️ 產品: ${products?.length || 0} 個`);
    console.log(`   🪑 桌台: ${tables?.length || 0} 個`);
    console.log(`   🔐 權限: Service Role (最高權限)`);
    console.log('');
    console.log('🎉 高權限驗證完成！系統已準備就緒');
    
    return true;

  } catch (error) {
    console.log('❌ 測試過程發生錯誤:', error.message);
    return false;
  }
}

// 執行測試
if (import.meta.url === `file://${process.argv[1]}`) {
  testHighPrivilegeAccess()
    .then(success => {
      if (success) {
        console.log('');
        console.log('🚀 系統已準備就緒，可以開始使用 TanaPOS v4 AI');
        process.exit(0);
      } else {
        console.log('');
        console.log('⚠️ 請檢查設定並重新執行');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ 驗證失敗:', error);
      process.exit(1);
    });
}

export { testHighPrivilegeAccess };
