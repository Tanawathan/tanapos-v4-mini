/**
 * 檢查並更新restaurants表結構
 * 添加預約設定欄位
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

async function checkAndSetupRestaurant() {
  try {
    console.log('🔍 檢查餐廳表結構...');
    
    // 先檢查當前餐廳資料
    const { data: restaurant, error: fetchError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', RESTAURANT_ID)
      .single();
    
    if (fetchError) {
      throw new Error(`查詢餐廳失敗: ${fetchError.message}`);
    }
    
    console.log('📋 當前餐廳資料:');
    console.log(`   餐廳名稱: ${restaurant.name}`);
    console.log(`   是否有營業時間: ${restaurant.business_hours ? '是' : '否'}`);
    
    // 更新營業時間（business_hours欄位應該已存在）
    console.log('\\n🏪 更新營業時間設定...');
    
    const { data: updatedRestaurant, error: updateError } = await supabase
      .from('restaurants')
      .update({ 
        business_hours: businessHours,
        updated_at: new Date().toISOString()
      })
      .eq('id', RESTAURANT_ID)
      .select()
      .single();
    
    if (updateError) {
      throw new Error(`更新餐廳營業時間失敗: ${updateError.message}`);
    }
    
    console.log('✅ 餐廳營業時間設置完成');
    console.log('📅 營業時間: 每天下午2:00 - 晚上9:00');
    console.log('🍽️  用餐時長: 90分鐘（最晚預約7:30PM）');
    
    // 顯示SQL語句來添加預約設定欄位
    console.log('\\n📋 需要在Supabase SQL編輯器中執行以下語句:');
    console.log('='.repeat(70));
    
    const addReservationSettingsSQL = `
-- 添加預約設定欄位到restaurants表
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS reservation_settings JSONB DEFAULT '{
  "meal_duration_minutes": 90,
  "last_reservation_time": "19:30", 
  "advance_booking_days": 30,
  "min_advance_hours": 2,
  "max_party_size": 12,
  "default_table_hold_minutes": 15
}'::jsonb;

-- 更新現有餐廳的預約設定
UPDATE restaurants 
SET reservation_settings = '{
  "meal_duration_minutes": 90,
  "last_reservation_time": "19:30",
  "advance_booking_days": 30, 
  "min_advance_hours": 2,
  "max_party_size": 12,
  "default_table_hold_minutes": 15
}'::jsonb
WHERE id = '${RESTAURANT_ID}';

-- 創建休假日管理表
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

-- 插入示範休假日
INSERT INTO restaurant_holidays (restaurant_id, holiday_date, holiday_name, is_recurring, recurring_type, description)
VALUES 
    ('${RESTAURANT_ID}', '2025-12-25', '聖誕節', true, 'yearly', '聖誕節公休'),
    ('${RESTAURANT_ID}', '2025-01-01', '元旦', true, 'yearly', '元旦公休')
ON CONFLICT (restaurant_id, holiday_date) DO NOTHING;
`;
    
    console.log(addReservationSettingsSQL);
    console.log('='.repeat(70));
    
    console.log('\\n📋 執行上述SQL後，預約系統將支援:');
    console.log('   ⏰ 營業時間: 每天下午2:00 - 晚上9:00'); 
    console.log('   🍽️  用餐時長: 90分鐘');
    console.log('   📅 最晚預約: 晚上7:30');
    console.log('   🎄 休假日管理: 可設定不固定休假日');
    console.log('   📊 預約限制: 提前2小時至30天，最多12人');
    
  } catch (error) {
    console.error('❌ 處理失敗:', error.message);
  }
}

if (require.main === module) {
  checkAndSetupRestaurant().catch(console.error);
}

module.exports = {
  checkAndSetupRestaurant,
  businessHours
};
