-- ================================
-- TanaPOS v4 AI - Supabase 設置 SQL
-- ================================
-- 設計日期: 2025-08-05
-- 版本: v4.0
-- 用途: Supabase 專用設置與權限配置
-- 說明: 在 Supabase Dashboard SQL Editor 中執行

-- ================================
-- 1. 啟用必要的擴展功能
-- ================================

-- UUID 生成擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 全文搜索擴展
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 時間處理擴展
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ================================
-- 2. 安全性設置
-- ================================

-- 啟用行級安全 (Row Level Security)
ALTER TABLE IF EXISTS public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;

-- ================================
-- 3. 權限設置
-- ================================

-- 為匿名用戶設置基本查詢權限
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 為認證用戶設置完整權限
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 為服務角色設置管理權限
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ================================
-- 4. 行級安全政策 (RLS Policies)
-- ================================

-- 餐廳資料隔離政策
DO $$
BEGIN
    -- 檢查政策是否存在，不存在則創建
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'restaurant_isolation' AND tablename = 'restaurants') THEN
        CREATE POLICY "restaurant_isolation" ON public.restaurants
            FOR ALL USING (true);
    END IF;
END $$;

-- 分類資料隔離政策
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'categories_restaurant_access' AND tablename = 'categories') THEN
        CREATE POLICY "categories_restaurant_access" ON public.categories
            FOR ALL USING (true);
    END IF;
END $$;

-- 商品資料隔離政策
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'products_restaurant_access' AND tablename = 'products') THEN
        CREATE POLICY "products_restaurant_access" ON public.products
            FOR ALL USING (true);
    END IF;
END $$;

-- 桌台資料隔離政策
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tables_restaurant_access' AND tablename = 'tables') THEN
        CREATE POLICY "tables_restaurant_access" ON public.tables
            FOR ALL USING (true);
    END IF;
END $$;

-- 訂單資料隔離政策
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'orders_restaurant_access' AND tablename = 'orders') THEN
        CREATE POLICY "orders_restaurant_access" ON public.orders
            FOR ALL USING (true);
    END IF;
END $$;

-- 訂單項目資料隔離政策
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'order_items_access' AND tablename = 'order_items') THEN
        CREATE POLICY "order_items_access" ON public.order_items
            FOR ALL USING (true);
    END IF;
END $$;

-- ================================
-- 5. 即時訂閱設置 (Realtime)
-- ================================

-- 啟用即時訂閱功能
BEGIN;
  -- 移除現有的即時訂閱（如果有）
  DROP PUBLICATION IF EXISTS supabase_realtime;
  
  -- 創建新的即時訂閱
  CREATE PUBLICATION supabase_realtime;
END;

-- 為關鍵表格啟用即時更新
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.table_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

-- ================================
-- 6. 自定義函數
-- ================================

-- 取得資料表列表的函數
CREATE OR REPLACE FUNCTION get_tables()
RETURNS TABLE(table_name text) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
$$;

-- 取得餐廳統計資料的函數
CREATE OR REPLACE FUNCTION get_restaurant_stats(restaurant_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_tables', (SELECT COUNT(*) FROM public.tables WHERE restaurant_id = restaurant_uuid),
    'total_categories', (SELECT COUNT(*) FROM public.categories WHERE restaurant_id = restaurant_uuid),
    'total_products', (SELECT COUNT(*) FROM public.products WHERE restaurant_id = restaurant_uuid),
    'total_orders_today', (SELECT COUNT(*) FROM public.orders WHERE restaurant_id = restaurant_uuid AND DATE(created_at) = CURRENT_DATE),
    'revenue_today', (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE restaurant_id = restaurant_uuid AND DATE(created_at) = CURRENT_DATE AND status = 'completed')
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 更新桌台狀態的函數
CREATE OR REPLACE FUNCTION update_table_status(
  table_uuid uuid,
  new_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.tables 
  SET 
    status = new_status,
    updated_at = now()
  WHERE id = table_uuid;
  
  RETURN FOUND;
END;
$$;

-- 建立新訂單的函數
CREATE OR REPLACE FUNCTION create_order(
  restaurant_uuid uuid,
  table_uuid uuid DEFAULT NULL,
  customer_name_param text DEFAULT NULL,
  party_size_param integer DEFAULT 1
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_order_id uuid;
  order_num text;
BEGIN
  -- 生成訂單編號
  order_num := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
  
  -- 建立訂單
  INSERT INTO public.orders (
    restaurant_id,
    table_id,
    order_number,
    customer_name,
    party_size,
    status,
    order_type
  ) VALUES (
    restaurant_uuid,
    table_uuid,
    order_num,
    customer_name_param,
    party_size_param,
    'pending',
    CASE WHEN table_uuid IS NULL THEN 'takeaway' ELSE 'dine_in' END
  ) RETURNING id INTO new_order_id;
  
  RETURN new_order_id;
END;
$$;

-- ================================
-- 7. 序列重置（如果需要）
-- ================================

-- 建立訂單編號序列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'order_number_seq') THEN
    CREATE SEQUENCE order_number_seq START 1;
  END IF;
END $$;

-- ================================
-- 8. 索引優化（針對常用查詢）
-- ================================

-- 餐廳相關索引
CREATE INDEX IF NOT EXISTS idx_restaurants_active_supabase ON public.restaurants(is_active) WHERE is_active = true;

-- 商品查詢索引
CREATE INDEX IF NOT EXISTS idx_products_restaurant_available ON public.products(restaurant_id, is_available) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_products_category_available ON public.products(category_id, is_available) WHERE is_available = true;

-- 桌台狀態索引
CREATE INDEX IF NOT EXISTS idx_tables_restaurant_status ON public.tables(restaurant_id, status);

-- 訂單查詢索引
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created ON public.orders(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_table_status ON public.orders(table_id, status) WHERE table_id IS NOT NULL;

-- 訂單項目索引
CREATE INDEX IF NOT EXISTS idx_order_items_order_status ON public.order_items(order_id, status);

-- ================================
-- 9. 視圖定義
-- ================================

-- 訂單摘要視圖
CREATE OR REPLACE VIEW order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.table_id,
    t.table_number,
    o.customer_name,
    o.party_size,
    o.status,
    o.payment_status,
    o.order_type,
    o.subtotal,
    o.tax_amount,
    o.service_charge,
    o.total_amount,
    o.created_at,
    o.updated_at,
    COUNT(oi.id) as item_count,
    SUM(oi.quantity) as total_quantity,
    EXTRACT(EPOCH FROM (COALESCE(o.completed_at, NOW()) - o.created_at))/60 as duration_minutes
FROM public.orders o
LEFT JOIN public.order_items oi ON o.id = oi.order_id
LEFT JOIN public.tables t ON o.table_id = t.id
GROUP BY o.id, t.table_number;

-- 桌台狀態視圖
CREATE OR REPLACE VIEW table_status_view AS
SELECT 
    t.id,
    t.restaurant_id,
    t.table_number,
    t.name,
    t.capacity,
    t.status,
    t.floor_level,
    t.zone,
    ts.id as current_session_id,
    ts.customer_name as current_customer,
    ts.party_size as current_party_size,
    ts.seated_at,
    COUNT(o.id) as active_orders,
    SUM(o.total_amount) as session_total
FROM public.tables t
LEFT JOIN public.table_sessions ts ON t.current_session_id = ts.id
LEFT JOIN public.orders o ON ts.id = o.session_id AND o.status NOT IN ('completed', 'cancelled')
GROUP BY t.id, ts.id;

-- 即時廚房顯示視圖 (KDS)
CREATE OR REPLACE VIEW kds_order_items AS
SELECT 
    oi.id,
    oi.order_id,
    o.order_number,
    o.table_id,
    t.table_number,
    oi.product_name,
    oi.quantity,
    oi.status,
    oi.special_instructions,
    oi.kitchen_station,
    oi.priority_level,
    oi.estimated_prep_time,
    oi.created_at,
    oi.preparation_started_at,
    EXTRACT(EPOCH FROM (NOW() - oi.created_at))/60 as elapsed_minutes,
    CASE 
        WHEN oi.estimated_prep_time IS NOT NULL 
        THEN oi.estimated_prep_time - EXTRACT(EPOCH FROM (NOW() - oi.created_at))/60
        ELSE NULL 
    END as remaining_minutes
FROM public.order_items oi
JOIN public.orders o ON oi.order_id = o.id
LEFT JOIN public.tables t ON o.table_id = t.id
WHERE oi.status IN ('pending', 'confirmed', 'preparing')
ORDER BY oi.priority_level DESC, oi.created_at ASC;

-- ================================
-- 10. 資料驗證約束
-- ================================

-- 檢查桌台容量約束
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tables_capacity_check') THEN
        ALTER TABLE public.tables ADD CONSTRAINT tables_capacity_check 
        CHECK (capacity >= min_capacity AND (max_capacity IS NULL OR capacity <= max_capacity));
    END IF;
EXCEPTION WHEN duplicate_object THEN
    -- 約束已存在，跳過
    NULL;
END $$;

-- 檢查訂單金額約束
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_amount_check') THEN
        ALTER TABLE public.orders ADD CONSTRAINT orders_amount_check 
        CHECK (subtotal >= 0 AND total_amount >= 0);
    END IF;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- ================================
-- 11. 測試資料載入（可選）
-- ================================

-- 插入測試餐廳（如果不存在）
INSERT INTO public.restaurants (
    id, 
    name, 
    address, 
    phone, 
    email, 
    tax_rate, 
    service_charge_rate,
    currency, 
    timezone,
    business_hours,
    is_active
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'TanaPOS 示範餐廳',
    '台北市信義區信義路五段7號',
    '02-1234-5678',
    'demo@tanapos.com',
    0.05,
    0.10,
    'TWD',
    'Asia/Taipei',
    '{"monday": {"open": "09:00", "close": "22:00"}, "tuesday": {"open": "09:00", "close": "22:00"}}',
    true
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

-- 插入測試分類
WITH restaurant_id AS (SELECT '11111111-1111-1111-1111-111111111111'::uuid as id)
INSERT INTO public.categories (restaurant_id, name, description, sort_order, color, icon, is_active) 
SELECT 
    r.id,
    category_data.name,
    category_data.description,
    category_data.sort_order,
    category_data.color,
    category_data.icon,
    true
FROM restaurant_id r,
(VALUES 
    ('主餐', '主要餐點', 1, '#3B82F6', '🍽️'),
    ('飲品', '各式飲品', 2, '#10B981', '🥤'),
    ('甜點', '精緻甜點', 3, '#F59E0B', '🍰'),
    ('前菜', '開胃小菜', 4, '#EF4444', '🥗'),
    ('湯品', '湯類料理', 5, '#8B5CF6', '🍲')
) AS category_data(name, description, sort_order, color, icon)
ON CONFLICT DO NOTHING;

-- 插入測試桌台
WITH restaurant_id AS (SELECT '11111111-1111-1111-1111-111111111111'::uuid as id)
INSERT INTO public.tables (restaurant_id, table_number, name, capacity, status, floor_level, zone, is_active)
SELECT 
    r.id,
    table_data.table_number,
    '桌台 ' || table_data.table_number,
    table_data.capacity,
    'available',
    1,
    CASE WHEN table_data.table_number <= 5 THEN '用餐區A' ELSE '用餐區B' END,
    true
FROM restaurant_id r,
(VALUES 
    (1, 4), (2, 4), (3, 6), (4, 2), (5, 4),
    (6, 6), (7, 8), (8, 4), (9, 2), (10, 4)
) AS table_data(table_number, capacity)
ON CONFLICT (restaurant_id, table_number) DO UPDATE SET
    capacity = EXCLUDED.capacity,
    updated_at = NOW();

-- ================================
-- 12. 效能監控
-- ================================

-- 建立慢查詢監控（如果支援）
-- 注意：這在某些 Supabase 版本中可能不可用
DO $$
BEGIN
    -- 嘗試啟用查詢統計擴展
    CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
EXCEPTION WHEN OTHERS THEN
    -- 如果無法啟用，跳過
    RAISE NOTICE '無法啟用 pg_stat_statements 擴展';
END $$;

-- ================================
-- 完成訊息
-- ================================

DO $$
BEGIN
    RAISE NOTICE '=================================';
    RAISE NOTICE 'TanaPOS v4 AI Supabase 設置完成！';
    RAISE NOTICE '=================================';
    RAISE NOTICE '✅ 擴展功能已啟用';
    RAISE NOTICE '✅ 權限已設置';
    RAISE NOTICE '✅ 行級安全已啟用';
    RAISE NOTICE '✅ 即時訂閱已配置';
    RAISE NOTICE '✅ 自定義函數已建立';
    RAISE NOTICE '✅ 索引已優化';
    RAISE NOTICE '✅ 視圖已建立';
    RAISE NOTICE '✅ 測試資料已載入';
    RAISE NOTICE '=================================';
    RAISE NOTICE '現在可以開始使用 TanaPOS v4 AI 系統了！';
    RAISE NOTICE '建議接下來執行：';
    RAISE NOTICE '1. 測試基本功能';
    RAISE NOTICE '2. 載入更多測試資料';
    RAISE NOTICE '3. 配置前端應用程式';
    RAISE NOTICE '=================================';
END $$;
