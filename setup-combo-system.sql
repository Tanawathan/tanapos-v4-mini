-- 套餐系統資料庫設置
-- 創建套餐產品表和相關功能

-- 1. 創建 combo_products 表 (套餐主表)
CREATE TABLE IF NOT EXISTS combo_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_available BOOLEAN DEFAULT true,
    preparation_time INTEGER DEFAULT 15, -- 製作時間(分鐘)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 創建 combo_items 表 (套餐項目表)
CREATE TABLE IF NOT EXISTS combo_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id UUID NOT NULL REFERENCES combo_products(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    is_optional BOOLEAN DEFAULT false,
    additional_price DECIMAL(10,2) DEFAULT 0, -- 額外加價
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(combo_id, product_id) -- 同一套餐不能重複添加同一產品
);

-- 3. 創建索引提升查詢效能
CREATE INDEX IF NOT EXISTS idx_combo_products_category ON combo_products(category_id);
CREATE INDEX IF NOT EXISTS idx_combo_products_available ON combo_products(is_available);
CREATE INDEX IF NOT EXISTS idx_combo_items_combo ON combo_items(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_items_product ON combo_items(product_id);

-- 4. 創建更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為 combo_products 表添加觸發器
DROP TRIGGER IF EXISTS update_combo_products_updated_at ON combo_products;
CREATE TRIGGER update_combo_products_updated_at
    BEFORE UPDATE ON combo_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 為 combo_items 表添加觸發器
DROP TRIGGER IF EXISTS update_combo_items_updated_at ON combo_items;
CREATE TRIGGER update_combo_items_updated_at
    BEFORE UPDATE ON combo_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. 設置 RLS (Row Level Security) 政策
ALTER TABLE combo_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_items ENABLE ROW LEVEL SECURITY;

-- 套餐產品的 RLS 政策
DROP POLICY IF EXISTS "Allow public read access to combo_products" ON combo_products;
CREATE POLICY "Allow public read access to combo_products"
    ON combo_products FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert to combo_products" ON combo_products;
CREATE POLICY "Allow authenticated insert to combo_products"
    ON combo_products FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update to combo_products" ON combo_products;
CREATE POLICY "Allow authenticated update to combo_products"
    ON combo_products FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete to combo_products" ON combo_products;
CREATE POLICY "Allow authenticated delete to combo_products"
    ON combo_products FOR DELETE
    USING (true);

-- 套餐項目的 RLS 政策
DROP POLICY IF EXISTS "Allow public read access to combo_items" ON combo_items;
CREATE POLICY "Allow public read access to combo_items"
    ON combo_items FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert to combo_items" ON combo_items;
CREATE POLICY "Allow authenticated insert to combo_items"
    ON combo_items FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update to combo_items" ON combo_items;
CREATE POLICY "Allow authenticated update to combo_items"
    ON combo_items FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete to combo_items" ON combo_items;
CREATE POLICY "Allow authenticated delete to combo_items"
    ON combo_items FOR DELETE
    USING (true);

-- 6. 創建便利視圖查詢套餐詳情
CREATE OR REPLACE VIEW combo_details AS
SELECT 
    cp.id as combo_id,
    cp.name as combo_name,
    cp.description as combo_description,
    cp.price as combo_price,
    cp.is_available as combo_available,
    cp.preparation_time,
    c.name as category_name,
    ci.id as item_id,
    ci.quantity,
    ci.is_optional,
    ci.additional_price,
    p.name as product_name,
    p.price as product_price
FROM combo_products cp
LEFT JOIN categories c ON cp.category_id = c.id
LEFT JOIN combo_items ci ON cp.id = ci.combo_id
LEFT JOIN products p ON ci.product_id = p.id
ORDER BY cp.name, ci.created_at;

-- 7. 插入示例套餐資料
INSERT INTO combo_products (name, description, price, preparation_time, is_available) VALUES
('經典雞排套餐', '包含招牌雞排、薯條、飲料的超值套餐', 180.00, 15, true),
('海鮮拼盤套餐', '新鮮海鮮配菜的豐富套餐', 380.00, 25, true),
('素食健康套餐', '營養均衡的素食組合套餐', 150.00, 12, true)
ON CONFLICT DO NOTHING;

-- 8. 檢查套餐系統設置狀態
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '套餐系統資料庫設置完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '已創建的表格:';
    RAISE NOTICE '- combo_products (套餐主表)';
    RAISE NOTICE '- combo_items (套餐項目表)';
    RAISE NOTICE '已創建的索引和觸發器';
    RAISE NOTICE '已設置 RLS 安全政策';
    RAISE NOTICE '已創建 combo_details 視圖';
    RAISE NOTICE '已插入示例套餐資料';
    RAISE NOTICE '========================================';
    RAISE NOTICE '現在可以在管理系統中管理套餐了！';
    RAISE NOTICE '========================================';
END $$;
