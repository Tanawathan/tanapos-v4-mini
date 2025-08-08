-- 🔧 修復預約系統問題 - 立即預訂功能
-- 執行日期: 2025年8月8日

-- ============================================================
-- 1. 添加缺少的欄位到 table_reservations 表
-- ============================================================

-- 添加 reservation_type 欄位
ALTER TABLE public.table_reservations 
ADD COLUMN IF NOT EXISTS reservation_type VARCHAR(50) DEFAULT 'dining';

-- 添加 adult_count 和 child_count 欄位（如果不存在）
ALTER TABLE public.table_reservations 
ADD COLUMN IF NOT EXISTS adult_count INTEGER DEFAULT 0;

ALTER TABLE public.table_reservations 
ADD COLUMN IF NOT EXISTS child_count INTEGER DEFAULT 0;

-- 添加 child_chair_needed 欄位（如果不存在）
ALTER TABLE public.table_reservations 
ADD COLUMN IF NOT EXISTS child_chair_needed BOOLEAN DEFAULT FALSE;

-- ============================================================
-- 2. 更新餐廳預約設定 - 允許立即預訂
-- ============================================================

UPDATE public.restaurants 
SET reservation_settings = jsonb_set(
    reservation_settings,
    '{reservationSettings,minAdvanceBookingHours}',
    '0'::jsonb
)
WHERE id = '11111111-1111-1111-1111-111111111111';

-- 也可以調整最大提前預訂天數（如果需要）
UPDATE public.restaurants 
SET reservation_settings = jsonb_set(
    reservation_settings,
    '{reservationSettings,maxAdvanceBookingDays}',
    '90'::jsonb
)
WHERE id = '11111111-1111-1111-1111-111111111111';

-- ============================================================
-- 3. 創建預約測試資料 (可選)
-- ============================================================

-- 插入一筆測試預約 (當前時間往後 1 小時)
/*
INSERT INTO public.table_reservations (
    restaurant_id,
    customer_name,
    customer_phone,
    customer_email,
    party_size,
    adult_count,
    child_count,
    child_chair_needed,
    reservation_time,
    duration_minutes,
    estimated_end_time,
    status,
    special_requests,
    occasion,
    reservation_type,
    created_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '測試客戶',
    '0912345678',
    'test@example.com',
    2,
    2,
    0,
    FALSE,
    NOW() + INTERVAL '1 hour',
    90,
    NOW() + INTERVAL '2.5 hours',
    'confirmed',
    '測試預約',
    'dining',
    'dining',
    NOW()
);
*/

-- ============================================================
-- 4. 驗證修復結果
-- ============================================================

-- 檢查 table_reservations 表新增的欄位
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'table_reservations' 
  AND column_name IN ('reservation_type', 'adult_count', 'child_count', 'child_chair_needed')
ORDER BY column_name;

-- 檢查餐廳預約設定是否更新
SELECT 
    name,
    reservation_settings->'reservationSettings'->>'minAdvanceBookingHours' as min_advance_hours,
    reservation_settings->'reservationSettings'->>'maxAdvanceBookingDays' as max_advance_days,
    reservation_settings->'reservationSettings'->>'lastReservationTime' as last_reservation_time
FROM public.restaurants 
WHERE id = '11111111-1111-1111-1111-111111111111';

-- 檢查表是否可以正常插入資料
SELECT COUNT(*) as total_reservations 
FROM public.table_reservations 
WHERE restaurant_id = '11111111-1111-1111-1111-111111111111';

-- ============================================================
-- 執行完成！
-- ============================================================
-- 🎉 修復完成！
-- 
-- 📋 已修復的問題：
-- ✅ 添加了 reservation_type 欄位
-- ✅ 添加了 adult_count, child_count 欄位
-- ✅ 添加了 child_chair_needed 欄位
-- ✅ 調整最少提前預訂時間為 0 小時（立即預訂）
-- ✅ 調整最大提前預訂天數為 90 天
--
-- 🚀 現在可以：
-- - 立即預訂當下時間的位置
-- - 正常提交預約表單
-- - 使用完整的預約功能
-- 
-- 💡 下一步：重新測試預約功能！
