-- 超級安全版修復腳本 - 自動檢測表結構
-- 請在 Supabase Dashboard > SQL Editor 中執行

-- 1. 完全移除現有的套餐相關表（如果存在）
DROP TABLE IF EXISTS combo_choices CASCADE;
DROP TABLE IF EXISTS combo_products CASCADE;

-- 2. 創建 combo_products 表
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

-- 3. 創建 combo_choices 表
CREATE TABLE combo_choices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    combo_id UUID NOT NULL REFERENCES combo_products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    min_selections INTEGER DEFAULT 1,
    max_selections INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 設置 RLS 政策
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

-- 5. 檢查 categories 表結構並安全插入分類
DO $$
DECLARE
    has_is_available BOOLEAN;
    has_color BOOLEAN;
    has_sort_order BOOLEAN;
BEGIN
    -- 檢查 categories 表的欄位
    SELECT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'is_available'
    ) INTO has_is_available;
    
    SELECT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'color'
    ) INTO has_color;
    
    SELECT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'categories' AND column_name = 'sort_order'
    ) INTO has_sort_order;
    
    -- 根據欄位存在情況執行不同的插入語句
    IF has_is_available AND has_color AND has_sort_order THEN
        INSERT INTO categories (name, color, sort_order, is_available) VALUES
        ('前菜', '#FF6B6B', 1, true),
        ('主餐', '#4ECDC4', 2, true),
        ('飲品', '#45B7D1', 3, true),
        ('甜點', '#96CEB4', 4, true),
        ('湯品', '#FECA57', 5, true)
        ON CONFLICT (name) DO NOTHING;
    ELSIF has_color AND has_sort_order THEN
        INSERT INTO categories (name, color, sort_order) VALUES
        ('前菜', '#FF6B6B', 1),
        ('主餐', '#4ECDC4', 2),
        ('飲品', '#45B7D1', 3),
        ('甜點', '#96CEB4', 4),
        ('湯品', '#FECA57', 5)
        ON CONFLICT (name) DO NOTHING;
    ELSIF has_color THEN
        INSERT INTO categories (name, color) VALUES
        ('前菜', '#FF6B6B'),
        ('主餐', '#4ECDC4'),
        ('飲品', '#45B7D1'),
        ('甜點', '#96CEB4'),
        ('湯品', '#FECA57')
        ON CONFLICT (name) DO NOTHING;
    ELSE
        INSERT INTO categories (name) VALUES
        ('前菜'),
        ('主餐'),
        ('飲品'),
        ('甜點'),
        ('湯品')
        ON CONFLICT (name) DO NOTHING;
    END IF;
    
    RAISE NOTICE '分類已安全插入';
END $$;

-- 6. 插入套餐資料
INSERT INTO combo_products (id, name, description, price, combo_type, is_available, preparation_time) VALUES
('550e8400-e29b-41d4-a716-446655440001', '夏日特色套餐', '可選擇前菜、主餐、飲品、甜點的完美組合', 330.00, 'selectable', true, 25),
('550e8400-e29b-41d4-a716-446655440002', '經典商務套餐', '包含主餐、湯品、飲品的商務首選', 280.00, 'selectable', true, 20),
('550e8400-e29b-41d4-a716-446655440003', '超值家庭套餐', '適合分享的豐盛套餐組合', 680.00, 'selectable', true, 30);

-- 7. 安全插入套餐選擇規則
DO $$
DECLARE
    appetizer_id UUID;
    main_id UUID;
    drink_id UUID;
    dessert_id UUID;
    soup_id UUID;
BEGIN
    -- 獲取分類 ID
    SELECT id INTO appetizer_id FROM categories WHERE name = '前菜' LIMIT 1;
    SELECT id INTO main_id FROM categories WHERE name = '主餐' LIMIT 1;
    SELECT id INTO drink_id FROM categories WHERE name = '飲品' LIMIT 1;
    SELECT id INTO dessert_id FROM categories WHERE name = '甜點' LIMIT 1;
    SELECT id INTO soup_id FROM categories WHERE name = '湯品' LIMIT 1;
    
    -- 夏日特色套餐
    IF appetizer_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440001', appetizer_id, 1, 1, 1);
    END IF;
    
    IF main_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440001', main_id, 1, 1, 2);
    END IF;
    
    IF drink_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440001', drink_id, 1, 1, 3);
    END IF;
    
    IF dessert_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440001', dessert_id, 1, 1, 4);
    END IF;
    
    -- 經典商務套餐
    IF main_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440002', main_id, 1, 1, 1);
    END IF;
    
    IF soup_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440002', soup_id, 1, 1, 2);
    END IF;
    
    IF drink_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440002', drink_id, 1, 1, 3);
    END IF;
    
    -- 超值家庭套餐
    IF main_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440003', main_id, 2, 3, 1);
    END IF;
    
    IF appetizer_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440003', appetizer_id, 1, 2, 2);
    END IF;
    
    IF drink_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440003', drink_id, 2, 4, 3);
    END IF;
    
    IF dessert_id IS NOT NULL THEN
        INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order) 
        VALUES ('550e8400-e29b-41d4-a716-446655440003', dessert_id, 1, 2, 4);
    END IF;
    
    RAISE NOTICE '套餐選擇規則已安全插入';
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
FROM categories;

-- 9. 顯示詳細結果
SELECT 
    cp.name as 套餐名稱,
    cp.combo_type as 套餐類型,
    cp.price as 價格,
    cat.name as 選擇分類,
    cc.min_selections as 最少選擇,
    cc.max_selections as 最多選擇,
    cc.sort_order as 排序
FROM combo_products cp
LEFT JOIN combo_choices cc ON cp.id = cc.combo_id
LEFT JOIN categories cat ON cc.category_id = cat.id
ORDER BY cp.name, cc.sort_order;

-- 完成訊息
SELECT '🎉 套餐系統已完全重新建立！請重新整理您的應用程式。' as 狀態;
