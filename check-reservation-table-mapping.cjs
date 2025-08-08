const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkReservationTableMapping() {
  console.log('🔍 檢查預約與桌台對應關係...\n');
  
  try {
    // 1. 檢查有效預約
    const { data: reservations, error: resError } = await supabase
      .from('table_reservations')
      .select('id, customer_name, party_size, status, table_id, reservation_time, special_requests')
      .in('status', ['confirmed', 'seated'])
      .order('reservation_time');
      
    if (resError) {
      console.error('❌ 查詢預約錯誤:', resError.message);
      return;
    }
    
    if (!reservations || reservations.length === 0) {
      console.log('❌ 沒有找到有效的預約資料');
      return;
    }
    
    console.log(`✅ 找到 ${reservations.length} 筆有效預約:`);
    
    // 2. 檢查桌台狀態
    const { data: tables, error: tableError } = await supabase
      .from('tables')
      .select('id, table_number, status, capacity')
      .order('table_number');
      
    if (tableError) {
      console.error('❌ 查詢桌台錯誤:', tableError.message);
      return;
    }
    
    // 3. 顯示預約詳情
    for (const res of reservations) {
      console.log(`\n📅 ${res.customer_name} (${res.party_size}人)`);
      console.log(`   狀態: ${res.status}`);
      console.log(`   時間: ${new Date(res.reservation_time).toLocaleString('zh-TW')}`);
      console.log(`   桌台ID: ${res.table_id || '未分配'}`);
      
      if (res.table_id) {
        const table = tables.find(t => t.id === res.table_id);
        if (table) {
          console.log(`   ✅ 已分配桌台${table.table_number} (${table.capacity}人座, 狀態:${table.status})`);
        } else {
          console.log(`   ❌ 桌台ID無效`);
        }
      }
      
      if (res.special_requests) {
        console.log(`   備註: ${res.special_requests}`);
      }
    }
    
    // 4. 檢查預約中的桌台
    console.log('\n🪑 桌台狀態總覽:');
    const reservedTables = tables.filter(t => t.status === 'reserved');
    console.log(`   預約中桌台: ${reservedTables.length} 個`);
    
    reservedTables.forEach(table => {
      const reservation = reservations.find(r => r.table_id === table.id);
      if (reservation) {
        console.log(`   - 桌台${table.table_number}: ${reservation.customer_name} (${reservation.party_size}人)`);
      } else {
        console.log(`   - 桌台${table.table_number}: 標記為預約但無對應預約記錄`);
      }
    });
    
    console.log('\n🎉 檢查完成！');
    
  } catch (error) {
    console.error('❌ 執行錯誤:', error.message);
  }
}

checkReservationTableMapping();
