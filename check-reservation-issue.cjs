#!/usr/bin/env node

/**
 * 🔍 檢查餐廳預約設定和時間顯示問題
 */

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

/**
 * 檢查所有餐廳的ID和設定
 */
async function checkAllRestaurants() {
    console.log('🔍 檢查所有餐廳的ID和預約設定...');
    
    try {
        const { data, error } = await supabase
            .from('restaurants')
            .select('id, name, reservation_settings');

        if (error) {
            console.log('❌ 查詢餐廳失敗:', error.message);
            return;
        }

        console.log(`✅ 找到 ${data.length} 個餐廳:`);
        
        data.forEach((restaurant, index) => {
            console.log(`\n${index + 1}. ${restaurant.name}`);
            console.log(`   ID: ${restaurant.id}`);
            console.log(`   是否為環境變數ID: ${restaurant.id === RESTAURANT_ID ? '✅ 是' : '❌ 否'}`);
            
            if (restaurant.reservation_settings) {
                const settings = restaurant.reservation_settings;
                console.log(`   預約設定: ✅ 已設定`);
                
                // 檢查營業時間
                if (settings.businessHours) {
                    console.log(`   營業時間: ✅ 已設定`);
                    Object.entries(settings.businessHours).forEach(([day, hours]) => {
                        if (hours.isOpen) {
                            console.log(`     ${day}: ${hours.openTime} - ${hours.closeTime}`);
                        }
                    });
                } else {
                    console.log(`   營業時間: ❌ 未設定`);
                }
                
                // 檢查預約設定
                if (settings.reservationSettings) {
                    const rs = settings.reservationSettings;
                    console.log(`   預約規則: ✅ 已設定`);
                    console.log(`     用餐時間: ${rs.mealDurationMinutes} 分鐘`);
                    console.log(`     最晚預約: ${rs.lastReservationTime}`);
                    console.log(`     時段間隔: ${rs.slotDurationMinutes} 分鐘`);
                } else {
                    console.log(`   預約規則: ❌ 未設定`);
                }
            } else {
                console.log(`   預約設定: ❌ 未設定`);
            }
        });

    } catch (error) {
        console.log('❌ 檢查餐廳時發生錯誤:', error.message);
    }
}

/**
 * 檢查特定餐廳的預約時段計算
 */
async function checkTimeSlotCalculation() {
    console.log('\n🕒 檢查預約時段計算...');
    
    try {
        const { data: restaurant, error } = await supabase
            .from('restaurants')
            .select('reservation_settings')
            .eq('id', RESTAURANT_ID)
            .single();

        if (error) {
            console.log('❌ 查詢餐廳設定失敗:', error.message);
            return;
        }

        if (!restaurant?.reservation_settings) {
            console.log('❌ 餐廳沒有預約設定');
            return;
        }

        const settings = restaurant.reservation_settings;
        console.log('✅ 找到餐廳預約設定');
        
        // 模擬今天的時段計算
        const today = new Date();
        const dayName = today.toLocaleDateString('en-US', { weekday: 'lowercase' });
        
        console.log(`📅 今天是: ${dayName}`);
        
        const todayHours = settings.businessHours[dayName];
        if (!todayHours || !todayHours.isOpen) {
            console.log('❌ 今天不營業');
            return;
        }
        
        console.log(`🕐 今天營業時間: ${todayHours.openTime} - ${todayHours.closeTime}`);
        
        // 計算時段
        const reservationSettings = settings.reservationSettings;
        const slotDuration = reservationSettings.slotDurationMinutes || 30;
        const lastReservationTime = reservationSettings.lastReservationTime || '19:30';
        
        console.log(`⏱️  時段間隔: ${slotDuration} 分鐘`);
        console.log(`🔚 最晚預約: ${lastReservationTime}`);
        
        // 計算可預約時段
        const startTime = todayHours.openTime;
        const endTime = lastReservationTime;
        
        console.log(`\n📋 今天可預約時段:`);
        
        // 簡單時段計算示例
        const startHour = parseInt(startTime.split(':')[0]);
        const startMinute = parseInt(startTime.split(':')[1]);
        const endHour = parseInt(endTime.split(':')[0]);
        const endMinute = parseInt(endTime.split(':')[1]);
        
        let currentHour = startHour;
        let currentMinute = startMinute;
        let slotCount = 0;
        
        while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
            const timeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
            console.log(`   ${timeSlot}`);
            
            slotCount++;
            currentMinute += slotDuration;
            
            if (currentMinute >= 60) {
                currentHour++;
                currentMinute -= 60;
            }
            
            // 防止無限循環
            if (slotCount > 20) break;
        }
        
        console.log(`\n✅ 總共 ${slotCount} 個時段`);
        
        if (slotCount === 0) {
            console.log('⚠️  沒有可預約時段！可能的原因:');
            console.log('   1. 營業時間設定錯誤');
            console.log('   2. 最晚預約時間太早');
            console.log('   3. 時段間隔設定錯誤');
        }

    } catch (error) {
        console.log('❌ 檢查時段計算時發生錯誤:', error.message);
    }
}

/**
 * 檢查前端可能的問題
 */
async function checkFrontendIssues() {
    console.log('\n🖥️  檢查可能的前端問題...');
    
    // 檢查是否有桌台
    try {
        const { data: tables, error } = await supabase
            .from('tables')
            .select('id, table_number, capacity')
            .eq('restaurant_id', RESTAURANT_ID)
            .limit(5);

        if (error) {
            console.log('❌ 查詢桌台失敗:', error.message);
        } else if (!tables || tables.length === 0) {
            console.log('❌ 沒有找到桌台資料');
            console.log('💡 預約系統需要桌台才能顯示時段');
        } else {
            console.log(`✅ 找到 ${tables.length} 個桌台`);
        }
    } catch (error) {
        console.log('❌ 檢查桌台時發生錯誤:', error.message);
    }
    
    console.log('\n🔧 可能的解決方案:');
    console.log('1. 確認前端使用正確的餐廳ID');
    console.log('2. 檢查前端預約組件是否正確讀取營業時間');
    console.log('3. 確認日期選擇是否觸發時間計算');
    console.log('4. 檢查瀏覽器控制台是否有JavaScript錯誤');
    console.log('5. 確認桌台資料存在');
}

/**
 * 主執行函數
 */
async function main() {
    await checkAllRestaurants();
    await checkTimeSlotCalculation();
    await checkFrontendIssues();
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 檢查完成');
    console.log(`🏪 確認使用的餐廳ID: ${RESTAURANT_ID}`);
    console.log('💡 如果問題持續，請檢查前端預約組件的實作');
}

if (require.main === module) {
    main().catch(console.error);
}
