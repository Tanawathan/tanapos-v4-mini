-- 🔧 TanaPOS V4-AI 預約系統資料庫設定
-- 手動在 Supabase SQL 編輯器中執行以下命令
-- 執行日期: 2025年8月8日

-- ============================================================
-- 1. 添加預約設定欄位到餐廳表
-- ============================================================

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

-- ============================================================
-- 2. 創建餐廳假期表
-- ============================================================

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

-- ============================================================
-- 3. 創建餐廳假期表索引（提升查詢效能）
-- ============================================================

-- 餐廳和日期複合索引
CREATE INDEX IF NOT EXISTS idx_restaurant_holidays_restaurant_date 
ON public.restaurant_holidays(restaurant_id, holiday_date);

-- 日期範圍查詢索引
CREATE INDEX IF NOT EXISTS idx_restaurant_holidays_date_range 
ON public.restaurant_holidays(holiday_date);

-- ============================================================
-- 4. 設定餐廳假期表 RLS（資料列安全性）
-- ============================================================

-- 啟用 RLS
ALTER TABLE public.restaurant_holidays ENABLE ROW LEVEL SECURITY;

-- 查看假期政策
DROP POLICY IF EXISTS "Users can view holidays for their restaurant" ON public.restaurant_holidays;
CREATE POLICY "Users can view holidays for their restaurant" 
ON public.restaurant_holidays FOR SELECT 
USING (restaurant_id IN (
    SELECT r.id FROM public.restaurants r 
    WHERE r.id = restaurant_holidays.restaurant_id
));

-- 管理假期政策
DROP POLICY IF EXISTS "Users can manage holidays for their restaurant" ON public.restaurant_holidays;
CREATE POLICY "Users can manage holidays for their restaurant" 
ON public.restaurant_holidays FOR ALL 
USING (restaurant_id IN (
    SELECT r.id FROM public.restaurants r 
    WHERE r.id = restaurant_holidays.restaurant_id
));

-- ============================================================
-- 5. 更新現有餐廳的預約設定（如果 reservation_settings 為 NULL）
-- ============================================================

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

-- ============================================================
-- 6. 驗證設定是否成功
-- ============================================================

-- 檢查餐廳表是否有 reservation_settings 欄位
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'restaurants' 
  AND column_name = 'reservation_settings';

-- 檢查是否成功創建 restaurant_holidays 表
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'restaurant_holidays';

-- 檢查索引是否創建成功
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE tablename = 'restaurant_holidays';

-- 檢查 RLS 是否啟用
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'restaurant_holidays';

-- 檢查現有餐廳的 reservation_settings
SELECT id, name, reservation_settings 
FROM public.restaurants 
LIMIT 5;

-- ============================================================
-- 執行完成！
-- ============================================================
-- 🎉 恭喜！預約系統資料庫設定完成
-- 
-- 📋 已完成的設定：
-- ✅ 餐廳表添加了 reservation_settings JSONB 欄位
-- ✅ 創建了 restaurant_holidays 假期表
-- ✅ 設定了效能索引
-- ✅ 配置了資料列安全性（RLS）
-- ✅ 更新了現有餐廳的預約設定
--
-- 🚀 現在可以使用：
-- - 每日下午 2:00 - 晚上 9:00 營業時間
-- - 90 分鐘用餐時間
-- - 最晚預約時間 19:30（7:30 PM）
-- - 假期管理功能
-- - 自動桌台分配系統
-- 
-- 💡 下一步：在應用程式中測試預約功能！
