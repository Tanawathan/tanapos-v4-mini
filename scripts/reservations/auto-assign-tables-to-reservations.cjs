#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY);
const restaurantId = process.env.VITE_RESTAURANT_ID || '11111111-1111-1111-1111-111111111111';
async function autoAssign(){
	console.log('🤖 自動為確認預約分配桌台');
	const { data: reservations, error: rErr } = await supabase.from('table_reservations').select('*').eq('restaurant_id', restaurantId).eq('status','confirmed').is('table_id', null).order('reservation_time');
	if(rErr){ console.error(rErr.message); return; }
	if(!reservations?.length){ console.log('✅ 無需分配'); return; }
	const { data: tables, error: tErr } = await supabase.from('tables').select('*').eq('restaurant_id', restaurantId).eq('is_active', true).in('status',['available','reserved']).order('capacity');
	if(tErr){ console.error(tErr.message); return; }
	const used=new Set();
	for(const res of reservations){
		const candidates=tables.filter(t=>t.capacity>=res.party_size && !used.has(t.id));
		if(!candidates.length){ console.log(`⚠️ 無適合桌台: ${res.customer_name}`); continue; }
		const best=candidates.reduce((b,c)=> (c.capacity-res.party_size)<(b.capacity-res.party_size)?c:b);
		used.add(best.id);
		await supabase.from('table_reservations').update({ table_id: best.id, updated_at: new Date().toISOString() }).eq('id', res.id);
		await supabase.from('tables').update({ status: 'reserved', updated_at: new Date().toISOString() }).eq('id', best.id);
		console.log(`✅ ${res.customer_name} -> 桌 ${best.table_number}`);
	}
	console.log('🎉 完成');
}
autoAssign();

