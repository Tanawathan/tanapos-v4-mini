-- 修正套餐選擇系統的SQL
-- 這個SQL將創建正確的套餐選擇規則表格

-- 1. 創建 combo_choices 表格（如果不存在）
CREATE TABLE IF NOT EXISTS combo_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id UUID NOT NULL REFERENCES combo_products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    min_selections INTEGER DEFAULT 1,
    max_selections INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 創建索引
CREATE INDEX IF NOT EXISTS idx_combo_choices_combo ON combo_choices(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_choices_category ON combo_choices(category_id);

-- 3. 設置 RLS 政策
ALTER TABLE combo_choices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to combo_choices" ON combo_choices;
CREATE POLICY "Allow public read access to combo_choices"
    ON combo_choices FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert to combo_choices" ON combo_choices;
CREATE POLICY "Allow authenticated insert to combo_choices"
    ON combo_choices FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update to combo_choices" ON combo_choices;
CREATE POLICY "Allow authenticated update to combo_choices"
    ON combo_choices FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete to combo_choices" ON combo_choices;
CREATE POLICY "Allow authenticated delete to combo_choices"
    ON combo_choices FOR DELETE
    USING (true);

-- 4. 檢查現有分類，為套餐添加示例選擇規則
-- 注意：這裡需要根據您實際的分類來設定

-- 查看現有分類
SELECT id, name FROM categories WHERE is_active = true ORDER BY name;

-- 如果您有這些分類，可以執行以下插入語句
-- （請根據實際分類ID修改）

-- 示例：為「頁日套餐」添加選擇規則
-- 假設您有以下分類：前菜、主餐、飲品、甜點

-- 獲取套餐ID
DO $$
DECLARE
    combo_uuid UUID;
    appetizer_cat_id UUID;
    main_cat_id UUID;
    drink_cat_id UUID;
    dessert_cat_id UUID;
BEGIN
    -- 獲取套餐ID
    SELECT id INTO combo_uuid FROM combo_products WHERE name = '頁日套餐' LIMIT 1;
    
    IF combo_uuid IS NOT NULL THEN
        -- 獲取分類ID（根據實際分類名稱調整）
        SELECT id INTO appetizer_cat_id FROM categories WHERE name LIKE '%前菜%' OR name LIKE '%開胃%' LIMIT 1;
        SELECT id INTO main_cat_id FROM categories WHERE name LIKE '%主餐%' OR name LIKE '%主食%' LIMIT 1;
        SELECT id INTO drink_cat_id FROM categories WHERE name LIKE '%飲%' OR name LIKE '%飲料%' LIMIT 1;
        SELECT id INTO dessert_cat_id FROM categories WHERE name LIKE '%甜%' OR name LIKE '%點心%' LIMIT 1;
        
        -- 插入選擇規則
        IF appetizer_cat_id IS NOT NULL THEN
            INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections)
            VALUES (combo_uuid, appetizer_cat_id, 1, 1)
            ON CONFLICT DO NOTHING;
            RAISE NOTICE '✅ 已添加前菜選擇規則';
        END IF;
        
        IF main_cat_id IS NOT NULL THEN
            INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections)
            VALUES (combo_uuid, main_cat_id, 1, 1)
            ON CONFLICT DO NOTHING;
            RAISE NOTICE '✅ 已添加主餐選擇規則';
        END IF;
        
        IF drink_cat_id IS NOT NULL THEN
            INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections)
            VALUES (combo_uuid, drink_cat_id, 1, 1)
            ON CONFLICT DO NOTHING;
            RAISE NOTICE '✅ 已添加飲品選擇規則';
        END IF;
        
        IF dessert_cat_id IS NOT NULL THEN
            INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections)
            VALUES (combo_uuid, dessert_cat_id, 1, 1)
            ON CONFLICT DO NOTHING;
            RAISE NOTICE '✅ 已添加甜點選擇規則';
        END IF;
        
        RAISE NOTICE '🎉 套餐選擇規則設定完成！';
    ELSE
        RAISE NOTICE '❌ 找不到「頁日套餐」';
    END IF;
END $$;

-- 5. 驗證設定結果
SELECT 
    cp.name as 套餐名稱,
    c.name as 分類名稱,
    cc.min_selections as 最少選擇,
    cc.max_selections as 最多選擇
FROM combo_choices cc
JOIN combo_products cp ON cc.combo_id = cp.id
JOIN categories c ON cc.category_id = c.id
ORDER BY cp.name, c.name;
