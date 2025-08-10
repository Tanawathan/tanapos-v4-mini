#!/usr/bin/env node
// Moved from root: list-tables.cjs
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY);
async function listTables(){
  try {
    const { data, error } = await supabase.rpc('list_tables');
    if (error) {
      console.log('使用直接查詢...');
      const { data: tables, error: tableError } = await supabase.from('information_schema.tables').select('table_name').eq('table_schema','public');
      if (tableError){ console.error('查詢錯誤:', tableError); return; }
      console.log('📋 找到的表格:'); tables.forEach(t=>console.log(`- ${t.table_name}`));
    }
  } catch { console.log('回退檢查常見表...'); }
}
listTables();
