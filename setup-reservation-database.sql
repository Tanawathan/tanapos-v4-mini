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
WHERE id = 'a8fff0de-a2dd-4749-a80c-08a6102de734';

-- 3. 創建休假日管理表
CREATE TABLE IF NOT EXISTS restaurant_holidays (
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
    ('a8fff0de-a2dd-4749-a80c-08a6102de734', '2025-01-01', '元旦', true, 'yearly', '元旦假期'),
    ('a8fff0de-a2dd-4749-a80c-08a6102de734', '2025-02-28', '和平紀念日', true, 'yearly', '國定假日'),
    ('a8fff0de-a2dd-4749-a80c-08a6102de734', '2025-04-04', '兒童節', true, 'yearly', '兒童節假期'),
    ('a8fff0de-a2dd-4749-a80c-08a6102de734', '2025-04-05', '清明節', true, 'yearly', '清明節假期'),
    ('a8fff0de-a2dd-4749-a80c-08a6102de734', '2025-05-01', '勞動節', true, 'yearly', '勞動節假期'),
    ('a8fff0de-a2dd-4749-a80c-08a6102de734', '2025-10-10', '國慶日', true, 'yearly', '中華民國國慶日'),
    ('a8fff0de-a2dd-4749-a80c-08a6102de734', '2025-12-25', '聖誕節', true, 'yearly', '聖誕節假期')
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
WHERE id = 'a8fff0de-a2dd-4749-a80c-08a6102de734';

-- 驗證休假日
SELECT 
    holiday_date,
    holiday_name,
    is_recurring,
    recurring_type,
    description
FROM restaurant_holidays 
WHERE restaurant_id = 'a8fff0de-a2dd-4749-a80c-08a6102de734'
ORDER BY holiday_date;

-- 測試休假日檢查函數
SELECT is_holiday('a8fff0de-a2dd-4749-a80c-08a6102de734', '2025-12-25') as is_christmas_holiday;
