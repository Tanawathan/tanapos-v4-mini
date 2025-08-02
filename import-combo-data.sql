-- 套餐選擇規則和選項批量匯入SQL
-- 請在 Supabase Dashboard 的 SQL Editor 中執行

-- 1. 首先確保 combo_choices 表格存在
CREATE TABLE IF NOT EXISTS combo_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    combo_id UUID NOT NULL REFERENCES combo_products(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    min_selections INTEGER DEFAULT 1,
    max_selections INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 設置索引和RLS政策
CREATE INDEX IF NOT EXISTS idx_combo_choices_combo ON combo_choices(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_choices_category ON combo_choices(category_id);

ALTER TABLE combo_choices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to combo_choices" ON combo_choices;
CREATE POLICY "Allow public read access to combo_choices"
    ON combo_choices FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated manage combo_choices" ON combo_choices;
CREATE POLICY "Allow authenticated manage combo_choices"
    ON combo_choices FOR ALL USING (true);

-- 3. 查看現有的套餐和分類
SELECT '=== 現有套餐 ===' as info;
SELECT id, name, combo_type FROM combo_products WHERE is_available = true;

SELECT '=== 現有分類 ===' as info;
SELECT id, name FROM categories WHERE is_active = true ORDER BY name;

-- 4. 批量插入套餐選擇規則
-- 為「頁日套餐」添加規則
DO $$
DECLARE
    combo_uuid UUID;
    cat_uuid UUID;
BEGIN
    -- 獲取套餐ID
    SELECT id INTO combo_uuid FROM combo_products WHERE name = '頁日套餐' LIMIT 1;
    
    IF combo_uuid IS NOT NULL THEN
        -- 前菜規則
        SELECT id INTO cat_uuid FROM categories WHERE name ILIKE '%前菜%' OR name ILIKE '%開胃%' OR name ILIKE '%沙拉%' LIMIT 1;
        IF cat_uuid IS NOT NULL THEN
            INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections)
            VALUES (combo_uuid, cat_uuid, 1, 1) ON CONFLICT DO NOTHING;
            RAISE NOTICE '✅ 已添加前菜選擇規則';
        ELSE
            RAISE NOTICE '⚠️ 找不到前菜分類，請手動建立或修改分類名稱';
        END IF;
        
        -- 主餐規則
        SELECT id INTO cat_uuid FROM categories WHERE name ILIKE '%主餐%' OR name ILIKE '%主食%' OR name ILIKE '%肉類%' LIMIT 1;
        IF cat_uuid IS NOT NULL THEN
            INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections)
            VALUES (combo_uuid, cat_uuid, 1, 1) ON CONFLICT DO NOTHING;
            RAISE NOTICE '✅ 已添加主餐選擇規則';
        ELSE
            RAISE NOTICE '⚠️ 找不到主餐分類，請手動建立或修改分類名稱';
        END IF;
        
        -- 飲品規則
        SELECT id INTO cat_uuid FROM categories WHERE name ILIKE '%飲%' OR name ILIKE '%茶%' OR name ILIKE '%咖啡%' LIMIT 1;
        IF cat_uuid IS NOT NULL THEN
            INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections)
            VALUES (combo_uuid, cat_uuid, 1, 1) ON CONFLICT DO NOTHING;
            RAISE NOTICE '✅ 已添加飲品選擇規則';
        ELSE
            RAISE NOTICE '⚠️ 找不到飲品分類，請手動建立或修改分類名稱';
        END IF;
        
        -- 甜點規則
        SELECT id INTO cat_uuid FROM categories WHERE name ILIKE '%甜%' OR name ILIKE '%點心%' OR name ILIKE '%蛋糕%' LIMIT 1;
        IF cat_uuid IS NOT NULL THEN
            INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections)
            VALUES (combo_uuid, cat_uuid, 1, 1) ON CONFLICT DO NOTHING;
            RAISE NOTICE '✅ 已添加甜點選擇規則';
        ELSE
            RAISE NOTICE '⚠️ 找不到甜點分類，請手動建立或修改分類名稱';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ 找不到「頁日套餐」，請先創建套餐';
    END IF;
END $$;

-- 5. 為其他套餐添加類似規則
-- 夏日特色套餐
DO $$
DECLARE
    combo_uuid UUID;
    cat_uuid UUID;
BEGIN
    SELECT id INTO combo_uuid FROM combo_products WHERE name = '夏日特色套餐' LIMIT 1;
    
    IF combo_uuid IS NOT NULL THEN
        -- 為夏日特色套餐添加規則（允許選擇1-2個飲品）
        SELECT id INTO cat_uuid FROM categories WHERE name ILIKE '%飲%' LIMIT 1;
        IF cat_uuid IS NOT NULL THEN
            INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections)
            VALUES (combo_uuid, cat_uuid, 1, 2) ON CONFLICT DO NOTHING;
        END IF;
        
        -- 添加其他分類的規則...
        RAISE NOTICE '✅ 夏日特色套餐規則已設定';
    END IF;
END $$;

-- 6. 驗證結果
SELECT '=== 套餐選擇規則設定結果 ===' as info;
SELECT 
    cp.name as 套餐名稱,
    c.name as 分類名稱,
    cc.min_selections as 最少選擇,
    cc.max_selections as 最多選擇,
    cp.combo_type as 套餐類型
FROM combo_choices cc
JOIN combo_products cp ON cc.combo_id = cp.id
JOIN categories c ON cc.category_id = c.id
ORDER BY cp.name, c.name;

-- 7. 如果需要清除所有規則重新設定，執行以下SQL：
-- DELETE FROM combo_choices; -- 取消註解以清除所有規則

-- 8. 手動插入規則的範本（如果自動設定失敗）
-- INSERT INTO combo_choices (combo_id, category_id, min_selections, max_selections) VALUES
-- ('套餐UUID', '分類UUID', 1, 1);

RAISE NOTICE '🎉 套餐選擇規則匯入完成！請回到管理頁面查看結果。';
