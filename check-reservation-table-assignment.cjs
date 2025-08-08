#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// 載入環境變數
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://arksfwmcmwnyxvlcpskm.supabase.co',
  process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMzMzcxMCwiZXhwIjoyMDY5OTA5NzEwfQ.PucLCfBVtZR6cxkwqXwUKKthhuNUggFt4hjJ17nRCoE'
);

async function checkReservationTableAssignment() {
  console.log('🔍 檢查預訂和桌台分配狀態...\n');
  
  const restaurantId = '11111111-1111-1111-1111-111111111111';
  
  try {
    // 1. 檢查今日預訂
    console.log('📋 今日預訂列表：');
    const today = new Date().toISOString().split('T')[0];
    const { data: reservations, error: reservationError } = await supabase
      .from('table_reservations')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .gte('reservation_time', `${today}T00:00:00`)
      .lte('reservation_time', `${today}T23:59:59`)
      .order('reservation_time');
    
    if (reservationError) {
      console.error('❌ 預訂查詢錯誤:', reservationError);
      return;
    }
    
    if (reservations.length === 0) {
      console.log('❌ 沒有找到今日預訂');
      return;
    }
    
    reservations.forEach((reservation, index) => {
      console.log(`預訂 ${index + 1}:`);
      console.log(`  - ID: ${reservation.id}`);
      console.log(`  - 客戶: ${reservation.customer_name}`);
      console.log(`  - 人數: ${reservation.party_size}`);
      console.log(`  - 時間: ${reservation.reservation_time}`);
      console.log(`  - 狀態: ${reservation.status}`);
      console.log(`  - 分配桌台: ${reservation.assigned_table_id || '未分配'}`);
      console.log('');
    });
    
    // 2. 檢查桌台狀態
    console.log('🪑 桌台狀態：');
    const { data: tables, error: tablesError } = await supabase
      .from('restaurant_tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('table_number');
    
    if (tablesError) {
      console.error('❌ 桌台查詢錯誤:', tablesError);
      return;
    }
    
    tables.forEach(table => {
      console.log(`桌台 ${table.table_number} (${table.table_code}):`);
      console.log(`  - 座位數: ${table.capacity}`);
      console.log(`  - 狀態: ${table.status}`);
      console.log(`  - 當前訂單: ${table.current_order_id || '無'}`);
      console.log(`  - 預訂ID: ${table.reservation_id || '無'}`);
      console.log('');
    });
    
    // 3. 檢查預訂和桌台的關聯
    console.log('🔗 預訂桌台關聯檢查：');
    const reservedTables = tables.filter(table => table.reservation_id);
    const assignedReservations = reservations.filter(r => r.assigned_table_id);
    
    console.log(`有預訂ID的桌台數量: ${reservedTables.length}`);
    console.log(`有分配桌台的預訂數量: ${assignedReservations.length}`);
    
    // 檢查不匹配的情況
    const unassignedReservations = reservations.filter(r => !r.assigned_table_id);
    const unReservedTables = tables.filter(t => t.status === 'available' && !t.reservation_id);
    
    console.log('\n⚠️ 問題檢測：');
    if (unassignedReservations.length > 0) {
      console.log(`❌ ${unassignedReservations.length} 個預訂沒有分配桌台：`);
      unassignedReservations.forEach(r => {
        console.log(`  - ${r.customer_name} (${r.party_size}人) - ${r.reservation_time}`);
      });
    }
    
    if (unReservedTables.length > 0) {
      console.log(`✅ ${unReservedTables.length} 個可用桌台：`);
      unReservedTables.forEach(t => {
        console.log(`  - 桌台 ${t.table_number} (${t.capacity}人座)`);
      });
    }
    
    // 4. 檢查自動分配是否正常工作
    console.log('\n🤖 自動分配檢查：');
    if (unassignedReservations.length > 0 && unReservedTables.length > 0) {
      console.log('❗ 發現問題：有預訂沒有分配桌台，但有可用桌台');
      console.log('建議執行自動桌台分配修復');
    } else if (unassignedReservations.length > 0 && unReservedTables.length === 0) {
      console.log('❗ 沒有足夠的可用桌台分配給所有預訂');
    } else {
      console.log('✅ 預訂和桌台分配狀態正常');
    }
    
  } catch (error) {
    console.error('❌ 檢查過程發生錯誤:', error);
  }
}

checkReservationTableAssignment();
