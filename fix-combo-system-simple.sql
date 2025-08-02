-- 簡化版套餐系統修復腳本
-- 這個版本會確保所有必要的分類都存在

-- 1. 確保 categories 表有必要的分類
INSERT INTO categories (name, color, sort_order, is_available) VALUES
('前菜', '#FF6B6B', 1, true),
('主餐', '#4ECDC4', 2, true),
('飲品', '#45B7D1', 3, true),
('甜點', '#96CEB4', 4, true),
('湯品', '#FECA57', 5, true)
ON CONFLICT (name) DO NOTHING;

-- 2. 確保 combo_products 表存在
CREATE TABLE IF NOT EXISTS combo_products (
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

-- 3. 確保 combo_choices 表存在
CREATE TABLE IF NOT EXISTS combo_choices (
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

-- 刪除並重新創建政策
DROP POLICY IF EXISTS "Enable read access for all users" ON combo_products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON combo_products;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON combo_products;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON combo_products;

CREATE POLICY "Enable read access for all users" ON combo_products FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON combo_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON combo_products FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON combo_products FOR DELETE USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON combo_choices;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON combo_choices;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON combo_choices;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON combo_choices;

CREATE POLICY "Enable read access for all users" ON combo_choices FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON combo_choices FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON combo_choices FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON combo_choices FOR DELETE USING (true);

-- 5. 清除現有套餐資料
TRUNCATE TABLE combo_choices CASCADE;
TRUNCATE TABLE combo_products CASCADE;

-- 6. 插入套餐資料
INSERT INTO combo_products (id, name, description, price, combo_type, is_available, preparation_time) VALUES
('550e8400-e29b-41d4-a716-446655440001', '夏日特色套餐', '可選擇前菜、主餐、飲品、甜點的完美組合', 330.00, 'selectable', true, 25),
('550e8400-e29b-41d4-a716-446655440002', '經典商務套餐', '包含主餐、湯品、飲品的商務首選', 280.00, 'selectable', true, 20),
('550e8400-e29b-41d4-a716-446655440003', '超值家庭套餐', '適合分享的豐盛套餐組合', 680.00, 'selectable', true, 30);

-- 7. 插入套餐選擇規則 (使用分類ID)
WITH category_ids AS (
  SELECT id, name FROM categories 
  WHERE name IN ('前菜', '主餐', '飲品', '甜點', '湯品')
)
INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order)
SELECT 
  v.combo_id::uuid,
  c.id,
  v.min_selections,
  v.max_selections,
  v.sort_order
FROM (
  VALUES
    -- 夏日特色套餐
    ('550e8400-e29b-41d4-a716-446655440001', '前菜', 1, 1, 1),
    ('550e8400-e29b-41d4-a716-446655440001', '主餐', 1, 1, 2),
    ('550e8400-e29b-41d4-a716-446655440001', '飲品', 1, 1, 3),
    ('550e8400-e29b-41d4-a716-446655440001', '甜點', 1, 1, 4),
    
    -- 經典商務套餐
    ('550e8400-e29b-41d4-a716-446655440002', '主餐', 1, 1, 1),
    ('550e8400-e29b-41d4-a716-446655440002', '湯品', 1, 1, 2),
    ('550e8400-e29b-41d4-a716-446655440002', '飲品', 1, 1, 3),
    
    -- 超值家庭套餐
    ('550e8400-e29b-41d4-a716-446655440003', '主餐', 2, 3, 1),
    ('550e8400-e29b-41d4-a716-446655440003', '前菜', 1, 2, 2),
    ('550e8400-e29b-41d4-a716-446655440003', '飲品', 2, 4, 3),
    ('550e8400-e29b-41d4-a716-446655440003', '甜點', 1, 2, 4)
) AS v(combo_id, category_name, min_selections, max_selections, sort_order)
JOIN category_ids c ON v.category_name = c.name;

-- 8. 檢查結果
SELECT 
    '套餐總數' as 項目,
    COUNT(*) as 數量
FROM combo_products
UNION ALL
SELECT 
    '選擇規則總數' as 項目,
    COUNT(*) as 數量
FROM combo_choices
UNION ALL
SELECT 
    '分類總數' as 項目,
    COUNT(*) as 數量
FROM categories;

-- 9. 顯示詳細結果
SELECT 
    cp.name as 套餐名稱,
    cp.combo_type as 套餐類型,
    cp.price as 價格,
    cat.name as 選擇分類,
    cc.min_selections as 最少選擇,
    cc.max_selections as 最多選擇
FROM combo_products cp
LEFT JOIN combo_choices cc ON cp.id = cc.combo_id
LEFT JOIN categories cat ON cc.category_id = cat.id
ORDER BY cp.name, cc.sort_order;

SELECT '✅ 套餐系統修復完成！請重新整理您的應用程式。' as 狀態;
