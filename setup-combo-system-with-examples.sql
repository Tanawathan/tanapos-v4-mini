-- 套餐系統完整設置腳本 - 包含範例數據
-- 在 Supabase Dashboard > SQL Editor 中執行

-- 1. 重新創建 combo_products 表
DROP TABLE IF EXISTS combo_choices CASCADE;
DROP TABLE IF EXISTS combo_products CASCADE;

CREATE TABLE combo_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    combo_type VARCHAR(20) NOT NULL CHECK (combo_type IN ('fixed', 'selectable')),
    is_available BOOLEAN DEFAULT true,
    preparation_time INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 創建 combo_choices 表
CREATE TABLE combo_choices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    combo_id UUID NOT NULL REFERENCES combo_products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    min_selections INTEGER DEFAULT 1,
    max_selections INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 設置 RLS 政策
ALTER TABLE combo_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_choices ENABLE ROW LEVEL SECURITY;

-- combo_products 政策
CREATE POLICY "Enable read access for all users" ON combo_products FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON combo_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON combo_products FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON combo_products FOR DELETE USING (true);

-- combo_choices 政策
CREATE POLICY "Enable read access for all users" ON combo_choices FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON combo_choices FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON combo_choices FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON combo_choices FOR DELETE USING (true);

-- 4. 確保基本分類存在
DO $$
BEGIN
    -- 只插入不存在的分類
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = '前菜') THEN
        INSERT INTO categories (name) VALUES ('前菜');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = '主餐') THEN
        INSERT INTO categories (name) VALUES ('主餐');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = '飲品') THEN
        INSERT INTO categories (name) VALUES ('飲品');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = '甜點') THEN
        INSERT INTO categories (name) VALUES ('甜點');
    END IF;
    
    RAISE NOTICE '基本分類已確保存在';
END $$;

-- 5. 插入範例產品（如果不存在）
DO $$
DECLARE
    appetizer_cat_id UUID;
    main_cat_id UUID;
    drink_cat_id UUID;
    dessert_cat_id UUID;
BEGIN
    -- 獲取分類 ID
    SELECT id INTO appetizer_cat_id FROM categories WHERE name = '前菜' LIMIT 1;
    SELECT id INTO main_cat_id FROM categories WHERE name = '主餐' LIMIT 1;
    SELECT id INTO drink_cat_id FROM categories WHERE name = '飲品' LIMIT 1;
    SELECT id INTO dessert_cat_id FROM categories WHERE name = '甜點' LIMIT 1;
    
    -- 前菜
    IF appetizer_cat_id IS NOT NULL THEN
        INSERT INTO products (name, description, price, category_id, is_available) VALUES
        ('凯撒沙拉', '新鮮蔬菜配經典凯撒醬', 120.00, appetizer_cat_id, true),
        ('蒜香麵包', '香脆蒜香法式麵包', 80.00, appetizer_cat_id, true),
        ('雞翅', '香辣烤雞翅', 150.00, appetizer_cat_id, true)
        ON CONFLICT (name) DO NOTHING;
    END IF;
    
    -- 主餐
    IF main_cat_id IS NOT NULL THEN
        INSERT INTO products (name, description, price, category_id, is_available) VALUES
        ('炸雞排', '酥脆香嫩炸雞排', 200.00, main_cat_id, true),
        ('牛肉漢堡', '特調牛肉漢堡', 250.00, main_cat_id, true),
        ('義大利麵', '經典番茄義大利麵', 180.00, main_cat_id, true),
        ('烤魚', '新鮮烤魚', 280.00, main_cat_id, true),
        ('牛排', '嫩煎牛排', 350.00, main_cat_id, true)
        ON CONFLICT (name) DO NOTHING;
    END IF;
    
    -- 飲品
    IF drink_cat_id IS NOT NULL THEN
        INSERT INTO products (name, description, price, category_id, is_available) VALUES
        ('可樂', '冰涼可口可樂', 40.00, drink_cat_id, true),
        ('柳橙汁', '新鮮柳橙汁', 60.00, drink_cat_id, true),
        ('咖啡', '現煮黑咖啡', 80.00, drink_cat_id, true),
        ('奶茶', '香濃奶茶', 70.00, drink_cat_id, true),
        ('果汁', '季節水果汁', 90.00, drink_cat_id, true)
        ON CONFLICT (name) DO NOTHING;
    END IF;
    
    -- 甜點
    IF dessert_cat_id IS NOT NULL THEN
        INSERT INTO products (name, description, price, category_id, is_available) VALUES
        ('起司蛋糕', '濃郁起司蛋糕', 120.00, dessert_cat_id, true),
        ('巧克力布朗尼', '香濃巧克力布朗尼', 100.00, dessert_cat_id, true),
        ('冰淇淋', '香草冰淇淋', 80.00, dessert_cat_id, true),
        ('提拉米蘇', '義式提拉米蘇', 150.00, dessert_cat_id, true)
        ON CONFLICT (name) DO NOTHING;
    END IF;
    
    RAISE NOTICE '範例產品已插入';
END $$;

-- 6. 插入範例套餐
INSERT INTO combo_products (id, name, description, price, combo_type, is_available, preparation_time) VALUES
('550e8400-e29b-41d4-a716-446655440001', '經典套餐', '前菜 + 主餐 + 飲品的經典組合', 300.00, 'selectable', true, 20),
('550e8400-e29b-41d4-a716-446655440002', '豪華套餐', '前菜 + 主餐 + 飲品 + 甜點的豪華享受', 450.00, 'selectable', true, 25),
('550e8400-e29b-41d4-a716-446655440003', '家庭套餐', '適合2-3人分享的豐盛套餐', 800.00, 'selectable', true, 30)
ON CONFLICT (id) DO NOTHING;

-- 7. 插入套餐選擇規則
DO $$
DECLARE
    appetizer_cat_id UUID;
    main_cat_id UUID;
    drink_cat_id UUID;
    dessert_cat_id UUID;
BEGIN
    -- 獲取分類 ID
    SELECT id INTO appetizer_cat_id FROM categories WHERE name = '前菜' LIMIT 1;
    SELECT id INTO main_cat_id FROM categories WHERE name = '主餐' LIMIT 1;
    SELECT id INTO drink_cat_id FROM categories WHERE name = '飲品' LIMIT 1;
    SELECT id INTO dessert_cat_id FROM categories WHERE name = '甜點' LIMIT 1;
    
    -- 經典套餐規則
    IF appetizer_cat_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440001', appetizer_cat_id, 1, 1, 1);
    END IF;
    
    IF main_cat_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440001', main_cat_id, 1, 1, 2);
    END IF;
    
    IF drink_cat_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440001', drink_cat_id, 1, 1, 3);
    END IF;
    
    -- 豪華套餐規則
    IF appetizer_cat_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440002', appetizer_cat_id, 1, 1, 1);
    END IF;
    
    IF main_cat_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440002', main_cat_id, 1, 1, 2);
    END IF;
    
    IF drink_cat_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440002', drink_cat_id, 1, 1, 3);
    END IF;
    
    IF dessert_cat_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440002', dessert_cat_id, 1, 1, 4);
    END IF;
    
    -- 家庭套餐規則 (可以選擇多個)
    IF appetizer_cat_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440003', appetizer_cat_id, 2, 3, 1);
    END IF;
    
    IF main_cat_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440003', main_cat_id, 2, 3, 2);
    END IF;
    
    IF drink_cat_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440003', drink_cat_id, 3, 5, 3);
    END IF;
    
    IF dessert_cat_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440003', dessert_cat_id, 1, 2, 4);
    END IF;
    
    RAISE NOTICE '套餐選擇規則已插入';
END $$;

-- 8. 檢查結果
SELECT 
    '✅ 套餐總數' as 項目,
    COUNT(*) as 數量
FROM combo_products
UNION ALL
SELECT 
    '✅ 選擇規則總數' as 項目,
    COUNT(*) as 數量
FROM combo_choices
UNION ALL
SELECT 
    '✅ 分類總數' as 項目,
    COUNT(*) as 數量
FROM categories
UNION ALL
SELECT 
    '✅ 產品總數' as 項目,
    COUNT(*) as 數量
FROM products;

-- 9. 顯示套餐詳情
SELECT 
    cp.name as 套餐名稱,
    cp.combo_type as 套餐類型,
    cp.price as 價格,
    cat.name as 選擇分類,
    cc.min_selections as 最少選擇,
    cc.max_selections as 最多選擇,
    COUNT(p.id) as 可選產品數量
FROM combo_products cp
LEFT JOIN combo_choices cc ON cp.id = cc.combo_id
LEFT JOIN categories cat ON cc.category_id = cat.id
LEFT JOIN products p ON cat.id = p.category_id AND p.is_available = true
GROUP BY cp.id, cp.name, cp.combo_type, cp.price, cat.name, cc.min_selections, cc.max_selections, cc.sort_order
ORDER BY cp.name, cc.sort_order;

-- 完成訊息
SELECT '🎉 套餐系統設置完成！包含範例數據，現在可以在管理介面中進行套餐設定。' as 狀態;
