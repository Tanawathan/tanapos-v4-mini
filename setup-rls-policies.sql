-- TanaPOS v4 AI - RLS 政策設定
-- 此腳本設定所有必要的 Row Level Security 政策

-- 1. 啟用所有表格的 RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_selection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_selection_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- 2. 刪除舊的政策（如果存在）
DROP POLICY IF EXISTS "restaurants_policy" ON restaurants;
DROP POLICY IF EXISTS "categories_policy" ON categories;
DROP POLICY IF EXISTS "products_policy" ON products;
DROP POLICY IF EXISTS "combo_products_policy" ON combo_products;
DROP POLICY IF EXISTS "combo_selection_rules_policy" ON combo_selection_rules;
DROP POLICY IF EXISTS "combo_selection_options_policy" ON combo_selection_options;
DROP POLICY IF EXISTS "tables_policy" ON tables;
DROP POLICY IF EXISTS "orders_policy" ON orders;
DROP POLICY IF EXISTS "order_items_policy" ON order_items;
DROP POLICY IF EXISTS "suppliers_policy" ON suppliers;

-- 3. 為餐廳表創建政策
CREATE POLICY "restaurants_policy" ON restaurants
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 4. 為分類表創建政策
CREATE POLICY "categories_policy" ON categories
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. 為產品表創建政策
CREATE POLICY "products_policy" ON products
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 6. 為套餐表創建政策
CREATE POLICY "combo_products_policy" ON combo_products
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 7. 為套餐選擇規則表創建政策
CREATE POLICY "combo_selection_rules_policy" ON combo_selection_rules
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 8. 為套餐選項表創建政策
CREATE POLICY "combo_selection_options_policy" ON combo_selection_options
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 8. 為桌台表創建政策
CREATE POLICY "tables_policy" ON tables
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 9. 為訂單表創建政策
CREATE POLICY "orders_policy" ON orders
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 10. 為訂單項目表創建政策
CREATE POLICY "order_items_policy" ON order_items
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 11. 為供應商表創建政策
CREATE POLICY "suppliers_policy" ON suppliers
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 12. 授予必要權限給 authenticated 和 anon 角色
GRANT ALL ON restaurants TO authenticated, anon;
GRANT ALL ON categories TO authenticated, anon;
GRANT ALL ON products TO authenticated, anon;
GRANT ALL ON combo_products TO authenticated, anon;
GRANT ALL ON combo_selection_rules TO authenticated, anon;
GRANT ALL ON combo_selection_options TO authenticated, anon;
GRANT ALL ON tables TO authenticated, anon;
GRANT ALL ON orders TO authenticated, anon;
GRANT ALL ON order_items TO authenticated, anon;
GRANT ALL ON suppliers TO authenticated, anon;

-- 13. 授予序列權限
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- 14. 確保餐廳資料存在
INSERT INTO restaurants (id, name, address, phone, email, created_at, updated_at) 
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'TanaPOS 測試餐廳',
    '台北市信義區測試路123號',
    '02-12345678',
    'test@tanapos.com',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    updated_at = NOW();

-- 15. 驗證設定
SELECT 
    tablename,
    schemaname,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('restaurants', 'categories', 'products', 'combo_products', 'combo_selection_rules', 'combo_selection_options', 'tables', 'orders', 'order_items', 'suppliers');

-- 16. 檢查政策
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
