#!/usr/bin/env node
/**
 * 完整版 test-updated-reservation-system
 * 功能:
 *  1. 營業時間與預約設定讀取
 *  2. 明日可預約時段生成 (30 分鐘間隔)
 *  3. 休假日 (restaurant_holidays) 檢查 (若表存在)
 *  4. 預約欄位結構驗證 (table_reservations)
 *  5. (可選) 測試插入一筆臨時預約 (僅在 --insert flag)
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY
const RESTAURANT_ID = process.env.VITE_RESTAURANT_ID

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !RESTAURANT_ID) {
	console.error('❌ 缺少必要環境變數: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / VITE_RESTAURANT_ID')
	process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const args = process.argv.slice(2)
const SHOULD_INSERT = args.includes('--insert')

function formatHeader(title) {
	console.log('\n' + title)
	console.log('-'.repeat(title.length))
}

async function fetchRestaurantSettings() {
	formatHeader('1️⃣ 讀取餐廳營業時間與預約設定')
	const { data, error } = await supabase
		.from('restaurants')
		.select('business_hours, reservation_settings, settings')
		.eq('id', RESTAURANT_ID)
		.single()
	if (error) throw new Error('餐廳設定讀取失敗: ' + error.message)
	const bh = data.business_hours || {}
	const rs = data.reservation_settings || data.settings?.reservation_settings || {}
	console.log('✅ 成功讀取')
	Object.entries(bh).forEach(([day, val]) => {
		if (!val) return
		console.log(`  ${day}: ${val.is_open ? `${val.open}-${val.close}` : '休息'}`)
	})
	console.log('預約設定片段:', {
		meal_duration: rs.meal_duration_minutes,
		last_time: rs.last_reservation_time,
		min_advance_hours: rs.min_advance_hours || rs.minAdvanceBookingHours,
		max_advance_days: rs.advance_booking_days || rs.maxAdvanceBookingDays
	})
	return { businessHours: bh, reservationSettings: rs }
}

function generateTomorrowSlots(businessHours, reservationSettings) {
	formatHeader('2️⃣ 明日可預約時段')
	const tomorrow = new Date(Date.now() + 86400000)
	const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
	const key = dayNames[tomorrow.getDay()]
	const dayInfo = businessHours[key]
	if (!dayInfo || !dayInfo.is_open) {
		console.log('❌ 明日不營業')
		return []
	}
	const lastTime = reservationSettings.last_reservation_time || reservationSettings.lastReservationTime || dayInfo.close
	const [openH, openM] = dayInfo.open.split(':').map(Number)
	const [lastH, lastM] = lastTime.split(':').map(Number)
	let h = openH, m = openM
	const slots = []
	while (h < lastH || (h === lastH && m <= lastM)) {
		slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`)
		m += 30
		if (m >= 60) { m -= 60; h++ }
	}
	console.log('✅ 時段:', slots.join(', '))
	console.log('總數:', slots.length)
	return slots
}

async function checkHolidays() {
	formatHeader('3️⃣ 休假日檢查 (若表存在)')
	try {
		const { data, error } = await supabase
			.from('restaurant_holidays')
			.select('holiday_date, holiday_name')
			.eq('restaurant_id', RESTAURANT_ID)
			.limit(5)
		if (error) {
			console.log('⚠️ 無法讀取休假日 (可能未建立表):', error.message)
			return
		}
		if (!data?.length) {
			console.log('ℹ️  目前沒有休假日記錄 (前5筆)')
			return
		}
		data.forEach(r => console.log(`  ${r.holiday_date} - ${r.holiday_name}`))
	} catch (e) {
		console.log('⚠️  休假日檢查異常:', e.message)
	}
}

async function verifyReservationColumns() {
	formatHeader('4️⃣ 預約欄位結構驗證 (抽樣)')
	const { data, error } = await supabase
		.from('table_reservations')
		.select('*')
		.limit(1)
	if (error) {
		console.log('⚠️  抽樣失敗:', error.message)
		return
	}
	if (!data?.length) {
		console.log('ℹ️ 無預約資料可供驗證 (空表)')
		return
	}
	console.log('✅ 欄位集合:', Object.keys(data[0]).join(', '))
	const expected = ['adult_count','child_count','child_chair_needed','reservation_type','reservation_notes','special_requests']
	expected.forEach(col => {
		console.log(`  ${col}: ${col in data[0] ? '✅' : '❌ 缺失'}`)
	})
}

async function maybeInsertTestReservation(slots, reservationSettings) {
	if (!SHOULD_INSERT) return
	formatHeader('5️⃣ 測試插入預約 (可選 --insert)')
	if (!slots.length) {
		console.log('❌ 無可用時段，跳過插入')
		return
	}
	const targetSlot = slots[Math.min(2, slots.length - 1)] // 選第三個或最後一個
	const tomorrow = new Date(Date.now() + 86400000)
	const dateStr = tomorrow.toISOString().split('T')[0]
	const testRow = {
		restaurant_id: RESTAURANT_ID,
		customer_name: '系統測試客戶',
		customer_phone: '0912345678',
		party_size: 4,
		adult_count: 3,
		child_count: 1,
		child_chair_needed: true,
		reservation_date: dateStr,
		reservation_time: targetSlot,
		reservation_type: 'dining',
		special_requests: '靠窗測試',
		status: 'pending'
	}
	const { error } = await supabase.from('table_reservations').insert(testRow)
	if (error) console.log('⚠️  插入失敗:', error.message)
	else console.log('✅ 已插入測試預約: ', dateStr, targetSlot)
}

async function main() {
	try {
		console.log('🧪 開始完整預約系統測試')
		const { businessHours, reservationSettings } = await fetchRestaurantSettings()
		const slots = generateTomorrowSlots(businessHours, reservationSettings)
		await checkHolidays()
		await verifyReservationColumns()
		await maybeInsertTestReservation(slots, reservationSettings)
		formatHeader('🎉 測試完成')
		console.log('概要:')
		console.log(`  時段數: ${slots.length}`)
		console.log(`  休假日檢查: 已嘗試 (是否存在表取決於環境)`)
		console.log('  欄位驗證: 已抽樣顯示')
		console.log(SHOULD_INSERT ? '  插入測試預約: 已執行 (若無錯誤)' : '  插入測試預約: 未啟用 (--insert 可啟用)')
	} catch (e) {
		console.error('❌ 測試流程失敗:', e.message)
	}
}

if (require.main === module) {
	main()
}

module.exports = { main }
