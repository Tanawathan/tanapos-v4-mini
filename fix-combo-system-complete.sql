-- 完整的套餐系統檢查和修復腳本
-- 請在 Supabase Dashboard > SQL Editor 中執行

-- 1. 檢查 combo_products 表是否存在
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'combo_products') THEN
        -- 創建 combo_products 表
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
        
        RAISE NOTICE 'combo_products 表已創建';
    ELSE
        RAISE NOTICE 'combo_products 表已存在';
    END IF;
END $$;

-- 2. 檢查 combo_choices 表是否存在，並確保欄位正確
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'combo_choices') THEN
        -- 創建 combo_choices 表
        CREATE TABLE combo_choices (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            combo_id UUID NOT NULL REFERENCES combo_products(id) ON DELETE CASCADE,
            category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
            min_selections INTEGER DEFAULT 1,
            max_selections INTEGER DEFAULT 1,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'combo_choices 表已創建';
    ELSE
        RAISE NOTICE 'combo_choices 表已存在';
    END IF;
END $$;

-- 3. 檢查並設置 RLS 政策
ALTER TABLE combo_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_choices ENABLE ROW LEVEL SECURITY;

-- 刪除現有政策（如果存在）
DROP POLICY IF EXISTS "Enable read access for all users" ON combo_products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON combo_products;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON combo_products;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON combo_products;

DROP POLICY IF EXISTS "Enable read access for all users" ON combo_choices;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON combo_choices;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON combo_choices;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON combo_choices;

-- 創建新的 RLS 政策 - combo_products
CREATE POLICY "Enable read access for all users" ON combo_products FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON combo_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON combo_products FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON combo_products FOR DELETE USING (true);

-- 創建新的 RLS 政策 - combo_choices
CREATE POLICY "Enable read access for all users" ON combo_choices FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON combo_choices FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON combo_choices FOR UPDATE USING (true);
CREATE POLICY "Enable delete for authenticated users only" ON combo_choices FOR DELETE USING (true);

-- 4. 清除現有資料並重新匯入
TRUNCATE TABLE combo_choices CASCADE;
TRUNCATE TABLE combo_products CASCADE;

-- 5. 插入套餐資料
INSERT INTO combo_products (id, name, description, price, combo_type, is_available, preparation_time) VALUES
('550e8400-e29b-41d4-a716-446655440001', '夏日特色套餐', '可選擇前菜、主餐、飲品、甜點的完美組合', 330.00, 'selectable', true, 25),
('550e8400-e29b-41d4-a716-446655440002', '經典商務套餐', '包含主餐、湯品、飲品的商務首選', 280.00, 'selectable', true, 20),
('550e8400-e29b-41d4-a716-446655440003', '超值家庭套餐', '適合分享的豐盛套餐組合', 680.00, 'selectable', true, 30);

-- 6. 插入套餐選擇規則
-- 首先獲取分類ID
WITH category_mapping AS (
  SELECT 
    '前菜' as category_name, 
    (SELECT id FROM categories WHERE name = '前菜' LIMIT 1) as category_id
  UNION ALL
  SELECT 
    '主餐' as category_name, 
    (SELECT id FROM categories WHERE name = '主餐' LIMIT 1) as category_id
  UNION ALL
  SELECT 
    '飲品' as category_name, 
    (SELECT id FROM categories WHERE name = '飲品' LIMIT 1) as category_id
  UNION ALL
  SELECT 
    '甜點' as category_name, 
    (SELECT id FROM categories WHERE name = '甜點' LIMIT 1) as category_id
  UNION ALL
  SELECT 
    '湯品' as category_name, 
    (SELECT id FROM categories WHERE name = '湯品' LIMIT 1) as category_id
)
INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections, sort_order)
SELECT 
  combo_id,
  cm.category_id,
  min_selections,
  max_selections,
  sort_order
FROM (
  VALUES
    -- 夏日特色套餐的選擇規則
    ('550e8400-e29b-41d4-a716-446655440001', '前菜', 1, 1, 1),
    ('550e8400-e29b-41d4-a716-446655440001', '主餐', 1, 1, 2),
    ('550e8400-e29b-41d4-a716-446655440001', '飲品', 1, 1, 3),
    ('550e8400-e29b-41d4-a716-446655440001', '甜點', 1, 1, 4),
    
    -- 經典商務套餐的選擇規則
    ('550e8400-e29b-41d4-a716-446655440002', '主餐', 1, 1, 1),
    ('550e8400-e29b-41d4-a716-446655440002', '湯品', 1, 1, 2),
    ('550e8400-e29b-41d4-a716-446655440002', '飲品', 1, 1, 3),
    
    -- 超值家庭套餐的選擇規則
    ('550e8400-e29b-41d4-a716-446655440003', '主餐', 2, 3, 1),
    ('550e8400-e29b-41d4-a716-446655440003', '前菜', 1, 2, 2),
    ('550e8400-e29b-41d4-a716-446655440003', '飲品', 2, 4, 3),
    ('550e8400-e29b-41d4-a716-446655440003', '甜點', 1, 2, 4)
) AS v(combo_id, category_name, min_selections, max_selections, sort_order)
JOIN category_mapping cm ON v.category_name = cm.category_name
WHERE cm.category_id IS NOT NULL;

-- 7. 檢查資料是否正確匯入
SELECT 
    '套餐總數' as 檢查項目,
    COUNT(*) as 數量
FROM combo_products
UNION ALL
SELECT 
    '選擇規則總數' as 檢查項目,
    COUNT(*) as 數量
FROM combo_choices;

-- 8. 顯示所有套餐和其選擇規則
SELECT 
    cp.name as 套餐名稱,
    cp.combo_type as 套餐類型,
    cp.price as 價格,
    cp.is_available as 可用狀態,
    cat.name as 選擇分類,
    cc.min_selections as 最少選擇,
    cc.max_selections as 最多選擇
FROM combo_products cp
LEFT JOIN combo_choices cc ON cp.id = cc.combo_id
LEFT JOIN categories cat ON cc.category_id = cat.id
ORDER BY cp.name, cc.sort_order;

-- 完成訊息
SELECT '✅ 套餐系統檢查和修復完成！請重新整理您的應用程式。' as 狀態;
