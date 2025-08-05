#!/usr/bin/env node
/**
 * TanaPOS v4 AI - 簡化連接測試
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
const restaurantId = process.env.VITE_RESTAURANT_ID || process.env.RESTAURANT_ID;

console.log('🔐 TanaPOS v4 AI - 簡化連接測試');
console.log(`📍 URL: ${supabaseUrl}`);
console.log(`🔑 Service Key: ${serviceKey ? '✓ 已設定' : '❌ 未設定'}`);
console.log(`🏪 Restaurant ID: ${restaurantId}`);

async function simpleTest() {
  try {
    console.log('\n🔗 創建 Supabase 客戶端...');
    const supabase = createClient(supabaseUrl, serviceKey);
    
    console.log('✅ 客戶端創建成功');
    
    console.log('\n🏪 測試餐廳資料查詢...');
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();
    
    if (error) {
      console.log('❌ 餐廳查詢失敗:', error.message);
      return false;
    }
    
    if (restaurant) {
      console.log('✅ 餐廳資料找到:', restaurant.name);
    } else {
      console.log('⚠️ 餐廳資料不存在');
    }
    
    console.log('\n📂 測試分類資料查詢...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('count')
      .eq('restaurant_id', restaurantId);
    
    if (catError) {
      console.log('❌ 分類查詢失敗:', catError.message);
    } else {
      console.log(`✅ 分類查詢成功，找到 ${categories.length} 個分類`);
    }
    
    console.log('\n🎉 簡化測試完成！');
    return true;
    
  } catch (error) {
    console.log('❌ 測試失敗:', error.message);
    return false;
  }
}

simpleTest()
  .then(success => {
    console.log(success ? '\n✅ 連接測試成功' : '\n❌ 連接測試失敗');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ 執行錯誤:', error);
    process.exit(1);
  });
