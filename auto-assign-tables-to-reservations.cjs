#!/usr/bin/env node

/**
 * 自動為已確認預約分配桌台
 * 修復預約成功但桌台沒有分配的問題
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY
);

const restaurantId = process.env.VITE_RESTAURANT_ID || '11111111-1111-1111-1111-111111111111';

async function autoAssignTablesToReservations() {
  console.log('🤖 開始自動為確認預約分配桌台...\n');

  try {
    // 1. 查找所有已確認但未分配桌台的預約
    console.log('📋 查找未分配桌台的預約...');
    const { data: unassignedReservations, error: resError } = await supabase
      .from('table_reservations')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'confirmed')
      .is('table_id', null)
      .order('reservation_time');

    if (resError) {
      console.error('❌ 查詢預約錯誤:', resError);
      return;
    }

    if (!unassignedReservations || unassignedReservations.length === 0) {
      console.log('✅ 所有已確認預約都已分配桌台');
      return;
    }

    console.log(`🔍 找到 ${unassignedReservations.length} 筆未分配桌台的預約:`);
    unassignedReservations.forEach((res, i) => {
      console.log(`${i + 1}. ${res.customer_name} - ${res.party_size}人 - ${new Date(res.reservation_time).toLocaleString('zh-TW')}`);
    });

    // 2. 查找所有可用桌台
    console.log('\n🪑 查找可用桌台...');
    const { data: availableTables, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .in('status', ['available', 'reserved']) // 包含already reserved但沒有reservation_id的桌台
      .order('capacity');

    if (tableError) {
      console.error('❌ 查詢桌台錯誤:', tableError);
      return;
    }

    if (!availableTables || availableTables.length === 0) {
      console.log('❌ 沒有可用的桌台');
      return;
    }

    console.log(`🪑 找到 ${availableTables.length} 張桌台`);

    // 3. 自動分配桌台
    console.log('\n🎯 開始自動分配桌台...');
    const assignments = [];

    for (const reservation of unassignedReservations) {
      // 找到最適合的桌台（容量剛好且最小）
      const suitableTables = availableTables.filter(table => 
        table.capacity >= reservation.party_size && 
        !assignments.some(a => a.tableId === table.id) // 避免重複分配
      );

      if (suitableTables.length === 0) {
        console.log(`⚠️  ${reservation.customer_name}: 找不到適合的桌台 (需要${reservation.party_size}人座)`);
        continue;
      }

      // 選擇容量最接近的桌台
      const bestTable = suitableTables.reduce((best, current) => 
        (current.capacity - reservation.party_size) < (best.capacity - reservation.party_size) 
          ? current : best
      );

      assignments.push({
        reservationId: reservation.id,
        tableId: bestTable.id,
        customerName: reservation.customer_name,
        partySize: reservation.party_size,
        tableNumber: bestTable.table_number,
        tableCapacity: bestTable.capacity
      });

      console.log(`✅ ${reservation.customer_name} (${reservation.party_size}人) → 桌台 ${bestTable.table_number} (${bestTable.capacity}人座)`);
    }

    // 4. 執行分配更新
    if (assignments.length === 0) {
      console.log('\n❌ 沒有可執行的分配');
      return;
    }

    console.log(`\n🚀 執行 ${assignments.length} 筆桌台分配...`);

    for (const assignment of assignments) {
      try {
        // 更新預約記錄
        const { error: updateReservationError } = await supabase
          .from('table_reservations')
          .update({
            table_id: assignment.tableId,
            updated_at: new Date().toISOString()
          })
          .eq('id', assignment.reservationId);

        if (updateReservationError) {
          console.error(`❌ 更新預約失敗 (${assignment.customerName}):`, updateReservationError);
          continue;
        }

        // 更新桌台狀態並設置預約關聯
        const { error: updateTableError } = await supabase
          .from('tables')
          .update({
            status: 'reserved',
            updated_at: new Date().toISOString()
          })
          .eq('id', assignment.tableId);

        if (updateTableError) {
          console.error(`❌ 更新桌台狀態失敗 (桌台 ${assignment.tableNumber}):`, updateTableError);
          continue;
        }

        console.log(`✅ 完成分配: ${assignment.customerName} → 桌台 ${assignment.tableNumber}`);

      } catch (error) {
        console.error(`❌ 分配過程出錯 (${assignment.customerName}):`, error);
      }
    }

    // 5. 驗證分配結果
    console.log('\n🔍 驗證分配結果...');
    const { data: updatedReservations, error: verifyError } = await supabase
      .from('table_reservations')
      .select(`
        customer_name, 
        party_size, 
        table_id,
        tables!inner(table_number)
      `)
      .eq('restaurant_id', restaurantId)
      .eq('status', 'confirmed')
      .not('table_id', 'is', null)
      .order('reservation_time');

    if (!verifyError && updatedReservations) {
      console.log(`📊 驗證結果: ${updatedReservations.length} 筆預約已分配桌台`);
      updatedReservations.forEach(res => {
        const tableNumber = res.tables?.table_number || '未知';
        console.log(`   ✅ ${res.customer_name} → 桌台 ${tableNumber}`);
      });
    }

    console.log('\n🎉 自動桌台分配完成！');

  } catch (error) {
    console.error('❌ 自動分配過程發生錯誤:', error);
  }
}

autoAssignTablesToReservations();
