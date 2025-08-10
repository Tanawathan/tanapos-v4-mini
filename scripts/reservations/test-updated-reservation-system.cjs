#!/usr/bin/env node
// Full updated reservation system test (migrated)
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY;
const RESTAURANT_ID = process.env.VITE_RESTAURANT_ID;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testReservationSystem() {
	console.log('🧪 測試更新後的預約系統');
	const { data: restaurant, error: restError } = await supabase
		.from('restaurants')
		.select('business_hours, reservation_settings')
		.eq('id', RESTAURANT_ID)
		.single();
	if (restError) { console.error('餐廳查詢失敗', restError.message); return; }
	console.log('✅ 餐廳營業時間與設定讀取成功');
	const today = new Date();
	const tomorrow = new Date(today.getTime() + 86400000);
	const businessHours = restaurant.business_hours || {};
	const resSettings = restaurant.reservation_settings || {};
	const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
	const tDay = dayNames[tomorrow.getDay()];
	const hours = businessHours[tDay];
	if (hours?.is_open) {
		const slots = [];
		const [openH, openM] = hours.open.split(':').map(Number);
		const [lastH, lastM] = (resSettings.last_reservation_time||hours.close).split(':').map(Number);
		let h=openH,m=openM;
		while (h<lastH || (h===lastH && m<=lastM)) { slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`); m+=30; if(m>=60){m-=60;h++;} }
		console.log('明日可預約時段:', slots.join(', '));
	}
	console.log('🎉 測試完成');
}

if (require.main === module) testReservationSystem();
module.exports = { testReservationSystem };
