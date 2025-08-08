-- 擴展預約系統支援現場顧客與性別記錄
-- 更新時間: 2025-01-08

-- 1. 更新 table_reservations 表，增加性別欄位和現場客戶支援
ALTER TABLE public.table_reservations 
ADD COLUMN IF NOT EXISTS customer_gender VARCHAR(10) CHECK (customer_gender IN ('male', 'female', 'other', NULL)),
ADD COLUMN IF NOT EXISTS customer_last_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_walk_in BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reservation_type VARCHAR(20) DEFAULT 'advance' CHECK (reservation_type IN ('advance', 'same_day', 'walk_in'));

-- 2. 更新餐廳設定以支援當日預約
UPDATE public.restaurants 
SET settings = COALESCE(settings, '{}'::jsonb) || jsonb_build_object(
  'reservation_settings', COALESCE(settings->'reservation_settings', '{}'::jsonb) || jsonb_build_object(
    'allow_same_day_booking', true,
    'walk_in_enabled', true,
    'quick_registration', true,
    'min_advance_hours', 0,
    'same_day_slots_limit', 50
  )
)
WHERE id IS NOT NULL;

-- 3. 建立現場顾客快速登記視圖
CREATE OR REPLACE VIEW public.walk_in_customers AS
SELECT 
  id,
  customer_name,
  customer_last_name,
  customer_gender,
  party_size,
  arrival_time,
  status,
  table_id,
  seated_at,
  created_at
FROM public.table_reservations
WHERE is_walk_in = TRUE
ORDER BY arrival_time DESC;

-- 4. 建立當日預約統計視圖  
CREATE OR REPLACE VIEW public.today_reservations AS
SELECT 
  DATE(reservation_time AT TIME ZONE 'Asia/Taipei') as reservation_date,
  reservation_type,
  COUNT(*) as count,
  SUM(party_size) as total_guests
FROM public.table_reservations
WHERE DATE(reservation_time AT TIME ZONE 'Asia/Taipei') = CURRENT_DATE
GROUP BY DATE(reservation_time AT TIME ZONE 'Asia/Taipei'), reservation_type;

-- 5. 更新 RLS 政策以支援新欄位
DROP POLICY IF EXISTS "Users can view reservations" ON public.table_reservations;
CREATE POLICY "Users can view reservations" ON public.table_reservations
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert reservations" ON public.table_reservations;
CREATE POLICY "Users can insert reservations" ON public.table_reservations
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update reservations" ON public.table_reservations;
CREATE POLICY "Users can update reservations" ON public.table_reservations
FOR UPDATE USING (true);

-- 6. 為性別和預約類型建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_reservations_gender ON public.table_reservations(customer_gender);
CREATE INDEX IF NOT EXISTS idx_reservations_type ON public.table_reservations(reservation_type);
CREATE INDEX IF NOT EXISTS idx_reservations_walk_in ON public.table_reservations(is_walk_in);
CREATE INDEX IF NOT EXISTS idx_reservations_arrival_time ON public.table_reservations(arrival_time);

-- 7. 建立現場顧客登記的便利函數
CREATE OR REPLACE FUNCTION public.quick_walk_in_registration(
  p_restaurant_id UUID,
  p_customer_name TEXT,
  p_customer_last_name TEXT DEFAULT NULL,
  p_customer_gender TEXT DEFAULT NULL,
  p_party_size INTEGER DEFAULT 1,
  p_customer_phone TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  reservation_id UUID;
BEGIN
  -- 插入現場顧客記錄
  INSERT INTO public.table_reservations (
    restaurant_id,
    customer_name,
    customer_last_name,
    customer_gender,
    customer_phone,
    party_size,
    reservation_time,
    arrival_time,
    is_walk_in,
    reservation_type,
    status,
    duration_minutes
  ) VALUES (
    p_restaurant_id,
    p_customer_name,
    p_customer_last_name,
    p_customer_gender,
    COALESCE(p_customer_phone, ''),
    p_party_size,
    NOW(),
    NOW(),
    TRUE,
    'walk_in',
    'confirmed',
    120
  ) RETURNING id INTO reservation_id;
  
  RETURN reservation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 建立當日預約檢查函數
CREATE OR REPLACE FUNCTION public.check_same_day_availability(
  p_restaurant_id UUID,
  p_date DATE,
  p_party_size INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  max_capacity INTEGER;
  current_bookings INTEGER;
  settings JSONB;
BEGIN
  -- 獲取餐廳設定
  SELECT restaurants.settings INTO settings
  FROM public.restaurants 
  WHERE id = p_restaurant_id;
  
  -- 檢查是否允許當日預約
  IF NOT COALESCE((settings->'reservation_settings'->>'allow_same_day_booking')::BOOLEAN, FALSE) THEN
    RETURN FALSE;
  END IF;
  
  -- 計算當日已預約人數
  SELECT COALESCE(SUM(party_size), 0) INTO current_bookings
  FROM public.table_reservations
  WHERE restaurant_id = p_restaurant_id 
    AND DATE(reservation_time AT TIME ZONE 'Asia/Taipei') = p_date
    AND status IN ('confirmed', 'seated');
  
  -- 獲取當日預約上限
  max_capacity := COALESCE((settings->'reservation_settings'->>'same_day_slots_limit')::INTEGER, 50);
  
  -- 檢查是否還有空間
  RETURN (current_bookings + p_party_size) <= max_capacity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 為視圖設定 RLS
ALTER VIEW public.walk_in_customers SET (security_invoker = on);
ALTER VIEW public.today_reservations SET (security_invoker = on);

-- 10. 插入測試用的現場顧客資料
INSERT INTO public.table_reservations (
  restaurant_id,
  customer_name,
  customer_last_name,
  customer_gender,
  customer_phone,
  party_size,
  reservation_time,
  arrival_time,
  is_walk_in,
  reservation_type,
  status,
  duration_minutes
) VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    '王先生',
    '王',
    'male', 
    '0912345678',
    2,
    NOW(),
    NOW(),
    TRUE,
    'walk_in',
    'confirmed',
    120
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    '李小姐',
    '李',
    'female',
    '0987654321', 
    4,
    NOW() + INTERVAL '30 minutes',
    NULL,
    FALSE,
    'same_day',
    'confirmed',
    120
  );

COMMENT ON COLUMN public.table_reservations.customer_gender IS '顧客性別: male, female, other';
COMMENT ON COLUMN public.table_reservations.customer_last_name IS '顧客姓氏，用於快速識別';
COMMENT ON COLUMN public.table_reservations.is_walk_in IS '是否為現場顧客（無預約直接到店）';
COMMENT ON COLUMN public.table_reservations.arrival_time IS '實際到店時間';
COMMENT ON COLUMN public.table_reservations.reservation_type IS '預約類型: advance(預先), same_day(當日), walk_in(現場)';

COMMENT ON FUNCTION public.quick_walk_in_registration IS '現場顧客快速登記函數，簡化登記流程';
COMMENT ON FUNCTION public.check_same_day_availability IS '檢查當日預約是否還有空位';

-- 完成提示
SELECT 
  '✅ 預約系統擴展完成！' as status,
  '支援當日預約、現場顧客登記、性別記錄' as features,
  COUNT(*) as total_reservations
FROM public.table_reservations;
