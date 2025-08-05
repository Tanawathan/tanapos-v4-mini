#!/usr/bin/env node
/**
 * TanaPOS v4 AI - 桌台管理功能測試
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const restaurantId = process.env.VITE_RESTAURANT_ID;

async function testTableFunctions() {
  console.log('🪑 TanaPOS v4 AI - 桌台管理功能測試');
  console.log('==========================================');
  console.log('');
  
  const supabase = createClient(supabaseUrl, anonKey);
  
  try {
    // 測試桌台載入
    console.log('🪑 測試桌台載入...');
    const { data: tables, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('table_number', { ascending: true });
    
    if (tableError) {
      console.log('❌ 桌台載入失敗:', tableError.message);
    } else {
      console.log(`✅ 成功載入 ${tables.length} 個桌台:`);
      tables.forEach(table => {
        console.log(`   - ${table.name} (${table.table_number}號): 容量${table.capacity}人, 狀態:${table.status}`);
      });
    }
    console.log('');
    
    // 測試訂單載入（與桌台相關）
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
        console.log(`   - ${order.order_number}: ${order.tables?.name || '外帶'} - ${order.status} ($${order.total_amount})`);
      });
      if (orders.length > 5) {
        console.log(`   ... 還有 ${orders.length - 5} 個訂單`);
      }
    }
    console.log('');
    
    // 測試桌台狀態統計
    console.log('📊 桌台狀態統計:');
    const statusCounts = tables.reduce((acc, table) => {
      acc[table.status] = (acc[table.status] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      const statusEmoji = {
        'available': '🟢',
        'occupied': '🔴', 
        'reserved': '🟡',
        'cleaning': '🧽',
        'maintenance': '🔧'
      };
      console.log(`   ${statusEmoji[status] || '⚪'} ${status}: ${count} 個桌台`);
    });
    console.log('');
    
    // 測試桌台更新權限
    console.log('✏️ 測試桌台狀態更新權限...');
    if (tables.length > 0) {
      const testTable = tables[0];
      const originalStatus = testTable.status;
      const newStatus = originalStatus === 'available' ? 'cleaning' : 'available';
      
      const { error: updateError } = await supabase
        .from('tables')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', testTable.id);
      
      if (updateError) {
        console.log('❌ 桌台更新失敗:', updateError.message);
      } else {
        console.log(`✅ 桌台更新成功: ${testTable.name} 狀態 ${originalStatus} → ${newStatus}`);
        
        // 恢復原狀態
        await supabase
          .from('tables')
          .update({ 
            status: originalStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', testTable.id);
        console.log('✅ 桌台狀態已恢復');
      }
    }
    
    console.log('');
    console.log('🎊 桌台管理功能測試完成！');
    
    // 總結
    const workingFeatures = [];
    const brokenFeatures = [];
    
    if (!tableError) workingFeatures.push('桌台查詢');
    else brokenFeatures.push('桌台查詢');
    
    if (!orderError) workingFeatures.push('訂單查詢');
    else brokenFeatures.push('訂單查詢');
    
    console.log('📊 功能狀態總結:');
    console.log(`✅ 正常功能: ${workingFeatures.join(', ')}`);
    if (brokenFeatures.length > 0) {
      console.log(`❌ 需修復功能: ${brokenFeatures.join(', ')}`);
    }
    
  } catch (error) {
    console.log('❌ 測試過程發生錯誤:', error.message);
  }
}

testTableFunctions()
  .then(() => {
    console.log('🏁 測試完成！');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 測試失敗:', error);
    process.exit(1);
  });
