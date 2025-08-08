#!/usr/bin/env node

/**
 * 🧪 測試立即預訂功能
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;
const RESTAURANT_ID = process.env.VITE_RESTAURANT_ID;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🧪 測試立即預訂功能...');

async function testImmediateBooking() {
    try {
        console.log('1. 檢查餐廳預約設定...');
        
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
        const minAdvanceHours = settings.reservationSettings?.minAdvanceBookingHours || 2;
        
        console.log('✅ 預約設定:');
        console.log(`   - 最少提前時間: ${minAdvanceHours} 小時`);
        console.log(`   - 營業時間: ${JSON.stringify(settings.businessHours.friday)}`);
        
        if (minAdvanceHours > 0) {
            console.log('⚠️  需要執行 fix-reservation-immediate.sql 來設定立即預訂');
            console.log('   請到 Supabase SQL 編輯器執行該腳本');
            return;
        }
        
        console.log('✅ 已支援立即預訂');

        console.log('\n2. 檢查 table_reservations 表結構...');
        
        // 嘗試插入測試資料
        const testReservation = {
            restaurant_id: RESTAURANT_ID,
            customer_name: '測試客戶',
            customer_phone: '0912345678',
            customer_email: 'test@example.com',
            party_size: 2,
            adult_count: 2,
            child_count: 0,
            child_chair_needed: false,
            reservation_time: new Date().toISOString(),
            duration_minutes: 90,
            estimated_end_time: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
            status: 'confirmed',
            special_requests: '測試預約',
            occasion: 'dining',
            reservation_type: 'dining',
            customer_notes: JSON.stringify({
                adults: 2,
                children: 0,
                childChairNeeded: false,
                reservationType: 'dining'
            })
        };

        console.log('📝 嘗試插入測試預約...');
        
        const { data: insertData, error: insertError } = await supabase
            .from('table_reservations')
            .insert(testReservation)
            .select()
            .single();

        if (insertError) {
            console.log('❌ 插入測試預約失敗:', insertError.message);
            
            if (insertError.message.includes('reservation_type')) {
                console.log('💡 需要執行 fix-reservation-immediate.sql 添加缺少的欄位');
            }
            return;
        }

        console.log('✅ 測試預約創建成功!');
        console.log(`   預約ID: ${insertData.id}`);
        console.log(`   客戶: ${insertData.customer_name}`);
        console.log(`   時間: ${new Date(insertData.reservation_time).toLocaleString()}`);

        // 清理測試資料
        console.log('\n🧹 清理測試資料...');
        const { error: deleteError } = await supabase
            .from('table_reservations')
            .delete()
            .eq('id', insertData.id);

        if (deleteError) {
            console.log('⚠️  清理測試資料失敗:', deleteError.message);
        } else {
            console.log('✅ 測試資料已清理');
        }

        console.log('\n🎉 立即預訂功能測試完成!');
        console.log('💡 現在可以在前端測試預約功能');

    } catch (error) {
        console.log('❌ 測試失敗:', error.message);
    }
}

testImmediateBooking();
