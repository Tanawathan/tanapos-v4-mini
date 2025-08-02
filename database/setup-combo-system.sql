-- ====================================
-- 🍽️ 套餐系統資料庫結構
-- ====================================

-- 套餐主表
CREATE TABLE IF NOT EXISTS combo_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    preparation_time INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 套餐組合項目表
CREATE TABLE IF NOT EXISTS combo_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    combo_id UUID REFERENCES combo_products(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    is_optional BOOLEAN DEFAULT false,
    additional_price DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_combo_products_category ON combo_products(category_id);
CREATE INDEX IF NOT EXISTS idx_combo_products_available ON combo_products(is_available);
CREATE INDEX IF NOT EXISTS idx_combo_items_combo ON combo_items(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_items_product ON combo_items(product_id);

-- 建立更新時間觸發器（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_combo_products_updated_at 
    BEFORE UPDATE ON combo_products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 新增權限（如果需要）
ALTER TABLE combo_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_items ENABLE ROW LEVEL SECURITY;

-- 為所有用戶創建基本政策（可根據需要調整）
CREATE POLICY "Enable read access for all users" ON combo_products FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON combo_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON combo_products FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON combo_products FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON combo_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON combo_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON combo_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON combo_items FOR DELETE USING (true);

-- 插入範例套餐資料
DO $$
DECLARE
    combo_id UUID;
    main_category_id UUID;
    chicken_product_id UUID;
    rice_product_id UUID;
    drink_product_id UUID;
BEGIN
    -- 獲取主餐分類ID
    SELECT id INTO main_category_id FROM categories WHERE name = '主餐' LIMIT 1;
    
    -- 如果沒有主餐分類，創建一個
    IF main_category_id IS NULL THEN
        INSERT INTO categories (name, description, sort_order) 
        VALUES ('套餐', '超值套餐組合', 10) 
        RETURNING id INTO main_category_id;
    END IF;
    
    -- 創建範例套餐
    INSERT INTO combo_products (name, description, price, category_id, is_available, preparation_time)
    VALUES 
        ('經典雞排套餐', '香嫩雞排+白米飯+紅茶，經濟實惠', 180, main_category_id, true, 15),
        ('泰式套餐A', '打拋豬+茉莉香米+泰式奶茶', 220, main_category_id, true, 18),
        ('素食套餐', '蔬菜咖哩+糙米飯+檸檬汽水', 160, main_category_id, true, 12)
    ON CONFLICT DO NOTHING;
    
    -- 為套餐添加組合項目（這裡假設已有基本產品）
    -- 注意：實際使用時需要根據現有的 products 表中的產品ID來設定
END $$;

-- 查詢套餐和其組合項目的VIEW
CREATE OR REPLACE VIEW combo_details AS
SELECT 
    cp.id as combo_id,
    cp.name as combo_name,
    cp.description as combo_description,
    cp.price as combo_price,
    cp.is_available,
    ci.id as item_id,
    p.name as product_name,
    ci.quantity,
    ci.is_optional,
    ci.additional_price
FROM combo_products cp
LEFT JOIN combo_items ci ON cp.id = ci.combo_id
LEFT JOIN products p ON ci.product_id = p.id
ORDER BY cp.name, ci.id;
