/**
 * 使用 Supabase 服務角色 API 直接執行 SQL
 * 這個腳本會嘗試使用服務角色權限來執行資料庫設定
 */

const https = require('https');

// Supabase 配置
const SUPABASE_URL = 'https://arksfwmcmwnyxvlcpskm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6InNlcnZpY2Vcfcm9sZSIsImlhdCI6MTc1NDMzMzcxMCwiZXhwIjoyMDY5OTA5NzEwfQ.Bqk5Xrdb2vY4P4xU9QL5f3tY7oJ5GWv8wXfT4N2V2Ns'; // 需要服務角色金鑰
const RESTAURANT_ID = 'a8fff0de-a2dd-4749-a80c-08a6102de734';

// SQL 語句列表
const sqlStatements = [
  // 1. 添加預約設定欄位
  `DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' 
        AND column_name = 'reservation_settings'
    ) THEN
        ALTER TABLE restaurants 
        ADD COLUMN reservation_settings JSONB DEFAULT '{
            "meal_duration_minutes": 90,
            "last_reservation_time": "19:30", 
            "advance_booking_days": 30,
            "min_advance_hours": 2,
            "max_party_size": 12,
            "default_table_hold_minutes": 15
        }'::jsonb;
        
        RAISE NOTICE '已添加 reservation_settings 欄位';
    END IF;
END $$;`,

  // 2. 更新餐廳設定
  `UPDATE restaurants 
SET reservation_settings = '{
    "meal_duration_minutes": 90,
    "last_reservation_time": "19:30",
    "advance_booking_days": 30, 
    "min_advance_hours": 2,
    "max_party_size": 12,
    "default_table_hold_minutes": 15
}'::jsonb,
updated_at = NOW()
WHERE id = '${RESTAURANT_ID}';`,

  // 3. 創建休假日表
  `CREATE TABLE IF NOT EXISTS restaurant_holidays (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    holiday_date DATE NOT NULL,
    holiday_name VARCHAR(100) NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    recurring_type VARCHAR(20) CHECK (recurring_type IN ('yearly', 'monthly', 'weekly')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(restaurant_id, holiday_date)
);`,

  // 4. 創建索引
  `CREATE INDEX IF NOT EXISTS idx_restaurant_holidays_date 
ON restaurant_holidays(restaurant_id, holiday_date);

CREATE INDEX IF NOT EXISTS idx_restaurant_holidays_recurring 
ON restaurant_holidays(restaurant_id, is_recurring) 
WHERE is_recurring = true;`,

  // 5. 創建休假日檢查函數
  `CREATE OR REPLACE FUNCTION is_holiday(rest_id UUID, check_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM restaurant_holidays 
        WHERE restaurant_id = rest_id 
        AND holiday_date = check_date
    );
END;
$$ LANGUAGE plpgsql;`,

  // 6. 插入示範休假日
  `INSERT INTO restaurant_holidays (
    restaurant_id, 
    holiday_date, 
    holiday_name, 
    is_recurring, 
    recurring_type, 
    description
) VALUES 
    ('${RESTAURANT_ID}', '2025-01-01', '元旦', true, 'yearly', '元旦假期'),
    ('${RESTAURANT_ID}', '2025-02-28', '和平紀念日', true, 'yearly', '國定假日'),
    ('${RESTAURANT_ID}', '2025-04-04', '兒童節', true, 'yearly', '兒童節假期'),
    ('${RESTAURANT_ID}', '2025-04-05', '清明節', true, 'yearly', '清明節假期'),
    ('${RESTAURANT_ID}', '2025-05-01', '勞動節', true, 'yearly', '勞動節假期'),
    ('${RESTAURANT_ID}', '2025-10-10', '國慶日', true, 'yearly', '中華民國國慶日'),
    ('${RESTAURANT_ID}', '2025-12-25', '聖誕節', true, 'yearly', '聖誕節假期')
ON CONFLICT (restaurant_id, holiday_date) DO NOTHING;`
];

// 執行 SQL 的函數
function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: sql
    });

    const options = {
      hostname: 'arksfwmcmwnyxvlcpskm.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data: data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// 直接使用 REST API 更新餐廳設定
function updateRestaurantSettings() {
  return new Promise((resolve, reject) => {
    const settings = {
      reservation_settings: {
        meal_duration_minutes: 90,
        last_reservation_time: "19:30",
        advance_booking_days: 30,
        min_advance_hours: 2,
        max_party_size: 12,
        default_table_hold_minutes: 15
      },
      updated_at: new Date().toISOString()
    };

    const postData = JSON.stringify(settings);

    const options = {
      hostname: 'arksfwmcmwnyxvlcpskm.supabase.co',
      port: 443,
      path: `/rest/v1/restaurants?id=eq.${RESTAURANT_ID}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({ status: res.statusCode, data: data });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function executeManualSetup() {
  console.log('🔧 開始使用 Supabase API 執行 SQL 設定...');
  console.log('='.repeat(60));

  // 方法 1: 嘗試直接更新餐廳設定
  console.log('\\n1️⃣ 嘗試直接更新餐廳預約設定...');
  try {
    const result = await updateRestaurantSettings();
    console.log('✅ REST API 更新成功!', result.status);
  } catch (error) {
    console.log('❌ REST API 更新失敗:', error.message);
  }

  // 方法 2: 嘗試通過 RPC 執行 SQL
  console.log('\\n2️⃣ 嘗試通過 RPC 執行 SQL...');
  
  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    console.log(`\\n執行第 ${i + 1} 個 SQL 語句...`);
    
    try {
      const result = await executeSQL(sql);
      console.log(`✅ SQL ${i + 1} 執行成功`);
    } catch (error) {
      console.log(`❌ SQL ${i + 1} 執行失敗:`, error.message);
      
      // 如果是權限問題，提供手動執行建議
      if (error.message.includes('permission') || error.message.includes('not found')) {
        console.log('\\n📋 建議手動執行 SQL:');
        console.log('1. 打開 Supabase 控制台');
        console.log('2. 進入 SQL 編輯器');
        console.log('3. 執行以下 SQL 語句:');
        console.log('\\n```sql');
        console.log(sql);
        console.log('```');
      }
    }
    
    // 添加延遲避免過快請求
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\\n🎉 自動設定嘗試完成！');
  console.log('\\n📝 如果自動設定失敗，請手動執行以下步驟：');
  console.log('1. 打開 Supabase 控制台: https://supabase.com/dashboard');
  console.log('2. 選擇你的專案');
  console.log('3. 進入 SQL Editor');
  console.log('4. 執行 setup-reservation-database.sql 檔案中的內容');
}

// 驗證設定結果
function verifySetup() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'arksfwmcmwnyxvlcpskm.supabase.co',
      port: 443,
      path: `/rest/v1/restaurants?id=eq.${RESTAURANT_ID}&select=name,business_hours,reservation_settings`,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result && result.length > 0) {
            const restaurant = result[0];
            console.log('\\n📊 設定驗證結果:');
            console.log(`✅ 餐廳名稱: ${restaurant.name}`);
            console.log(`${restaurant.business_hours ? '✅' : '❌'} 營業時間設定`);
            console.log(`${restaurant.reservation_settings ? '✅' : '❌'} 預約系統設定`);
            
            if (restaurant.reservation_settings) {
              console.log('\\n🍽️ 預約設定詳情:');
              console.log(`   用餐時長: ${restaurant.reservation_settings.meal_duration_minutes} 分鐘`);
              console.log(`   最晚預約: ${restaurant.reservation_settings.last_reservation_time}`);
            }
          }
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// 主執行函數
async function main() {
  try {
    await executeManualSetup();
    
    // 等待一下再驗證
    console.log('\\n⏳ 等待 3 秒後驗證設定結果...');
    setTimeout(async () => {
      try {
        await verifySetup();
      } catch (error) {
        console.log('驗證失敗:', error.message);
      }
    }, 3000);
    
  } catch (error) {
    console.error('執行失敗:', error.message);
  }
}

// 支援驗證模式
if (process.argv[2] === 'verify') {
  verifySetup().catch(console.error);
} else {
  main();
}
