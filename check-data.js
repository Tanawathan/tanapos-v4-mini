#!/usr/bin/env node
/**
 * TanaPOS v4 AI - 資料統計檢查
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;
const restaurantId = process.env.VITE_RESTAURANT_ID || process.env.RESTAURANT_ID;

async function checkDataCounts() {
  console.log('📊 TanaPOS v4 AI - 資料統計檢查');
  console.log('');
  
  const supabase = createClient(supabaseUrl, serviceKey);
  
  try {
    // 檢查餐廳
    const { data: restaurants, error: restError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId);
    
    console.log(`🏪 餐廳: ${restaurants?.length || 0} 個`);
    if (restaurants?.[0]) {
      console.log(`   名稱: ${restaurants[0].name}`);
    }
    
    // 檢查分類
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurantId);
    
    console.log(`📂 分類: ${categories?.length || 0} 個`);
    
    // 檢查產品
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurantId);
    
    console.log(`🍽️ 產品: ${products?.length || 0} 個`);
    
    // 檢查桌台
    const { data: tables, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurantId);
    
    console.log(`🪑 桌台: ${tables?.length || 0} 個`);
    
    // 檢查訂單
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId);
    
    console.log(`📋 訂單: ${orders?.length || 0} 個`);
    
    console.log('');
    
    // 判斷是否需要載入測試資料
    const needsTestData = 
      !categories?.length || categories.length < 5 ||
      !products?.length || products.length < 10 ||
      !tables?.length || tables.length < 5;
    
    if (needsTestData) {
      console.log('⚠️ 資料不完整，建議載入完整測試資料');
      console.log('💡 請在 Supabase SQL Editor 中執行 complete-test-data.sql');
    } else {
      console.log('✅ 資料完整，系統已準備就緒');
    }
    
    return !needsTestData;
    
  } catch (error) {
    console.log('❌ 資料檢查失敗:', error.message);
    return false;
  }
}

checkDataCounts()
  .then(complete => {
    console.log('');
    if (complete) {
      console.log('🚀 系統已準備就緒，可以開始使用！');
    } else {
      console.log('🔧 需要載入測試資料後再次測試');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 檢查失敗:', error);
    process.exit(1);
  });
