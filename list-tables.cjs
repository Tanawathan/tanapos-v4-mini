#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY
);

async function listTables() {
  try {
    // 查詢所有表
    const { data, error } = await supabase
      .rpc('list_tables');
    
    if (error) {
      console.log('使用直接查詢...');
      // 直接查詢系統表
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
        
      if (tableError) {
        console.error('查詢錯誤:', tableError);
        return;
      }
      
      console.log('📋 找到的表格:');
      tables.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }
  } catch (error) {
    console.log('嘗試查詢常見的表...');
    
    const commonTables = [
      'tables', 'restaurant_tables', 'dining_tables', 'table_management',
      'reservations', 'table_reservations', 'orders', 'restaurant_orders'
    ];
    
    for (const tableName of commonTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (!error && data) {
          console.log(`✅ ${tableName} 存在，有 ${data.length} 筆資料`);
          if (data.length > 0) {
            console.log(`   欄位: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (e) {
        // 表不存在，繼續
      }
    }
  }
}

listTables();
