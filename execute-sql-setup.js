#!/usr/bin/env node

/**
 * 🔧 Supabase SQL 設定執行器
 * 使用服務角色金鑰直接執行 SQL 命令
 */

const https = require('https');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ 缺少必要的環境變數：');
    console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✓' : '❌');
    console.error('   PRIVATE_SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✓' : '❌');
    process.exit(1);
}

console.log('🚀 開始執行 Supabase SQL 設定...');
console.log(`📡 連接到: ${SUPABASE_URL}`);

// SQL 命令列表
const sqlCommands = [
    {
        name: '添加預約設定欄位到餐廳表',
        sql: `
        ALTER TABLE public.restaurants 
        ADD COLUMN IF NOT EXISTS reservation_settings JSONB DEFAULT '{
            "businessHours": {
                "monday": {"isOpen": true, "openTime": "14:00", "closeTime": "21:00"},
                "tuesday": {"isOpen": true, "openTime": "14:00", "closeTime": "21:00"},
                "wednesday": {"isOpen": true, "openTime": "14:00", "closeTime": "21:00"},
                "thursday": {"isOpen": true, "openTime": "14:00", "closeTime": "21:00"},
                "friday": {"isOpen": true, "openTime": "14:00", "closeTime": "21:00"},
                "saturday": {"isOpen": true, "openTime": "14:00", "closeTime": "21:00"},
                "sunday": {"isOpen": true, "openTime": "14:00", "closeTime": "21:00"}
            },
            "reservationSettings": {
                "slotDurationMinutes": 30,
                "maxAdvanceBookingDays": 30,
                "minAdvanceBookingHours": 2,
                "mealDurationMinutes": 90,
                "lastReservationTime": "19:30"
            },
            "autoAssignment": {
                "enabled": true,
                "preferenceWeight": 0.3,
                "capacityWeight": 0.5,
                "aiPriorityWeight": 0.2
            }
        }'::jsonb;
        `
    },
    {
        name: '創建餐廳假期表',
        sql: `
        CREATE TABLE IF NOT EXISTS public.restaurant_holidays (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
            holiday_date DATE NOT NULL,
            holiday_name VARCHAR(255) NOT NULL,
            is_recurring BOOLEAN DEFAULT FALSE,
            recurrence_type VARCHAR(20) CHECK (recurrence_type IN ('yearly', 'monthly', 'weekly')) DEFAULT NULL,
            is_closed BOOLEAN DEFAULT TRUE,
            special_hours JSONB DEFAULT NULL,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            -- 確保同一餐廳同一天不會有重複的假期記錄
            UNIQUE(restaurant_id, holiday_date)
        );
        `
    },
    {
        name: '創建餐廳假期表索引',
        sql: `
        CREATE INDEX IF NOT EXISTS idx_restaurant_holidays_restaurant_date 
        ON public.restaurant_holidays(restaurant_id, holiday_date);
        
        CREATE INDEX IF NOT EXISTS idx_restaurant_holidays_date_range 
        ON public.restaurant_holidays(holiday_date);
        `
    },
    {
        name: '設定餐廳假期表 RLS',
        sql: `
        ALTER TABLE public.restaurant_holidays ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view holidays for their restaurant" ON public.restaurant_holidays;
        CREATE POLICY "Users can view holidays for their restaurant" 
        ON public.restaurant_holidays FOR SELECT 
        USING (restaurant_id IN (
            SELECT r.id FROM public.restaurants r 
            WHERE r.id = restaurant_holidays.restaurant_id
        ));
        
        DROP POLICY IF EXISTS "Users can manage holidays for their restaurant" ON public.restaurant_holidays;
        CREATE POLICY "Users can manage holidays for their restaurant" 
        ON public.restaurant_holidays FOR ALL 
        USING (restaurant_id IN (
            SELECT r.id FROM public.restaurants r 
            WHERE r.id = restaurant_holidays.restaurant_id
        ));
        `
    },
    {
        name: '更新現有餐廳的預約設定',
        sql: `
        UPDATE public.restaurants 
        SET reservation_settings = '{
            "businessHours": {
                "monday": {"isOpen": true, "openTime": "14:00", "closeTime": "21:00"},
                "tuesday": {"isOpen": true, "openTime": "14:00", "closeTime": "21:00"},
                "wednesday": {"isOpen": true, "openTime": "14:00", "closeTime": "21:00"},
                "thursday": {"isOpen": true, "openTime": "14:00", "closeTime": "21:00"},
                "friday": {"isOpen": true, "openTime": "14:00", "closeTime": "21:00"},
                "saturday": {"isOpen": true, "openTime": "14:00", "closeTime": "21:00"},
                "sunday": {"isOpen": true, "openTime": "14:00", "closeTime": "21:00"}
            },
            "reservationSettings": {
                "slotDurationMinutes": 30,
                "maxAdvanceBookingDays": 30,
                "minAdvanceBookingHours": 2,
                "mealDurationMinutes": 90,
                "lastReservationTime": "19:30"
            },
            "autoAssignment": {
                "enabled": true,
                "preferenceWeight": 0.3,
                "capacityWeight": 0.5,
                "aiPriorityWeight": 0.2
            }
        }'::jsonb
        WHERE reservation_settings IS NULL;
        `
    }
];

/**
 * 執行 SQL 命令
 */
async function executeSqlCommand(command) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);
        
        const postData = JSON.stringify({
            sql: command.sql.trim()
        });

        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({
                        success: true,
                        statusCode: res.statusCode,
                        data: data
                    });
                } else {
                    reject({
                        success: false,
                        statusCode: res.statusCode,
                        error: data
                    });
                }
            });
        });

        req.on('error', (err) => {
            reject({
                success: false,
                error: err.message
            });
        });

        req.write(postData);
        req.end();
    });
}

/**
 * 直接執行 SQL（不使用 RPC）
 */
async function executeDirectSQL(command) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${SUPABASE_URL}/rest/v1/`);
        
        const postData = command.sql.trim();

        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: '/rest/v1/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/sql',
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'apikey': SERVICE_ROLE_KEY,
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`   HTTP 狀態碼: ${res.statusCode}`);
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({
                        success: true,
                        statusCode: res.statusCode,
                        data: data
                    });
                } else {
                    console.log(`   錯誤回應: ${data}`);
                    reject({
                        success: false,
                        statusCode: res.statusCode,
                        error: data
                    });
                }
            });
        });

        req.on('error', (err) => {
            reject({
                success: false,
                error: err.message
            });
        });

        req.write(postData);
        req.end();
    });
}

/**
 * 主執行函數
 */
async function main() {
    console.log(`\n📋 準備執行 ${sqlCommands.length} 個 SQL 命令...\n`);
    
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < sqlCommands.length; i++) {
        const command = sqlCommands[i];
        console.log(`🔄 [${i + 1}/${sqlCommands.length}] ${command.name}`);
        
        try {
            // 嘗試直接執行 SQL
            const result = await executeDirectSQL(command);
            console.log(`✅ 成功執行`);
            successCount++;
        } catch (error) {
            console.log(`❌ 執行失敗:`);
            console.log(`   錯誤: ${error.error || error.message}`);
            console.log(`   狀態碼: ${error.statusCode || 'N/A'}`);
            failureCount++;
        }
        
        console.log(''); // 空行分隔
    }

    // 總結報告
    console.log('='.repeat(60));
    console.log('📊 執行總結:');
    console.log(`✅ 成功: ${successCount} 個命令`);
    console.log(`❌ 失敗: ${failureCount} 個命令`);
    console.log(`📋 總計: ${sqlCommands.length} 個命令`);
    
    if (failureCount === 0) {
        console.log('\n🎉 所有 SQL 命令執行成功！');
        console.log('🚀 預約系統現在已完全設定完成');
        console.log('💡 可以開始使用業務時間和假期管理功能');
    } else {
        console.log(`\n⚠️  有 ${failureCount} 個命令執行失敗`);
        console.log('💡 請檢查錯誤訊息並手動在 Supabase SQL 編輯器中執行失敗的命令');
    }
}

// 執行主函數
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { executeSqlCommand, executeDirectSQL, sqlCommands };
