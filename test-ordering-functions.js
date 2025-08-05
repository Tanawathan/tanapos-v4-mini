#!/usr/bin/env node
/**
 * TanaPOS v4 AI - 點餐系統功能測試
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const restaurantId = process.env.VITE_RESTAURANT_ID;

async function testOrderingFunctions() {
  console.log('📋 TanaPOS v4 AI - 點餐系統功能測試');
  console.log('==========================================');
  console.log('');
  
  const supabase = createClient(supabaseUrl, anonKey);
  
  try {
    // 測試分類載入（點餐用）
    console.log('📂 測試分類載入（點餐用）...');
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (catError) {
      console.log('❌ 分類載入失敗:', catError.message);
    } else {
      console.log(`✅ 成功載入 ${categories.length} 個分類供點餐選擇:`);
      categories.forEach(cat => {
        console.log(`   - ${cat.icon || '📂'} ${cat.name}: ${cat.description || '無描述'}`);
      });
    }
    console.log('');
    
    // 測試產品載入（點餐用）
    console.log('🍽️ 測試產品載入（點餐用）...');
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
      console.log(`✅ 成功載入 ${products.length} 個可點餐產品:`);
      
      // 按分類組織產品
      const productsByCategory = products.reduce((acc, prod) => {
        const categoryName = prod.categories?.name || '未分類';
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(prod);
        return acc;
      }, {});
      
      Object.entries(productsByCategory).forEach(([category, prods]) => {
        console.log(`   ${category}: ${prods.length} 個產品`);
        prods.slice(0, 3).forEach(prod => {
          console.log(`     - ${prod.name}: $${prod.price} (${prod.preparation_time || 0}分鐘)`);
        });
        if (prods.length > 3) {
          console.log(`     ... 還有 ${prods.length - 3} 個產品`);
        }
      });
    }
    console.log('');
    
    // 測試桌台選擇（點餐用）
    console.log('🪑 測試可用桌台查詢...');
    const { data: availableTables, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'available')
      .order('table_number');
    
    if (tableError) {
      console.log('❌ 桌台查詢失敗:', tableError.message);
    } else {
      console.log(`✅ 找到 ${availableTables.length} 個可用桌台:`);
      availableTables.forEach(table => {
        console.log(`   - ${table.name} (${table.table_number}號): 容量${table.capacity}人`);
      });
    }
    console.log('');
    
    // 測試訂單建立權限
    console.log('📝 測試訂單建立權限...');
    
    if (availableTables.length > 0 && products.length > 0) {
      const testTable = availableTables[0];
      const testProduct = products[0];
      
      // 生成測試訂單編號
      const orderNumber = 'TEST-' + Date.now();
      
      const testOrder = {
        restaurant_id: restaurantId,
        table_id: testTable.id,
        order_number: orderNumber,
        customer_name: '測試客戶',
        customer_phone: '0900000000',
        subtotal: testProduct.price,
        tax_amount: testProduct.price * 0.05,
        total_amount: testProduct.price * 1.05,
        status: 'pending',
        payment_status: 'unpaid',
        order_type: 'dine_in',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert(testOrder)
        .select()
        .single();
      
      if (orderError) {
        console.log('❌ 訂單建立失敗:', orderError.message);
      } else {
        console.log('✅ 訂單建立成功:', newOrder.order_number);
        
        // 建立訂單項目
        const testOrderItem = {
          order_id: newOrder.id,
          product_id: testProduct.id,
          product_name: testProduct.name,
          quantity: 1,
          unit_price: testProduct.price,
          total_price: testProduct.price,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error: itemError } = await supabase
          .from('order_items')
          .insert(testOrderItem);
        
        if (itemError) {
          console.log('❌ 訂單項目建立失敗:', itemError.message);
        } else {
          console.log('✅ 訂單項目建立成功');
        }
        
        // 清理測試資料
        await supabase.from('order_items').delete().eq('order_id', newOrder.id);
        await supabase.from('orders').delete().eq('id', newOrder.id);
        console.log('✅ 測試資料已清理');
      }
    } else {
      console.log('⚠️ 無法測試訂單建立（缺少可用桌台或產品）');
    }
    
    console.log('');
    console.log('🎊 點餐系統功能測試完成！');
    
    // 總結
    const workingFeatures = [];
    const brokenFeatures = [];
    
    if (!catError) workingFeatures.push('分類瀏覽');
    else brokenFeatures.push('分類瀏覽');
    
    if (!prodError) workingFeatures.push('產品瀏覽');
    else brokenFeatures.push('產品瀏覽');
    
    if (!tableError) workingFeatures.push('桌台選擇');
    else brokenFeatures.push('桌台選擇');
    
    console.log('📊 功能狀態總結:');
    console.log(`✅ 正常功能: ${workingFeatures.join(', ')}`);
    if (brokenFeatures.length > 0) {
      console.log(`❌ 需修復功能: ${brokenFeatures.join(', ')}`);
    }
    
  } catch (error) {
    console.log('❌ 測試過程發生錯誤:', error.message);
  }
}

testOrderingFunctions()
  .then(() => {
    console.log('🏁 測試完成！');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 測試失敗:', error);
    process.exit(1);
  });
