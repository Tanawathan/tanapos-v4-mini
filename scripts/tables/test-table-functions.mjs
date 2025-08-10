#!/usr/bin/env node
// Moved from root: test-table-functions.js -> standardized .mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const restaurantId = process.env.VITE_RESTAURANT_ID;
async function main(){
  console.log('🪑 桌台管理功能測試');
  const { data: tables, error: tErr } = await supabase.from('tables').select('*').eq('restaurant_id', restaurantId).order('table_number',{ascending:true});
  if (tErr) console.log('❌ 桌台載入失敗:', tErr.message); else console.log(`✅ 桌台 ${tables.length}`);
  const { data: orders, error: oErr } = await supabase.from('orders').select('*').eq('restaurant_id', restaurantId).order('created_at',{ascending:false});
  if (oErr) console.log('❌ 訂單載入失敗:', oErr.message); else console.log(`✅ 訂單 ${orders.length}`);
}
main().catch(e=>{ console.error(e); process.exit(1); });
