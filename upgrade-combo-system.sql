-- 升級套餐系統：支援分類選擇的套餐組合
-- 例如：夏日套餐 = 選一個前菜 + 一個主餐 + 一個飲品 + 一個甜點

-- 1. 修改 combo_products 表格，新增套餐類型
ALTER TABLE combo_products ADD COLUMN IF NOT EXISTS combo_type VARCHAR(50) DEFAULT 'fixed';
-- combo_type: 'fixed' = 固定套餐, 'customizable' = 可選擇套餐

-- 2. 創建套餐選擇規則表
CREATE TABLE IF NOT EXISTS combo_selection_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id UUID NOT NULL REFERENCES combo_products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    selection_name VARCHAR(255) NOT NULL, -- 例如: "選擇前菜", "選擇主餐"
    min_selections INTEGER DEFAULT 1, -- 最少選擇數量
    max_selections INTEGER DEFAULT 1, -- 最多選擇數量
    is_required BOOLEAN DEFAULT true, -- 是否必選
    display_order INTEGER DEFAULT 0, -- 顯示順序
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 創建套餐選項表 (從分類中可選的產品)
CREATE TABLE IF NOT EXISTS combo_selection_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES combo_selection_rules(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    additional_price DECIMAL(10,2) DEFAULT 0, -- 額外加價
    is_default BOOLEAN DEFAULT false, -- 是否為預設選項
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rule_id, product_id) -- 同一規則不能重複添加同一產品
);

-- 4. 創建訂單套餐選擇記錄表
CREATE TABLE IF NOT EXISTS order_combo_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    rule_id UUID NOT NULL REFERENCES combo_selection_rules(id) ON DELETE CASCADE,
    selected_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    additional_price DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 創建索引
CREATE INDEX IF NOT EXISTS idx_combo_selection_rules_combo ON combo_selection_rules(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_selection_rules_category ON combo_selection_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_combo_selection_options_rule ON combo_selection_options(rule_id);
CREATE INDEX IF NOT EXISTS idx_combo_selection_options_product ON combo_selection_options(product_id);
CREATE INDEX IF NOT EXISTS idx_order_combo_selections_order_item ON order_combo_selections(order_item_id);

-- 6. 更新時間觸發器
DROP TRIGGER IF EXISTS update_combo_selection_rules_updated_at ON combo_selection_rules;
CREATE TRIGGER update_combo_selection_rules_updated_at
    BEFORE UPDATE ON combo_selection_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. RLS 政策
ALTER TABLE combo_selection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_selection_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_combo_selections ENABLE ROW LEVEL SECURITY;

-- combo_selection_rules 政策
DROP POLICY IF EXISTS "Allow public read access to combo_selection_rules" ON combo_selection_rules;
CREATE POLICY "Allow public read access to combo_selection_rules"
    ON combo_selection_rules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated modify to combo_selection_rules" ON combo_selection_rules;
CREATE POLICY "Allow authenticated modify to combo_selection_rules"
    ON combo_selection_rules FOR ALL USING (true);

-- combo_selection_options 政策
DROP POLICY IF EXISTS "Allow public read access to combo_selection_options" ON combo_selection_options;
CREATE POLICY "Allow public read access to combo_selection_options"
    ON combo_selection_options FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated modify to combo_selection_options" ON combo_selection_options;
CREATE POLICY "Allow authenticated modify to combo_selection_options"
    ON combo_selection_options FOR ALL USING (true);

-- order_combo_selections 政策
DROP POLICY IF EXISTS "Allow public read access to order_combo_selections" ON order_combo_selections;
CREATE POLICY "Allow public read access to order_combo_selections"
    ON order_combo_selections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated modify to order_combo_selections" ON order_combo_selections;
CREATE POLICY "Allow authenticated modify to order_combo_selections"
    ON order_combo_selections FOR ALL USING (true);

-- 8. 創建便利視圖：套餐完整詳情
CREATE OR REPLACE VIEW combo_full_details AS
SELECT 
    cp.id as combo_id,
    cp.name as combo_name,
    cp.description as combo_description,
    cp.price as combo_base_price,
    cp.combo_type,
    cp.is_available as combo_available,
    
    -- 選擇規則
    csr.id as rule_id,
    csr.selection_name,
    csr.min_selections,
    csr.max_selections,
    csr.is_required,
    csr.display_order,
    cat.name as category_name,
    
    -- 選項詳情
    cso.id as option_id,
    cso.additional_price,
    cso.is_default,
    p.id as product_id,
    p.name as product_name,
    p.price as product_price,
    p.description as product_description

FROM combo_products cp
LEFT JOIN combo_selection_rules csr ON cp.id = csr.combo_id
LEFT JOIN categories cat ON csr.category_id = cat.id
LEFT JOIN combo_selection_options cso ON csr.id = cso.rule_id
LEFT JOIN products p ON cso.product_id = p.id
WHERE cp.combo_type = 'customizable'
ORDER BY cp.name, csr.display_order, p.name;

-- 9. 插入示例可選擇套餐
INSERT INTO combo_products (name, description, price, combo_type, preparation_time, is_available) VALUES
('夏日特色套餐', '自由選擇前菜、主餐、飲品、甜點的完美組合', 280.00, 'customizable', 25, true),
('經典商務套餐', '適合商務聚餐的豊富選擇', 380.00, 'customizable', 30, true)
ON CONFLICT DO NOTHING;

-- 獲取剛插入的套餐ID (僅在第一次執行時有效)
DO $$
DECLARE
    summer_combo_id UUID;
    business_combo_id UUID;
    appetizer_cat_id UUID;
    main_cat_id UUID;
    drink_cat_id UUID;
    dessert_cat_id UUID;
BEGIN
    -- 獲取套餐ID
    SELECT id INTO summer_combo_id FROM combo_products WHERE name = '夏日特色套餐' AND combo_type = 'customizable' LIMIT 1;
    SELECT id INTO business_combo_id FROM combo_products WHERE name = '經典商務套餐' AND combo_type = 'customizable' LIMIT 1;
    
    -- 獲取分類ID (假設已存在這些分類)
    SELECT id INTO appetizer_cat_id FROM categories WHERE name ILIKE '%前菜%' OR name ILIKE '%開胃%' OR name ILIKE '%appetizer%' LIMIT 1;
    SELECT id INTO main_cat_id FROM categories WHERE name ILIKE '%主餐%' OR name ILIKE '%主食%' OR name ILIKE '%main%' LIMIT 1;
    SELECT id INTO drink_cat_id FROM categories WHERE name ILIKE '%飲品%' OR name ILIKE '%飲料%' OR name ILIKE '%drink%' LIMIT 1;
    SELECT id INTO dessert_cat_id FROM categories WHERE name ILIKE '%甜點%' OR name ILIKE '%dessert%' LIMIT 1;
    
    -- 如果找不到分類，創建基本分類
    IF appetizer_cat_id IS NULL THEN
        INSERT INTO categories (name, description) VALUES ('前菜類', '開胃前菜') ON CONFLICT DO NOTHING;
        SELECT id INTO appetizer_cat_id FROM categories WHERE name = '前菜類' LIMIT 1;
    END IF;
    
    IF main_cat_id IS NULL THEN
        INSERT INTO categories (name, description) VALUES ('主餐類', '主要餐點') ON CONFLICT DO NOTHING;
        SELECT id INTO main_cat_id FROM categories WHERE name = '主餐類' LIMIT 1;
    END IF;
    
    IF drink_cat_id IS NULL THEN
        INSERT INTO categories (name, description) VALUES ('飲品類', '各式飲料') ON CONFLICT DO NOTHING;
        SELECT id INTO drink_cat_id FROM categories WHERE name = '飲品類' LIMIT 1;
    END IF;
    
    IF dessert_cat_id IS NULL THEN
        INSERT INTO categories (name, description) VALUES ('甜點類', '餐後甜品') ON CONFLICT DO NOTHING;
        SELECT id INTO dessert_cat_id FROM categories WHERE name = '甜點類' LIMIT 1;
    END IF;
    
    -- 為夏日套餐創建選擇規則
    IF summer_combo_id IS NOT NULL THEN
        INSERT INTO combo_selection_rules (combo_id, category_id, selection_name, min_selections, max_selections, is_required, display_order) VALUES
        (summer_combo_id, appetizer_cat_id, '選擇前菜', 1, 1, true, 1),
        (summer_combo_id, main_cat_id, '選擇主餐', 1, 1, true, 2),
        (summer_combo_id, drink_cat_id, '選擇飲品', 1, 1, true, 3),
        (summer_combo_id, dessert_cat_id, '選擇甜點', 1, 1, false, 4)
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- 為商務套餐創建選擇規則
    IF business_combo_id IS NOT NULL THEN
        INSERT INTO combo_selection_rules (combo_id, category_id, selection_name, min_selections, max_selections, is_required, display_order) VALUES
        (business_combo_id, appetizer_cat_id, '選擇前菜', 1, 2, true, 1),
        (business_combo_id, main_cat_id, '選擇主餐', 1, 1, true, 2),
        (business_combo_id, drink_cat_id, '選擇飲品', 1, 2, false, 3),
        (business_combo_id, dessert_cat_id, '選擇甜點', 0, 1, false, 4)
        ON CONFLICT DO NOTHING;
    END IF;
    
    RAISE NOTICE '✅ 示例可選擇套餐設置完成';
END $$;

-- 10. 完成提示
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🍽️ 升級套餐系統完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '新增功能:';
    RAISE NOTICE '✅ 可選擇套餐系統 (customizable combos)';
    RAISE NOTICE '✅ 分類選擇規則 (category selection rules)';
    RAISE NOTICE '✅ 套餐選項管理 (combo selection options)';
    RAISE NOTICE '✅ 訂單套餐選擇記錄 (order combo selections)';
    RAISE NOTICE '✅ 示例套餐: 夏日特色套餐、經典商務套餐';
    RAISE NOTICE '========================================';
    RAISE NOTICE '下一步: 更新前端組件支援套餐選擇';
    RAISE NOTICE '========================================';
END $$;
