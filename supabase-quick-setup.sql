-- ================================
-- TanaPOS v4 AI - 快速設置 SQL
-- ================================
-- 用途: 在 Supabase Dashboard SQL Editor 中一鍵執行
-- 說明: 包含最基本的設置，適合快速測試

-- 啟用擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 關閉 RLS 以便測試（生產環境請啟用）
ALTER TABLE IF EXISTS public.restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items DISABLE ROW LEVEL SECURITY;

-- 設置權限
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 建立訂單序列
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- 插入測試餐廳
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
    true
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

-- 快速完成提示
SELECT 'TanaPOS v4 AI 快速設置完成！現在可以開始測試系統功能。' as setup_status;
