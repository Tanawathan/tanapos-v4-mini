#!/usr/bin/env node
// Full auto-assignment quick smoke test (env-based)
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
	process.env.VITE_SUPABASE_URL,
	process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);
const restaurantId = process.env.VITE_RESTAURANT_ID || '11111111-1111-1111-1111-111111111111';

async function run() {
	console.log('🧪 Quick test: reservation auto table assignment');
	const { data: tables, error: tableErr } = await supabase
		.from('tables')
		.select('id, table_number, capacity, status')
		.eq('restaurant_id', restaurantId)
		.eq('is_active', true)
		.eq('status', 'available')
		.order('capacity');
	if (tableErr) { console.error('取桌台錯誤', tableErr); return; }
	if (!tables?.length) { console.log('❌ 無可用桌台'); return; }
	const reservation = {
		restaurant_id: restaurantId,
		customer_name: 'AutoAssignTest',
		customer_phone: '0900000000',
		party_size: 2,
		reservation_time: new Date(Date.now() + 60*60*1000).toISOString(),
		status: 'confirmed'
	};
	const { data: created, error: createErr } = await supabase.from('table_reservations').insert(reservation).select().single();
	if (createErr) { console.error('創建預約失敗', createErr); return; }
	const best = tables.find(t => t.capacity >= reservation.party_size) || tables[0];
	await supabase.from('table_reservations').update({ table_id: best.id }).eq('id', created.id);
	await supabase.from('tables').update({ status: 'reserved' }).eq('id', best.id);
	const { data: verify } = await supabase.from('table_reservations').select('id, table_id').eq('id', created.id).single();
	console.log(verify?.table_id ? `✅ 分配成功 -> Table ${best.table_number}`: '❌ 分配失敗');
	await supabase.from('tables').update({ status: 'available' }).eq('id', best.id);
	await supabase.from('table_reservations').delete().eq('id', created.id);
	console.log('🧹 已清理測試資料');
}
run().catch(e => console.error(e));
