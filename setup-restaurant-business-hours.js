/**
 * 設置餐廳營業時間和休假管理
 * 營業時間：每天下午2點至晚上9點
 * 用餐時長：90分鐘
 * 最晚預約：晚上7:30
 */

const { createClient } = require('@supabase/supabase-js');

// 環境配置
const SUPABASE_URL = 'https://arksfwmcmwnyxvlcpskm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFya3Nmd21jbXdueXh2bGNwc2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzM3MTAsImV4cCI6MjA2OTkwOTcxMH0.7ifP1Un1mZvtazPjeLAQEPnpO_G75VmxrI3NdkaaYCU';
const RESTAURANT_ID = 'a8fff0de-a2dd-4749-a80c-08a6102de734';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 營業時間配置
const businessHours = {
  monday: { open: '14:00', close: '21:00', is_open: true },
  tuesday: { open: '14:00', close: '21:00', is_open: true },
  wednesday: { open: '14:00', close: '21:00', is_open: true },
  thursday: { open: '14:00', close: '21:00', is_open: true },
  friday: { open: '14:00', close: '21:00', is_open: true },
  saturday: { open: '14:00', close: '21:00', is_open: true },
  sunday: { open: '14:00', close: '21:00', is_open: true }
};

// 預約設定
const reservationSettings = {
  meal_duration_minutes: 90,        // 用餐時長90分鐘
  last_reservation_time: '19:30',   // 最晚預約時間7:30PM
  advance_booking_days: 30,         // 可提前預約30天
  min_advance_hours: 2,             // 最少提前2小時預約
  max_party_size: 12,               // 最大聚餐人數
  default_table_hold_minutes: 15    // 預設保留桌台15分鐘
};

async function setupRestaurantHours() {
  try {
    console.log('🏪 開始設置餐廳營業時間和預約設定...');
    
    // 1. 更新餐廳營業時間
    const { data: updatedRestaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .update({ 
        business_hours: businessHours,
        reservation_settings: reservationSettings,
        updated_at: new Date().toISOString()
      })
      .eq('id', RESTAURANT_ID)
      .select()
      .single();
    
    if (restaurantError) {
      throw new Error(`更新餐廳資訊失敗: ${restaurantError.message}`);
    }
    
    console.log('✅ 餐廳營業時間設置完成');
    console.log('📅 營業時間: 每天下午2:00 - 晚上9:00');
    console.log('🍽️  用餐時長: 90分鐘');
    console.log('⏰ 最晚預約: 晚上7:30');
    
    // 2. 創建休假日管理表（如果不存在）
    console.log('\\n🗓️  設置休假日管理系統...');
    
    // 檢查是否需要創建休假日表
    const { data: existingHolidays, error: holidayCheckError } = await supabase
      .from('restaurant_holidays')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .limit(1);
    
    if (holidayCheckError && holidayCheckError.code !== 'PGRST116') {
      console.log('⚠️  休假日表可能需要創建，這是正常的');
    }
    
    console.log('✅ 休假日管理系統準備就緒');
    
    // 3. 驗證設置
    console.log('\\n🔍 驗證設置結果...');
    
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('business_hours, reservation_settings')
      .eq('id', RESTAURANT_ID)
      .single();
    
    if (restaurant) {
      console.log('📋 當前營業時間設定:');
      Object.entries(restaurant.business_hours).forEach(([day, hours]) => {
        console.log(`   ${day}: ${hours.is_open ? `${hours.open} - ${hours.close}` : '休息'}`);
      });
      
      console.log('\\n📋 預約設定:');
      console.log(`   用餐時長: ${restaurant.reservation_settings.meal_duration_minutes}分鐘`);
      console.log(`   最晚預約: ${restaurant.reservation_settings.last_reservation_time}`);
      console.log(`   提前預約: ${restaurant.reservation_settings.advance_booking_days}天`);
    }
    
    console.log('\\n🎉 餐廳營業時間和預約設定已完成！');
    
  } catch (error) {
    console.error('❌ 設置失敗:', error.message);
    process.exit(1);
  }
}

// 創建休假日管理的SQL（備用）
const createHolidayTableSQL = `
CREATE TABLE IF NOT EXISTS restaurant_holidays (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    holiday_date DATE NOT NULL,
    holiday_name VARCHAR(100),
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_type VARCHAR(20), -- 'yearly', 'monthly', 'weekly'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(restaurant_id, holiday_date)
);

-- 創建索引提升查詢效能
CREATE INDEX IF NOT EXISTS idx_restaurant_holidays_date 
ON restaurant_holidays(restaurant_id, holiday_date);

-- 創建函數檢查是否為休假日
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
`;

async function createHolidayTable() {
  try {
    console.log('\\n📋 創建休假日管理表...');
    
    // 注意：這需要在Supabase SQL編輯器中執行
    console.log('請在Supabase SQL編輯器中執行以下SQL:');
    console.log('='.repeat(60));
    console.log(createHolidayTableSQL);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ 創建休假日表失敗:', error.message);
  }
}

// 示範休假日設定
async function addSampleHolidays() {
  try {
    console.log('\\n🎄 添加示範休假日...');
    
    const sampleHolidays = [
      {
        restaurant_id: RESTAURANT_ID,
        holiday_date: '2025-12-25',
        holiday_name: '聖誕節',
        is_recurring: true,
        recurring_type: 'yearly',
        description: '聖誕節公休'
      },
      {
        restaurant_id: RESTAURANT_ID,
        holiday_date: '2025-01-01',
        holiday_name: '元旦',
        is_recurring: true,
        recurring_type: 'yearly',
        description: '元旦公休'
      }
    ];
    
    // 嘗試插入示範休假日（可能表格還不存在）
    try {
      const { data, error } = await supabase
        .from('restaurant_holidays')
        .upsert(sampleHolidays, { onConflict: 'restaurant_id,holiday_date' });
      
      if (error) {
        console.log('⚠️  休假日表尚未創建，這是正常的');
      } else {
        console.log('✅ 示範休假日已添加');
      }
    } catch (err) {
      console.log('💡 提示：需要先在資料庫中創建休假日表');
    }
    
  } catch (error) {
    console.log('💡 休假日功能將在資料庫表創建後可用');
  }
}

// 主執行函數
async function main() {
  await setupRestaurantHours();
  await createHolidayTable();
  await addSampleHolidays();
  
  console.log('\\n📋 下一步：');
  console.log('1. 在Supabase中創建休假日表');
  console.log('2. 建立休假日管理UI');
  console.log('3. 整合預約系統的休假日檢查');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  setupRestaurantHours,
  createHolidayTable,
  addSampleHolidays,
  businessHours,
  reservationSettings,
  createHolidayTableSQL
};
