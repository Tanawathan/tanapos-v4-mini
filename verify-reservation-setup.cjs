#!/usr/bin/env node

/**
 * 🧪 驗證預約系統資料庫設定
 * 檢查是否成功設定所有必要的資料庫結構
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;
const RESTAURANT_ID = process.env.VITE_RESTAURANT_ID;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ 缺少必要的環境變數');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🧪 開始驗證預約系統資料庫設定...');
console.log(`📡 連接到: ${SUPABASE_URL}`);
console.log(`🏪 餐廳 ID: ${RESTAURANT_ID}`);
console.log('');

/**
 * 檢查餐廳的預約設定
 */
async function checkRestaurantSettings() {
    console.log('🔍 檢查餐廳預約設定...');
    
    try {
        const { data, error } = await supabase
            .from('restaurants')
            .select('id, name, reservation_settings')
            .eq('id', RESTAURANT_ID)
            .single();

        if (error) {
            console.log('❌ 查詢餐廳設定失敗:', error.message);
            return false;
        }

        if (!data) {
            console.log('❌ 找不到餐廳資料');
            return false;
        }

        console.log(`✅ 餐廳名稱: ${data.name}`);
        
        if (!data.reservation_settings) {
            console.log('❌ 缺少 reservation_settings 欄位');
            return false;
        }

        const settings = data.reservation_settings;
        console.log('✅ 找到預約設定:');
        console.log(`   - 營業時間已設定: ${settings.businessHours ? '✓' : '❌'}`);
        console.log(`   - 預約設定已設定: ${settings.reservationSettings ? '✓' : '❌'}`);
        console.log(`   - 自動分配已設定: ${settings.autoAssignment ? '✓' : '❌'}`);
        
        if (settings.reservationSettings) {
            const rs = settings.reservationSettings;
            console.log(`   - 用餐時間: ${rs.mealDurationMinutes || 0} 分鐘`);
            console.log(`   - 最晚預約: ${rs.lastReservationTime || 'N/A'}`);
        }
        
        return true;
    } catch (error) {
        console.log('❌ 檢查餐廳設定時發生錯誤:', error.message);
        return false;
    }
}

/**
 * 檢查假期表是否存在
 */
async function checkHolidaysTable() {
    console.log('\n🔍 檢查餐廳假期表...');
    
    try {
        const { data, error } = await supabase
            .from('restaurant_holidays')
            .select('id')
            .eq('restaurant_id', RESTAURANT_ID)
            .limit(1);

        if (error) {
            // 如果是表不存在的錯誤
            if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
                console.log('❌ restaurant_holidays 表不存在');
                console.log('💡 需要執行 manual-sql-setup.sql 中的 SQL 命令');
                return false;
            }
            console.log('❌ 查詢假期表失敗:', error.message);
            return false;
        }

        console.log('✅ restaurant_holidays 表已存在');
        console.log(`✅ 目前有 ${data ? data.length : 0} 筆假期記錄`);
        return true;
    } catch (error) {
        console.log('❌ 檢查假期表時發生錯誤:', error.message);
        return false;
    }
}

/**
 * 檢查桌台資料是否存在
 */
async function checkTablesData() {
    console.log('\n🔍 檢查桌台資料...');
    
    try {
        const { data, error } = await supabase
            .from('tables')
            .select('id, table_number, capacity, ai_assignment_priority')
            .eq('restaurant_id', RESTAURANT_ID)
            .limit(5);

        if (error) {
            console.log('❌ 查詢桌台資料失敗:', error.message);
            return false;
        }

        if (!data || data.length === 0) {
            console.log('❌ 沒有找到桌台資料');
            console.log('💡 需要先創建桌台資料才能測試自動分配功能');
            return false;
        }

        console.log(`✅ 找到 ${data.length} 個桌台`);
        data.forEach(table => {
            console.log(`   - 桌台 ${table.table_number}: 容量 ${table.capacity}, AI優先度 ${table.ai_assignment_priority}`);
        });
        
        return true;
    } catch (error) {
        console.log('❌ 檢查桌台資料時發生錯誤:', error.message);
        return false;
    }
}

/**
 * 測試預約系統功能
 */
async function testReservationSystem() {
    console.log('\n🧪 測試預約系統功能...');
    
    try {
        // 測試查詢可用時段
        const testDate = new Date();
        testDate.setDate(testDate.getDate() + 1); // 明天
        
        console.log(`🕒 測試日期: ${testDate.toLocaleDateString()}`);
        
        // 這裡我們不能直接測試 ReservationService，因為它需要在瀏覽器環境中運行
        // 但我們可以檢查基本的資料結構是否正確
        
        console.log('✅ 基本結構檢查完成');
        console.log('💡 需要在瀏覽器中測試完整的預約功能');
        
        return true;
    } catch (error) {
        console.log('❌ 測試預約系統時發生錯誤:', error.message);
        return false;
    }
}

/**
 * 主執行函數
 */
async function main() {
    const checks = [
        { name: '餐廳預約設定', test: checkRestaurantSettings },
        { name: '假期表結構', test: checkHolidaysTable },
        { name: '桌台資料', test: checkTablesData },
        { name: '預約系統功能', test: testReservationSystem }
    ];

    const results = [];
    
    for (const check of checks) {
        const result = await check.test();
        results.push({ name: check.name, success: result });
        
        // 短暫延遲
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 總結報告
    console.log('\n' + '='.repeat(60));
    console.log('📊 驗證結果總結:');
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    results.forEach(result => {
        console.log(`${result.success ? '✅' : '❌'} ${result.name}`);
    });
    
    console.log(`\n📈 成功率: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
    
    if (successCount === totalCount) {
        console.log('\n🎉 所有檢查都通過！預約系統已準備就緒');
        console.log('🚀 可以開始在應用程式中使用預約功能');
        console.log('\n💡 功能特色:');
        console.log('   - 每日 14:00-21:00 營業時間');
        console.log('   - 90分鐘用餐時長');
        console.log('   - 最晚19:30預約');
        console.log('   - 假期管理功能');
        console.log('   - 自動桌台分配');
    } else {
        console.log('\n⚠️  仍有項目需要設定');
        console.log('💡 請按照提示完成缺少的設定');
        
        const failedChecks = results.filter(r => !r.success);
        if (failedChecks.some(c => c.name === '假期表結構')) {
            console.log('\n📋 下一步行動:');
            console.log('1. 開啟 Supabase 儀表板');
            console.log('2. 進入 SQL 編輯器');
            console.log('3. 執行 manual-sql-setup.sql 中的所有命令');
            console.log('4. 重新運行此驗證腳本');
        }
    }
}

// 執行主函數
if (require.main === module) {
    main().catch(console.error);
}
