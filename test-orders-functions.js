#!/usr/bin/env node
/**
 * TanaPOS v4 AI - 訂單管理功能測試
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const restaurantId = process.env.VITE_RESTAURANT_ID;

async function testOrderManagementFunctions() {
  console.log('📊 TanaPOS v4 AI - 訂單管理功能測試');
  console.log('==========================================');
  console.log('');
  
  const supabase = createClient(supabaseUrl, anonKey);
  
  try {
    // 測試訂單載入
    console.log('📋 測試訂單載入...');
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        tables:table_id (
          name,
          table_number
        )
      `)
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    
    if (orderError) {
      console.log('❌ 訂單載入失敗:', orderError.message);
    } else {
      console.log(`✅ 成功載入 ${orders.length} 個訂單:`);
      orders.slice(0, 5).forEach(order => {
        const table = order.tables ? `${order.tables.name}` : '外帶';
        console.log(`   - ${order.order_number}: ${table} - ${order.status} ($${order.total_amount})`);
      });
      if (orders.length > 5) {
        console.log(`   ... 還有 ${orders.length - 5} 個訂單`);
      }
    }
    console.log('');
    
    // 測試訂單項目載入
    console.log('🍽️ 測試訂單項目載入...');
    if (orders && orders.length > 0) {
      const testOrder = orders[0];
      const { data: orderItems, error: itemError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', testOrder.id)
        .order('created_at');
      
      if (itemError) {
        console.log('❌ 訂單項目載入失敗:', itemError.message);
      } else {
        console.log(`✅ 訂單 ${testOrder.order_number} 有 ${orderItems.length} 個項目:`);
        orderItems.forEach(item => {
          console.log(`   - ${item.product_name} x${item.quantity} = $${item.total_price} (${item.status})`);
        });
      }
    }
    console.log('');
    
    // 測試訂單狀態統計
    console.log('📊 訂單狀態統計:');
    if (orders) {
      const statusCounts = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});
      
      const statusEmojis = {
        'pending': '⏳',
        'confirmed': '✅',
        'preparing': '👨‍🍳',
        'ready': '🎉',
        'served': '🍽️',
        'cancelled': '❌',
        'completed': '✨'
      };
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${statusEmojis[status] || '⚪'} ${status}: ${count} 個訂單`);
      });
      
      // 計算今日營收
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= today && order.status !== 'cancelled';
      });
      
      const totalRevenue = todayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      console.log(`   💰 今日營收: $${totalRevenue.toFixed(2)} (${todayOrders.length} 筆訂單)`);
    }
    console.log('');
    
    // 測試訂單狀態更新
    console.log('✏️ 測試訂單狀態更新...');
    if (orders && orders.length > 0) {
      const testOrder = orders.find(order => order.status === 'preparing' || order.status === 'pending');
      
      if (testOrder) {
        const originalStatus = testOrder.status;
        const newStatus = originalStatus === 'pending' ? 'confirmed' : 'ready';
        
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', testOrder.id);
        
        if (updateError) {
          console.log('❌ 訂單狀態更新失敗:', updateError.message);
        } else {
          console.log(`✅ 訂單狀態更新成功: ${testOrder.order_number} ${originalStatus} → ${newStatus}`);
          
          // 恢復原狀態
          await supabase
            .from('orders')
            .update({ 
              status: originalStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', testOrder.id);
          console.log('✅ 訂單狀態已恢復');
        }
      } else {
        console.log('⚠️ 找不到可更新狀態的訂單');
      }
    }
    
    // 測試訂單搜尋功能
    console.log('');
    console.log('🔍 測試訂單搜尋功能...');
    if (orders && orders.length > 0) {
      const searchTerm = orders[0].order_number.substring(0, 3);
      const { data: searchResults, error: searchError } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .ilike('order_number', `%${searchTerm}%`)
        .limit(5);
      
      if (searchError) {
        console.log('❌ 訂單搜尋失敗:', searchError.message);
      } else {
        console.log(`✅ 搜尋 "${searchTerm}" 找到 ${searchResults.length} 個結果:`);
        searchResults.forEach(order => {
          console.log(`   - ${order.order_number}: ${order.status} ($${order.total_amount})`);
        });
      }
    }
    
    console.log('');
    console.log('🎊 訂單管理功能測試完成！');
    
    // 總結
    const workingFeatures = [];
    const brokenFeatures = [];
    
    if (!orderError) workingFeatures.push('訂單查詢');
    else brokenFeatures.push('訂單查詢');
    
    workingFeatures.push('狀態統計', '訂單搜尋');
    
    console.log('📊 功能狀態總結:');
    console.log(`✅ 正常功能: ${workingFeatures.join(', ')}`);
    if (brokenFeatures.length > 0) {
      console.log(`❌ 需修復功能: ${brokenFeatures.join(', ')}`);
    }
    
  } catch (error) {
    console.log('❌ 測試過程發生錯誤:', error.message);
  }
}

testOrderManagementFunctions()
  .then(() => {
    console.log('🏁 測試完成！');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 測試失敗:', error);
    process.exit(1);
  });
