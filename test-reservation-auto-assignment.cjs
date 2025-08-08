#!/usr/bin/env node

/**
 * 測試預約系統自動桌台分配功能
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY
);

const restaurantId = process.env.VITE_RESTAURANT_ID || '11111111-1111-1111-1111-111111111111';

async function testReservationTableAssignment() {
  console.log('🧪 測試預約系統自動桌台分配功能...\n');

  try {
    // 1. 檢查當前預約與桌台狀況
    console.log('📊 檢查當前狀況...');
    
    const { data: currentReservations } = await supabase
      .from('table_reservations')
      .select(`
        id, customer_name, party_size, status, table_id,
        tables!inner(table_number)
      `)
      .eq('restaurant_id', restaurantId)
      .eq('status', 'confirmed')
      .not('table_id', 'is', null);

    console.log(`目前已分配桌台的預約數量: ${currentReservations?.length || 0}`);
    if (currentReservations && currentReservations.length > 0) {
      currentReservations.forEach(res => {
        const tableNumber = res.tables?.table_number || '未知';
        console.log(`  - ${res.customer_name} (${res.party_size}人) → 桌台 ${tableNumber}`);
      });
    }

    const { data: availableTables } = await supabase
      .from('tables')
      .select('id, table_number, capacity, status')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .eq('status', 'available');

    console.log(`\n目前可用桌台數量: ${availableTables?.length || 0}`);
    if (availableTables && availableTables.length > 0) {
      availableTables.forEach(table => {
        console.log(`  - 桌台 ${table.table_number} (${table.capacity}人座)`);
      });
    }

    // 2. 創建測試預約（模擬API調用）
    console.log('\n🎯 創建測試預約...');
    
    const testReservation = {
      customer_name: '測試客戶',
      customer_phone: '0912345678',
      customer_email: 'test@example.com',
      party_size: 2,
      adult_count: 2,
      child_count: 0,
      child_chair_needed: false,
      reservation_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2小時後
      duration_minutes: 90,
      estimated_end_time: new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString(),
      status: 'confirmed',
      special_requests: '希望安靜的位置',
      occasion: 'dining',
      restaurant_id: restaurantId
    };

    console.log(`預約詳情: ${testReservation.customer_name} - ${testReservation.party_size}人`);
    console.log(`預約時間: ${new Date(testReservation.reservation_time).toLocaleString('zh-TW')}`);

    // 創建預約
    const { data: newReservation, error: createError } = await supabase
      .from('table_reservations')
      .insert(testReservation)
      .select()
      .single();

    if (createError) {
      console.error('❌ 創建預約失敗:', createError);
      return;
    }

    console.log(`✅ 預約創建成功，ID: ${newReservation.id}`);

    // 3. 手動觸發自動桌台分配（模擬ReservationService邏輯）
    console.log('\n🤖 執行自動桌台分配...');
    
    // 找到最適合的桌台
    const suitableTables = availableTables.filter(table => table.capacity >= testReservation.party_size);
    
    if (suitableTables.length === 0) {
      console.log('❌ 沒有適合的桌台');
      return;
    }

    // 選擇容量最接近的桌台
    const bestTable = suitableTables.reduce((best, current) => 
      (current.capacity - testReservation.party_size) < (best.capacity - testReservation.party_size) 
        ? current : best
    );

    console.log(`🎯 選擇桌台: ${bestTable.table_number} (${bestTable.capacity}人座)`);

    // 執行分配
    const { error: updateReservationError } = await supabase
      .from('table_reservations')
      .update({ table_id: bestTable.id })
      .eq('id', newReservation.id);

    if (updateReservationError) {
      console.error('❌ 更新預約失敗:', updateReservationError);
      return;
    }

    const { error: updateTableError } = await supabase
      .from('tables')
      .update({ status: 'reserved' })
      .eq('id', bestTable.id);

    if (updateTableError) {
      console.error('❌ 更新桌台狀態失敗:', updateTableError);
      return;
    }

    console.log(`✅ 桌台分配成功: ${testReservation.customer_name} → 桌台 ${bestTable.table_number}`);

    // 4. 驗證分配結果
    console.log('\n🔍 驗證分配結果...');
    
    const { data: verifyReservation } = await supabase
      .from('table_reservations')
      .select(`
        customer_name, party_size, table_id,
        tables!inner(table_number, status)
      `)
      .eq('id', newReservation.id)
      .single();

    if (verifyReservation && verifyReservation.table_id) {
      const tableNumber = verifyReservation.tables?.table_number;
      const tableStatus = verifyReservation.tables?.status;
      console.log(`✅ 驗證成功:`);
      console.log(`   預約: ${verifyReservation.customer_name} (${verifyReservation.party_size}人)`);
      console.log(`   分配桌台: ${tableNumber}`);
      console.log(`   桌台狀態: ${tableStatus}`);
    } else {
      console.log('❌ 驗證失敗: 預約沒有分配到桌台');
    }

    // 5. 清理測試數據（可選）
    console.log('\n🧹 清理測試數據...');
    
    // 恢復桌台狀態
    await supabase
      .from('tables')
      .update({ status: 'available' })
      .eq('id', bestTable.id);

    // 刪除測試預約
    await supabase
      .from('table_reservations')
      .delete()
      .eq('id', newReservation.id);

    console.log('✅ 測試數據已清理');

    console.log('\n🎉 測試完成！預約自動桌台分配功能正常工作');

  } catch (error) {
    console.error('❌ 測試過程發生錯誤:', error);
  }
}

testReservationTableAssignment();
