#!/usr/bin/env node

/**
 * 🔍 檢查 table_reservations 表結構
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;
const RESTAURANT_ID = process.env.VITE_RESTAURANT_ID;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 檢查 table_reservations 表結構...');

async function checkTableReservationsStructure() {
    try {
        // 嘗試查詢表結構
        const { data, error } = await supabase
            .from('table_reservations')
            .select('*')
            .limit(1);

        if (error) {
            console.log('❌ 查詢 table_reservations 失敗:', error.message);
            
            if (error.message.includes('does not exist')) {
                console.log('🔧 需要創建 table_reservations 表');
                return false;
            }
            
            if (error.message.includes('reservation_type')) {
                console.log('🔧 需要添加 reservation_type 欄位');
                return false;
            }
        } else {
            console.log('✅ table_reservations 表存在');
            if (data && data.length > 0) {
                console.log('📋 表結構欄位:');
                Object.keys(data[0]).forEach(key => {
                    console.log(`  - ${key}`);
                });
            }
            return true;
        }
    } catch (error) {
        console.log('❌ 檢查失敗:', error.message);
        return false;
    }
}

checkTableReservationsStructure();
