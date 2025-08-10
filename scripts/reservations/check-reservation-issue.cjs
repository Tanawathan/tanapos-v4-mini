#!/usr/bin/env node
// Moved from project root to scripts/reservations/
// Full original logic preserved below.
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;
const RESTAURANT_ID = process.env.VITE_RESTAURANT_ID;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 檢查預約時間顯示問題...');
console.log(`📡 Supabase URL: ${SUPABASE_URL}`);
console.log(`🏪 環境變數餐廳 ID: ${RESTAURANT_ID}`);
console.log('');

async function checkAllRestaurants() {
  console.log('🔍 檢查所有餐廳的ID和預約設定...');
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, reservation_settings');
    if (error) { console.log('❌ 查詢餐廳失敗:', error.message); return; }
    console.log(`✅ 找到 ${data.length} 個餐廳:`);
    data.forEach((restaurant, index) => {
      console.log(`\n${index + 1}. ${restaurant.name}`);
      console.log(`   ID: ${restaurant.id}`);
      console.log(`   是否為環境變數ID: ${restaurant.id === RESTAURANT_ID ? '✅ 是' : '❌ 否'}`);
      if (restaurant.reservation_settings) {
        const settings = restaurant.reservation_settings;
        console.log(`   預約設定: ✅ 已設定`);
        if (settings.businessHours) {
          console.log(`   營業時間: ✅ 已設定`);
          Object.entries(settings.businessHours).forEach(([day, hours]) => {
            if (hours.isOpen) console.log(`     ${day}: ${hours.openTime} - ${hours.closeTime}`);
          });
        } else { console.log(`   營業時間: ❌ 未設定`); }
        if (settings.reservationSettings) {
          const rs = settings.reservationSettings;
            console.log(`   預約規則: ✅ 已設定`);
            console.log(`     用餐時間: ${rs.mealDurationMinutes} 分鐘`);
            console.log(`     最晚預約: ${rs.lastReservationTime}`);
            console.log(`     時段間隔: ${rs.slotDurationMinutes} 分鐘`);
        } else { console.log(`   預約規則: ❌ 未設定`); }
      } else { console.log(`   預約設定: ❌ 未設定`); }
    });
  } catch (error) { console.log('❌ 檢查餐廳時發生錯誤:', error.message); }
}

async function checkTimeSlotCalculation() {
  console.log('\n🕒 檢查預約時段計算...');
  try {
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('reservation_settings')
      .eq('id', RESTAURANT_ID)
      .single();
    if (error) { console.log('❌ 查詢餐廳設定失敗:', error.message); return; }
    if (!restaurant?.reservation_settings) { console.log('❌ 餐廳沒有預約設定'); return; }
    const settings = restaurant.reservation_settings;
    console.log('✅ 找到餐廳預約設定');
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    console.log(`📅 今天是: ${dayName}`);
    const todayHours = settings.businessHours[dayName];
    if (!todayHours || !todayHours.isOpen) { console.log('❌ 今天不營業'); return; }
    console.log(`🕐 今天營業時間: ${todayHours.openTime} - ${todayHours.closeTime}`);
    const reservationSettings = settings.reservationSettings;
    const slotDuration = reservationSettings.slotDurationMinutes || 30;
    const lastReservationTime = reservationSettings.lastReservationTime || '19:30';
    console.log(`⏱️  時段間隔: ${slotDuration} 分鐘`);
    console.log(`🔚 最晚預約: ${lastReservationTime}`);
    const startTime = todayHours.openTime;
    const endTime = lastReservationTime;
    console.log(`\n📋 今天可預約時段:`);
    const startHour = parseInt(startTime.split(':')[0]);
    const startMinute = parseInt(startTime.split(':')[1]);
    const endHour = parseInt(endTime.split(':')[0]);
    const endMinute = parseInt(endTime.split(':')[1]);
    let currentHour = startHour; let currentMinute = startMinute; let slotCount = 0;
    while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
      const timeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      console.log(`   ${timeSlot}`);
      slotCount++; currentMinute += slotDuration; if (currentMinute >= 60) { currentHour++; currentMinute -= 60; }
      if (slotCount > 200) break; // safety
    }
    console.log(`\n✅ 總共 ${slotCount} 個時段`);
    if (slotCount === 0) {
      console.log('⚠️  沒有可預約時段！可能原因: 營業時間或最晚預約時間設定錯誤 / 時段間隔異常');
    }
  } catch (error) { console.log('❌ 檢查時段計算時發生錯誤:', error.message); }
}

async function checkFrontendIssues() {
  console.log('\n🖥️  檢查可能的前端問題...');
  try {
    const { data: tables, error } = await supabase
      .from('tables')
      .select('id, table_number, capacity')
      .eq('restaurant_id', RESTAURANT_ID)
      .limit(5);
    if (error) { console.log('❌ 查詢桌台失敗:', error.message); }
    else if (!tables || tables.length === 0) { console.log('❌ 沒有找到桌台資料'); }
    else { console.log(`✅ 找到 ${tables.length} 個桌台`); }
  } catch (error) { console.log('❌ 檢查桌台時發生錯誤:', error.message); }
  console.log('\n🔧 建議檢查: 餐廳ID / 前端營業時間載入 / 日期觸發 / console error / 桌台資料');
}

async function main() {
  await checkAllRestaurants();
  await checkTimeSlotCalculation();
  await checkFrontendIssues();
  console.log('\n' + '='.repeat(60));
  console.log('📋 檢查完成');
  console.log(`🏪 確認使用的餐廳ID: ${RESTAURANT_ID}`);
}

if (require.main === module) { main().catch(console.error); }
