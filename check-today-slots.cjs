#!/usr/bin/env node

/**
 * 🔍 檢查今天可預約時段
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;
const RESTAURANT_ID = process.env.VITE_RESTAURANT_ID;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🕒 檢查今天的預約時段...');

async function checkTodayTimeSlots() {
    try {
        const { data: restaurant, error } = await supabase
            .from('restaurants')
            .select('reservation_settings')
            .eq('id', RESTAURANT_ID)
            .single();

        if (error) {
            console.log('❌ 查詢餐廳失敗:', error.message);
            return;
        }

        const settings = restaurant.reservation_settings;
        
        // 獲取今天是星期幾
        const today = new Date();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const todayName = dayNames[today.getDay()];
        
        console.log(`📅 今天是: ${todayName} (${today.toLocaleDateString()})`);
        
        const todayHours = settings.businessHours[todayName];
        if (!todayHours || !todayHours.isOpen) {
            console.log('❌ 今天不營業');
            return;
        }
        
        console.log(`🕐 營業時間: ${todayHours.openTime} - ${todayHours.closeTime}`);
        
        const reservationSettings = settings.reservationSettings;
        const slotDuration = reservationSettings.slotDurationMinutes || 30;
        const lastReservationTime = reservationSettings.lastReservationTime || '19:30';
        
        console.log(`⏱️  時段間隔: ${slotDuration} 分鐘`);
        console.log(`🔚 最晚預約: ${lastReservationTime}`);
        
        // 計算時段
        const startTime = todayHours.openTime; // "14:00"
        const endTime = lastReservationTime;   // "19:30"
        
        console.log(`\n📋 可預約時段:`);
        
        // 解析開始時間
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        let currentHour = startHour;
        let currentMinute = startMinute;
        let slots = [];
        
        while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
            const timeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
            slots.push(timeSlot);
            console.log(`   ${timeSlot}`);
            
            // 增加時段間隔
            currentMinute += slotDuration;
            
            if (currentMinute >= 60) {
                currentHour += Math.floor(currentMinute / 60);
                currentMinute = currentMinute % 60;
            }
            
            // 防止無限循環
            if (slots.length > 50) break;
        }
        
        console.log(`\n✅ 總共 ${slots.length} 個可預約時段`);
        
        if (slots.length === 0) {
            console.log('\n⚠️  沒有可預約時段！');
            console.log('可能原因:');
            console.log('1. 營業時間配置錯誤');
            console.log('2. 最晚預約時間太早');
            console.log('3. 當前時間已經過了最晚預約時間');
        } else {
            console.log('\n✅ 時段計算正常，問題可能在前端');
        }
        
        // 檢查當前時間是否影響
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        console.log(`\n🕐 當前時間: ${currentTime}`);
        
        const minAdvanceHours = reservationSettings.minAdvanceBookingHours || 2;
        console.log(`⏰ 最少提前: ${minAdvanceHours} 小時`);
        
        // 計算最早可預約時間
        const earliestBooking = new Date();
        earliestBooking.setHours(earliestBooking.getHours() + minAdvanceHours);
        const earliestTime = `${earliestBooking.getHours().toString().padStart(2, '0')}:${earliestBooking.getMinutes().toString().padStart(2, '0')}`;
        console.log(`📅 最早可預約: ${earliestTime}`);

    } catch (error) {
        console.log('❌ 檢查時發生錯誤:', error.message);
    }
}

checkTodayTimeSlots();
