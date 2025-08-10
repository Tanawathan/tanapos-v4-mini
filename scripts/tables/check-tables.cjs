#!/usr/bin/env node
// Moved from root: check-tables.cjs (env driven)
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const restaurantId = process.env.VITE_RESTAURANT_ID || '11111111-1111-1111-1111-111111111111';
async function run(){
  console.log('🪑 檢查桌台數據...');
  const { data: tables, error } = await supabase.from('tables').select('*').eq('restaurant_id', restaurantId).order('table_number');
  if (error){ console.log('❌ 查詢桌台失敗:', error.message||error); return; }
  console.log(`\n📊 總共 ${tables.length} 個桌台:`);
  const statusCounts={};
  tables.forEach(t=>{ const s=t.status||'unknown'; statusCounts[s]=(statusCounts[s]||0)+1; });
  Object.entries(statusCounts).forEach(([s,c])=>console.log(`  ${s}: ${c} 桌`));
}
run();
