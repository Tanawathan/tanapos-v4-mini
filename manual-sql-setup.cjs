/**
 * 使用 Supabase API 手動執行 SQL 設定
 * 添加預約設定欄位和休假日管理表
 */

const { createClient } = require('@supabase/supabase-js');

// 環境配置
const SUPABASE_URL = 'https://arksfwmcmwnyxvlcpskm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU';
const RESTAURANT_ID = 'a8fff0de-a2dd-4749-a80c-08a6102de734';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 預約設定
const reservationSettings = {
  meal_duration_minutes: 90,
  last_reservation_time: "19:30", 
  advance_booking_days: 30,
  min_advance_hours: 2,
  max_party_size: 12,
  default_table_hold_minutes: 15
};

async function executeManualSQLSetup() {
  try {
    console.log('🔧 開始手動執行 SQL 設定...');
    console.log('='.repeat(60));
    
    // 步驟 1: 嘗試更新餐廳的預約設定（即使欄位不存在也要先嘗試）
    console.log('\\n1️⃣ 嘗試直接更新餐廳預約設定...');
    
    try {
      const { data: updateResult, error: updateError } = await supabase
        .from('restaurants')
        .update({ 
          reservation_settings: reservationSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', RESTAURANT_ID)
        .select();
      
      if (updateError) {
        console.log(`❌ 直接更新失敗: ${updateError.message}`);
        console.log('   這表示 reservation_settings 欄位不存在，需要手動添加');
      } else {
        console.log('✅ 預約設定更新成功！');
      }
    } catch (err) {
      console.log(`❌ 更新預約設定失敗: ${err.message}`);
    }
    
    // 步驟 2: 嘗試創建休假日表
    console.log('\\n2️⃣ 嘗試創建休假日管理功能...');
    
    // 先嘗試插入測試休假日來檢查表是否存在
    try {
      const testHoliday = {
        restaurant_id: RESTAURANT_ID,
        holiday_date: '2025-12-25',
        holiday_name: '聖誕節',
        is_recurring: true,
        recurring_type: 'yearly',
        description: '聖誕節公休'
      };
      
      const { data: insertResult, error: insertError } = await supabase
        .from('restaurant_holidays')
        .upsert([testHoliday], { onConflict: 'restaurant_id,holiday_date' })
        .select();
      
      if (insertError) {
        console.log(`❌ 休假日表不存在: ${insertError.message}`);
      } else {
        console.log('✅ 休假日表存在，測試插入成功');
        
        // 插入更多示範休假日
        const sampleHolidays = [
          {
            restaurant_id: RESTAURANT_ID,
            holiday_date: '2025-01-01',
            holiday_name: '元旦',
            is_recurring: true,
            recurring_type: 'yearly',
            description: '元旦公休'
          },
          {
            restaurant_id: RESTAURANT_ID,
            holiday_date: '2025-02-28',
            holiday_name: '和平紀念日',
            is_recurring: true,
            recurring_type: 'yearly',
            description: '國定假日'
          }
        ];
        
        await supabase
          .from('restaurant_holidays')
          .upsert(sampleHolidays, { onConflict: 'restaurant_id,holiday_date' });
          
        console.log('✅ 示範休假日已添加');
      }
    } catch (err) {
      console.log(`❌ 休假日功能測試失敗: ${err.message}`);
    }
    
    // 步驟 3: 使用 RPC 嘗試執行 SQL（如果有權限）
    console.log('\\n3️⃣ 嘗試使用 RPC 執行 SQL...');
    
    try {
      // 嘗試調用一個可能存在的 RPC 函數
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('exec_sql', { 
          sql_command: `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'restaurants' 
            AND column_name = 'reservation_settings'
          `
        });
      
      if (rpcError) {
        console.log('❌ RPC 執行不可用，需要手動在 Supabase 後台執行 SQL');
      } else {
        console.log('✅ RPC 可用，可以執行 SQL 命令');
      }
    } catch (err) {
      console.log('❌ RPC 功能不可用');
    }
    
    // 步驟 4: 手動構建需要執行的 SQL 語句
    console.log('\\n4️⃣ 生成需要手動執行的 SQL 語句...');
    
    const sqlStatements = `
-- =====================================================
-- TanaPOS 預約系統 SQL 設定腳本
-- 請在 Supabase SQL 編輯器中執行以下語句
-- =====================================================

-- 1. 檢查並添加預約設定欄位
DO $$
BEGIN
    -- 檢查欄位是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' 
        AND column_name = 'reservation_settings'
    ) THEN
        -- 添加預約設定欄位
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
    ELSE
        RAISE NOTICE 'reservation_settings 欄位已存在';
    END IF;
END $$;

-- 2. 更新現有餐廳的預約設定
UPDATE restaurants 
SET reservation_settings = '{
    "meal_duration_minutes": 90,
    "last_reservation_time": "19:30",
    "advance_booking_days": 30, 
    "min_advance_hours": 2,
    "max_party_size": 12,
    "default_table_hold_minutes": 15
}'::jsonb,
updated_at = NOW()
WHERE id = '${RESTAURANT_ID}';

-- 3. 創建休假日管理表
CREATE TABLE IF NOT EXISTS restaurant_holidays (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    holiday_date DATE NOT NULL,
    holiday_name VARCHAR(100) NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_type VARCHAR(20) CHECK (recurring_type IN ('yearly', 'monthly', 'weekly')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(restaurant_id, holiday_date)
);

-- 4. 創建索引提升查詢效能
CREATE INDEX IF NOT EXISTS idx_restaurant_holidays_date 
ON restaurant_holidays(restaurant_id, holiday_date);

CREATE INDEX IF NOT EXISTS idx_restaurant_holidays_recurring 
ON restaurant_holidays(restaurant_id, is_recurring) 
WHERE is_recurring = true;

-- 5. 創建函數檢查是否為休假日
CREATE OR REPLACE FUNCTION is_holiday(rest_id UUID, check_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM restaurant_holidays 
        WHERE restaurant_id = rest_id 
        AND holiday_date = check_date
    );
END;
$$ LANGUAGE plpgsql;

-- 6. 創建函數獲取指定期間的休假日
CREATE OR REPLACE FUNCTION get_holidays_in_period(
    rest_id UUID, 
    start_date DATE, 
    end_date DATE
)
RETURNS TABLE(
    holiday_date DATE,
    holiday_name VARCHAR(100),
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT h.holiday_date, h.holiday_name, h.description
    FROM restaurant_holidays h
    WHERE h.restaurant_id = rest_id
    AND h.holiday_date BETWEEN start_date AND end_date
    ORDER BY h.holiday_date;
END;
$$ LANGUAGE plpgsql;

-- 7. 插入示範休假日
INSERT INTO restaurant_holidays (
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
ON CONFLICT (restaurant_id, holiday_date) DO NOTHING;

-- 8. 創建觸發器自動更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_restaurant_holidays_updated_at
    BEFORE UPDATE ON restaurant_holidays
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 執行完成後的驗證查詢
-- =====================================================

-- 驗證餐廳設定
SELECT 
    name,
    business_hours,
    reservation_settings
FROM restaurants 
WHERE id = '${RESTAURANT_ID}';

-- 驗證休假日
SELECT 
    holiday_date,
    holiday_name,
    is_recurring,
    recurring_type,
    description
FROM restaurant_holidays 
WHERE restaurant_id = '${RESTAURANT_ID}'
ORDER BY holiday_date;

-- 測試休假日檢查函數
SELECT is_holiday('${RESTAURANT_ID}', '2025-12-25') as is_christmas_holiday;

-- =====================================================
-- 設定完成！
-- =====================================================
`;

    console.log('\\n📋 請將以下 SQL 語句複製到 Supabase SQL 編輯器中執行:');
    console.log('='.repeat(60));
    console.log(sqlStatements);
    console.log('='.repeat(60));
    
    // 步驟 5: 提供設定完成後的驗證步驟
    console.log('\\n5️⃣ 設定完成後的驗證步驟...');
    
    setTimeout(async () => {
      console.log('\\n🔍 進行簡單驗證...');
      
      // 驗證餐廳資料
      try {
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('name, business_hours, reservation_settings')
          .eq('id', RESTAURANT_ID)
          .single();
        
        if (restaurant) {
          console.log('\\n✅ 餐廳資料狀態:');
          console.log(`   餐廳名稱: ${restaurant.name}`);
          console.log(`   營業時間: ${restaurant.business_hours ? '✅ 已設定' : '❌ 未設定'}`);
          console.log(`   預約設定: ${restaurant.reservation_settings ? '✅ 已設定' : '❌ 未設定'}`);
          
          if (restaurant.reservation_settings) {
            console.log('\\n📋 預約設定詳情:');
            console.log(`   用餐時長: ${restaurant.reservation_settings.meal_duration_minutes} 分鐘`);
            console.log(`   最晚預約: ${restaurant.reservation_settings.last_reservation_time}`);
          }
        }
      } catch (err) {
        console.log('❌ 餐廳資料驗證失敗:', err.message);
      }
      
      // 驗證休假日表
      try {
        const { data: holidays, error } = await supabase
          .from('restaurant_holidays')
          .select('count')
          .eq('restaurant_id', RESTAURANT_ID);
        
        if (error) {
          console.log('❌ 休假日表尚未創建');
        } else {
          console.log('✅ 休假日表已創建並可用');
        }
      } catch (err) {
        console.log('❌ 休假日表驗證失敗');
      }
    }, 2000);
    
    console.log('\\n🎉 手動 SQL 設定指南已準備完成！');
    
  } catch (error) {
    console.error('❌ 手動 SQL 設定失敗:', error.message);
  }
}

// 創建一個驗證函數
async function verifySetup() {
  console.log('\\n🔍 驗證設定結果...');
  
  try {
    // 檢查餐廳設定
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', RESTAURANT_ID)
      .single();
    
    console.log('\\n📊 設定狀態報告:');
    console.log(`✅ 餐廳名稱: ${restaurant.name}`);
    console.log(`${restaurant.business_hours ? '✅' : '❌'} 營業時間設定`);
    console.log(`${restaurant.reservation_settings ? '✅' : '❌'} 預約系統設定`);
    
    if (restaurant.business_hours) {
      console.log('\\n🕐 營業時間:');
      Object.entries(restaurant.business_hours).forEach(([day, hours]) => {
        console.log(`   ${day}: ${hours.is_open ? `${hours.open}-${hours.close}` : '休息'}`);
      });
    }
    
    if (restaurant.reservation_settings) {
      console.log('\\n🍽️ 預約設定:');
      console.log(`   用餐時長: ${restaurant.reservation_settings.meal_duration_minutes} 分鐘`);
      console.log(`   最晚預約: ${restaurant.reservation_settings.last_reservation_time}`);
      console.log(`   提前預約: ${restaurant.reservation_settings.advance_booking_days} 天`);
    }
    
    // 檢查休假日
    try {
      const { data: holidays } = await supabase
        .from('restaurant_holidays')
        .select('*')
        .eq('restaurant_id', RESTAURANT_ID)
        .limit(5);
      
      console.log(`\\n🎄 休假日設定: ${holidays ? `✅ ${holidays.length} 個假日` : '❌ 表不存在'}`);
      
      if (holidays && holidays.length > 0) {
        holidays.forEach(holiday => {
          console.log(`   ${holiday.holiday_date}: ${holiday.holiday_name}`);
        });
      }
    } catch (err) {
      console.log('❌ 休假日表尚未創建');
    }
    
  } catch (error) {
    console.error('驗證失敗:', error.message);
  }
}

// 主執行函數
async function main() {
  await executeManualSQLSetup();
  
  // 提供手動驗證選項
  console.log('\\n📝 執行 SQL 後，可運行以下命令驗證:');
  console.log('node manual-sql-setup.cjs verify');
}

// 支援驗證模式
if (process.argv[2] === 'verify') {
  verifySetup().catch(console.error);
} else {
  main().catch(console.error);
}

module.exports = {
  executeManualSQLSetup,
  verifySetup,
  reservationSettings
};
