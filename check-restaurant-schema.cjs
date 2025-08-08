#!/usr/bin/env node

/**
 * 🔍 檢查餐廳資料庫欄位結構
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;
const RESTAURANT_ID = process.env.VITE_RESTAURANT_ID;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 檢查餐廳資料庫結構...');

async function checkRestaurantSchema() {
    try {
        const { data, error } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', RESTAURANT_ID)
            .single();

        if (error) {
            console.log('❌ 查詢失敗:', error.message);
            return;
        }

        console.log('✅ 餐廳資料結構:');
        console.log('欄位列表:');
        Object.keys(data).forEach(key => {
            const value = data[key];
            console.log(`  ${key}: ${typeof value} = ${JSON.stringify(value)?.substring(0, 100)}${JSON.stringify(value)?.length > 100 ? '...' : ''}`);
        });

        console.log('\n🎯 重點檢查:');
        console.log('business_hours:', data.business_hours ? '✅ 存在' : '❌ 不存在');
        console.log('reservation_settings:', data.reservation_settings ? '✅ 存在' : '❌ 不存在');

        if (data.reservation_settings) {
            console.log('\n📋 reservation_settings 內容:');
            console.log(JSON.stringify(data.reservation_settings, null, 2));
        }

    } catch (error) {
        console.log('❌ 檢查失敗:', error.message);
    }
}

checkRestaurantSchema();
